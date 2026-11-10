# LAB11 — Logging, Metrics and Automation presentation

> Historical iteration report, not the current acceptance contract or a claim that its browser suite passes today. Superseded by [LAB11 current release verification](lab11-current-release.md). Commands, page counts, asset hashes and publication status below describe that earlier iteration only.

Workspace: `/Users/prommeesee/projects/classroom`, branch `exam-new`. Source and standalone preview revision only; no deployment, commit or push.

## Interaction and original mapping

Seven independent topics remain after removing only the single-machine logs experiment. The first topic is now centralized logs (ค้นข้ามบริการ). The original `logging.js` model, lesson reading/comparison/notes, quiz choices, manifest, assessment and stable identities are unchanged. Each topic prepares only an unrun scenario; earlier topics need not be visited.

| Original instruction | Topic(s), prepared condition | Original action and actual outcome |
|---|---|---|
| Search central / Error | 1: all services | `inspect-logs`: actual Web 2 `DB_TIMEOUT` and Worker 1 `PHOTO_JOB_FAILED` records, without repairing either service |
| Read all three metric groups; compare periods | 2: host, 3: tier, 4: business | Separate `inspect-metrics` calls; show original three rows and original window/cohort for each group. CPU 30%, memory 55%, disk 20 MB/s; query p95 900 ms, cache hit 65%, backlog 24; DAU 1,200, D−7 cohort returning on D 40%, revenue 24,000 baht |
| Broken version, two pipeline steps | 5: fresh `testsPass=false` | Original `run-pipeline` twice: built → blocked. Build passes, Test visibly fails, Deploy remains unperformed |
| Fixed version, three steps | 6: fresh `testsPass=true` | Original `run-pipeline` three times: built → tested → deployed; no guarantee of bug-free service |
| Repeat after terminal; reset | 7: explicitly prepared already-deployed state | Original terminal `run-pipeline` is an unscored no-op. Global reset cancels playback and returns topic 1, without deleting learning evidence |

The guided UI intentionally removes editable scopes/levels/version controls, unrelated result sections and the broad architecture from the experiment. The original model's other scope/level capabilities remain unchanged. Retained reading explains centralized logging, three metric levels, CI, privacy, limitations and downstream scaling. No new telemetry, network topology, thresholds, alerting, test execution or real deployment is invented.

## Presentation and sequencing

- Short Thai premise, centered 48px icon navigation, one primary experiment and adjacent result inside the scene; replay/pause are secondary. No score panel or generic technical-details panel.
- Search results appear as real event boxes, not generic particles. Central search projects service-labelled result boxes along a dotted presentation connector; this is explicitly not a network route or a promise of log collection completeness.
- Metric rows display exact model values and windows, without inventing comparability between different units or fabricated warning thresholds. No connector is drawn for metrics; compact local reveal is used instead.
- Pipeline cards retain visibly distinct pending, passed and failed states. A code-version box advances only across a real captured pipeline transition. Failed Test does not animate a Deploy transition.
- Connector duration is **1500ms** for experiment and replay. Local reveal/hold is **900ms**. Both are awaited; pause freezes the active animation and holds later operations. Reduced motion settles directly. Topic/reset/lesson cancellation prevents subsequent mutations or saves.
- Every meaningful original semantic operation is recorded separately under `logging-operations / logging-operations`. Repeated pipeline steps retain `run-pipeline` and backend deduplication; there is no compound identity. Replay and presets never record. Failed saves retain the captured transition and UUID for retry, without repeating its model mutation.

## Current removal verification

Evidence: `evidence/lab11-remove-single-host/` (separate from all historical screenshots). Full units: **120 passed**. Compiled focused suite: **6 passed**, all seven outcomes in Light/Dark at 1280/390/320, plus normal-motion phone and short 320×600 keyboard checks. Initial/reset/Back return to `1 / 7 · ค้นข้ามบริการ`; first Back and final Next disabled. Removed heading/prompt absent from experiment DOM. Exact metric values/windows and both central error records verified. 1500ms connector playback, pause, replay and cancellation retained. Scoped reading/quiz/reset/glossary regressions: **5 passed**.

Fresh disposable Flask/SQLite account QA: **15 experiment POSTs**, original three action identities, **4 persisted semantic points** including thinking, only LAB11 completed, zero replay/navigation POSTs. Lost-response exact retry, pending duplicate guard/focus, terminal no-op, cancellation during saves and reload persistence passed. See `account-report.json`. No signup/OTP, backend restart, full backend unit suite or full historical browser suite was run for this removal.

Parent preview PID 98524 on port 4173 rebuilt in place without restarting. Canonical dist, model, other lesson source and unrelated Word lockfile are hash-preserved against the pre-removal snapshot. No Docker, live DB, publication or commit/push. Only three LAB11 source files changed for this removal; existing shared integration and CSS required no edits.

Removal reproduction (from `courses/scale-lab`, using existing compatible x64 Node):

