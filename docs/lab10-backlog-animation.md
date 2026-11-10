# LAB10 topic 4 — visible backlog accumulation

> Historical implementation/verification record. Current LAB10 has **five topics**, ends at “เพิ่ม Workers ลดงานค้าง”, and uses **1500ms** connector motion. See [current revision](lab10-five-topics-speed.md). Counts, timings, assets and publication statements below describe that earlier stage, not current status.

Workspace: `/Users/prommeesee/projects/classroom`. Presentation-only follow-up to `lab10-presentation.md`; no deployment, commit or push.

## Diagnosis and change

The supplied screenshot and actual compiled preview showed an honest idle state, not an automatically executed experiment. Existing playback did await a 2000ms generic dot route and a 650ms hold, then displayed job tiles; it was not silently running a continuous Worker. However, the moving dot did not identify the jobs, and processing had no visible in-progress state. The backlog teaching depended too much on changing counters and generic messages.

Topic 4 now shows actual captured job IDs moving as blue chips, with concise queue before→after feedback. It retains the original sequence, **enqueue → enqueue → process → enqueue** (not three enqueues followed by work). The deterministic model and sequencer are unchanged:

| Stage | Waiting IDs | Completed IDs |
|---|---|---|
| Idle | none | none |
| First batch arrives | 1–3 | none |
| Second batch arrives | 1–6 | none |
| Worker takes #1 / processes it | 2–6 | none |
| One round completes | 2–6 | 1 |
| Third batch arrives | 2–9 | 1 |

The final highlighted queue retains eight waiting chips, separately from the single completed chip. The result reads **เข้า 9 · เสร็จ 1 · ค้าง 8 งาน**. Counts and chip identities derive from captured before/after model snapshots; no throughput, clock, dropped-job or retry model was added. Idle offers a short instruction and zero actual results. Other topics retain their existing presentation.

Each transfer remains **2000ms**. After arrival, enqueues have a 1000ms arrival hold; work has a 1300ms processing hold before completion. A 900ms settled hold precedes the next original action. Every phase is awaited, pauseable and cancelable. Replay projects stored frames only; reduced motion settles each snapshot directly. A compact ID-only waiting/completed display avoids eight repeated “Sharpen” labels forming a tall column on phones; accessible labels retain the job type.

## Verification actually executed

- RED: new snapshot test failed because the projection export was absent. The compiled UI test failed on the original preview because the backlog summary was absent. A narrow-layout regression then failed at a 166.75px waiting block; compact IDs resolved it without reducing typography.
- `npm test`: **115 passed, 0 failed**, saved in `evidence/lab10-backlog-animation/units.txt`.
- Compiled browser suite: **9 passed** (`browser.json`). Four new backlog tests plus all five prior queue-presentation tests. Covered real intermediate queue growth, #1 processing while done remains zero, final exact IDs/counts, 2000ms motion, sampled movement, exact pause freezing, route/chip geometry, replay, cancellation, reduced motion, Light/Dark, 1280/390/320px and separate 600px-high phone captures. All six queue topics retain their original final counts and controls.
- Real disposable Flask/SQLite QA: **17 experiment POSTs**, original `enqueue-jobs` / `process-jobs` identities, **3 persisted semantic points** (two simulation identities plus thinking), completed `message-queue`, **0 playback/navigation POSTs**, no page errors. Tested held-save focus/duplicate blocking, wrong-answer qualification, exact-event lost-response retry, cancel during first backlog save, reload and standalone completion. See `account-report.json`. This uses a synthetic seeded account and ephemeral database, not real accounts; restart persistence and signup are not part of this run.
- Inspected actual original, idle, moving, six-waiting, processing and final screenshots. Mobile inspection prompted compact chips. `moving-light-320.png`, `working-dark.png`, `six-waiting-light.png`, `final-light.png` and `mobile-dark-320.png` show the meaningful phases. Short-phone scrolling remains necessary for the whole diagram; text was not shrunk to fit it.
- Hash baseline: **85 source/dist files checked**, only `main.js`, `queue-presentation.js` and `queue-presentation.css` changed. Queue model, queue sequencer, other source modules and canonical dist remain unchanged. `git diff --check` passed. Prior pending work and old screenshot destinations were preserved.

## Files and reproduction

Changed presentation: `courses/scale-lab/src/queue-presentation.js`, `queue-presentation.css`; `main.js` only passes the active topic to the renderer. No action/sequencing/scoring changes.

Added: `tests/queue-backlog.test.js`, `tests/browser/queue-backlog.spec.js`, `playwright.backlog.config.js`. Existing `queue-presentation.spec.js` and `scripts/lab10-presentation-browser-verify.mjs` now accept evidence-directory overrides so old evidence is not overwritten.

From `courses/scale-lab`:

```sh
npm test
node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview --emptyOutDir
node node_modules/@playwright/test/cli.js test --config=playwright.backlog.config.js queue-backlog.spec.js queue-presentation.spec.js
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab10-backlog-qa-courses/scale-lab/dist --emptyOutDir
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab10-backlog-qa-courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python QA_PYTHON_ARCH=arm64 QUEUE_QA_EVIDENCE=/Users/prommeesee/projects/classroom/evidence/lab10-backlog-animation node ../../scripts/lab10-presentation-browser-verify.mjs
```

The existing parent-owned preview **PID 98524** is still listening at **http://127.0.0.1:4173/** and was rebuilt in place, not restarted. It is standalone, with browser-local progress and no platform login. Isolated backend QA terminated its owned server and disposable database. No Docker, canonical dist or real database was changed.
