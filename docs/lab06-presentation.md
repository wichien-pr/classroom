# LAB06 — complete-topic cache experiments (preview only)

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

**Current particle cadence:** LAB01 800ms, LAB02 850ms per leg, LAB03 2000ms, LAB04 1200ms, and LAB05–09 2000ms per connector. See [particle-speed verification](particle-speed.md). Earlier 2700ms measurements below are historical and superseded; no historical test results are being re-certified.

## Scope and factual basis

Checkout `/Users/prommeesee/projects/classroom`, branch `exam-new`. This revision changes only LAB06 presentation plus narrowly scoped mount/control hooks and two cross-lesson test selectors. Existing uncommitted LAB05 work is retained. No commit, push, Docker operation, canonical dist build, live-account use or database migration.

The source of behavior is `cache.js`, the existing five cache instructions in `lesson-layout-data.js` / `lesson-topics.js`, `cache-view.js` notes, current manifest and cache curriculum/model tests. The locally available `Step4.pdf` is interview wrap-up material, not Cache; no Cache source PDF was available for reinspection. PDFs and `~$Step3.docx` were not modified. Lesson identity `cache`, its original three model awards and original thinking identities remain unchanged. Manifest/private bank were not edited.

## Interaction and model mapping

Each topic starts with a fresh `cacheInitial()` (DB 100, empty cache, clock 0, TTL 3). Navigation prepares only that initial state, with no model action or participation POST. One primary **▶ ทดลอง** executes its own prerequisites, then the meaningful comparison:

| Topic | Original model operations in order | Observable result |
|---|---|---|
| First read / repeat | `read-cache`, `read-cache` | MISS fills once, then HIT; DB reads 1 |
| Stale copy | `read-cache`, `update(150)`, `read-cache` | cache 100, DB 150; stale HIT |
| Invalidation | `read-cache`, `update(150)`, `read-cache`, `invalidate`, `read-cache` | stale copy removed, MISS refills 150; DB reads 2 |
| TTL | `read-cache`, `update(150)`, `tick`, `tick`, `tick`, `read-cache` | manual clock reaches 3; expired copy refills 150; DB reads 2 |
| Outage / restart | `read-cache`, `outage`, `read-cache`, `restart`, `read-cache` | BYPASS while down, cold restart, MISS refill; DB reads 3 |

`read-cache`, `update` and `invalidate` keep their original `cache / cache / action` participation identities. Tick, outage and restart are unscored. No generic compound action was added. Each full run uses the unchanged model, not preset fabricated results. TTL never advances with animation duration or wall-clock time. Existing eviction/read-through/concurrency caveats remain in reading notes; they are not simulated.

A MISS animation distinguishes Application→Cache lookup, Application→DB read, DB→Application result and Application→Cache fill. HIT uses only Application/Cache; BYPASS uses only Application/DB. There is no Cache→DB call or invented post-fill cache read. The state labels show the captured action result, while the route indicator explains that action's ordered operations. Paths are dotted orthogonal tracks with one moving blue circle at a time, not a latency visualization.

## Async and completion contract

`cache-flow.js` captures each real action and awaits presentation plus confirmed participation save before advancing. Pause holds the current animation and future operations. Replay shows the entire completed snapshot sequence without model calls or POSTs. Failed save stops the sequence; the existing retry uses the captured UUID/payload, then the primary button resumes without repeating the mutation. Generation cancellation on topic/reset/remount prevents future operations and posts; already in-flight saves may finish for the captured lesson only.

Primary/replay are disabled while running or account loading/saving, including held manual-completion requests. Native primary node and keyboard focus survive scene updates. Completion remains the existing bottom footer: one allowlisted experiment plus either thinking answer, then an explicit completion click. Incorrect answers qualify; neither navigation, replay nor quiz selection auto-completes or advances the lesson. Existing history/storage contracts are retained.

Presentation uses centered topic/count between 48px chevrons; reset and playback have Thai accessible names/tooltips. The toolbar is inside the scene, transparent with only a top divider. Light scene is `#f3f7fa`. Actual-down cache has a 3px red border and red labels; stale copies are neutral, not down or current-ready green. Mobile controls stay on one row and readable feedback wraps beneath.

## Executed verification

- **93 unit tests passed** (`npm test`), including five added Cache flow/projection/preset tests. Existing 88 tests remain passing. TDD RED was observed for the missing preset, missing sequencer and missing primary UI, followed by GREEN. Additional cancellation/retry/route checks characterize the adapted proven sequencer; they are not claimed as separate RED-first slices.
- **93 targeted Playwright tests passed** in one final run: 15 LAB06 checks plus LAB01–05, completion-footer, hidden participation panel and scene-background regressions. Covers every Cache topic in Light/Dark at 1280/390/320, centered geometry, 48px controls, tooltips/focus, dotted orthogonal paths, node clearance, actual moving/frozen particle positions, stale vs outage styling, pause/replay/navigation cancellation and reduced motion.
- Initial cross-lesson failures were stale test expectations: the exclusion check still treated LAB06 as a text-reset lesson and the participation runner searched only `[data-action]`. Those selectors now use an actually untargeted lesson / LAB06's primary control; the final full targeted selection passed. No unrelated legacy implementation was changed.
- **Real isolated compiled Flask/SQLite QA passed**, using only a seeded synthetic account and disposable database: 24 experiment POSTs, all three original actions, semantic score 4 (three first-action awards plus incorrect thinking answer), only `cache` completed. Verified API readback, semantic dedup, reload, zero navigation/replay POSTs, held-save disabling/focus, exact lost-response UUID/payload retry after real commit, cancellation during pending save on topic/reset/leave, and held manual completion blocking.
- Both scratch builds succeeded. Final compiled standalone preview was exercised again by the account runner through completion/reload and both-theme screenshots at all three widths; no page errors. Inspected actual desktop/mobile screenshots and outage styling. Build warning only: external scratch outDir is not automatically emptied.
- Full historical browser suite and full backend suite were not run; old free-form Cache browser tests still address the retired manual controls. QA proves authenticated course behavior, not signup/OTP or production reliability. Backend process-restart persistence was not separately tested; reload persistence was.
- This runner's QA server exits in `finally`; no detached testing loop is used. Final process discovery also found inherited PID 41384 on port 52914 with `QA_COURSES_ROOT=.../lab05-qa-courses`; it was not started by this LAB06 run and was left untouched. Parent-owned preview PID 21546 remains running.

