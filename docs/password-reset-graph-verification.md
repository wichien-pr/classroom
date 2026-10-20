# Graph password recovery — verification and deployment handoff

## Outcome

Selectable app-only Microsoft Graph transport is integrated into the existing bounded recovery queue. SMTP remains the compatibility default; Graph failures never fall back to SMTP. No live reset email was sent, no deployment/restart of production was performed, and `.env` was not changed. Existing combined-qualification work is preserved. No dependency was added.

User-approved canonical reset origin: **http://localhost:8080**, links usable on this machine only. Explicit web-local mode is supported independently of Graph: both Microsoft authorities remain HTTPS with normal certificate verification.

## Executed verification

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`.

- `cd appworks && .venv/bin/python -m pytest -q`: **362 passed**, final run 81.92s; `evidence/password-reset-graph/final-backend.log`.
- `cd courses/scale-lab && PATH=/usr/local/bin:$PATH npm test`: **26 passed**, zero failed; `course-unit.log`.
- `PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/password-reset-graph-qa-server.py`: Vite isolated build succeeded, 11 modules; only a new private temporary output tree, never published dist. Expected Vite notice that external outDir is not emptied; directory was freshly created.
- `curl http://127.0.0.1:8119/login`: HTTP 200 readiness.
- `PATH=/usr/local/bin:$PATH node scripts/password-reset-graph-browser-verify.mjs`: exit 0 on fresh QA server/database, final report `browser.json` and stdout `browser.log`.
- Real browser registered/logged in, qualified a lesson in isolated compiled Scale Lab, requested recovery, read the private local Graph-double payload, scrubbed fragment, tested confirmation mismatch, reset password, verified old session revocation and old-password denial/new-password acceptance, preserved qualification, rejected replay/expiry/invalid links and checked 320/390px layout. Zero browser page errors. Final 320px reset screenshot and 390px forgot screenshot visually inspected: fields, errors and buttons contained/readable.
- Graph HTTP boundary double observed exactly **2 token requests and 2 sendMail requests**, correct fixed authorities, app-only form/scope, configured sender, recipient, bearer header, Text body and `saveToSentItems=false`. No external Graph requests in this QA. This proves integration, **not provider delivery**.
- Private stored config was parsed and validated with an isolated database and placeholder HTTPS validation origin, without any request/email or exposing values: `config-check.log`.
- SHA-256 comparison of five production DB/dist files stayed unchanged: `preserved-before.json`, `preservation.json`. No production DB writes or published build occurred.
- QA PID 25253 was identified by listener and exact launcher command, stopped, and 8119 closure confirmed (curl exit 7). Earlier QA PID 23001 was also explicitly stopped. Runtime process tracker had incorrectly reported the first already exited; listener inspection caught and resolved that. Final listener record is `final-listeners.log`. 8080 had no listener when inspected; unrelated Docker 8081 remained untouched. No Classroom LaunchAgent match was found in the user's LaunchAgents directory.

## Vertical TDD trace

Each implementation slice followed its observed failure; logs are retained under `evidence/password-reset-graph/`:

1. `01-red.log`: request rejected because Graph transport lacked support; `01-green.log`: Graph end-to-end queue/request slice plus original recovery tests green.
2. `02-red.log`: eleven invalid Graph configurations incorrectly accepted; `02-green.log`: credential/GUID/sender/timeout validation green. Unknown transport was already rejected and is regression coverage.
3. `03-red.log`: malformed/missing token and HTTP protocol errors left an active reset row; `03-green.log`: cleanup, sanitized failure, no fallback green. Existing token/send HTTP failures, redirects, oversized responses and timeout handling were characterization coverage where already green.
4. `04-red.log`: explicit deployment entry did not exist; `04-green.log`: private-file mapping, process precedence/no environment mutation and QA/file isolation green.
5. `05-red.log`: unsafe permissions/symlink/parser cases were accepted or unsanitized; `05-green-full.log`: private-file checks plus full backend green (357 at that point).
6. Additional already-implemented behavior characterization: cross-alias precedence, OUTLOOK process aliases, explicitly allowed HTTP localhost with Graph and refusal without opt-in. Final full backend count 362. These are not claimed as new RED cycles.

## Files changed

Production:
- `appworks/password_reset.py`: transport selection, Graph defaults/OUTLOOK aliases, enabled config validation, dispatch and HTTP error cleanup; unchanged secure recovery/session/rate-limit behavior.
- `appworks/graph_mail.py` (new): fixed-authority HTTPS token/sendMail, bounded reads/timeouts, no redirects/retries, sanitized errors, no persistent access token.
- `appworks/service.py` (new): explicit private `.env` deployment factory; does not mutate process environment or load during import.

Tests/QA:
- `appworks/tests/test_password_reset_graph.py` (new).
- `appworks/tests/test_service_entry.py` (new).
- `scripts/password-reset-graph-qa-server.py` (new).
- `scripts/password-reset-graph-browser-verify.mjs` (new).

Documentation/evidence:
- `appworks/.env.password-reset.example`, `docs/password-reset-contract.md`, `README.md`.
- This verification document and `evidence/password-reset-graph/` logs/reports/screenshots.
- Reusable Classroom skill updated separately; no other profile touched.

`app.py`, recovery templates, original SMTP QA/test scripts, course sources/manifests, production DB/dist and actual `.env` were not edited. Workspace is under an ancestor Git repository rather than an isolated Classroom repository; no commit/stage action was performed.

## Parent's authorized rollout

Do not replace the private `.env` with the example. Existing credentials parsed successfully; recovery was still disabled, origin empty and Graph not selected at inspection. Parent must preserve secret values and apply only the intended operational settings:

```dotenv
APPWORKS_RESET_TRANSPORT=graph
APPWORKS_RESET_BASE_URL=http://localhost:8080
APPWORKS_RESET_ALLOW_LOCAL=1
APPWORKS_COOKIE_SECURE=0
APPWORKS_RESET_ENABLED=1
```

Use existing `OUTLOOK_CLIENT_ID`, `OUTLOOK_TENANT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_USER_EMAIL`; no permission grant changes needed. Keep `.env` 0600 and untracked. IDs must already be canonical lowercase GUIDs; do not silently repair malformed identifiers.

After backups and coordinated pending combined-qualification deployment, launch from `appworks`:

```sh
.venv/bin/waitress-serve --listen=127.0.0.1:8080 --call service:create_app
```

**Important:** old `app:create_app` does not read `.env`. Use the new explicit service factory or explicitly provision process variables. The parent must own the production process. Confirm `http://localhost:8080/login` and use that hostname consistently: localhost and 127.0.0.1 have different cookies/origins. Do not change Graph URLs to HTTP or grant inbox-read permissions. Stop/restart only the identified production process; do not touch 8081.

Then perform the single authorized reset to the user's own registered mailbox, confirming actual provider acceptance and actual receipt/link preservation, successful password change and revoked old session. This child intentionally did not perform that test. Parent's earlier standalone Graph 202 is separate evidence, not proof that this integrated reset email reached an inbox.

Rollback: disable `APPWORKS_RESET_ENABLED=0` and restart, preserving additive tables/data. No course rebuild is needed for Graph alone, but combined qualification still requires its own coordinated backend/manifest/client deployment. Queue is bounded but in-memory/non-durable, no retries; Graph 202 is not delivery, and uncertain send failures revoke that capability. HTTP localhost is local-only, not suitable for remote users.
