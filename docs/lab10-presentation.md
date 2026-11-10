# LAB10 Message Queue — guided presentation, verified scratch preview

> Historical implementation/verification record. Current LAB10 has **five topics**, ends at “เพิ่ม Workers ลดงานค้าง”, and uses **1500ms** connector motion. See [current revision](lab10-five-topics-speed.md). Counts, timings, assets and publication statements below describe that earlier stage, not current status.

Workspace: `/Users/prommeesee/projects/classroom`. No deployment, commit or push.

## Delivered

Six independent guided topics replace manual configuration with a short scenario and one experiment action. Centered icon navigation, reset, and an in-scene experiment/replay/pause/result row follow the LAB09 interaction. Actual queued and completed job tiles show the model outcome, not merely footer counts. Light uses `#f3f7fa`; Dark uses course tokens. Actual-down Producer/Workers have thick red borders and readable red labels.

The existing `queueAction` model, original reading/comparison/notes, quiz, manifest and assessment remain unchanged. The presentation calls original `message-queue / message-queue / enqueue-jobs` and `process-jobs` identities separately. Each worker processes one FIFO job per round; enqueue accepts three jobs with capacity 30. No broker failure, ack, persistence, exactly-once or automatic retry semantics were added. Playback retry is presentation/account-save retry, not queue-delivery retry.

### Original instruction → independent scenario → result

| Topic | Prepared conditions and original actions | Final waiting / completed |
|---|---|---|
| Enqueue is not completion | Empty queue, ready Producer and one Worker; enqueue Crop | 3 / 0 |
| Workers stopped | Three waiting Crop jobs, Workers stopped; enqueue then attempted work | 6 / 0; stopped work is unscored |
| Producer stopped | Six waiting Crop jobs, Producer stopped, one Worker ready; work | 5 / 1 |
| Input outpaces processing | Empty queue; enqueue Sharpen twice, work once, enqueue again | 8 / 1 |
| More Workers | Nine waiting Blur jobs, four Workers; work once without changing Producer | 5 / 4 |
| Drain and reset | Three waiting jobs, one Worker; work three times and attempt once on empty queue | 0 / 3; empty work unscored; reset returns first topic and initial state |

Topic presets are unscored setup and do not depend on visiting earlier topics. Job types have equal modeled cost. Repeated experiments restart their topic's deterministic attempt. Navigation/reset cancels unfinished playback and future operations, not already captured in-flight account writes.

Routes last **2000ms** and are awaited. Job tiles/counters update after traversal, followed by an awaited 650ms visual hold; no-route outcomes use a 900ms hold. Pause freezes the current visual phase and therefore holds the next model transition. Reduced motion settles directly. Replay projects captured snapshots only. Failed account saves retain the current result; transport retry reuses the event and continuing the sequence does not mutate that action twice.

## Verification actually executed

- Integration assertion observed RED for missing main integration, then GREEN. Existing queue-flow tests were characterization coverage; expanded tests verify awaiting playback/save, cancellation, failed-save continuation and unscored no-ops.
- `npm test`: **114 passed, 0 failed** (`evidence/lab10-presentation/unit-tests.txt`).
- Compiled `queue-presentation.spec.js`: **5 passed**. All six topics in Light/Dark at 1280/390/320px, exact final job counts and visible tiles, independent presets, replay, reset, no overflow, 48px controls, same-row playback, 16px+ results and exact Light background. Separate 320×600 keyboard/focus/tooltip/action-result captures. Real 2000ms animation, awaited route, exact frozen pause, particle centre against SVG path, endpoint adjacency, stationary dotted tracks, replay and navigation cancellation.
- Compiled regression run: **15 passed**. Existing LAB10 glossary/reset/thinking/content/layout checks adapted to guided controls, LAB09 six-topic/short-phone behavior, LAB01 icon navigation in both themes/three widths, and all-lesson score-panel absence/explicit completion journey.
- LAB01–08 timing regression run: **17 passed, 1 failed initially**. LAB01's wall-clock replay-during-route assertion found the scene already finished; the exact test passed when rerun alone (**1 passed**). No LAB01 implementation or timing was changed. Other measured durations, pause/replay and reduced motion passed. Keep this initial timing flake visible rather than claiming a completely clean first run.
- Real isolated Flask/SQLite QA against a separate integrated compiled build: **17 experiment POSTs**, only original enqueue/work actions; **3 persisted semantic points** (two simulation identities plus one thinking answer); completed `['message-queue']`. Navigation/replay produced **0 POSTs**. Verified held-save duplicate blocking and focus, wrong-answer qualification, no-op exclusion, lost-response-after-commit exact-event retry without duplicate enqueue, cancellation during first save of a multi-action sequence for topic/reset/lesson, manual-save blocking, reload persistence and standalone completion/reload. No page errors. This is a synthetic seeded account, not signup/OTP or production-account coverage; server-restart persistence was not exercised.
- Actual reference LAB09, old LAB10, final Light/Dark desktop/mobile/paused and short-phone screenshots inspected. Enlarged scene captures avoid sticky-header clipping; separate short-phone captures retain normal viewport geometry.
- Preservation baseline was taken **after main integration, before builds**: all 179 recorded source/backend/dist/manifest/bank hashes remain unchanged after verification, including four canonical dist files. LAB01–09-owned source modules have no tracked changes; shared main/topic changes only add LAB10 integration. `git diff --check` passed. Unrelated `~$Step3.docx` untouched.

Evidence is isolated under `evidence/lab10-presentation/`: `compiled-browser.json`, `regressions.json`, `timing-regressions.json`, `timing-retry.json`, `account-report.json`, `baseline.json`, `preservation.json`, screenshots and test output. Previous evidence paths were not reused.

## Files

New presentation: `src/queue-flow.js`, `src/queue-presentation.js`, `src/queue-presentation.css` under `courses/scale-lab`.

Integration: `src/main.js`, `src/lesson-topics.js`.

Tests/config: `tests/queue-flow.test.js`, `tests/queue-integration.test.js`, `tests/browser/queue-presentation.spec.js`, `playwright.lab10.config.js`; adapted `message-queue.spec.js`, `participation-panel.spec.js`, and the untargeted-lab exclusion in `flow-navigation-icons.spec.js` (LAB10 → LAB11).

Real backend runner: `scripts/lab10-presentation-browser-verify.mjs`. This document and the isolated evidence directory complete the handoff.

## Reproduction and preview

From `courses/scale-lab`:

```sh
npm test
node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview --emptyOutDir
npx playwright test --config=playwright.lab10.config.js queue-presentation.spec.js
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab10-qa-courses/scale-lab/dist --emptyOutDir
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab10-qa-courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python QA_PYTHON_ARCH=arm64 node ../../scripts/lab10-presentation-browser-verify.mjs
```

Existing parent-owned preview **PID 98524** remains at **http://127.0.0.1:4173/**, rebuilt in place without restarting. HTTP 200 and actual compiled LAB10 controls verified. This is standalone with browser-local progress and no platform login. Isolated QA terminated its own disposable backend. Canonical dist, live database, deployment and Git publication were not changed.
