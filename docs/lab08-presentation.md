# LAB08 experiment presentation — implementation, not deployment

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

**Current particle cadence:** LAB01 800ms, LAB02 850ms per leg, LAB03 2000ms, LAB04 1200ms, and LAB05–09 2000ms per connector. See [particle-speed verification](particle-speed.md). Earlier 2700ms verification below is historical and superseded.

Workspace: `/Users/prommeesee/projects/classroom`, branch `exam-new`. Existing uncommitted LAB01–07 work was the baseline, not HEAD. No Docker, commit, push, real account, live volume, canonical dist, manifest or assessment changes.

## Result

LAB08 now has independent guided presets, centered icon navigation with equal 48px sides, a separate reset icon, and a compact experiment/replay/pause/result strip inside its scene. Light scene is exactly `#f3f7fa`; Dark retains course tokens. Routes are stationary round-dotted tracks with model-backed blue particles, now 2000ms per connector. Failed Web/store nodes are red with 3px borders; Web 3 not yet in the pool is neutral rather than falsely down. The selected Web appears in the route diagram; the full pool's health/session state stays visible above it.

Original introduction, comparison, expanded notes, quiz choices and private assessment remain unchanged. Original `webRequest` implementation is unchanged; only a preset factory was added beside it. Counters shown by a guided attempt describe that independent attempt, not a cumulative benchmark. Preparing a topic does not call the model, create a result or score. One explicit experiment calls the original request once; replay uses its snapshot. Save failures retain the original event and model result. Topic/reset/lesson changes cancel pending playback; an already captured in-flight save may finish but cannot replace the new scene.

Stable identity: `stateless-web / stateless-web / web-request`. Wrong thinking answer still qualifies; correct answers do not auto-complete. Completion remains explicit and gated. Score panels remain absent.

## Original instruction mapping (conditions are not omitted)

All six original `webSteps()` items remain in source. The mounted instructions state their automatically prepared conditions instead of referring to removed form controls.

| Original instruction | Independent topic/preset | Observable model result |
| --- | --- | --- |
| Stateful, session A on Web 1, target Web 2, send request | 1: local, Sticky off, Web 1/2 up, Web 3 outside pool, target 2 | `NO_SESSION`, server 2, zero store reads; routing does not move session |
| Enable Sticky and send again | 2: local, Sticky on, requested target still 2, Web 1/2 up | `OK`, actual server 1; session remains local |
| Change to shared store, disable Sticky, send to Web 2, compare first item | 3: shared, Sticky off, Web 1/2 up, target 2 | `OK`, server 2, one attempted store read |
| Turn Web 1 off, send again | 4: shared, Web 1 down, Web 2 up, Sticky off, target 2 | `OK`, server 2; session survives Web 1 outage |
| Add Web 3, choose Web 3, send | 5: shared, Web 1 remains down, Web 2/3 up, target 3 | `OK`, server 3; newly added Web shares session |
| Turn shared store off and compare with Web outage | 6: shared, Web 1 remains down, Web 2/3 up, target 3, store down | `STORE_UNAVAILABLE`, server 3, attempted read 1; adding Web does not fix store |
| Existing model's all-Web-unavailable outcome (formerly available through free-form settings) | Supplementary topic 7: all Web down, store ready | `NO_WEB`, server -1, zero store reads; no route to Web/store |

All experiments preserve the same original action above, including failure outcomes. No new curriculum identity or scoring action was introduced. Shared-store routes appear only when a shared read succeeds; no successful delivery is drawn to a failed store. Local session experiments do not animate store traffic. Motion illustrates the already validated model result, not latency measurements. Existing notes still explain authentication/cookies, shared files, autoscaling, store technologies, persistence/replication/expiry/recovery, DNS/LB, and capacity/availability limitations.

## Verification actually run

