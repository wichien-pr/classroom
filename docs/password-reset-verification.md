# Password recovery verification

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`.

## Actual results

- `cd appworks && .venv/bin/python -m pytest -q`: **327 passed in 77.93s** (final recorded run). Includes **34 password-recovery tests**; focused run: `tests/test_password_reset.py -q`, **34 passed in 14.76s**.
- `cd courses/scale-lab && PATH=/usr/local/bin:$PATH npm test`: **26 passed**.
- Same directory: `PATH=/usr/local/bin:$PATH npx playwright test -c playwright.account.config.js`: **15 passed (13.0s)**.
- Same directory: `PATH=/usr/local/bin:$PATH npm run test:e2e`: **17 passed (12.4s)**.
- Root: `PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/password-reset-qa-server.py`: actual isolated Vite production build **11 modules, built in 459ms**; Waitress HTTP 200 on `http://127.0.0.1:8118/login`.
- Root: `PATH=/usr/local/bin:$PATH node scripts/password-reset-browser-verify.mjs`: **passed**, **2 actual loopback SMTP receipts**, **zero browser page errors**, 8 recorded journey stages.
- Protected production SQLite and existing Scale Lab dist: **all 5 SHA-256 hashes unchanged** across isolated QA. No production startup/migration/deployment; ports 8080 and 8081 not changed.

Files under `evidence/password-reset/`: `backend-tests.txt`, `course-tests.txt`, `browser.json`, `server.json`, `protected-before.json`, `protected-result.txt`, `forgot-320.png`, `forgot-390.png`, `reset-320.png`, `reset-390.png`.

The 320px request screenshot and 390px invalid-reset screenshot were visually inspected: readable Thai labels, usable full-width controls, no clipping, no visible capability/password. Browser assertions also check no horizontal overflow at both sizes. Raw QA email artifacts are private in the temporary directory named in `server.json`, not in the report or web-accessible tree; they are not production email.

## Browser journey actually exercised

1. Register and log in against isolated SQLite, open **newly compiled** Scale Lab, perform manual+simulation+thinking actions and qualify a lesson.
2. Navigate actual forgot link, submit email, capture actual SMTP message and parse link.
3. Follow fragment link, check no-store/no-referrer and immediate URL scrubbing; reopen GET without consuming; submit mismatched confirmation, then retry successfully.
4. Verify no automatic login and previously authenticated browser session revoked.
5. Old password rejected, new password accepted; prior lesson qualification/criteria unchanged.
6. Reuse consumed email link and receive invalid/used response.
7. Request another real email, expire only the QA token in QA SQLite, follow it and receive expired response.
8. Invalid fragment and request/reset forms at 320/390px, no raw token in HTTP URL/query, no page errors.

## Observed vertical TDD trace

These are observed execution summaries, not fabricated terminal transcripts. Each implementation slice followed its own failed test and was followed by targeted GREEN plus a full backend suite. Additional edge cases were explicitly labeled characterization/regression tests rather than claimed as new RED evidence.

| Slice / focused selector | Meaningful RED observed | GREEN full backend at that point |
|---|---|---|
| anonymous page/privacy/generic response | login lacked `/forgot-password` | 294 passed |
| real SMTP/hash-only/trusted URL | actual SMTP sink had 0 messages, expected 1 | 295 passed |
| reset/session revocation/one-time | `/reset-password` returned 404, expected 200 | 296 passed |
| password policy/confirmation | 3 cases returned 200, expected 400 | 299 passed |
| persisted account limit | sink received 4 messages, expected 3 | 300 passed |
| unknown account/IP limit | sink received 1 message after 10 unknown requests, expected 0 | 301 passed |
| enabled config validation | 13 unsafe configurations did not raise | 314 passed |
| disabled consumption | old issued token returned 200 when feature disabled, expected 400 | 315 passed |
| in-flight old-password login | old session still got catalog 200 after reset, expected 303 | 316 passed |
| real-browser null Origin regression | same-origin private form returned 403, expected 200 | 326 passed |
| numeric environment privacy | invalid integer error exposed supplied value instead of sanitized error | 327 passed |

Regression cases additionally cover expired/tampered/empty/malformed/overlong capabilities, concurrent reset submissions, foreign CSRF/Origin/Fetch-Site, GET non-consumption, posted foreign user ID, preserving other accounts/sessions and all unrelated table contents, expiry of throttle window, persisted account limit across app recreation, SMTP failure with no STARTTLS downgrade/no secret logs, forwarded-host poisoning, and generic enabled/disabled behavior.

## Issues found and resolved

The first integrated browser run found **403 on the real form** although Flask client tests passed. A minimal Chromium probe observed `Origin: null`, `Sec-Fetch-Site: same-origin`, cookie present — caused by the required no-referrer policy. Added a failing regression before a narrowly scoped recovery-only exception, retaining mandatory CSRF and rejecting null origin without exact same-origin metadata. A fresh isolated server/build/browser run passed. Do not remove privacy headers or globally allow null Origin.

An explicit concurrent login test found the existing login could verify the old hash, race with reset, then create a new session after revocation. Fixed by transactionally rechecking the verified hash at session issuance. Regression now passes.

Build emitted only the expected Vite warning that its fresh temporary outDir is outside project root; no live dist override was used. Background shell also reports a pre-existing missing `ng` command from `.zshrc`; it did not block build/server. No production dependency was added.

## Remaining operator work / limitations

No provider values or secrets were supplied, no real email sent and no production service changed. Obtain SMTP host/port/TLS/sender/auth plus canonical HTTPS origin, provision credentials privately, perform backup and authorized rollout per `password-reset-contract.md`. Loopback SMTP proves integration, not provider/inbox readiness.

Mail queue is bounded and in memory, not durable; restart can lose pending requests. It does not promise delivery or retry automatically. IP throttling uses direct peer address; proxy deployment requires an explicit trusted-proxy review. Fragment links require JavaScript and provider/link-rewriter fragment preservation. QA captures are private temporary artifacts, not a supported mailbox service.

Current isolated QA ownership/paths are in `server.json`; parent verifier can inspect this process or stop it and launch a fresh QA instance. The browser runner expects fresh registration/mailbox state. Do not restart production as part of verification.
