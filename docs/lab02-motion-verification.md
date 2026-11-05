# LAB02 animated experiment prototype — deployed to local HTTPS

Workspace `/Users/prommeesee/projects/classroom`, branch `exam-new`.

## Delivered

- LAB02 only: original native SVG component illustrations, HTML labels, a central Web/Database diagram, segmented allocated-resource meters, distinct shared-host boundary and explicit database failure state.
- Existing inputs precede the figure. The original bound `estimate` button is moved into the figure beside its static result; it is not cloned. Keyboard focus survives rendering. Longer model reasoning and SQL/NoSQL suitability remain in the existing outcome/disclosure.
- A finite illustrative request path follows the actual last validated database configuration: normal path goes to DB and back; unavailable DB stops at DB, never animates successful data return. Web remains working as the existing model specifies. Main action keeps `workload / workload / estimate` and the existing event/scoring flow.
- Replay/pause/resume only control CSS playback; no model call, event insertion, progress or participation write. Next/Back pauses animation without resetting inputs/results. Reset and lesson remount discard the view. Reduced-motion preference shows the result immediately.
- Resource bars represent abstract allocations, not utilization or measured capacity. LAB02 does not model load, overload, request latency or throughput; none was invented. Animation duration is explanatory, not a benchmark.

## Source changes in this task

- `courses/scale-lab/src/workload-view.js` (new): scoped renderer and visual-only controller.
- `courses/scale-lab/src/workload-view.css` (new): responsive diagrams, finite motion, light/dark palette, 48px controls.
- `courses/scale-lab/src/main.js`: workload-only rendering/action hook and retained button/focus.
- `courses/scale-lab/src/lesson-topics.js`: LAB02 controls before figure.
- `courses/scale-lab/tests/browser/workload-motion.spec.js` (new): lifecycle, model projection, keyboard, six short-viewport theme cases and reduced motion.
- `courses/scale-lab/tests/browser/lesson-topics.spec.js` and `lesson-topics-readability.spec.js`: LAB02-specific updated action-placement contract; other labs retain their former assertions.
- `scripts/workload-motion-browser-verify.mjs` (new): disposable authenticated compiled-backend verification.
- This document.

Existing pending LAB01, sidebar, quiz, curriculum and other-lab edits were not reset. No model, manifest, private bank or backend source was changed. Existing browser runners regenerate their ignored evidence screenshots.

## Executed checks

- TDD RED → GREEN: missing playback surface; primary action must live beside the diagram result; lost keyboard focus after renderer replacement. Each failure was observed before its implementation/fix.
- Unit suite: **74 passed** (`PATH=/usr/local/bin:$PATH npm test`).
- Full lesson-topic suite: **29 passed**, all 11 topic-enabled labs / 59 topics, typography/contrast/overflow and input identity. Earlier failures were obsolete LAB02 control-area placement expectations; changed only LAB02 to assert the actual main-action/static-result adjacency.
- Final motion suite: **8 passed**, at 1280×800, 390×568, 320×568 in both themes. Covers unavailable DB stop animation, natural end, pause/resume/replay, navigation interruption, invalid input, reset/remount, keyboard focus and reduced motion.
- Database browser regression: **1 passed**; LAB01 full-diagram regressions: **6 passed** (also included in an earlier 23-pass combined browser run).
- Backend participation/qualification: **42 passed**, isolated pytest databases using the arm64 scratch venv.
- Integrated scratch build: **54 modules**; `/Users/prommeesee/.hermes/cache/scratch/lab02-motion-qa/scale-lab/dist`, final entry references `index-B2Fs849N.js` / `index-Dnf6sOom.css`. No published host dist build.
- Actual compiled Flask synthetic-account QA: **2 main-action POSTs**, **0 replay/pause/navigation POSTs**, **1 persisted semantic award** after repeat action and reload; criteria `{manual:false, simulation:true, thinking:false}`, no automatic completion, **0 page errors**. Server owned by runner and terminated in finally.
- `git diff --check` passed. Host `dist/index.html` SHA-256 stayed `41f192e5acf8e7a8ce85e6867873c2854a08131e175feb90e55e9e3035ffe855` before/after. No Docker commands or real-account data access were performed.