- RED → GREEN: absent preset function, missing guided flow contract, missing `.web-scene`, and missing no-Web preset each failed before implementation; then passed. Existing model tests remain regression coverage.
- Full course unit suite: `PATH=/usr/local/bin:$PATH npm test` → **101 passed, 0 failed**.
- First selected source-browser regression run: **44 passed / 7 failed**. The failures were stale tests assuming LAB08 still had a text reset / `[data-action]` manual controls. Updated only the LAB08 selector in the shared participation runner and moved the reference exclusion to genuinely untargeted LAB09. All seven subsequently passed.
- Final focused browser run: **21 passed** (LAB08 source layout/behavior, updated reference exclusion and all-lesson completion/scoring-panel regression; compiled preview geometry/motion tests). JSON: `evidence/lab08-presentation/final-browser-results.json`.
- Earlier successful reference coverage in the 44 passing tests includes LAB02 icon controls, LAB03 presets/motion, LAB04 routing, LAB05 complete flows and pause/replay, LAB06 slow complete routes, LAB07 all themes/widths and slow routes, plus the gated footer. This is not a claim that every historical browser test in the repository passed.
- Compiled visual matrix: all 7 topics at 1280 / 390 / 320px in Light/Dark; title centers, 48px controls, grouped primary/replay/pause row, readable result size, exact Light background, no horizontal overflow, 3px actual-down borders, stationary dash/cap style and sampled path/node intersections. A real geometry test found horizontal nodes of differing heights were misclassified as vertical; direction now uses x separation and the rerun passed.
- Compiled motion: actual particle centers match SVG path points; route duration 2700ms; all six successful shared-session connector animations finish before enabling the action; exact paused position after awaiting animation readiness; replay restarts motion without changing request/store counters; navigation cancels playback. Tested Light desktop and Dark 320px, plus reduced-motion static geometry across the full matrix.
- Inspected actual full-scene Light/Dark desktop/mobile screenshots and normal-height mobile result screenshots. Large element screenshots are captured with sufficient viewport height to avoid sticky-header overlap; normal-height captures remain separate.
- Real isolated Flask/SQLite account QA passed twice, most recently against the final compiled build: **13 experiment POSTs**, only original `web-request`, **2 persisted semantic points** (one experiment + wrong thinking choice), completed `['stateless-web']`, **0 navigation/replay POSTs**, no page errors. Verified held-save disabled icon/focus and duplicate guard, lost-response-after-commit same-UUID retry without second model mutation, navigation/reset/lesson-exit during save, explicit completion held-save gating and persistence after reload. Standalone separately verifies wrong-answer-only cannot complete, then experiment + wrong answer can explicitly complete and reload.
- Account report: `evidence/lab08-presentation/account-report.json`. QA uses a seeded synthetic account in a new temporary SQLite database and isolated uploads, never registration bypasses or copied real accounts; this is course/API persistence coverage, not signup/OTP coverage. The disposable QA process is terminated by the runner.
- Preservation check: **382 baseline files** hashed; all untargeted source/backend/canonical dist files remain identical to the current pre-edit checkout. See `evidence/lab08-presentation/preservation.json`. `git diff --check` passes.

## Reproduce

From `courses/scale-lab`:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview --emptyOutDir
PATH=/usr/local/bin:$PATH VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-qa-courses/scale-lab/dist --emptyOutDir
PATH=/usr/local/bin:$PATH LAB08_PREVIEW_URL=http://127.0.0.1:4173/ npm run test:e2e -- web-visual.spec.js web-presentation.spec.js stateless-layout.spec.js stateless-web.spec.js flow-navigation-icons.spec.js participation-panel.spec.js
```

From repository root:

```sh
TMPDIR=/Users/prommeesee/.hermes/cache/scratch \
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab08-qa-courses \
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python \
QA_PYTHON_ARCH=arm64 /usr/local/bin/node scripts/lab08-presentation-browser-verify.mjs
```

The old scratch preview/venv no longer existed when discovered. Created a new standalone preview output and isolated arm64 Python venv with `appworks/requirements.txt`; no shared interpreter or dependency lockfile changes. The unrelated pre-existing theme-QA listener was not touched.

## Preview and evidence

**http://127.0.0.1:4173/** → choose LAB08. **Standalone**, no platform login, browser-local progress, not https://localhost/ and not the real accounts database. HTTP 200 and the compiled interaction were verified. Vite preview serves `/Users/prommeesee/.hermes/cache/scratch/lab08-preview`; source changes require rebuilding that directory. The preview was started by this task (PID 15195 / `proc_95d0024680aa`); the parent should retain/adopt ownership for handoff, or restart the exact command below if delegation cleanup stops it:

```sh
# cwd: courses/scale-lab
/usr/local/bin/node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview
```

Evidence examples under `evidence/lab08-presentation/`:
- `before-1.png` through reference LAB06, and `before-8.png`: inspected original compiled references/target.
- `scene-1280-light-2.png`, `scene-1280-dark-2.png`: shared session success.
- `scene-390-light-0.png`, `scene-320-dark-5.png`: narrow-screen local miss / store failure.
- `result-320-dark-5.png`: normal-height action/result viewport.
- `paused-1280-light.png`, `paused-320-dark.png`: paused controls.

Full backend pytest, every historical browser suite, account server restart, signup/OTP, and live HTTPS account verification were not run. No deployment is implied. The live Docker image and actual `classroom-accounts-20261022` volume were never used for QA.

## Exact implementation paths

Modified:
- `courses/scale-lab/src/main.js`
- `courses/scale-lab/src/lesson-topics.js`
- `courses/scale-lab/src/stateless-web.js`
- `courses/scale-lab/tests/browser/stateless-web.spec.js`
- `courses/scale-lab/tests/browser/stateless-layout.spec.js`
- `courses/scale-lab/tests/browser/flow-navigation-icons.spec.js` (only untargeted exclusion changes LAB08 → LAB09; prior edits retained)
- `courses/scale-lab/tests/browser/participation-panel.spec.js` (LAB08 primary selector/wait only; prior edits retained)

Created:
- `courses/scale-lab/src/web-flow.js`
- `courses/scale-lab/src/web-presentation.js`
- `courses/scale-lab/src/web-presentation.css`
- `courses/scale-lab/tests/web-flow.test.js`
- `courses/scale-lab/tests/browser/web-presentation.spec.js`
- `courses/scale-lab/tests/browser/web-visual.spec.js`
- `scripts/lab08-inspect.mjs`
- `scripts/lab08-presentation-browser-verify.mjs`
- `docs/lab08-presentation.md`

Generated screenshots/reports are under ignored evidence directories; scratch build/venv are outside the repository. Existing LAB05–07 files, unrelated pending changes and `~$Step3.docx` are preserved.
