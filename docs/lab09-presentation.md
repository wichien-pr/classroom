# LAB09 Data centers — presentation parity, not deployment

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

> Current experiment: six topics, ending at “6 / 6 · ศูนย์เดียวรับไหวไหม”; topic 7 and its illustrative release panel were removed. The implementation and verification below describe the earlier historical revision. See [current removal verification](lab09-remove-release-topic.md).

Workspace `/Users/prommeesee/projects/classroom`, branch `exam-new`. Baseline is the current working tree including pending LAB01–08 and particle-speed corrections, not HEAD.

## Delivered

Seven independent guided experiments, centered icon navigation with equal 48px sides, separate reset, and an in-scene experiment/replay/pause/result toolbar. Light scene is `#f3f7fa`; Dark uses course tokens. Stationary round-dotted tracks carry blue particles for **2000ms per connector**, sequentially awaited before saving. Pause holds traversal; replay uses captured results without evaluating or posting again. Navigation/reset/unmount cancels old playback; an already captured save may finish without changing the new scene. Failed saves retain the same result/event for retry.

The original evaluator `evaluateDataCenters`, initial state, source instructions, introduction/comparison, detailed reading notes, quizzes, manifest and private assessment are unchanged. Presets live in a separate presentation module. Original action remains **`data-centers / data-centers / dc-request`**. Completion still requires explicit manual completion, an experiment, and either thinking answer; correctness is not required. Numeric score panels remain absent.

This is a batch evaluator, not a DNS or request-delivery state machine. Particles illustrate the model's assigned client→site destinations, including attempted traffic to an unavailable site, explicitly labeled as not served. No invented successful response, cross-site replication, DNS transition or internal database traffic is animated. Two client groups make the direct HTTP destination explicit on narrow screens. Both sites retain Load balancer, Web, Database and Cache labels; the unchanged reading notes explain routing, data synchronization, deployment and limitations.

## Original instruction → independent preset → observable result

Every preset starts from `dataCentersInitial()` with East share 60, both capacities 100, data/release ready, and fresh DNS unless stated. Preparing a topic creates no result or participation event.

| Original step | Independent conditions | Original evaluator result |
| --- | --- | --- |
| 1. Both sites ready, send 100 | Default | Routes 60 / 40; no unavailable, missing data or overload |
| 2. Disable West | West down, redirect off | Routes 60 / 40; unavailable 40 |
| 3. Enable redirect but old DNS | West down, redirect on, freshDNS false | Routes still 60 / 40; unavailable 40 |
| 4. Receive new DNS | West down, redirect on, freshDNS true | Routes 100 / 0; moved 40; unavailable 0 |
| 5. Disable cross-site data | Same failover conditions, synced false | Missing data 40; changing DNS does not copy data |
| 6. Restore data, lower East capacity | Same failover, synced true, East capacity 60 | Overloaded 40; missing data 0 |
| 7. Restore capacity, mismatch releases | Same failover, capacity 100, sameRelease false | Release warning; not a claim all requests fail |

West remains down in steps 2–7. Restoring data/capacity in later presets is explicit rather than depending on learners visiting previous slides. Reset returns to step 1. Risk counts may overlap and retain the original warning not to sum them into a failure total.

## Verification actually run

