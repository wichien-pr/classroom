# LAB05 — one experiment per topic (standalone preview; not deployed)

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

## Scope

Checkout: `/Users/prommeesee/projects/classroom`, branch `exam-new`. This follow-up preserves the pending LAB05 presentation, other lessons, manifests, private assessment, reference PDFs and existing `~$Step3.docx`. No commit/push, Docker changes, live database access or canonical dist build. The unavailable historical `Database-Replication.pdf` was not re-inspected; model/source contracts remain the factual basis.

## Single-button contract

Each of eight topics now has one primary icon button, **▶ ทดลอง**, with Thai accessible name and tooltip. Replay and pause remain secondary icons. All three fit on one row even at 320px; feedback wraps beneath. The stage counter/title and actual result remain beside the controls. Light scene stays `#f3f7fa`; Dark, 48px targets, dotted tracks, actual-down red nodes and stale/divergent neutral nodes remain.

`replication-flow.js` executes original model operations **sequentially**, capturing a separate immutable scene snapshot after each real action. It waits for that stage's animation and then its meaningful participation save before the next model transition. Failed writes and rejected promotions display their actual model result, without invented routes. No-route stages have a short readable hold; reduced motion removes motion/hold delays but still executes and awaits the same actions in order.

Pause freezes the current animation and holds the next model action. It is not a rollback of the already executed stage. Replay is available only after the complete run, shows **every captured stage**, and invokes neither the model nor account APIs. Replay snapshots do not replace the simulator state. New explicit runs start from the topic's deterministic premise; retries resume the stopped stage rather than repeating its model mutation.

### Exact sequences

| Topic | Prepared premise | Ordered real actions |
|---|---|---|
| 1. Write and lag | All up, versions 0/0/0 | `write` → `read-replica` (STALE) |
| 2. Primary and manual sync | Versions 2/1/1 | `read-primary` → `sync` → `read-replica` (current) |
| 3. One replica down | Replica 1 down, versions 2/1/1 | `read-replica` selects Replica 2 |
| 4. Both replicas down | Primary up, both replicas down | `read-replica` falls back to Primary |
| 5. Primary down | Replicas available, versions 2/1/1 | `write` (503) → `sync` (blocked/no work) → `read-replica` (STALE) |
| 6. No fencing | Primary down, versions 2/1/2 | `promote` rejected by existing guard |
| 7. Fence, no loss consent | Same, fenced true only | `promote` rejected by existing loss guard |
| 8. Fence and loss accepted | Both assumptions explicitly prepared | `promote` (loss 1) → `write` → `read-primary` → `read-replica` (different history) → `sync` → `read-replica` (reconciled) |

Promotion remains unscored and never bypasses fencing/loss consent. The old writer stays fenced/down. The real `replicationAction` implementation remains unchanged. Topic navigation sets conditions without executing actions or awarding credit.

Semantic identities remain `replica / replica / write`, `read-primary`, `read-replica`, `sync`; there is **no compound experiment identity**. Each meaningful original action is submitted separately. Blocked/no-op sync and promotion generate no participation request. Semantic server dedup remains intact across runs/reload. Completion still requires one meaningful allowlisted experiment plus **either** thinking answer and explicit footer completion; correctness is not required.

## Async safety

- Synchronous busy guard prevents duplicate clicks; primary/replay disabled throughout flow and account saving/loading.
- A failed save stops progression and exposes the existing accessible retry status. Retry resends the captured UUID/payload; after confirmation, the experiment button continues at the next unfinished stage without another write mutation.
- Topic navigation, reset and lesson unmount cancel the runner generation, current animations and resize observer. No subsequent old-scenario action or POST can start. An already in-flight request may finish for its captured original lesson, but cannot advance the old run or mutate another lesson's simulator.
- Bound primary control is retained through scene replacement. Handlers are assigned, not accumulated. Focus returns only if the same connected button remains and focus was not moved elsewhere.
- As before, this is an educational in-browser model, not real DB traffic, automatic election, actual fencing implementation, measured replication latency or production reliability evidence.

## Verification for this follow-up

