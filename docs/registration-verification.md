# Registration verification handoff

## Result

Implemented and verified in `/Users/prommeesee/Documents/04_Learning/classroom`; **not deployed, no real-provider email sent**. New users are created only after email OTP verification. Existing accounts remain usable, with no fabricated verification timestamp. See [security/config/migration contract](registration-contract.md).

Runtime overlay: `appworks/app.py`, new `appworks/registration.py`, `appworks/templates/auth.html`, new `appworks/templates/registration_verify.html`. No runtime dependency changes or course source changes. Existing Graph transport, recovery/service factories and private `.env` were not modified.

## Executed verification

| Command (working directory) | Actual result | Evidence |
|---|---|---|
| `.venv/bin/python -m pytest -q` (`appworks`) | **396 passed**, 89.67s | `evidence/registration/backend-final.log` |
| `.venv/bin/python -m pytest tests/test_registration_otp.py tests/test_registration_security.py -q` (`appworks`) | **34 passed**, 7.32s | `evidence/registration/otp-final.log` |
| `npm test` (`courses/scale-lab`) | **26 passed** | `evidence/registration/course-unit.log` |
| `PATH=/usr/local/bin:$PATH npm run test:e2e` (`courses/scale-lab`) | **17 passed** | `evidence/registration/course-browser.log` |
| `PATH=/usr/local/bin:$PATH npx playwright test --config=playwright.account.config.js` (`courses/scale-lab`) | **15 passed** | `evidence/registration/course-account-browser.log` |
| `node scripts/registration-browser-verify.mjs` (root) | **12 scenario groups passed**, no page errors | `evidence/registration/browser.json` |
| `node scripts/registration-restart-verify.mjs` after real QA process restart (root) | **3 checks passed** | `evidence/registration/restart.json` |
| `CLASSROOM_QA_URL=http://127.0.0.1:8120 CLASSROOM_QA_MAIL_DIR=<server.json qa> node scripts/browser-verify.mjs` (root) | Canonical platform integration passed, JS/CSS 200, no errors | `evidence/registration/platform-browser-run.log`, `evidence/platform-browser.json` |
| `python3 scripts/courses.py validate` (root) | `OK scale-lab: /courses/scale-lab/` | tool execution |
| Python py_compile and Node --check on new runtime/QA files | exit 0 | tool execution |

The full backend suite includes auth/session/reset/profile/participation/qualification/Community regressions. Existing registration helpers now explicitly capture and submit an OTP rather than bypassing the new gate. The separate account Playwright suite tests client adapters against its existing stubs; actual integrated account/qualification behavior is additionally exercised against the isolated compiled Flask server.

The QA launcher ran Vite with `--base /courses/scale-lab/ --outDir <private-temp>/courses/scale-lab/dist`. It transformed 11 modules and produced an isolated integrated build. It **did not overwrite live dist**. Vite's expected informational warning says this temporary outDir is outside the project root and will not be emptied. Build output: `evidence/registration-server.log`.

## Real boundary/browser evidence

`evidence/registration/browser.json` covers correct recipient and six-digit Graph HTTP receipt; pending login and recovery-bypass rejection; malformed/wrong/expired code; resend invalidation; concurrent one-time redemption; no auto-login; qualified lesson; password reset/session revocation with progress preserved; legacy account login; other-browser codes and five-attempt invalidation; actual Graph HTTP failure; narrow forms; private pending state for restart.

The main journey recorded 6 token requests, 5 accepted sendMail requests and 1 rejected request. The canonical platform runner then sent one additional OTP: final `graph-boundary.json` is **7 token / 6 accepted sendMail / 1 rejected / externalNetwork=false**. These are requests to a real loopback HTTP double, not Microsoft or inbox delivery. SMTP registration was separately verified using a real loopback SMTP receiver in the backend suite.

Real process restart preserved the pending cookie/challenge, allowed verification/login and authenticated progress. Final stopped QA PID was **44257**; `evidence/registration/server.json` retains the private DB/build paths for `--resume`. Port **8120 is stopped**. Final read-only listener check confirmed production **8080 PID 28821** and unrelated **8081 Docker PID 1363** remained running; neither was stopped, restarted, migrated or reconfigured.

Screenshots: `evidence/registration/register-{320,390}.png`, `verify-{320,390}.png`. The 320px error/OTP and 390px registration screenshots were visually inspected: text wraps, fields/buttons fit, no horizontal overflow. Pages scroll vertically to lower controls. Raw OTPs were cleared before screenshots; raw local-double receipts and browser state remain only in the private temporary directory.

## TDD and review notes

Development used observed RED→GREEN slices: pending-only signup/verification; fail-closed delivery; existing email preservation; five-attempt invalidation; cooldown/rotation/cap; idempotent duplicate submit; durable email/IP limits; same-email race-safe insertion; activation only after delivery acceptance; SMTP selection; bounded in-flight delivery; private headers/narrow null-Origin support/UI resend; explicit cancel/restart; signup explanation/pending UI and pruning; rejecting regenerated previous OTP values; rejecting ambiguous email headers. Each new behavior failed under the immediately preceding implementation before its production change, then passed. The detailed failures are in the tool execution transcript; this section is a summary, **not a fabricated raw test log**. Additional already-passing adversarial characterization tests cover recovery bypass, expiry, HMAC storage, cross-session ownership, concurrent redemption/attempts/resends, restart, legacy migration and stale delivery completion.

Initial full regression failures were expected fixture incompatibilities with the new mandatory gate; they were fixed by explicit OTP completion in `test_app.register` and the recovery fixture, not by a production switch. Final full suite is green. Static scan of the new registration runtime found no shell/eval/pickle/interpolated-SQL/debug-print/logging patterns. No project-local git history is available: the containing Git root is the user home, so no broad add/commit was attempted. Parent/operator independent review is still required before deployment authorization.

## Deliberate limitations

- Retains existing 409 registration email-existence signal; recovery stays generic.
- Sending is synchronous, bounded to four concurrent deliveries per app process, with configured socket timeouts; no durable delivery queue or inbox-delivery guarantee.
- Clearing the browser cookie requires starting again. Limits can defer legitimate signup during address/IP abuse; existing accounts are not locked.
- Pending rows older than eight hours are cleaned on send admission, not by a scheduled job.
- Historical QA launchers that assumed immediate signup need a local mail transport and explicit OTP completion; the canonical platform runner and backend fixtures have been updated. Do not disable verification to run old scripts.
- No real Graph token/mail request, inbox check, production backup/migration/restart or production deployment was performed. The operator must follow the contract's backup and service restart procedure only after authorization.