## Slower-particle follow-up (preview only)

- Changed only LAB06's moving-particle WAAPI duration from **900 ms to 2700 ms per directed path** (one third the previous speed). Non-route static stages remain 900 ms; reduced-motion still settles immediately without animation or added waits. A MISS now shows all four paths for 10.8 seconds before advancing; MISS→HIT uses six paths / 16.2 seconds, excluding pause/save overhead.
- Existing `await animation.finished` and sequencer `await show(...)` already gate every route and snapshot. They remain unchanged, as do CSS, model clock/TTL, read counts, action identities and API/save/retry logic. Live and replay share the same renderer.
- TDD: the new real-time browser regression failed with received 900 / expected 2700, then passed. It samples actual progress over time, awaits all four MISS completions before HIT, checks all six animation completions, exact pause freeze/resume, replay cadence, reset cancellation and zero standalone POSTs. Adjusted only two old animation-dependent timeout bounds.
- Follow-up verification: **93/93 unit tests**, **16/16 targeted LAB06 Playwright tests** (Light/Dark, 1280/390/320, five independent topics, reduced motion, navigation/reset cancellation). Unit coverage retains failed-save retry without duplicate model mutation. No new authenticated backend run was performed for this timing-only change; earlier account evidence above is historical, not rerun evidence.
- Rebuilt the same scratch `flow-dotted-build`; parent preview PID 21546 / port 4173 was not restarted. Visually inspected the compiled moving blue circle and sampled all six paths: duration 2700 ms each, last rAF samples above 99%, all finished, final DB reads 1 / HIT 1 / MISS 1 / model clock 0. A long awaited browser probe hit the harness's 5-second call limit; rerunning with nonblocking collection and a host-side wait succeeded.
- Follow-up files: `src/cache-presentation.js`, `tests/browser/cache-presentation.spec.js`, `tests/browser/cache-visual.spec.js`, this document. No commit/push/deploy; pending LAB05 and other lesson sources remain untouched.

## Reproduction

From `courses/scale-lab`:

```sh
npm test
npx playwright test tests/browser/cache-presentation.spec.js tests/browser/cache-visual.spec.js tests/browser/replication-presentation.spec.js tests/browser/replication-visual.spec.js tests/browser/balance-presentation.spec.js tests/browser/balance-visual.spec.js tests/browser/flow-presets.spec.js tests/browser/flow-navigation-icons.spec.js tests/browser/flow-icons.spec.js tests/browser/flow-toolbar.spec.js tests/browser/workload-icons.spec.js tests/browser/workload-lines.spec.js tests/browser/lesson-topics-presets.spec.js tests/browser/scaling-presentation.spec.js tests/browser/scaling-failure.spec.js tests/browser/completion-footer.spec.js tests/browser/participation-panel.spec.js tests/browser/scene-background.spec.js
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/flow-dotted-build
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ /usr/local/bin/node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab06-qa-courses/scale-lab/dist
```

From repository root:

```sh
TMPDIR=/Users/prommeesee/.hermes/cache/scratch \
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab06-qa-courses \
QA_PYTHON_ARCH=x86_64 \
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python \
/usr/local/bin/node scripts/lab06-presentation-browser-verify.mjs
```

The checkout has no executable `appworks/.venv/bin/python`; the first QA invocation failed honestly, then used the existing compatible scratch interpreter above. No dependency reinstall was needed.

Evidence: `evidence/lab06-presentation/account-report.json`, `{light,dark}-{1280,390,320}-topic-{1..5}-{header,result}.png`, `outage-{light,dark}-{1280,390,320}.png`, `preview-{light,dark}-{1280,390,320}-{header,result}.png`; final targeted browser report at `courses/scale-lab/evidence/browser-results.json`.

## Files and preview

Added: `src/cache-flow.js`, `src/cache-presentation.js`, `src/cache-presentation.css`, `tests/cache-flow.test.js`, `tests/browser/cache-presentation.spec.js`, `tests/browser/cache-visual.spec.js`, `scripts/lab06-presentation-browser-verify.mjs`, this document.

Modified: `src/cache.js` (preset factory only), `src/cache-view.js` (notes referring to guided flow), `src/main.js`, `src/lesson-topics.js`, `tests/browser/flow-navigation-icons.spec.js`, `tests/browser/participation-panel.spec.js`. Shared file edits preserve the pending LAB05 changes. Existing `lesson-layout-data.js`, replication modules/tests/docs and `~$Step3.docx` remain as inherited pending work, not LAB06 edits.

**http://127.0.0.1:4173/** — updated standalone compiled preview, no platform login, browser-local progress. Same scratch `flow-dotted-build` and parent server, not a Docker/main-site deployment. Canonical `dist` and live databases were not written.
