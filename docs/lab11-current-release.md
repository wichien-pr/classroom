# LAB11 — current paged Logging / Metrics / CI presentation

This is the current source contract for `exam-new`. Earlier `lab11-*` reports are historical iteration evidence, not assertions that their obsolete UI tests still pass. This revision is prepared for the authorized branch commit/push; it does not deploy or merge anything.

## Learner contract

| Page | Internal phases | Explicit experiment operations |
| --- | --- | --- |
| 1 — Tests ไม่ผ่าน · หยุด | failed Test, Build already passed privately, Deploy locked | `run-pipeline` once |
| 2 — แก้ไข Code Version → Build → Test → Deploy | fix, Build, Test, Deploy (1/4–4/4) | unscored fix, three awaited `run-pipeline` saves |
| 3 — Logs → Metrics → ตรวจหลักฐาน | centralized Error logs, host, Service Tier, Business, observe (1/5–5/5) | `inspect-logs`, three awaited `inspect-metrics` saves, unscored observe |

Back/Next automatically plays only the selected page, including revisits, then stops. Replay is projection-only, not a full-story runner. Navigation does not execute scored prerequisites or award participation. Pause/resume, cancellation, reset and disabled navigation boundaries remain. The explanatory instruction strip and internal decision quizzes are absent; the separate thinking question and completion footer remain.

Moving pipeline tokens show `v.1` for the failed original Test and `v.2` for corrected Test and Deploy. Connector motion remains 1500ms. Labels use Version, Service Tier and Business. Fixed telemetry samples retain their separate windows/cohorts; passing tests neither repair them nor establish a root cause. Build/test/deploy and monitoring are explicitly illustrative, not real CI execution or telemetry.

`logging-story.js` owns the mounted page map and awaited runner. `logging-presentation.js` owns projection. Earlier `logging-flow.js` / `logging-practical.js` helpers and their unit tests are retained as historical model/interpretation coverage, not mounted learner interactions. Obsolete untracked presentation/practical browser suites, earlier QA configs/scripts, and the scratch story probe are deliberately not part of this release; they remain locally untouched.

## Fresh pre-push verification

Evidence is isolated outside the repository at `/Users/prommeesee/.hermes/cache/scratch/lab11-publish/`:

- Full course units: **134 passed, 0 failed, 0 skipped**.
- Fresh standalone and account builds: succeeded, 87 modules each. Standalone asset `index-BoMRr57K.js`; account asset `index-BaEWU0WS.js`; CSS `index-CYArxv8h.css`. Expected Vite warning: external output directory is not emptied.
- Compiled focused browser suite: **21 passed, 0 failed, 0 skipped**, covering all three pages, ordered four/five-phase sequences, selected-page stop/replay, pause/cancellation/reset, both themes, 320/390/1280 widths, navigation geometry and moving `v.1` / corrected `v.2` tokens at Test and Deploy.
- Migrated existing browser assertions: **6 passed**, covering LAB11 quiz/reset, readability/accessibility at 320/390/1440, cumulative evidence/Back behavior and the existing logging/workload integration check.
- Fresh disposable Flask/SQLite account QA: page 3 emitted logs + three metrics actions; page 2 three pipeline actions; page 1 one pipeline action. Navigation/replay emitted **0 participation/progress POSTs**. Persisted semantic score **3**, manual=false, simulation=true, thinking=false, completed=[]. Real-response-loss exact UUID retries, same-page continuation without repeated mutation, cancellation during both merged-page saves, reload and disabled incomplete completion all passed; page errors=[].

Canonical dist and the existing parent-owned preview at 4173 are protected from these builds. Verification uses a separate temporary preview at 4187. No Docker, deployment, live database, private bank, course identity or backend scoring changes. The account QA uses a synthetic seeded user, not real accounts or signup/OTP. Full legacy browser/backend suites were **not** rerun; do not interpret these focused results as a full-browser pass.

## Reproduction

From `courses/scale-lab`, build into a new scratch directory and serve that compiled output. Keep existing preview processes and dist untouched. Set `LOGGING_QA_URL` to that preview and `LOGGING_QA_EVIDENCE` to a fresh evidence directory, then run:

```sh
npm test
node node_modules/@playwright/test/cli.js test --config playwright.lab11-observation.config.js
```

For account QA, build with `VITE_CLASSROOM_URL=/`, `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress`, base `/courses/scale-lab/` and output `$QA_COURSES_ROOT/scale-lab/dist`. From repo root run `node scripts/lab11-observation-browser-verify.mjs` with scratch `TMPDIR`, `QA_COURSES_ROOT`, a compatible `QA_PYTHON` (and `QA_PYTHON_ARCH` if needed), and a fresh `LOGGING_QA_EVIDENCE`. The script stops its ephemeral backend in `finally`.