- TDD: observed missing preset and missing guided-flow function assertions fail, then pass. Browser `.dc-scene` absence failed before integration. Subsequent regressions exposed the legacy pale offline background, missing glossary enrichment and low-contrast Dark glossary; each was fixed and rerun. Snapshot-only replay and failed-save retry also have characterization coverage.
- Full unit suite: `PATH=/usr/local/bin:$PATH npm test` → **105 passed, 0 failed**.
- Compiled LAB09 suite → **5 passed**: all 7 topics at 1280 / 390 / 320px in Light/Dark; centered navigation, 48px targets, grouped toolbar, >=16px result text, exact Light background, 3px down borders, no overflow, nonempty glossary contrast >=4.5, sampled path/node/bounds geometry, actual particle centres against SVG paths, 2000ms duration, both route completions, exact frozen pause, replay and cancellation. Includes 320×600 keyboard/icon/tooltip/focus/result checks. Reduced-motion matrix is static and instant.
- Compiled regression suite → **30 passed**: 5 existing LAB09 content/glossary/layout checks, 6 LAB01 icon-navigation checks, all-lesson score-panel/footer journey, and **18 LAB01–08 particle timing/replay/pause/reduced-motion checks**. Existing timings remain LAB01 800ms, LAB02 850ms/leg, LAB03 2000ms, LAB04 1200ms, LAB05–08 2000ms.
- Real isolated Flask/SQLite account QA against the final integrated scratch build → **13 experiment POSTs**, only `dc-request`, **2 persisted semantic points**, completed `['data-centers']`, **0 navigation/replay POSTs**, no page errors. Verified duplicate guard, held-save icon/focus, lost-response-after-commit same-event retry, topic/reset/lesson cancellation during saving, explicit completion save gating, wrong answer qualification and reload persistence. Standalone wrong-answer-only is insufficient; adding the experiment enables explicit completion and persists after reload.
- Actual reference LAB01–06/LAB08 screenshots and final Light/Dark desktop/mobile/paused LAB09 screenshots inspected. Fixed Dark offline surface and glossary readability after visual review. Geometry sampling waits two animation frames for glossary enrichment/ResizeObserver layout, rather than sampling the intermediate DOM mutation.
- Preservation: **173 pre-edit source/backend/dist/manifest/bank files hashed**, only allowed shared integration files (`main.js`, `lesson-topics.js`, `terms.js`) differ. All other baseline files match, including every LAB01–08 module and timing file. `main-before.js` was reconstructed by reversing only LAB09 additions and verified against its original baseline SHA-256. `git diff --check` passes.

Evidence: `evidence/lab09-presentation/compiled-browser.json`, `regression-results.json`, `account-report.json`, `baseline.json`, `preservation.json`, `main-before.js`, `topics-before.js`, `scene-*.png`, `result-*.png`, `paused-*.png`, and reference `before-*.png`. Historical LAB08/particle evidence was not reused as a screenshot destination.

## Reproduce

From `courses/scale-lab`:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview --emptyOutDir
PATH=/usr/local/bin:$PATH PLAYWRIGHT_JSON_OUTPUT_NAME=../../evidence/lab09-presentation/compiled-browser.json npx playwright test --config=playwright.lab09.config.js dc-presentation.spec.js dc-visual.spec.js --reporter=line,json --output=../../evidence/lab09-presentation/compiled-output
PATH=/usr/local/bin:$PATH npx playwright test --config=playwright.lab09.config.js data-centers.spec.js flow-navigation-icons.spec.js participation-panel.spec.js particle-speed.spec.js
PATH=/usr/local/bin:$PATH VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab09-qa-courses/scale-lab/dist --emptyOutDir
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab09-qa-courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python QA_PYTHON_ARCH=arm64 /usr/local/bin/node ../../scripts/lab09-presentation-browser-verify.mjs
```

## Exact task-owned paths

Modified (prior edits retained):
- `courses/scale-lab/src/main.js`
- `courses/scale-lab/src/lesson-topics.js`
- `courses/scale-lab/src/terms.js` (only LAB09 explanatory selectors)
- `courses/scale-lab/tests/browser/data-centers.spec.js`
- `courses/scale-lab/tests/browser/flow-navigation-icons.spec.js` (untargeted exclusion LAB09 → LAB10 only)
- `courses/scale-lab/tests/browser/participation-panel.spec.js` (LAB09 primary selector/wait only)

Created:
- `courses/scale-lab/src/dc-flow.js`
- `courses/scale-lab/src/dc-presentation.js`
- `courses/scale-lab/src/dc-presentation.css`
- `courses/scale-lab/tests/dc-flow.test.js`
- `courses/scale-lab/tests/browser/dc-presentation.spec.js`
- `courses/scale-lab/tests/browser/dc-visual.spec.js`
- `courses/scale-lab/playwright.lab09.config.js`
- `scripts/lab09-inspect.mjs`
- `scripts/lab09-geometry-inspect.mjs`
- `scripts/lab09-presentation-browser-verify.mjs`
- `docs/lab09-presentation.md`

## Preview and limits

**http://127.0.0.1:4173/** → LAB09. Standalone, no platform login, browser-local progress. Existing parent-owned PID **27119** is still serving `/Users/prommeesee/.hermes/cache/scratch/lab08-preview`; it was rebuilt, never stopped/restarted. HTTP 200 and actual compiled controls verified.

No Docker deployment, canonical dist write, commit/push, real-account access or live-data change. QA uses a synthetic seeded account in a disposable database and terminates only its own server. Not signup/OTP coverage. Full backend pytest, every historical browser suite, server-restart persistence and live HTTPS accounts were not tested. Main deployment remains separate from this preview.
