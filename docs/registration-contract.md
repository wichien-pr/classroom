# Registration email verification contract

## Behavior and legacy policy

New `/register` submissions create only a browser-bound **pending registration**, not a `users` row. A six-digit email code must be verified before an account exists. Success redirects to `/login`; it never authenticates automatically. Login, password reset, memberships, qualification, profiles and Community continue to use real users only, so a pending registration cannot use recovery to bypass verification.

**Existing accounts are explicitly grandfathered.** Their passwords, sessions, progress and identity remain usable. Additive `users.email_verified_at` is NULL for existing users: NULL is unknown historical verification, not a claim that those addresses were verified. New users receive the actual server timestamp only inside successful OTP redemption. No backfill and no account reset.

## Transport/configuration

Registration reuses the existing validated mail configuration, including Microsoft Graph app-only and SMTP:

- `APPWORKS_RESET_ENABLED=1` is required for sending. Disabled/missing configuration returns 503; registration does not silently bypass verification.
- `APPWORKS_RESET_TRANSPORT=graph` uses the existing `OUTLOOK_CLIENT_ID`, `OUTLOOK_TENANT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_USER_EMAIL` aliases (or existing APPWORKS_RESET_GRAPH_* equivalents).
- Existing `APPWORKS_RESET_BASE_URL` and local/HTTPS validation still apply because the same transport/configuration is shared with recovery. OTP emails themselves contain **no links**.
- SMTP remains selectable with the existing RESET_SMTP_* settings; TLS validation remains unchanged.
- Per-hop Graph/SMTP timeouts remain the existing configured values (10 seconds by default; validation limits 1–30). Graph uses fixed HTTPS authorities, never a user-supplied endpoint.
- No new secret or insecure bypass switch. Only authorized deployment uses `service:create_app` to load private `.env`; `app:create_app` never loads it. Do not copy QA transport substitution into production.

See `.env.registration.example` and `password-reset-contract.md`. Do not print configured credentials or actual raw messages.

## Challenge and abuse controls

- `secrets.randbelow` generates six decimal digits including leading zeros; TTL is 10 minutes from issuance, at most 5 incorrect attempts.
- Store an HMAC-SHA256 digest of generation + code, keyed by the **raw random HttpOnly browser session cookie**. SQLite contains only that cookie's SHA256 hash, not its raw HMAC key. This avoids a database-only six-digit offline brute-force oracle without another key file. Clearing/losing the cookie requires a new registration request; it does not unlock an old pending challenge.
- Pending rows store scrypt password hashes only. Codes/passwords are not returned in HTTP, URLs, access logs or ordinary application logs.
- Every mutation requires the existing session-bound CSRF token and origin checks. Hidden challenge generation is checked on verification/resend. `no-store` and `no-referrer` apply to registration routes. The existing narrow `Origin: null` allowance is extended only to those routes with browser-confirmed `Sec-Fetch-Site: same-origin`; CSRF remains mandatory.
- Resend cooldown: 60 seconds. Maximum 3 sends per challenge (initial + 2 resends). Resend resets attempts/expiry, rotates generation and never reuses the immediately preceding six-digit value.
- Shared durable rolling-hour limits for starts and resends: 3 per normalized email, 10 per actual request IP. Provider failures count. SQLite transactions serialize admission, attempts, resend and redemption. Cancel/new browser does not reset these limits. Existing login/reset throttles are unchanged.
- No asynchronous unbounded queue: at most 4 synchronous provider deliveries per app process; a busy sender fails closed with 503. Codes remain inactive until provider acceptance. Provider failure removes only the matching generation; late completion cannot activate or delete a newer challenge. 202 means Graph accepted a request, **not proof of inbox delivery**.
- Pending credentials older than 8 hours are pruned opportunistically during new send admission; there is no background janitor.

## Duplicate and cross-session tradeoffs

A repeated registration submission for the same browser/email resumes the existing pending challenge without sending again or replacing its password. Use **แก้ไขอีเมล / เริ่มใหม่** (CSRF-protected cancel) to deliberately change the password/email; send limits still apply. Different browsers hold independent pending rows for the same email. One browser cannot overwrite or verify another's pending credentials, even with its code. The first successful mailbox verification wins the unique users.email insert. A later independently verified challenge redirects to login without overwriting the existing password or creating another account.

The existing registration 409 response for an already registered email is retained for compatibility. Thus registration retains its pre-existing email-existence signal; this implementation does **not** claim enumeration resistance for registration. Recovery remains generic. Limits can temporarily prevent a legitimate new signup after abuse against its address; they never lock or change an existing account. Email verification is mailbox control at signup, not ongoing identity assurance.

## Additive migration and rollout

`registration.install` runs after existing profile/recovery setup. It adds nullable `users.email_verified_at`, `pending_registrations`, `registration_limits`, and the limits index. Existing users/sessions/progress/photos/community/reset records are not rewritten. No course source or live dist rebuild is needed for this platform-only change.

Before authorized deployment, the service owner must back up live SQLite with its backup API, verify integrity, preserve private uploads, then restart the identified production service with `service:create_app`. Do not modify private environment values, stop unrelated services, or deploy from these QA scripts. Do not roll back to the old direct-registration handler while accepting new signups, because that would remove the email gate. No deployment or provider mail was performed during implementation.

## Isolated verification

From workspace root (port 8120 must be free):

```sh
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py
node scripts/registration-browser-verify.mjs
# Stop only the identified PID from evidence/registration/server.json, then:
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --resume
node scripts/registration-restart-verify.mjs
CLASSROOM_QA_URL=http://127.0.0.1:8120 CLASSROOM_QA_MAIL_DIR=<private-qa-directory-from-server.json> node scripts/browser-verify.mjs
```

The QA launcher builds into a fresh temporary course tree, creates a private SQLite DB with a pre-feature legacy account, and substitutes only the Graph HTTPSConnection boundary with a real loopback HTTP double. It asserts OAuth grant/scope, fixed authority, Graph payload, recipient and six-digit content. Raw QA receipts and browser cookies stay in its 0700 temporary directory (files 0600), never sanitized reports.

Older standalone QA launchers that assumed direct registration now need a configured local mail double and explicit OTP completion. Do not add a production verification bypass to make such historical scripts pass. The canonical `browser-verify.mjs` now uses `complete-registration.mjs` against the private local-double mailbox.
