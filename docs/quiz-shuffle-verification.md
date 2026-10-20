# Check your thinking: randomized presentation (not deployed)

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`.

## Behavior and identity

Each of the twelve two-choice quizzes takes one independent `Math.random()` draw during module initialization. Values below 0.5 display original choices `[1,0]`; otherwise `[0,1]`. Orders are cached by stable lesson kind before first rendering. Navigation, feedback, asynchronous status changes and simulation reset do not redraw. Reload may produce either order, including the same order again; there is no promise of alternating or a balanced course-wide distribution.

Visual labels are always A then B. `data-answer` remains the original answer index: original 1 is correct in the current lesson content, original 0 is incorrect. Existing correctness/selection/feedback handlers and shared pending guards are unchanged. Original 0 submits `quiz-answer-a`; original 1 submits `quiz-answer-b`, regardless of visible letter. No source answers, manifests, backend IDs, scoring logic or qualification policy changed. Thai participation guidance explains identity rather than position. Standalone also shuffles and still claims no account points.

This is presentation randomization, not secure grading or an anti-cheat measure. Current lesson content intentionally remains untouched. The new contract regression asserts exactly two distinct answers and stable lesson/action keys; a future multi-choice curriculum must extend this presentation contract deliberately.

## Strict vertical TDD evidence

1. Added deterministic real-browser presentation test before changing `main.js`. `npx playwright test tests/browser/quiz-order.spec.js` failed on RNG 0: expected `[1,0]`, received `[0,1]`. RNG 0.999999 characterized the existing unchanged order. Evidence: `evidence/quiz-order-red.txt`.
2. Added minimal cached presentation map and rendered original choice IDs separately from display labels. Both deterministic cases passed within the full suite.
3. Added the revised identity-guidance assertion, observed both cases fail on the missing Thai explanation, then changed the guidance. Evidence: `evidence/quiz-copy-red.txt`.
4. Added passing regression coverage for all twelve lesson contracts and independent alternating RNG draws (exactly twelve total, unchanged through navigation/reset). These additional characterization checks are not claimed as separate RED cycles.

## Executed regressions

Commands from `courses/scale-lab`, with compatible Node selected using `PATH=/usr/local/bin:$PATH`:

- `npm test`: **27 passed** (`evidence/quiz-unit.txt`).
- `npx playwright test`: **20 passed** (`evidence/quiz-standalone.txt`). Includes both deterministic permutations, correct/wrong feedback, A/B labels, aria-pressed persistence, reset/navigation, per-lesson draw count and no standalone account score.
- `npx playwright test -c playwright.account.config.js`: **15 passed** (`evidence/quiz-account.txt`). Existing captured retry/navigation, shared async guards and qualification regressions remain green.

From `appworks`: `.venv/bin/python -m pytest -q`: **396 passed** (`evidence/quiz-backend.txt`).

## Real compiled Flask/SQLite browser verification

Started `scripts/registration-qa-server.py --port 8121 --evidence evidence/quiz-shuffle` with the appworks virtualenv and compatible Node PATH. Added optional port/evidence launcher parameters, preserving 8120/default evidence behavior. The launcher builds to a private temporary course tree, never the published course dist. Signup uses an actual six-digit OTP delivered through the existing loopback Graph HTTP double and `complete-registration.mjs`; there is no registration bypass or external provider traffic.

Stopped only the identified QA process before rebuilding final copy into the same private tree (`npm run build -- --base /courses/scale-lab/ --outDir <QA courses root>/scale-lab/dist --emptyOutDir`, with `VITE_CLASSROOM_URL=/` and `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress`). Resumed the same isolated DB using the launcher's `--resume --port 8121 --evidence evidence/quiz-shuffle` arguments. Final build: **11 modules, success**, `evidence/quiz-shuffle/build-final.txt`.

Executed `node scripts/quiz-shuffle-browser-verify.mjs` against that compiled server, without mocking any API:

- Both forced permutations; all twelve lessons' text and original identities.
- Correct original choice at visual A, then visual B after reload; correct and incorrect feedback.
- Selection/order persistence through navigation/reset; selection intentionally clears on reload.
- Original correct choice awarded once, opposite-order replay awarded zero; original alternative awarded once; repeated alternative and both choices after relogin awarded zero. Fresh request UUIDs do not produce duplicate semantic awards.
- Correct thinking + main simulation still lacks manual completion; explicit manual action remains required. Wrong thinking also qualifies when the other two criteria exist.
- All twelve lessons qualify, persisted through reload/relogin; final account score **25**.
- Desktop and 320/390px checks; no page errors; compiled JS/CSS responses all 200.

Artifacts: `evidence/quiz-shuffle/browser.json`, `browser-log.txt`, `correct-at-A.png`, `correct-at-B.png`, `mobile-320.png`, `mobile-390.png`. Screenshots inspected: correct choice visibly changes position, feedback remains correct, narrow layout has readable choices/feedback without horizontal clipping. The QA database also passed `PRAGMA integrity_check`; `database-verification.json` records aggregate awards from two independent shuffle test accounts plus the canonical smoke account.

Also executed canonical `scripts/browser-verify.mjs` with `CLASSROOM_QA_URL` and `CLASSROOM_QA_MAIL_DIR` set from this QA server info: **passed** OTP signup/login, interactive compiled lab, return navigation, deep-route asset load, mobile overflow, guest protection and logout. Evidence: `evidence/quiz-shuffle/platform-log.txt` and `evidence/platform-browser.json`.

## Scope / handoff

No production deployment, production DB writes, private `.env` reads, manifest edits, published dist builds, or changes to ports 8080/8081. Live listeners remained PID 48985 (8080) and Docker PID 1363 (8081) when checked. Build/database/OTP receipts are in the private QA tree; do not publish them. Evidence server metadata identifies the QA PID and tree. QA PID 60876 was stopped after verification and port 8121 was confirmed closed; use the resume command above for review. Production rollout remains an explicit operator/parent decision.