```sh
/usr/local/bin/node --test tests/*.test.js
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview
/usr/local/bin/node node_modules/@playwright/test/cli.js test -c playwright.lab11.config.js
/usr/local/bin/node node_modules/@playwright/test/cli.js test -c playwright.lab11-regressions.config.js --grep 'LAB11|logging topics'
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ /usr/local/bin/node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-remove-single-host-courses/scale-lab/dist
# repository root:
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab11-remove-single-host-courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python QA_PYTHON_ARCH=arm64 LOGGING_QA_EVIDENCE=/Users/prommeesee/projects/classroom/evidence/lab11-remove-single-host /usr/local/bin/node scripts/lab11-presentation-browser-verify.mjs
```

## Historical verification before removal (eight topics)

- RED observed for missing logging-flow module, then first flow test GREEN; browser RED observed for old six-topic UI versus eight topics. A compact metrics geometry test failed at 84px before the scoped 16px gap fix. Subsequent model/sequencer tests characterize all metric groups, original action counts, failed-save continuation, replay and cancellation.
- Full course units: **120 passed, 0 failed** (`evidence/lab11-presentation/unit-tests.txt`).
- Compiled LAB11 browser suite: **6 passed**. All eight topics, Light/Dark, widths 1280/390/320, unrun and final states, independent Back/reset, 48px controls, centered title, same-row toolbar, readable result, no overflow, exact Light background, metric adjacency, normal and reduced motion. Actual 1500ms duration, paused positions, SVG endpoint/message-box geometry, local hold, replay and topic/reset/lesson cancellation tested. Short 320×600 keyboard/focus captures included.
- Scoped compiled regressions: **20 passed**. LAB11 reading/glossary/contrast/quiz/reset, topic-result isolation, LAB09 presets/short phones, LAB10 five topics/motion/pause/replay, LAB01 icon navigation and all-lesson score-panel absence/manual completion. Inherited LAB10 screenshots redirected with `QUEUE_EVIDENCE`; legacy LAB11 captures now use this revision's evidence directory.
- Real isolated Flask/SQLite QA with synthetic seeded account and separate integrated build: **16 experiment POSTs**, exactly `inspect-logs`, `inspect-metrics`, `run-pipeline`; **4 persisted semantic points** including one original thinking choice. Completed only `logging-operations`. **Zero navigation/replay POSTs**. Verified terminal exclusion, held-save duplicate guard/focus, wrong-answer qualification, lost-response-after-commit exact-payload retry, no duplicated mutation, cancellation during first save of a multi-step sequence for topic/reset/lesson, manual-save blocking and reload persistence. Standalone completion/reload verified too. `account-report.json` contains sanitized results.
- Actual Light/Dark desktop/mobile, short phone, paused event and paused pipeline screenshots inspected, not just generated. Separate scene captures are tall enough to avoid sticky-header clipping; normal-height action captures document real phone scrolling.
- `git diff --check` passes. LAB01–10 implementation files, model, lesson content, manifest/private bank and old evidence are not edited. Shared integration changes are LAB11-scoped. Unrelated `~$Step3.docx` is preserved. Canonical dist and databases were not build/test targets.

## Scope and limits

This is source/compiled-preview and isolated-account QA, not production HTTPS, real telemetry, signup/OTP or server-restart testing. The full historical browser suite was not run: unrelated old free-form tests still contain obsolete selectors from earlier lab conversions. Scoped current regressions above passed. Long pipeline scenes require vertical scrolling on short phones; text was not shrunk to force the whole scene into one viewport. Synthetic values cannot establish production bottlenecks or safe deployment.

A first background build selected arm64 Node and failed due to the installed x64 Rollup package. Using the existing `/usr/local/bin/node` built successfully without reinstalling dependencies. Parent-owned preview PID **98524** remains running; it was rebuilt in place, not restarted.

## Files and reproduction (original conversion; removal run below)

New source: `courses/scale-lab/src/logging-flow.js`, `logging-presentation.js`, `logging-presentation.css`. Integration: `main.js`, `lesson-topics.js`, and the metrics instruction split in `logging-view.js`. New unit/browser specs and scoped Playwright configs; legacy affected logging, completion and icon-exclusion assertions adapted. Real backend runner: `scripts/lab11-presentation-browser-verify.mjs`.

```sh
# courses/scale-lab
npm test
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview
npx playwright test -c playwright.lab11.config.js
QUEUE_EVIDENCE=../../evidence/lab11-presentation/lab10 npx playwright test -c playwright.lab11-regressions.config.js --grep 'LAB11|logging topics|LAB01 navigation|score panel|five guided|short phone|route is awaited|LAB09|short mobile'
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ /usr/local/bin/node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-qa-courses/scale-lab/dist
# repository root
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab11-qa-courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python QA_PYTHON_ARCH=arm64 /usr/local/bin/node scripts/lab11-presentation-browser-verify.mjs
```

Preview: **http://127.0.0.1:4173/** — standalone, browser-local progress, no platform login. Evidence: `evidence/lab11-presentation/`. Isolated QA cleans up its own backend and disposable database.
