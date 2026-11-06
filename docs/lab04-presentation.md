# LAB04 guided presentation — standalone preview, not deployed

## Scope and preserved contracts

LAB04 remains `balance / balance / route`. Its existing `routeBalance` and round-robin model are unchanged. Manifest, private bank, quiz semantics, APIs and qualification policy are unchanged. The explicit completion footer still requires an allowlisted experiment and either thinking answer (not necessarily correct); playback/navigation never completes a lesson.

Each topic starts with a fresh cursor and zero delivery counts, without calling the model action:

| Topic | Prepared targets | Repeated explicit experiment outcomes |
|---|---|---|
| Two registered servers | A/B healthy; C unregistered | A → B → A |
| First server down | A down; B healthy; C unregistered | B → B → B |
| No eligible backend | A/B down; C unregistered | 503; no delivery count |
| Registered replacement | A down; B/C healthy and registered | B → C → B |

Each experiment click sends one modeled request. Navigation resets only the current scenario, never stored awards. The result distinguishes undefined/unrun, null/unrouted and target index 0 (App A). C's unregistered state is not rendered as a down node. Only actually down A/B nodes have 3px solid red borders and red internal text.

The scene retains public/private IP and DNS-before-HTTP teaching facts. DNS lookup and health checks are stated prerequisites, not fabricated animated transitions. Sequential blue circles follow client→LB and only the actual selected backend over stationary round-dotted orthogonal tracks. An unsuccessful request stops at LB. Counts are delivered requests, not attempts. No latency, benchmark, in-flight recovery or DB behavior is invented. Replay/pause projects the latest result without calling routing or scoring.

Header uses centered topic titles, 48px chevrons/reset, Thai accessible icon names/tooltips and keyboard focus. Experiment/replay/pause, result and limitations live inside the scene. Light canvas and architecture wrapper are exactly #f3f7fa; styles are LAB04-scoped. Mobile retains readable labels and therefore requires vertical scrolling through the full diagram.

## Verification

- TDD: observed missing preset export failure, then GREEN; observed legacy selectors/settings in browser, then GREEN guided workflow.
- `npm test`: **81 passed** (80 existing + one preset test).
- Targeted Playwright run: **69 passed**, including 8 LAB04 tests, approved LAB01–03 presets/icons/toolbar/routes/failure presentation, shared completion footer, hidden participation panel and all-lesson canvas checks.
- LAB04 checks every topic in Light/Dark at 1280/390/320: centered heading, 48px targets, tooltip/focus bounds, no horizontal overflow, actual moving circle offsets and path coordinates, paused-animation readiness/freeze, connector/node intersections, exact dotted styling, real-down styling, reduced-motion static states, independent repeated routes and reset.
- Real isolated Flask/SQLite runner: **5 experiment POSTs**, all original `balance / balance / route`; semantic score remains **2** (one simulation + incorrect thinking answer). Replay/pause/navigation produce **0 POSTs**. Held real save confirms disabled saving icon and restored keyboard focus. Explicit completion and reload verified via API readback in account mode and local preview storage. No page errors.
- Synthetic account is seeded only in a disposable QA database; this is authenticated course testing, not registration/email testing. The launcher stops its own server and deletes disposable storage. No real accounts, Docker volume, canonical dist, source PDFs or temp Office document were changed.
- The LAB01 exclusion test now checks untouched LAB05 rather than asserting LAB04 must keep obsolete text-only reset controls. Initial canvas regression caught the transparent LAB04 wrapper; scoped Light override restored the existing exact-color contract.
- Historical full browser suite was not run or claimed green; older free-form LAB04 tests require migration to the requested preset UI. Unrelated legacy failures remain out of scope.

## Reproduction

From `courses/scale-lab`, use the compatible `/usr/local/bin` Node:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH npx playwright test tests/browser/balance-presentation.spec.js tests/browser/balance-visual.spec.js tests/browser/flow-presets.spec.js tests/browser/flow-navigation-icons.spec.js tests/browser/flow-icons.spec.js tests/browser/flow-toolbar.spec.js tests/browser/workload-icons.spec.js tests/browser/workload-lines.spec.js tests/browser/lesson-topics-presets.spec.js tests/browser/scaling-presentation.spec.js tests/browser/scaling-failure.spec.js tests/browser/completion-footer.spec.js tests/browser/participation-panel.spec.js tests/browser/scene-background.spec.js
```

Build account QA with `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/` and Vite `--base /courses/scale-lab/ --outDir <scratch>/lab04-qa-courses/scale-lab/dist`. Both environment variables matter: a return link alone does not enable account scoring.

From repository root:

```sh
TMPDIR=/Users/prommeesee/.hermes/cache/scratch \
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab04-qa-courses \
QA_PYTHON_ARCH=x86_64 \
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python \
PATH=/usr/local/bin:$PATH node scripts/lab04-presentation-browser-verify.mjs
```

The existing scratch interpreter's Pillow wheel is x86_64; forcing arm64 fails. The repository-local appworks venv does not exist on this host. No shared packages were modified.

Evidence: `evidence/lab04-presentation/account-report.json`, `{light,dark}-{1280,390,320}-topic-{1..4}-{header,result}.png`, and `preview-{light,dark}-{1280,390,320}-{header,result}.png`. Actual preview screenshots reviewed in desktop Light/Dark and narrow 320/390 views.

Standalone preview: **http://127.0.0.1:4173/**, parent-owned PID **21546**, compiled directory `/Users/prommeesee/.hermes/cache/scratch/flow-dotted-build`. It has no platform login and uses browser-local progress. This is not the older Docker UI at https://localhost/. No commit, push or deployment performed.
