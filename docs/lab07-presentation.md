# LAB07 CDN — guided presentation (standalone preview only)

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

**Current particle cadence:** LAB01 800ms, LAB02 850ms per leg, LAB03 2000ms, LAB04 1200ms, and LAB05–09 2000ms per connector. See [particle-speed verification](particle-speed.md). Earlier 2700ms measurements below are historical and superseded; no historical test results are being re-certified.

## Scope and source

Checkout `/Users/prommeesee/projects/classroom`, branch `exam-new`. Existing pending LAB05/LAB06 work remains in place. No commit, push, deployment, Docker operation, canonical dist build or real-account/database write.

Behavior derives from the actual `src/cdn.js`, existing six topics/instructions, CDN notes, curriculum/model tests and `course.json`. No CDN source PDF was available for reinspection (only the unrelated local `Step4.pdf` was discovered). This is **source-model-based, not source-PDF-verified**. PDFs and `~$Step3.docx` were not edited. Manifest, private bank, stable lesson ID `cdn`, original `cdn / cdn / decision` action and thinking identities are unchanged.

## Six independent experiments

Each topic starts at `cdnInitial()` without requests or credit. One primary ▶ ทดลอง runs all prerequisites and stages:

| Topic | Actual model/setup operations | Observed result |
|---|---|---|
| MISS → HIT | request, request | one Origin read; HIT does not extend TTL |
| Stale copy | request, publish, request | version 1 delivered while Origin is version 2 |
| Manual TTL | request, publish, tick × 3, request | exact expiry at clock 3, then MISS refills version 2 |
| Invalidate | request, publish, request, invalidate, request | stale HIT, current key removal, MISS gets version 2 |
| URL/key | request, publish, version, request, ignore-query, request | query-aware new key gets version 2; ignoring query returns stale original key; both objects retained |
| Availability | CDN outage, request, enable fallback, request, Origin outage, request | failure → direct Origin fallback → failure; one Origin read, no CDN fill |

Only actual requests record `decision`. Publishing, explicit time ticks, invalidation, URL/key and availability changes remain unscored setup. No fabricated latency, geography, bandwidth or prices. The unchanged model tests also retain the fresh-HIT-while-Origin-down case.

MISS routes: client → edge → Origin → edge → client. HIT: client → edge → client, with no Origin route/read. Fallback: client → Origin → client, no edge fill. Down CDN without usable fallback has no delivered route. An available edge with unusable copy and unavailable Origin shows the client lookup only. Non-request setup does not invent network calls.

## Playback and UI

Each captured model action awaits every route and confirmed account save before advancing. Blue circles now take **2000 ms per directed route**, live and replay. Static non-route stages use a 900 ms hold; reduced-motion settles immediately, with no added awaits. Animation never advances the model clock. Pause freezes the current route and future actions. Replay uses the entire completed snapshot sequence and calls neither model nor API.

Generation cancellation on topic/reset/lesson change prevents subsequent operations; an already in-flight save may finish for its captured lesson. A failed save retains the mutated stage; retry uses the existing captured UUID/payload and continues without another mutation. Primary/replay block on active flow, account loading/saving and manual-completion pending state; keyboard focus survives held saves unless the learner moves elsewhere.

Centered topic/count, 48px chevrons/reset and Thai aria-label/title/focus tooltips follow LAB01–06. The toolbar sits inside the diagram with a top divider and no colored card. Light is exactly `#f3f7fa`; Dark uses existing theme tokens. Actual-down edge/Origin have 3px red borders and red internal labels. Stale/expired copies are not falsely styled down or current-ready. Completion remains the explicit bottom footer: experiment + either thinking answer (incorrect allowed), then manual click; no auto-complete/navigation.

## Latest layout revision — desktop left to right / mobile vertical

Only this follow-up's files changed: `src/cdn-presentation.js`, `src/cdn-presentation.css`, `tests/browser/cdn-presentation.spec.js`, new `tests/browser/cdn-layout.spec.js`, and this document. Earlier pending LAB05/LAB06/LAB07 implementation remains intact.

