# Password recovery contract and deployment checklist

Status: SMTP and selectable Microsoft Graph app-only transport implemented. Graph integration verified with an isolated HTTP double and real browser, not live reset-email delivery. **Not deployed by this change.** Production DB and course dist were not modified. See [Graph verification/handoff](password-reset-graph-verification.md).

## User flow

Login links to Thai `/forgot-password`; submit the registered email. Every accepted request returns the same conditional message, whether the email exists, is throttled, delivery fails, the queue is full, or mail is disabled. It does not claim email was delivered. Sending is handled by a bounded in-memory worker (100 pending jobs per process), avoiding a synchronous SMTP/account lookup timing distinction. Unknown addresses enter the same queue but do not receive mail. Queue jobs are not durable and can be lost at restart; users can request again after the throttle window. No automatic delivery retry or inbox-delivery guarantee.

Email links use the configured trusted origin plus `/reset-password#<capability>` — **never Host, Forwarded or X-Forwarded-Host**. The fragment is not sent to HTTP servers; first-party inline script removes it from history immediately and places it in a hidden POST field. JavaScript is required to import the link; there is an explicit noscript explanation, no insecure query-string fallback. Reopening an email link works until consumed/expired; merely GETting it never consumes it. Do not add analytics, remote fonts/assets or link tracking to these pages or emails.

Tokens contain 32 cryptographically random bytes (43 URL-safe characters). Only SHA-256 hashes are stored, with user ID and a fixed 30-minute expiry. No password is emailed. Passwords must be 12–128 characters and match confirmation, then use the existing scrypt hashing policy. Password update, token deletion (all tokens for this user), and authenticated-session revocation occur in one `BEGIN IMMEDIATE` transaction. A concurrent double submission has exactly one winner. Other accounts/sessions and all course/profile/activity/community data are preserved. No automatic login; the user must sign in again. Login rechecks the verified password hash inside its session-issuance transaction, preventing an in-flight old-password login from escaping revocation.

