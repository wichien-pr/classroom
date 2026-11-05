# LAB02 automatic topic scenarios — deployed to local HTTPS

Workspace: `/Users/prommeesee/projects/classroom`, branch `exam-new`.
This revision supersedes the animated prototype documented in `lab02-motion-verification.md` on the existing real-account `https://localhost` deployment. No commit or push.

## Verified release — 2026-11-05

- Running immutable image: `sha256:3efb5a93175f90734ce757b8df961da1c6d469e8f8a2c5d8143aecf7df58c8a1`, healthy; complete running `/app` hashes match the qualified image.
- Previous image: `sha256:d489c33e4cf91e246c89dd0c4a565798d83179f71108a20a6c7403a822fee66c`; rollback tag `classroom:rollback-lab02-presets-20261105-130720`.
- Canonical Compose build succeeded before downtime. Complete runtime delta is only Scale Lab dist (entry plus old/new JS/CSS); backend, other courses, manifests and private banks unchanged. New assets exactly match the source-qualified integrated scratch build.
- Actual immutable-image synthetic-account browser: **6 action POSTs, 0 navigation/playback POSTs, 1 persisted semantic award after reload**; all four presets and three topic-4 comparisons checked, no automatic completion or page errors. Separate matrix: **8 passed**, including Light/Dark at 1280/390/320, stale-result reset, shared allocation, outage, pause/replay and reduced motion. Unit suite rerun: **75 passed**.
- Evidence: `evidence/lab02-presets-image/report.json` and `evidence/lab02-presets-image-matrix/report.json`. Visually inspected light desktop and dark 320px action screenshots: readable diagram/actions/results, no condition form; full phone diagram still requires scrolling. Initial adapted matrix expected literal `Web 3` in the shared-machine label; corrected the QA assertion to the actual shared-allocation wording and reran successfully. No application fix was required.
- Coordinated stopped-writer full-volume backup: `/Users/prommeesee/.hermes/backups/classroom-lab02-presets-20261105-130720/data.tar` (SHA-256 `83e0006e652f957ef5019bb07f2ad6d8a1e6aeab43427200bd894e4c6f797b60`). Private backup directory/file permissions are 0700/0600. Archive extraction matched stopped-volume integrity, schema, deterministic fingerprints of **25 tables**, sessions and **1 upload file**.
- Same `classroom-accounts-20261022:/data` mount and exact effective environment retained. Immediately after startup, before HTTP probes, all fingerprints matched. After HTTPS probes, all non-session tables/uploads and preexisting sessions still matched; exactly **1 new anonymous login-page session**, no fixture writes to live storage.
- Report: `/Users/prommeesee/.hermes/backups/classroom-lab02-presets-20261105-130720/deployment-report.json`. Direct and CA-validated HTTPS `/healthz` passed; guest course/catalog redirects and protected API 401s passed. No `-k`, real credentials or live authenticated course actions used.
- All preexisting tracked/untracked source/tests/docs, reference PDFs, `~$Step3.docx` and host dist hash-preserved through deployment; only this verification document intentionally updated afterward.
- Limits: authenticated browser QA used disposable synthetic accounts over loopback HTTP, not live HTTPS accounts. Signup/OTP and restart-persistence journeys were not rerun. Account saving temporarily disables the primary button and can lose keyboard focus, as documented for the prior animation release.

## Behavior and preset table

The LAB02 condition labels/selects/inputs and supplementary settings button are removed from the mounted DOM, not merely visually hidden. A 16px read-only scenario label replaces them. Other labs retain their controls and state-preserving navigation.

| Topic | Fixed model configuration | Observable result |
|---|---|---|
| Separate Web / Data | split, Web 3, Data 1, available, orders/sql | Independent allocation; SQL fits the model's orders example |
| Shared machine | single, Web 3, Data input 1, available, orders/sql | Model returns Web 3 / Data 3 as shared resources, not two independent allocations |
| Web grows, DB fails | split, Web 4, Data 1, unavailable, orders/sql | Web remains running, data unavailable; blocked animation |
| Choose by access pattern | split, Web 3, Data 1, available; each explicit experiment cycles orders/sql → session/sql → session/key-value | fit → reconsider (not impossible) → fit, with original model reasoning/caveats |

Entering a topic (including Back/Next/reset/remount) prepares its first scenario and clears only the current result/playback; it neither executes an experiment nor writes progress/participation. Event history remains historical. Next experiment in topic 4 advances its fixed comparison; label, diagram and outcome always describe the same executed configuration. Replay repeats only the current illustration, never advances scenarios or calls the scored action.

The original `estimate` button node, model `evaluateDatabase`, action identity `workload / workload / estimate`, backend allowlists, quiz choices, manifests and private banks remain unchanged. No input controls or advanced settings are reachable by Tab in LAB02. Fixed allocation units are not latency/utilization measurements.

