# LAB10 — moving message boxes across all six topics

> Historical implementation/verification record. Current LAB10 has **five topics**, ends at “เพิ่ม Workers ลดงานค้าง”, and uses **1500ms** connector motion. See [current revision](lab10-five-topics-speed.md). Counts, timings, assets and publication statements below describe that earlier stage, not current status.

Workspace: `/Users/prommeesee/projects/classroom`, branch `exam-new`. Follow-up to `lab10-backlog-animation.md`; that document describes the earlier topic-4-only stage.

## Delivered

All six experiments now use the same captured-snapshot message projection: actual job-ID chips travel Producer → Queue or Queue → Worker, wait visibly in the queue, appear in a separate processing area, and become completed only after the processing hold. No circular traffic remains. Four-Worker processing displays four distinct labeled Worker/job pairs in the same explicit round, not staggered or autonomous work.

The model, presets, `queue-flow.js`, shared `main.js`, scoring identities and captured failed-save retry are unchanged. Blocked/empty operations have no route, no moving chips and no processing chips; stopped Workers retain their actual-down label. Waiting and completed chips keep accessible job-type labels. The backlog topic retains its original enqueue → enqueue → process → enqueue ordering and **9 received / 1 completed / 8 waiting** result.

| Topic | Final waiting | Final completed |
|---|---:|---:|
| Enqueue | 3 | 0 |
| Workers stopped | 6 | 0 |
| Producer stopped | 5 | 1 |
| Backlog | 8 | 1 |
| Four Workers | 5 | 4 |
| Drain, then empty attempt | 0 | 3 |

Each transfer takes **2000ms**, followed by the established 1000ms arrival hold or 1300ms processing hold and 900ms settled hold. These are presentation durations, not simulated throughput or processing latency. Pause freezes the active phase; replay uses captured frames; cancel resolves playback without starting subsequent model actions; reduced motion settles directly.

The center motion path is inset by half the chip height so the **whole box** stays between source and destination nodes, rather than overlapping their labels at the endpoints. Stationary dotted tracks remain. Compact IDs and wrapping Worker/job pairs remain readable at 320/390px without reducing job text below 16px.

## Verification actually run

Evidence: `evidence/lab10-message-boxes/`.

- RED → GREEN: `queue-message-boxes.test.js` first failed because topic 1 had no message-box layer. New compiled endpoint-clearance test then failed because legacy circle-center endpoints allowed half a box to enter a node; geometry was corrected and the test passed.
- Full course unit suite: **116 passed, 0 failed** (`units.txt`). Includes existing model/flow/retry tests plus conservation of real job IDs across every captured action in all six topics.
- Compiled browser checks: **27 passed, 0 failed, 0 flaky**, aggregated from `browser-light.json` (3), `browser-dark.json` (3), `browser-regression.json` (9), and `browser-focused.json` (12). `browser.json` records the earlier single-test GREEN run, not an additional test in this total.
- New six-topic motion matrix covers Light/Dark × 1280/390/320px: actual changing offsets, 2000ms timing, exact paused positions, sampled source/mid/destination box bounds and center/path agreement, actual IDs with no duplicates, processing before completion, four Worker/job pairs, no-op final frames without routes, original final counts, replay identities, cancellation, reduced motion, zero POSTs and no page errors. Existing backlog tests cover successive enqueue stages, actual #1 processing, full animated replay, and final IDs #2–#9 waiting. Existing focused tests cover glossary, thinking selection, LAB01 navigation and score-panel absence across lessons.
- Real isolated Flask/SQLite QA rerun: **17 experiment POSTs**, original `enqueue-jobs` and `process-jobs` actions, **3 persisted semantic points** (two simulation identities plus thinking), completed `message-queue`, **0 replay/navigation POSTs**, no page errors. Held save/focus, duplicate click guard, exact-event lost-response retry, cancellation during save, wrong-answer qualification and reload passed (`account-report.json`). Uses one synthetic seeded account and disposable storage, not live accounts; signup and restart persistence were not tested here.
- Inspected actual screenshots: `boxes-transfer-light-320-4.png`, `boxes-processing-dark-320-4.png`, `boxes-final-light-1280-3.png`, `boxes-final-dark-390-1.png`. Moving chips are clear and within the gap; four processing jobs wrap into readable pairs on phones; backlog and stopped-Worker final states remain distinct. Whole diagrams still require vertical scrolling on short phones; separate inherited 600px-high captures verify adjacent action/feedback.
- Snapshot hashes checked **85 source/dist files**: only `queue-presentation.js` and `queue-presentation.css` changed. Queue model/flow, shared wiring, other labs and canonical dist stayed unchanged. `git diff --check` passed.

One attempted combined browser invocation exceeded the tool's 420-second limit and produced no final report; it is not counted. All checks were rerun in bounded report-isolated batches above. Old hardcoded screenshot destinations were parameterized before the regression run.

## Changed files

- `courses/scale-lab/src/queue-presentation.js`, `queue-presentation.css`: shared six-topic message projection, processing slots, no-op handling, endpoint clearance; removed obsolete circular renderer/CSS.
- New `tests/queue-message-boxes.test.js`, `tests/browser/queue-message-boxes.spec.js`, `playwright.message-boxes.config.js`.
- Updated `tests/browser/queue-presentation.spec.js` for chip geometry and `queue-backlog.spec.js` / `message-queue.spec.js` for evidence isolation.
- This document. Prior pending lesson changes remain intact; no model/action/content preset changes.

## Reproduction / preview

From `courses/scale-lab`:

```sh
npm test
node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview --emptyOutDir
QUEUE_REPORT=../../evidence/lab10-message-boxes/browser-light.json node node_modules/@playwright/test/cli.js test --config=playwright.message-boxes.config.js queue-message-boxes.spec.js --grep light
QUEUE_REPORT=../../evidence/lab10-message-boxes/browser-dark.json node node_modules/@playwright/test/cli.js test --config=playwright.message-boxes.config.js queue-message-boxes.spec.js --grep dark
QUEUE_REPORT=../../evidence/lab10-message-boxes/browser-regression.json node node_modules/@playwright/test/cli.js test --config=playwright.message-boxes.config.js queue-backlog.spec.js queue-presentation.spec.js
QUEUE_REPORT=../../evidence/lab10-message-boxes/browser-focused.json node node_modules/@playwright/test/cli.js test --config=playwright.message-boxes.config.js message-queue.spec.js flow-navigation-icons.spec.js participation-panel.spec.js
```

For account QA, build with `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/`, base `/courses/scale-lab/`, and scratch output `/Users/prommeesee/.hermes/cache/scratch/lab10-boxes-qa-courses/scale-lab/dist`. Run the existing `scripts/lab10-presentation-browser-verify.mjs` with `TMPDIR=/Users/prommeesee/.hermes/cache/scratch`, that `QA_COURSES_ROOT`, `QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python`, `QA_PYTHON_ARCH=arm64`, and `QUEUE_QA_EVIDENCE=/Users/prommeesee/projects/classroom/evidence/lab10-message-boxes`.

The parent-owned preview **PID 98524** remains alive at **http://127.0.0.1:4173/**, rebuilt in place without restart. Served assets verified as `index-uT4CPRme.js` and `index-DJbXkUzO.css`. Standalone preview has browser-local progress and no platform login. No Docker, live database, canonical dist, commit or push was performed.