Recovery pages, including errors, use `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, existing CSP/frame denial and session-bound CSRF. Chromium HTML forms under no-referrer can emit `Origin: null`; only recovery endpoints accept that value when `Sec-Fetch-Site: same-origin` **and valid session CSRF** are present. Null without metadata, same-site, cross-site, wrong Origin and missing/foreign CSRF are rejected. Email capability is intentionally portable across browsers/sessions; its owner, not posted user IDs or the current browser's account, determines which password changes.

## Configuration

Template: `appworks/.env.password-reset.example`. It is documentation, not automatically loaded. The explicit deployment entry `service:create_app` reads private `appworks/.env`; ordinary `app:create_app` never reads that file (tests/QA stay isolated). Process variables take precedence over file values without mutating the process environment; do not paste secrets into chat, commands, reports or version control.

| Environment variable | Meaning/default |
|---|---|
| `APPWORKS_RESET_ENABLED` | `0` disabled by default; `1` enables worker and reset consumption |
| `APPWORKS_RESET_BASE_URL` | Required trusted public HTTPS origin, optional trailing slash; no credentials, path, query or fragment |
| `APPWORKS_RESET_TRANSPORT` | `smtp` default or `graph`; no automatic downgrade/fallback |
| `OUTLOOK_CLIENT_ID` / `OUTLOOK_TENANT_ID` | Graph application/tenant canonical lowercase GUIDs, no common/organizations authority |
| `OUTLOOK_CLIENT_SECRET` | Graph client secret **value**, never its ID |
| `OUTLOOK_USER_EMAIL` | Graph sender mailbox used in `/users/{sender}/sendMail` |
| `APPWORKS_RESET_GRAPH_TIMEOUT` | Graph socket timeout 1–30 seconds, default 10 per request |
| `APPWORKS_RESET_SMTP_HOST` | Required for SMTP only, provider hostname |
| `APPWORKS_RESET_SMTP_PORT` | Integer 1–65535, default 587; operator must confirm actual provider port |
| `APPWORKS_RESET_SMTP_TLS` | `starttls` default, or `ssl` for implicit TLS |
| `APPWORKS_RESET_SMTP_FROM` | Required provider-approved bare sender mailbox |
| `APPWORKS_RESET_SMTP_USERNAME` / `APPWORKS_RESET_SMTP_PASSWORD` | Both supplied or both empty for explicitly approved network relay; no guessed provider/login |
| `APPWORKS_RESET_SMTP_TIMEOUT` | Socket timeout 1–30 seconds, default 10 |
| `APPWORKS_RESET_ALLOW_LOCAL` | `0` default; `1` permits HTTP only for localhost/127.0.0.1/::1; `none` TLS additionally requires loopback SMTP and no username |
| `APPWORKS_COOKIE_SECURE` | Set `1` when serving production HTTPS |

Enabled incomplete/unsafe configuration raises a sanitized startup error, rather than insecure fallback. TLS uses system trust/certificate and hostname verification; no unverified SSL context. STARTTLS failure never retries plaintext. SMTP errors log only fixed messages, no exception contents/recipient/token/credentials. SMTP acceptance is not evidence of inbox delivery.

Before enabling real delivery, approve the canonical public HTTPS origin and provider-authorized sender. SMTP additionally needs host/port/TLS/authentication settings. Graph uses the existing securely provisioned OUTLOOK credentials; no permission additions are needed for this feature. Verify the service actually receives environment variables. For pre-fork WSGI deployment do not preload this app before fork: workers must call `create_app` after fork so their mail thread exists. Existing Waitress setup is supported.

## Rate limits and storage

Additive tables created on application initialization:

- `password_resets(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires REAL NOT NULL)` and user index.
- `password_reset_limits(kind TEXT NOT NULL, key_hash TEXT NOT NULL, attempted REAL NOT NULL)` and `(kind,key_hash,attempted)` index.

No alterations or destructive migration of users, learning progress, combined qualification, Participation, profile, activity or community tables. Expired reset rows are pruned when a valid-account mail job issues another token. Old throttle rows are pruned on new enabled requests. Successful reset deletes all existing tokens for that account.

Requests are limited persistently/transactionally to **3 per normalized email and 10 per source IP per rolling 15 minutes**, regardless of account existence; all outcomes remain generic HTTP 200. SHA-256 account/IP keys reduce accidental plaintext exposure but are not anonymization against guessing. No client-supplied forwarding headers are trusted; behind a reverse proxy deploy a reviewed trusted-client-IP configuration or expect shared proxy-IP throttling. Add perimeter abuse controls for high-volume distributed traffic; these are not a general DDoS defense. Reset submission requires a high-entropy capability, not an email lookup. Existing login throttling remains intact.

## Log and secret hygiene

Never log reset POST bodies, CSRF/session cookies, SMTP AUTH, email body, raw capabilities, or complete links. Disable request/response body capture for recovery in reverse proxies, APM and error tooling. Fragment links avoid standard HTTP access-log leakage; malicious/legacy callers can still put arbitrary secrets in query/path, so redact query strings on recovery endpoints at the edge. Do not enable Flask debug or SMTP debug logging in production. Keep mail provider link rewriting/tracking disabled; verify fragment preservation before rollout. Do not serve the workspace/evidence/private email directories as static content. Local SMTP captures are QA-only and mode-restricted.

## Authorized deployment only (not executed)

1. Coordinate deployment with the pending combined-qualification changes; this work preserves those changes. Do not overwrite course dist or deploy only half of that unrelated feature.
2. Identify the actual production process, DB path, private photo/community directories and service environment. Do not touch unrelated 8081. Back up before the next app initialization creates these tables.
3. Under an operator-controlled private backup directory (`umask 077`), use SQLite's backup API (not copying a live database file):
   ```python
   import sqlite3
   source = sqlite3.connect('file:/absolute/production/classroom.sqlite3?mode=ro', uri=True)
   backup = sqlite3.connect('/absolute/private-backups/classroom-before-recovery.sqlite3')
   source.backup(backup)
   assert backup.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
   backup.close(); source.close()
   ```
   Back up private photos/community uploads consistently with the existing application procedures. Verify restore into an isolated path, never over production during QA.
4. Install unchanged existing Python requirements; this feature adds no production dependency. Configure secrets in the service manager. First validate against an isolated DB and approved test recipient. No real email is sent merely by initializing the app; only requests enqueue it.
5. With explicit authorization, restart the identified production service with source/templates from the same release. Backend-only password recovery needs no course rebuild. Keep `RESET_ENABLED=0` until all public-origin/TLS/mail checks are approved.
6. Verify guest login, CSRF, provider acceptance/inbox receipt, actual link preservation, reset and session revocation using an authorized test account. Check no change in real learning/account data. Do not claim provider readiness based on loopback QA.
7. Disable `APPWORKS_RESET_ENABLED=0` and restart to stop issuing/consuming recovery tokens. Keep additive tables/data on rollback. Older application code can ignore them; never reset the account database. In-flight recovery jobs are not durable and may be lost on shutdown.

## Reproduce isolated QA

From project root, free **8118** only; never stop/start production 8080 or unrelated 8081:

```sh
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/password-reset-qa-server.py
# New terminal, once per fresh QA server/database:
PATH=/usr/local/bin:$PATH node scripts/password-reset-browser-verify.mjs
```

The launcher builds actual Vite assets into a new private temporary course tree, uses a fresh SQLite/photos/community directory, and starts a loopback-only SMTP capture on an OS-assigned port. `evidence/password-reset/server.json` identifies the isolated process/paths. Private `mail-*.eml` and `mail-*.json` in that temp directory contain QA-only capabilities; never copy their contents into reports. Browser report is sanitized. Stop only the identified QA process after verification. The browser runner intentionally expects a fresh database/mailbox.

See `docs/password-reset-verification.md` for actual execution results and TDD trace.

## Microsoft Graph deployment entry

After authorized backup/deployment, run from `appworks`:

```sh
.venv/bin/waitress-serve --listen=127.0.0.1:8080 --call service:create_app
```

The original `app:create_app` remains supported for process-environment-only deployment and all QA. Merely importing either module does not load `.env` or start the app. The explicit service factory loads only the file beside itself, never cwd/parent discovery. File must be a regular non-symlink owned by the current user with no group/other permissions (0600 recommended), maximum 64 KiB. Syntax is literal `KEY=value`, optional matching single/double quotes, blank lines and whole-line `#` comments. No `export`, interpolation, shell execution, escape expansion or inline comments. Duplicate/malformed keys, unclosed quotes or unsafe permissions fail with a sanitized error. Unknown valid keys are ignored by the config mapping; only recovery variables, OUTLOOK aliases and cookie-secure are mapped. DATABASE remains explicitly process-controlled. Process environment wins over file, even across aliases; canonical APPWORKS names win over OUTLOOK aliases within each layer. Optional canonical names are `APPWORKS_RESET_GRAPH_CLIENT_ID`, `...TENANT_ID`, `...CLIENT_SECRET`, `...SENDER`.