## Changed files for this revision

- `courses/scale-lab/src/workload-presets.js` — new deterministic presets.
- `courses/scale-lab/src/main.js` — workload-only preparation/result/run tracking and unchanged original action path.
- `courses/scale-lab/src/lesson-topics.js` — LAB02-only removed controls, read-only label, corrected instructions and navigation hook.
- `courses/scale-lab/src/workload-view.js` — initial action wording.
- `courses/scale-lab/src/workload-view.css` — 16px scenario label; outage animations restricted to actual playback (an idle zero-duration animation previously emitted animationend).
- `courses/scale-lab/tests/workload-presets.test.js` — new model contract.
- `courses/scale-lab/tests/browser/lesson-topics-presets.spec.js` — new automatic scenario/navigation lifecycle contract.
- `courses/scale-lab/tests/browser/{lesson-topics-workload,lesson-topics,workload-motion,database,labs}.spec.js` — adapt only LAB02 expectations; other-lab controls unchanged.
- `courses/scale-lab/tests/account/participation.spec.js` — LAB02 no-input/unscored navigation replaces retired invalid-input UI path; other-lab invalid-input check retained.
- `scripts/{workload-motion,lesson-topics}-browser-verify.mjs` — actual backend scenario/dedup and LAB02-specific navigation expectations.
- This document.

## Pre-deployment source verification (historical)

- TDD observed missing preset module, then original 7 condition/settings controls instead of 0, then idle outage incorrectly settling to finished, then new label inheriting 14px. Implementations resolved each failure.
- Unit suite: **75 passed** (`PATH=/usr/local/bin:$PATH npm test`). Preset unit coverage checks all six fixed configurations against the original model, including comparison wraparound.
- Full lesson-topic browser suite: **29 passed** (`npx playwright test --config playwright.lesson-topics.config.js`), all 11 topic-enabled labs / 59 topics, light/dark at 1280, 390 and 320px, 48px actions, typography, contrast and overflow.
- Animation + Database + LAB01 full-diagram suite: **15 passed** (`npx playwright test workload-motion.spec.js database.spec.js flow-main-diagram.spec.js`), includes pause/replay, reset/remount, keyboard, natural finish and reduced motion.
- Targeted mixed logging/workload and narrow all-lab regressions: **2 passed**. Targeted account invalid-input/navigation and delayed-save regressions: **2 passed** (intercepted frontend contracts, not persistence evidence).
- Actual isolated compiled Flask backend: **6 main-action POSTs, 0 playback/navigation POSTs, 1 persisted semantic award after reload**, no automatic completion; criteria `{manual:false,simulation:true,thinking:false}`, zero page errors. Score was zero after skipping/backtracking every topic before first experiment. Each fixed comparison used actual `estimate` with readback.
- Actual all-topic backend regression: **11 labs / 59 topics, 41 semantic awards, 11 qualified lessons**, zero page errors, reload retained state. LAB01 remains unqualified in this run. Synthetic seeded account only; no signup bypass installed in application.
- Integrated scratch build: **55 modules**, `index-B2ROxuq1.js` / `index-BHp4cLMC.css`, under `/Users/prommeesee/.hermes/cache/scratch/lab02-presets-qa/scale-lab/dist`. Build uses both `VITE_CLASSROOM_URL=/` and `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress`. An initial build omitted the latter and timed out waiting for POST; rebuilt correctly and reran both backend checks successfully.
- `git diff --check` passed. Host dist entry remains SHA-256 `41f192e5acf8e7a8ce85e6867873c2854a08131e175feb90e55e9e3035ffe855` (same as prior recorded baseline). No Docker/deploy, commit, push or production account/database operations.

## Evidence and limits

- `evidence/lab02-presets/`: four topics × Light/Dark × 1280/390/320, topic-top and action captures.
- `evidence/lab02-presets-motion/`: paused diagram/outage/action matrix.
- `evidence/lab02-presets-account/report.json`: six actual actions and backend readback.
- `evidence/lesson-topics-account/report.json`: all-topic authenticated regression.
- Visually reviewed `light-1280-1-top.png` and `dark-320-4-action.png`: no settings form; desktop shows premise plus diagram; narrow dark layout retains readable controls/outcome. The full vertical phone diagram still needs scrolling, as in the prior prototype.

At the source-only stage, no production HTTPS/account journey, backend restart or full unrelated account/browser suite was repeated. The source QA server was runner-owned and terminated in finally. Deployment is now authorized and completed as recorded above; earlier pending LAB01/sidebar/theme/quiz work, source PDFs and `~$Step3.docx` remain preserved.