## Visual review and evidence

- `evidence/lab02-motion/`: normal-viewport diagram, outage and action screenshots for each theme/width.
- `evidence/lab02-motion-account/report.json`: authenticated backend readback.
- Reviewed successive desktop/light and phone/dark captures. Removed inherited legacy block-text styling, replaced shrinking paused resource bars with accurate fixed allocations, and changed phone request paths to vertical. Final action capture confirms outage result and primary/playback buttons fit together at 320×568.
- Useful review images: `light-1280.png`, `dark-320-outage.png`, `dark-320-action.png`.

## Boundaries

## Authorized deployment — 2026-11-05

- Deployed canonical checkout to existing `https://localhost` (existing accounts), Compose project `classroom-docker-qa` with all four original Compose files. No commit/push; host dist, PDFs, `~$Step3.docx` and pending source work preserved.
- Exact healthy running image: `sha256:d489c33e4cf91e246c89dd0c4a565798d83179f71108a20a6c7403a822fee66c`. Canonical Docker build succeeded before downtime. Complete old/new `/app` comparison permits only Scale Lab's entry HTML and replaced JS/CSS; backend, other course bundles, manifests and private banks unchanged. New assets exactly match the source-qualified integrated scratch build.
- Actual immutable-image QA in a disposable read-only container with tmpfs and synthetic accounts: **8 motion checks**, including six Light/Dark 1280×800 / 390×568 / 320×568 cases, model/shared-machine/outage projection, playback lifecycle, navigation interruption and reduced motion. Separate account run: **2 main-action POSTs, 0 playback/navigation POSTs, 1 persisted semantic award after reload**, no automatic completion and no page errors. Evidence: `evidence/lab02-motion-image/report.json` and `evidence/lab02-motion-image-matrix/report.json`; screenshots reviewed at desktop/light and 320px/dark.
- Actual-image limitation discovered: account saving temporarily disables the main action and browser focus is lost. The standalone renderer-focus assertion does not certify account-mode focus retention; the adapted image runner verifies keyboard activation and re-enabled control instead. No prototype source was changed to hide this limitation.
- Coordinated stopped-writer full-volume backup: `/Users/prommeesee/.hermes/backups/classroom-lab02-motion-20261105-124224/data.tar`; SHA-256 `8fecd719873a20fae6ee9b52ee4d072d1dfb4dc4565a035826289a49cbec877c`. Extracted archive verified against stopped baseline; SQLite integrity `ok`, schema and deterministic fingerprints for **25 tables**, plus upload hashes, identical immediately after startup before HTTP probes.
- Preserved `classroom-accounts-20261022:/data` and effective runtime environment, privately saved 0600. Rollback image tag: `classroom:rollback-lab02-motion-20261105-124224` (old immutable image `sha256:20b48dd12294264a73926447004cfadf0195654240b78211edcd57689dde6f59`).
- Trusted-CA HTTPS `/healthz` and direct backend health passed. Guest course/catalog redirects and protected API 401s passed. Login probe added exactly one anonymous session; all prior sessions and every non-session table/upload remained unchanged. No real-account credentials or QA fixtures used on the live volume.
- Full sanitized release report: `/Users/prommeesee/.hermes/backups/classroom-lab02-motion-20261105-124224/deployment-report.json`. Earlier source-only checks above describe pre-deployment evidence, not the subsequent authorized rollout.

The full vertical phone diagram is taller than the 568px viewport; learners scroll between its top and the adjacent bottom action/result rather than reading reduced-size text. This remains a prototype usability trade-off, not an all-in-one-screen claim. Full unrelated browser/backend suites, signup/OTP, real-account HTTPS journeys and backend restart persistence were not repeated. The account run uses an explicitly seeded disposable QA account, not production data.
