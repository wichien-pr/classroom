# LAB02 experiment simplification — deployed to local HTTPS Docker

Checkout: `/Users/prommeesee/projects/classroom`, branch `exam-new`.

## Scope and UX

Only the workload experiment presentation changes. Theory, model, diagram renderer, quiz/private bank, identities and other labs remain unchanged from the pre-edit snapshot (including existing uncommitted redesign work).

Before: long action label; vertically stacked resource inputs; repeated control/result headings; settings button separating action and feedback; every action shows SQL/NoSQL rationale even in the resource/outage topics; permanent navigation caveat.

After: concise per-topic instruction, paired Web/Data inputs, one `ทดลอง` action immediately followed by `ผลล่าสุด`, visible readiness/resource relationship/DB verdict, expandable original reasoning and caveats, supplementary settings after results, navigation explanation in native disclosure. Full working diagram stays above controls/action, all state cards remain visible, original controls/listeners are moved, never cloned or auto-executed. Instructions 17px, actions/results 16px, navigation >=48px; no font shrinkage. Topic 4 supports both matching and mismatched DB choices. Errors without a recognized result verdict remain fully visible.

## Changed files

- `courses/scale-lab/src/lesson-topics.js`: workload-only presentation branches; no simulator changes.
- `courses/scale-lab/src/lesson-topics.css`: workload-scoped grouping and disclosure styles.
- `courses/scale-lab/tests/browser/lesson-topics-workload.spec.js`: new focused contracts + six viewport/theme cases.
- This document.

## Executed verification

- TDD RED → GREEN: short action + progressive disclosure; paired controls/action-result adjacency. Screenshot review exposed a colon-boundary issue; added a visible mismatched-verdict assertion, observed failure, then corrected boundary parsing. Unknown message formats fail open.
- `PATH=/usr/local/bin:$PATH npm test`: **74 passed**.
- `PATH=/usr/local/bin:$PATH npx playwright test --config=playwright.lesson-topics.config.js`: final **29 passed**. Covers all 11 topic-enabled labs/59 topics, all control identities/navigation, full diagram order, contrast/overflow/type, plus all four LAB02 actions in light/dark at 1280×800, 390×568, 320×568. Checks retained values/result after Back and keyboard disclosure.
- `PATH=/usr/local/bin:$PATH npx playwright test database.spec.js flow-main-diagram.spec.js flow-readability.spec.js sidebar-readability.spec.js --reporter=list`: **25 passed**.
- `PYTHONPATH=appworks /usr/bin/arch -arm64 /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python -m pytest appworks/tests/test_participation.py appworks/tests/test_qualification.py -q`: **42 passed**.
- Integrated Vite build: **52 modules**, isolated output `/Users/prommeesee/.hermes/cache/scratch/lab02-simple-qa/scale-lab/dist`, assets `index-BmwxOPA3.js` and `index-DWtWx4xQ.css`.
- Real synthetic-account Flask compiled QA: **11 lessons / 59 topics / 41 unique awards / 11 completed / zero page errors**. All action identities/dedup, Next/Back no progress/participation POST, retained state/result, combined qualification and reload verified. Existing `scripts/lesson-topics-browser-verify.mjs` run via scratch copy `/Users/prommeesee/.hermes/cache/scratch/lab02-account-verify.mjs` with absolute imports and separate evidence destination, no behavior assertion changes.
- `git diff --check`: passed.

## Evidence and preservation

- `evidence/lab02-simplified/`: 48 actual short-viewport top/action screenshots, all four topics × six cases; `protected-files.json`.
- `evidence/lab02-simplified-account/report.json`: actual backend readback and per-lesson coverage.
- Before screenshot: `/Users/prommeesee/.hermes/cache/scratch/lab02-before.png`.
- Visually inspected final light desktop topic top/action, light 390 topic-4 action and dark 320 outage action. Parent should independently inspect these final images.
- Snapshot `/Users/prommeesee/.hermes/cache/scratch/lab02-baseline.json`: 261 existing course files. 257 unchanged; changes are the two intended source files plus two regenerated preexisting database-test screenshots (`courses/scale-lab/evidence/lab02-diagram-{320,390}.png`). Host dist, all manifests/private banks, lesson/model source and other courses unchanged.

## Limitations / rollout

Deployed to `https://localhost` on 2026-11-05, using the existing real-account volume `classroom-accounts-20261022:/data` and full four-file HTTPS Compose configuration. No commit or push. Host dist, approved pending source changes, PDFs and `~$Step3.docx` preserved.

- Canonical Docker build succeeded before downtime. Running immutable image: `sha256:20b48dd12294264a73926447004cfadf0195654240b78211edcd57689dde6f59`; previous image: `sha256:e1574cb7763cef843674d038efccfa333c9710252a52e177cae75e88d7ed379c`.
- Complete `/app` hash comparison permits only Scale Lab dist index and old/new JS/CSS bundles. New integrated assets exactly match the source-qualified scratch bundle. Backend, other courses, manifests and private banks unchanged.
- Actual immutable-image synthetic-account browser QA: 11 lessons / 59 topics / 41 unique awards / 11 completed, zero page errors; navigation makes no course POST, retained state/results and reload dedup verified. Separate LAB02 matrix exercises all four topics in light/dark at 1280×800, 390×568 and 320×568, validates original `workload/estimate` identity, visible outage/mismatched verdict, keyboard disclosure, typography and overflow. All six cases pass; one semantic award across repeated actions and reloads. Evidence: `evidence/lab02-simplified-image/report.json` and `evidence/lab02-simplified-image-matrix/report.json`. Inspected actual-image dark 320 outage and light desktop verdict screenshots.
- Coordinated stopped-writer full-volume archive: `/Users/prommeesee/.hermes/backups/classroom-lab02-simple-20261105-110211/data.tar`. Extracted archive integrity/schema/all 25 table fingerprints/uploads match stopped-volume baseline. Immediate startup comparison before HTTP probes matches exactly. Effective environment and original mount preserved.
- Private deployment report and baseline/readback fingerprints: same backup directory, `deployment-report.json`. Archive SHA-256: `c72bb7fa0e6b5054afb6205c9fd84e8a407e83f42f42d35e4c6a8ac720647938`. Rollback tag: `classroom:rollback-lab02-simple-20261105-110211`; preserved runtime env is private mode 0600.
- Running application tree matches qualified image; backend healthy. Direct and trusted-CA HTTPS `/healthz` pass; login theme markers pass; protected HTML redirects 303 to `/login`, APIs reject guests 401. Login probe added exactly one anonymous session; all preexisting session rows, non-session tables and uploads remain unchanged.

Seeded synthetic-account HTTP coverage is not live-account HTTPS authentication, signup/OTP or restart-persistence verification. Full unrelated browser suite not rerun; its previously documented stale lesson-count failures remain historical. Mobile must still scroll through the approved full diagram; at 320×568 the action and key result fit together, but all state/navigation is not in the same viewport. Longer reasoning remains accessible on demand, not deleted.