- Desktop reads **ผู้ใช้ → CDN → Origin** in three equal columns, with centered nodes and short, separate request/return lanes across the adjacent gaps. The scene's **620px container breakpoint** (not viewport width) selects this layout, accounting for sidebar and panel insets. Mobile 390/320 stacks the same order without shrinking 18px headings or 14px labels.
- Normal MISS/HIT paths no longer detour around the perimeter. The two lanes are 24px apart; direct fallback alone bypasses CDN, with nested bottom lanes on desktop and bounded outside lanes on mobile. Paths remain derived from actual rendered node bounds via the existing ResizeObserver. Route identities, models, sequences, waits, timing, scoring and all existing controls are unchanged.
- TDD: new desktop reading-order assertion failed against the old vertical layout; after the CSS change the existing collision test caught 88 node intersections from the old routing geometry. Both passed after the geometry-only correction. Additional all-frame checks characterize every intermediate model-backed route, including fallback, across six topics × both themes × 1280/390/320: sampled node clearance, contained paths, anchored endpoints, distinct return lanes and minimum-length adjacent paths.
- Fresh verification: **98/98 unit tests**, **36/36 compiled CDN/footer/theme browser tests**, and **12/12 compiled LAB05/LAB06/navigation/hidden-panel regressions** passed. Slow-route coverage now measures actual visible blue-circle centers from <5% through >95% of every route, <1px path error, 2700ms duration, finish-before-next-stage, frozen pause, replay and cancellation in both themes at all three widths. Reduced motion, single-button six-topic outcomes, tooltips, Light `#f3f7fa`, divider-only toolbar and down/ready states also passed.
- One expanded mobile timing check initially sampled an animation still pending start. The test now awaits `animation.ready` and polls elapsed animation time before measuring speed instead of assuming wall-clock delay equals movement. The final complete 36-test run passed without retries/skips/flakes; no runtime playback change was made.
- Rebuilt **the same parent-owned scratch preview** at **http://127.0.0.1:4173/** (PID 21546), and ran the tests against its compiled assets, not source dev serving. Vite build succeeded; the only warning is the existing external outDir not being emptied. This standalone URL has no platform login and uses browser-local progress.
- Captured and visually inspected compiled desktop/mobile MISS and fallback scenes, including Light desktop and Dark 320px fallback. Full-scene images supplement normal 800px-high viewport captures; mobile intentionally scrolls rather than compressing labels. No node/text collisions or horizontal overflow observed. Existing header/result screenshots under `evidence/lab07-presentation/` were refreshed by the compiled tests.
- SHA-256 comparison with the pre-edit source/dist/reference snapshot shows only the two intended CDN presentation source files changed; other source (including pending LAB05/LAB06), canonical dist, local PDFs and `~$Step3.docx` are unchanged. No commit/push/deploy, Docker or live database operation. No new backend QA was needed or run for this layout-only follow-up; the authenticated evidence below belongs to the earlier implementation, not a fresh persistence certification.

Fresh evidence in `evidence/lab07-layout/`:

- `compiled-report.json` (36 passed), `regression-report.json` (12 passed), `scope-report.json`, `capture-report.json`.
- `{miss,fallback}-{light,dark}-{1280,390,320}-{scene,viewport}.png`.
- Representative reviewed screenshots: `miss-light-390-scene.png`, `fallback-dark-320-scene.png`, `fallback-light-1280-scene.png`.

Reproduction from `courses/scale-lab` (compiled-preview config is a scratch-only QA artifact):

```sh
PATH=/usr/local/bin:$PATH npm test
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/flow-dotted-build
PATH=/usr/local/bin:$PATH npx playwright test --config /Users/prommeesee/.hermes/cache/scratch/cdn-layout-preview.config.mjs cdn-layout.spec.js cdn-presentation.spec.js cdn-visual.spec.js completion-footer.spec.js scene-background.spec.js
PATH=/usr/local/bin:$PATH npx playwright test --config /Users/prommeesee/.hermes/cache/scratch/cdn-layout-regression.config.mjs cache-presentation.spec.js replication-presentation.spec.js flow-navigation-icons.spec.js participation-panel.spec.js
```

For source-server reproduction, run the same selected specs with the repository's normal Playwright config. Full historical browser/backend suites remain outside this follow-up's scope.

## Earlier implementation verification (historical)

