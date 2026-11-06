# LAB03 guided scaling presentation — verified source / standalone preview

Workspace `/Users/prommeesee/projects/classroom`, branch `exam-new`. No commit, push, Docker, deployment, canonical dist build, real-account/database access, PDF or `~$Step3.docx` changes.

## Behavior and source mapping

- Five independent presets retain every original experiment: (1) load 3 / capacity 1; (2) scale up to capacity 3; (3) three machines but Web 1 down and direct routing gives capacity 0; (4) ready LB routes to the two healthy machines, capacity 6; (5) the same pool with load 20 is overloaded. The former final instruction contained two experiments, now separate topics rather than an extra hidden click/settings step.
- Centered topic/count, 48px Back/Next chevrons and reset; one retained `#order` action plus replay/pause icons, Thai accessible names/title/tooltips and keyboard focus. No editable setup or duplicate outcome/history panels. Teaching notes and quiz identities remain; notes describe preset comparison rather than removed fields.
- `evaluateScaling` is unchanged. Its **healthy / routed / capacity / status** distinctions remain. This model is an evaluator, not a request state machine: the finite blue particles illustrate supported ready routes, explicitly not request success, measured load, latency or failover timing. Dotted orthogonal paths have no arrowheads. Offline direct routing has no moving particle. Reduced motion retains static routes/result.
- Navigation prepares a fresh unrun scenario without evaluating or scoring. Replay/pause operate only on the last projected result; cleanup cancels old animations and disconnects resize observers. The original `stock / stock / order` identity and semantic deduplication remain.
- Existing uncommitted completion-footer implementation is retained: one final footer, explicit completion, **experiment + either thinking answer, including a wrong answer**. No score panel, top completion or next-lesson button restored. No manifest/private bank/backend policy changes.

## Executed tests

- TDD: missing preset export failed, then passed; browser expected `1 / 5` failed against old `1 / 4`, then passed. A new keyboard test caught an undefined inherited Light-mode focus token; scoped token fixed it. Notes test failed on stale editable-UI wording, then passed.
- `PATH=/usr/local/bin:$PATH npm test`: **80 passed** (existing 78 plus two LAB03 tests).
- `PATH=/usr/local/bin:$PATH npx playwright test tests/browser/scaling-presentation.spec.js tests/browser/scaling.spec.js tests/browser/labs.spec.js tests/browser/flow-navigation-icons.spec.js tests/browser/flow-toolbar.spec.js tests/browser/flow-presets.spec.js tests/browser/workload-icons.spec.js tests/browser/workload-lines.spec.js tests/browser/workload-motion.spec.js tests/browser/completion-footer.spec.js`: **59 passed**.
- Matrix covers all five LAB03 topics at 1280/390/320 in Light/Dark, header centering, targets/names, tooltip viewport bounds/focus, 17px results, overflow, actual particle movement, exact paused offsets after animation readiness, circle centers against SVG path positions, sampled path/node intersections, reset and reduced motion. Includes LAB01/LAB02 regression and all-lesson completion/footer checks.
- `PATH=/usr/local/bin:$PATH npx playwright test --config playwright.account.config.js`: **23 passed**, frontend API-intercept contracts. The invalid-input test now uses still-editable LAB12; LAB03 instead asserts no inputs and unscored navigation. Adjacent-lab exclusion for LAB01 reset icons now targets unchanged LAB04.
- Actual compiled backend: `TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab03-account-courses QA_PYTHON_ARCH=x86_64 QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python /usr/local/bin/node scripts/lab03-presentation-browser-verify.mjs`.
  - Disposable SQLite and seeded synthetic account; **5 experiment POSTs**, exact original identity, **2 semantic points total** (one experiment plus wrong answer), **0 navigation/playback POSTs**, server-readback qualification/completion retained on reload, zero page errors.
  - Also checks the actual parent-owned compiled standalone preview: wrong answer alone disabled, experiment enables explicit completion, reload preserves it.
  - Initial QA startup used the wrong Python architecture; rerun explicitly selected the existing x86_64 environment, without dependency changes. Runner shuts down only its own server and deletes temporary QA data.

## Builds / preview / visual evidence

- Standalone built with `/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/flow-dotted-build --emptyOutDir`.
- Account build uses `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/`, `--base /courses/scale-lab/`, and scratch `lab03-account-courses/scale-lab/dist`.
- Latest standalone JS `index-NXcM5hZd.js`; account JS `index-CzcRsvPC.js`; shared CSS `index-Be8b2XAX.css`.
- Parent-owned **http://127.0.0.1:4173/** remains standalone (no login, local browser progress), same listener PID 21546, no restart. Final compiled runner passed against the updated bundle.
- `evidence/lab03-presentation/account-report.json` contains sanitized actual backend readback assertions.
- `evidence/lab03-presentation/{light,dark}-{1280,390,320}-topic-{1..5}.png` records the full browser matrix. `preview-{light,dark}-{1280,390,320}-{header,result}.png` records actual compiled preview viewports.
- Inspected actual Light/Dark desktop and mobile screenshots: centered heading, compact tree, clear healthy/offline labels, toolbar adjacent to readable result, no horizontal overflow. Phone diagrams intentionally need vertical scrolling; separate header/result viewports preserve font size rather than squeeze all content into one screen.

## Limits

The full historical standalone suite was not claimed green; unrelated obsolete expectations documented in `completion-footer-verification.md` remain outside scope. This QA verifies seeded authenticated course APIs and reload persistence, not signup/OTP, backend process restart, real accounts, production deployment or real performance. Numeric units and immediate health knowledge remain explicit teaching assumptions.

## Files changed for this task

- Runtime: `courses/scale-lab/src/{main.js,lesson-topics.js,lesson-layout-data.js,scaling.js}`; new `scaling-presets.js`, `scaling-view.js`, `scaling-view.css`.
- Tests: new `tests/scaling-presets.test.js`, `tests/browser/scaling-presentation.spec.js`; updated `tests/browser/{scaling.spec.js,labs.spec.js,flow-navigation-icons.spec.js}` and the narrow invalid-input section of `tests/account/participation.spec.js`. Existing completion changes in those shared files remain.
- Runner: new `scripts/lab03-presentation-browser-verify.mjs`.
- Documentation: this file. Pre-existing footer docs, modules, tests and runner preserved.
