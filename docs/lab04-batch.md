# LAB04 six-request batch — current local verification

Workspace: `/Users/prommeesee/projects/classroom`. Not deployed or committed.

## Design

One revised design, four retained independent presets. Each explicit experiment sends **six actual model requests**, sequentially. The six R1–R6 chips retain actual destinations; backend counters and six-cell bars come from model counts (not utilization or measured throughput).

| Preset | App A | App B | App C | Rejected |
|---|---:|---:|---:|---:|
| A/B round robin | 3 | 3 | 0 | 0 |
| A unavailable | 0 | 6 | 0 | 0 |
| No eligible backend | 0 | 0 | 0 | 6 × 503 |
| B/C replacement | 0 | 3 | 3 | 0 |

`routeBalance` remains a one-request primitive. Each request retains `balance / balance / route`; semantic scoring remains one simulation award per account. Manifest unchanged: **12 lessons / 44 active action definitions**, including three LAB04 definitions (route and the two original thinking choices). No real network load generator is introduced.

## Lifecycle

`balance-flow.js` owns captured frames and serial awaited operations/saves. Failed stages retain their mutation and retry the original event; an explicit subsequent experiment continues the remaining requests without rerouting the failed one. Pause gates the next request even while a save is in flight. Cancellation releases gates and prevents later operations; an already in-flight save may finish. Replay projects the captured six-frame batch without model operations or writes. Navigation prepares fresh counters without writes. Original centralized LAB04 connector duration stays **1200 ms**.

## Executed verification

All commands used `/usr/local/Cellar/node/26.7.0/bin/node`.

- `node --test tests/*.test.js`: **158 passed, 0 failed**. Includes five new batch lifecycle/model tests, original four-preset/model tests and timing regressions. Observed RED before implementation for missing batch controller, visible request strip, pause gating and paused-save-failure recovery.
- `PLAYWRIGHT_BROWSERS_PATH=.browsers node node_modules/@playwright/test/cli.js test -c playwright.lab04-batch.config.js`: **6 passed**. Every test covers all four presets, pause/frozen WAAPI times, 1200ms duration, real final counts, replay, reset and overflow. Light/Dark × 1280/390/320px = **24 rendered preset combinations**.
- Fresh authenticated Flask/SQLite runner `scripts/lab04-batch-browser-verify.mjs`: passed all four presets with six original action POSTs each, one semantic route award, zero navigation/replay POSTs, held-save pause/cancellation, lost-response-after-commit exact UUID/payload retry, same-page no-duplicate-mutation continuation, reset/navigation retry, wrong-choice participation, explicit manual completion and reload dedup. Browser errors: **0**. This uses a synthetic seeded QA account, not signup verification or real accounts.
- `git diff --check`: clean.

Evidence:

- Unit log: `/Users/prommeesee/.hermes/cache/scratch/lab04-batch-unit.log`
- Browser report: `/Users/prommeesee/.hermes/cache/scratch/lab04-batch/results.json`
- **24 screenshots**: same directory, `{light|dark}-{1280|390|320}-{0|1|2|3}.png`. Inspected desktop round robin, dark narrow replacement and light narrow all-down captures. Capture positioning keeps sticky chrome outside the scene.
- Real-account report: `/Users/prommeesee/.hermes/cache/scratch/lab04-batch-account/evidence/account-report.json`

## Preview / scope

Rebuilt the existing parent-owned standalone preview output `/Users/prommeesee/.hermes/cache/scratch/lab12-why-sharding-build` using Vite `build --outDir`. Verified the actual served HTML at **http://127.0.0.1:4178/** references `index-BDlXb_WI.js` and `index-ckNMtAhF.css`; browser checks ran against that URL. Standalone has no platform login and uses local progress. The parent preview process was not restarted.

Authenticated QA used its own scratch course tree/build/database and an ephemeral server; only that runner-owned server was cleaned up. No production DB, canonical dist, 4173, existing server, manifest, private bank, LAB03 source or historical evidence was changed. Earlier single-request browser fixtures describe the superseded one-request presentation and were preserved, not claimed as passing current batch acceptance. No commit, push or deployment.