- Initial pending baseline: 84 unit tests. Final **88 unit tests passed** (`npm test`), including four new flow tests for stage timing/snapshots, double clicks, cancellation, replay without records, guard/history outcomes, and failure resume.
- TDD observed RED for missing runner, missing cancel/retry behavior, five old primary buttons instead of one, mobile toolbar wrapping and enabled experiment during held completion save. Each was corrected and exercised GREEN. Additional all-eight-model checks are characterization, not claimed as new RED-first development.
- Targeted browser selection: **78 passed**. Includes **9 LAB05 tests**, all eight topics in Light/Dark at 1280/390/320, geometry, actual particle movement and paused offsets, dotted paths/node clearance, readable tooltips, one-row controls, real sequential waits, replay from first snapshot, reduced motion, and LAB01–04/completion/hidden-panel regressions.
- After the final account-pending guard correction: unit **88 passed**, relevant presentation/completion/panel selection **7 passed** again. The broader 78-test run preceded that final guard-only change.
- Real isolated compiled Flask/SQLite QA **passed**: **22 experiment POSTs** across full flows, repeated run, lost-response retry and cancellation cases; all four original action IDs; semantic score **5** (four first-action awards + incorrect thinking answer), completion only for `replica`, API readback and reload persistence.
- Replay/navigation **0 POSTs**. Held real participation request verifies stage 1 stays visible, duplicate click is ignored, saving icon and focus restoration. Dropped response after a real commit verifies identical UUID/payload retry and no duplicate model write. Navigation/reset/lesson switch during held saves generate no later flow POST. Held completion request verifies primary disabled until account saving completes.
- The synthetic account is seeded only in disposable QA SQLite; this is authenticated course coverage, **not** signup/OTP coverage. Runner cleans its disposable server/storage. No production account was used.
- The compiled standalone preview was exercised through completion, reload and all-theme screenshots; no browser page errors. Actual screenshot inspection found mobile controls initially stacking; a geometry regression and scoped row override corrected this.
- Full historical browser suite was not run. Legacy free-form replication tests still describe removed settings and are outside this targeted selection. No unrelated legacy failures were repaired.

## Reproduction

From `courses/scale-lab`:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH npx playwright test tests/browser/replication-visual.spec.js tests/browser/replication-presentation.spec.js tests/browser/balance-presentation.spec.js tests/browser/balance-visual.spec.js tests/browser/flow-presets.spec.js tests/browser/flow-navigation-icons.spec.js tests/browser/flow-icons.spec.js tests/browser/flow-toolbar.spec.js tests/browser/workload-icons.spec.js tests/browser/workload-lines.spec.js tests/browser/lesson-topics-presets.spec.js tests/browser/scaling-presentation.spec.js tests/browser/scaling-failure.spec.js tests/browser/completion-footer.spec.js tests/browser/participation-panel.spec.js tests/browser/scene-background.spec.js
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/flow-dotted-build
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ /usr/local/bin/node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab05-qa-courses/scale-lab/dist
```

From repository root:

```sh
TMPDIR=/Users/prommeesee/.hermes/cache/scratch \
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab05-qa-courses \
QA_PYTHON_ARCH=x86_64 \
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python \
/usr/local/bin/node scripts/lab05-presentation-browser-verify.mjs
```

Evidence: `evidence/lab05-presentation/account-report.json`, `{light,dark}-{1280,390,320}-topic-{1..8}-{header,result}.png`, and `preview-{light,dark}-{1280,390,320}-{header,result}.png`.

Follow-up modified: `src/main.js`, `src/lesson-topics.js`, `src/replication-presentation.js`, `.css`, LAB05 browser specs, `tests/browser/participation-panel.spec.js`, account runner and this document. Added `src/replication-flow.js` and `tests/replication-flow.test.js`. Earlier pending source/model/preset files are retained.

Preview: **http://127.0.0.1:4173/**, same parent-owned PID **21546**, serving scratch `flow-dotted-build` (rebuilt, not restarted). Standalone: no platform login; browser-local progress. Canonical dist and Docker are not updated. Build warnings only note that scratch output lies outside the project and is not automatically emptied.
