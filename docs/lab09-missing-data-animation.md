# LAB09 missing-data animation — standalone implementation

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

> Current experiment: six topics, ending at “6 / 6 · ศูนย์เดียวรับไหวไหม”; topic 7 and its illustrative release panel were removed. The implementation and verification below describe the earlier historical revision. See [current removal verification](lab09-remove-release-topic.md).

## Change

Topic 5 now distinguishes **เครื่องพร้อม** at US-East from **ข้อมูลที่ East** below the routing map. Its captured evaluator result drives the two groups: original East users (`state.eastShare`, default 60) have data; moved users (`result.missingData`, default 40) lack data. The latter has a dashed red empty-data block and ×, then a solid boundary with **⛔ อ่านไม่ได้ · ไม่มีข้อมูล**. No count is described as successful responses.

Playback sequence: real client→East connector (2000ms) → reveal the original/missing data groups (1400ms) → reveal blocked read (1400ms). The last two are local explanatory states, not new network calls or a simulated replication protocol. Group entrance uses a small translation, keeping text at full contrast even when paused. Final state remains visible. Reduced motion settles directly to that state. Replay uses the existing captured frame; the existing show promise now awaits both extra stages. Cancellation disposes the current animation; no evaluator, record/action, main adapter, model, manifest, scoring or topic configuration wiring changed.

All seven topics remain. Other topics retain their prior visual. The removed technical-details disclosure stays absent. No replication or response route was added. Risks remain separate rather than summed.

## Verification

- RED: new unit test failed on absent model-derived data group markup. New compiled stage test failed on absent `data-stage=route`.
- `node --test tests/*.test.js`: **107 passed**. Includes varied original share values 0/25/60/100, frame immutability, all seven presets, original `dc-request`, save retry, awaited show, replay and cancellation.
- `LAB09_EVIDENCE=/Users/prommeesee/projects/classroom/evidence/lab09-missing-data-animation/ npx playwright test -c playwright.lab09-missing-data.config.js dc-missing-data.spec.js dc-presentation.spec.js dc-usability.spec.js data-centers.spec.js dc-visual.spec.js`: **22 passed** against compiled 4173 preview.
- New stages exercised at 1280/390/320 in Light and Dark: actual 2000ms route, route/node bounds, hidden blocked verdict before data inspection, paused inspection persists, action stays disabled until complete, final 60/40 data groups, replay resets stages, navigation cancels, reduced-motion static verdict, no POSTs in standalone.
- Retained regressions: all-topic geometry, dotted tracks, readable labels, 48px controls, keyboard/glossary behavior, no removed disclosure, route particle position and frozen pause, replay duration, no stale outcome on navigation.
- Inspected actual screenshots of mid-animation dark mobile and final desktop Light/mobile Dark. Removed opacity animation after first inspection so paused text retains full contrast.
- `git diff --check`: clean.

Evidence: `evidence/lab09-missing-data-animation/browser-results.json`, `unit-results.txt`, `check-{width}-{theme}.png`, `final-{width}-{theme}.png`, plus retained route regression captures under this new directory. Historical evidence directories were not reused for these captures.

## Environment / limits

Rebuilt only `/Users/prommeesee/.hermes/cache/scratch/lab08-preview` using `node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview`. Existing parent preview PID 27119 remains listening at http://127.0.0.1:4173; no restart. This is standalone, with no platform login. Real-backend QA was not rerun because model/action/scoring wiring is unchanged; frontend zero-POST checks are not authenticated persistence evidence. No live database, Docker, canonical dist, deployment, commit or push was touched. Earlier pending LAB01–08 work and speed values were preserved.

Mobile intentionally stacks the data blocks for readable labels; the complete figure is taller than a short phone viewport. The scene is a projection of the batch evaluator, not an actual data lookup or throughput measurement.
