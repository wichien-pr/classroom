# LAB11 practical redesign

> Historical iteration report, not the current acceptance contract or a claim that its browser suite passes today. Superseded by [LAB11 current release verification](lab11-current-release.md). Commands, page counts, asset hashes and publication status below describe that earlier iteration only.

## Diagnosis and capability map (before implementation)
The rendered seven-topic workspace tells learners the two services to find before searching, reveals fixed metric groups with no question to answer, and automatically plays failed/fixed pipelines. Navigation, not investigation, is the main task. The terminal no-op is an API edge case rather than a useful learner exercise.

Replace seven presentations with three tasks in a simulated order-reading incident. Evidence remains independent: the logs do not establish root cause; metrics have no baseline, request-error rate or incident revenue delta; the pipeline's fixed code versions do not repair those evidence fixtures.

| Existing capability | New purpose and learner action | Observable outcome |
|---|---|---|
| Central Error search / inspect-logs | Search, then select the record relevant to an order read timeout | Exact records; Web 2 matches symptom, Worker photo failure is a different event; neither proves DB root cause |
| Host / inspect-metrics | Choose Web 1 resources to investigate | Exact host window/values; cannot generalize to Web 2 or all services |
| Tier / inspect-metrics | Choose dependencies to investigate | Exact query p95, cache hit and backlog; supports next checks, not root-cause proof |
| Business / inspect-metrics | Check business scope | Exact day/cohort; cannot quantify incident impact without comparable before/after data |
| Failed pipeline / run-pipeline twice | Test candidate before releasing | Build passes, Test blocks, Deploy not done |
| Fixed pipeline / run-pipeline three times | Switch to fixture revision and revalidate | Build/Test/Deploy simulated; logs/metrics unchanged, no guarantee of remediation |
| Terminal no-op | Remove numbered exercise; retain underlying model and unit coverage | No artificial award for already-deployed setup |

The decision feedback is formative and unscored. Any deliberate original inspection remains meaningful; no correctness/completion gate is added. Next/Back, choice preparation and playback never submit. Reading, quiz, manifest, model and durable identities stay unchanged. Original flow cancellation/retry and 1500ms connectors remain in use.

## Executed verification

- TDD: new incident interpretation test failed for the missing module, then passed. The compiled practical browser test failed on old `1 / 7` versus required `1 / 3`, then passed after integration. Additional metric/pipeline unit assertions characterize the feedback already covered by browser-first work.
- Full course units: **123 passed, 0 failed** (`unit-tests.txt`). Model and sequencer unchanged, including terminal no-op coverage.
- Compiled focused suite: **6 passed** (`browser.json`): every evidence choice and wrong/right interpretation in Light/Dark at 1280/390/320, original values, choice preparation clears old results, replay, normal-motion phone flow, 1500ms actual animation duration, frozen pause coordinates, connector endpoint geometry, cancellation and 320×600 keyboard use.
- Compiled scoped regressions: **12 passed** (`regressions.json`): LAB11 reading/glossary/contrast/reset/quiz, evidence isolation, LAB01 icon navigation in both themes and three widths, all-lesson score-panel absence/completion behavior.
- Real isolated Flask/SQLite run (`account-report.json`): **15 experiment POSTs**, original three action identities, **4 semantic points** including thinking; only `logging-operations` completed. No choice-preparation, interpretation, navigation or replay writes. Verified semantic deduplication, pending-save focus/duplicate guard, actual lost-response retry with identical payload, cancellation during first pipeline save, wrong-answer eligibility, explicit completion and reload in both account and standalone modes. Guest read rejected **401**, missing-CSRF completion rejected **403**, persisted completion read back unchanged. Synthetic seeded account, not signup QA; disposable backend cleans up on exit.
- Actual screenshots inspected: light logs 390, dark pipeline 320, dark tier metrics 390 and light short-phone 320. Text stays 16px or above for action/decision controls; 48px targets and no horizontal overflow. Long evidence and decisions still require vertical scrolling on phones; the screenshot suite retains short viewports rather than claiming the entire task fits one screen.
- Preservation report: among all pre-existing source/dist files, only `logging-presentation.js`, `logging-presentation.css`, `logging-view.js` (experiment steps only) and LAB11 branches of `main.js` changed. New `logging-practical.js` owns unscored interpretation. LAB01–10 source, `logging.js`, `logging-flow.js`, lesson reading/quiz source and canonical dist match the pending-work baseline. `git diff --check` passes. No manifest, assessment, backend or database edits.

## Handoff and reproduction

Preview rebuilt in place at **http://127.0.0.1:4173/**, existing parent-owned PID **98524**, output `/Users/prommeesee/.hermes/cache/scratch/lab08-preview`. It is standalone (local browser progress, no platform login). No server restart, Docker, canonical dist build, commit or push.

From `courses/scale-lab` using the existing compatible x64 Node:

```sh
/usr/local/bin/node --test tests/*.test.js
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview
/usr/local/bin/node node_modules/@playwright/test/cli.js test -c playwright.lab11-practical.config.js
/usr/local/bin/node node_modules/@playwright/test/cli.js test -c playwright.lab11-regressions.config.js --grep 'LAB11|logging topics|LAB01 navigation|score panel'
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ /usr/local/bin/node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-practical-courses/scale-lab/dist
```

From repository root:

```sh
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab11-practical-courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python QA_PYTHON_ARCH=arm64 LOGGING_QA_EVIDENCE=/Users/prommeesee/projects/classroom/evidence/lab11-practical-redesign /usr/local/bin/node scripts/lab11-practical-browser-verify.mjs
```

Limits: no production telemetry, actual code tests/deploy, baseline comparison, measured incident impact, backend restart, production HTTPS or full historical browser suite. Evidence fixtures intentionally do not change after the pipeline. Learner answers guide interpretation only; they never change qualification policy.