- **98/98 unit tests passed** (`npm test`): original 93 plus five CDN preset/sequence/cancellation/retry/projection checks. Observed RED for missing preset, missing flow and missing primary UI, then GREEN. Additional route/retry/cancellation tests characterize the adapted existing sequencer; not claimed as separate RED-first cycles.
- **109 distinct targeted browser checks passed**, in three bounded runs: 59 LAB01–04/navigation/hidden-panel regressions, 25 LAB05–06 checks, and 25 CDN/footer/background checks (15 CDN-specific). Every CDN topic covered in Light/Dark at 1280/390/320; actual particle coordinates/motion, 2.7-second completed paths, pause/resume, replay, cancellation, geometry/node clearance, dotted tracks, tooltips/focus, reduced motion, stale-neutral and down-red states.
- Initial cross-lesson failures were obsolete selector/timing expectations: the LAB01 exclusion checked newly converted LAB07 for text reset, and the score-panel test still waited only 10 seconds for LAB06's slower animation. Updated exclusion to LAB08 and used reduced-motion for the non-animation panel contract; added CDN's primary selector. Final bounded runs passed. One oversized regression invocation exceeded the harness's 420-second limit and was not counted; the same selected files were rerun in bounded groups.
- **Real isolated compiled Flask/SQLite QA passed** with a seeded synthetic account and disposable database: 23 experiment POSTs, only original `decision`, semantic score 2 (first request + incorrect thinking answer), only `cdn` completed. API readback verifies dedup, exact lost-response-after-commit retry, pending disabling/focus, cancellation during held saves on topic/reset/leave, zero playback/navigation POSTs, held manual completion and completion after reload. QA is authenticated course persistence coverage, not signup/OTP or backend process-restart coverage.
- Final standalone and isolated integrated scratch builds succeeded. Final compiled preview exercised through local completion/reload, all widths/themes, and actual six-route MISS→HIT animation: every route duration 2700 ms and every animation finished; Origin reads 1, HIT 1 / MISS 1, clock 0. Actual compiled desktop/mobile screenshots inspected. No page errors.
- Full historical browser suite and full backend suite were not run; obsolete free-form CDN tests still reference removed manual controls. No claim that all historical suites pass. Build warning only: scratch outDir is outside project and is not automatically emptied.

## Evidence and reproduction

`evidence/lab07-presentation/` contains:
- `earlier-labs-report.json` (59), `lab05-06-report.json` (25), `cdn-footer-report.json` (25)
- `account-report.json`
- `{light,dark}-{1280,390,320}-topic-{1..6}-{header,result}.png`
- `settled-{light,dark}-{1280,390,320}-topic-{1..6}.png`
- `preview-{light,dark}-{1280,390,320}-{header,result}.png`, `preview-moving-light-1280.png`

From `courses/scale-lab`:

```sh
npm test
PATH=/usr/local/bin:$PATH npx playwright test tests/browser/cdn-presentation.spec.js tests/browser/cdn-visual.spec.js tests/browser/completion-footer.spec.js tests/browser/scene-background.spec.js
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/flow-dotted-build
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ /usr/local/bin/node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab07-qa-courses/scale-lab/dist
```

From repository root:

```sh
TMPDIR=/Users/prommeesee/.hermes/cache/scratch \
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab07-qa-courses \
QA_PYTHON_ARCH=x86_64 \
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python \
/usr/local/bin/node scripts/lab07-presentation-browser-verify.mjs
```

The QA runner terminates its own server in `finally`; inherited unrelated QA PID 41384 was not touched.

## Files and preview

Added: `src/cdn-flow.js`, `src/cdn-presentation.js`, `src/cdn-presentation.css`, `tests/cdn-flow.test.js`, `tests/browser/cdn-presentation.spec.js`, `tests/browser/cdn-visual.spec.js`, `scripts/lab07-presentation-browser-verify.mjs`, this document.

Modified: `src/cdn.js` (cold preset factory only), `src/cdn-view.js` (guided-flow notes), `src/main.js`, `src/lesson-topics.js`, `tests/browser/flow-navigation-icons.spec.js`, `tests/browser/participation-panel.spec.js`. Shared edits retain pending LAB05/LAB06 integrations; other courses and canonical dist are untouched.

**http://127.0.0.1:4173/** — updated compiled standalone preview, no platform login, browser-local progress. Rebuilt the same scratch `flow-dotted-build`; parent-owned PID 21546 remains the preview owner. This is not a main-site deployment.