Graph uses fixed verified-TLS authorities `login.microsoftonline.com` and `graph.microsoft.com`, client credentials with `https://graph.microsoft.com/.default`, then only `POST /v1.0/users/{configured-sender}/sendMail`. There is no endpoint override, redirect following, SMTP fallback, inbox read, permission discovery or additional grant. Use application `Mail.Send`; restrict sender access with appropriate Exchange application access controls/RBAC. Existing unrelated app grants are not used or expanded here; reducing them is a separate operator review. `saveToSentItems=false` is explicit to avoid retaining reset links in the sender's Sent Items. Tokens are obtained per delivery, never persisted or logged; no cache or refresh-token storage.

Graph response reads are capped at 64 KiB, errors are fixed messages, and failure deletes that issued reset capability while preserving generic user responses. A 202 is acceptance only, not inbox delivery; timeout after acceptance can leave an email whose link was revoked. No retry is attempted; request again within the existing rate policy. Keep the queue and non-durable restart limitations above.

Do not copy or overwrite the existing `.env` from the example. This integration intentionally leaves its enabled flag, origin and credentials unchanged. Select `APPWORKS_RESET_TRANSPORT=graph`, set the approved origin, and enable only at the parent's authorized rollout. The user-approved canonical reset origin is **`http://localhost:8080`** (this machine only); using it requires explicit `APPWORKS_RESET_ALLOW_LOCAL=1` and `APPWORKS_COOKIE_SECURE=0`, and links work only on that machine. For real remote users choose an actual reachable HTTPS origin, `ALLOW_LOCAL=0` and `COOKIE_SECURE=1`. Do not invent a domain or use the request Host header.
