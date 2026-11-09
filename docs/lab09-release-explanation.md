# LAB09 topic 7 — release compatibility explanation

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

> Current experiment: six topics, ending at “6 / 6 · ศูนย์เดียวรับไหวไหม”; topic 7 and its illustrative release panel were removed. The implementation and verification below describe the earlier historical revision. See [current removal verification](lab09-remove-release-topic.md).

## Scope and teaching distinction

User screenshot showed East 100/West 0 and a mismatch warning, but no definition or concrete consequence of a release difference. The original model has only `sameRelease` (boolean), not version numbers, response schemas, compatibility checks or test results.

Added a topic-7-only static section inside the existing diagram figure, immediately after the unchanged action/result/caption group. It is visible before running too. Thai copy defines a service release as installed application software, not hardware or data versions. Two explicitly illustrative cards compare West v1 `{ "name": "Mali" }` and East v2 `{ "fullName": "Mali" }`. An older client expecting `name` might not show the name after moving to East. These values are a teaching example, not model-generated outputs.

A three-item checklist asks learners to use the same request against both releases in a test environment, compare expected responses/data formats, and check old-client compatibility. An explicit outage note separates West's installed release from its down state: the mismatch did not cause the preset outage, no live request goes to West, and the cards are not live replies. The original warning remains verbatim: difference requires compatibility testing, not proof all requests fail.

No new animation: a static comparison avoids implying fabricated test execution, API calls or pass/fail results. Model, presets, flow, action identity (`data-centers / data-centers / dc-request`), scoring and all seven outcomes are unchanged. Topic 5/6 stages and 2000ms connectors are unchanged. The previously removed global technical disclosure stays absent. The only `main.js` change for this task passes the existing topic index to the renderer, so the explanation can appear before the first run.

## Verification

- TDD: new `tests/dc-release.test.js` failed because `.dc-release-panel` was absent, then passed after implementation.
- `npm test`: **109 passed, 0 failed** (full course units).
- `npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview`: success, 81 modules. Vite warns that the external scratch directory is not emptied; intentionally no canonical dist build.
- `LAB09_EVIDENCE=/Users/prommeesee/projects/classroom/evidence/lab09-release-explanation/regressions/ npx playwright test --config playwright.lab09-release.config.js dc-release.spec.js dc-capacity.spec.js dc-missing-data.spec.js dc-presentation.spec.js dc-usability.spec.js data-centers.spec.js`: **32 passed, 0 failed** against the compiled existing preview.
- New browser cases cover 1280/390/320px, Light/Dark, visible pre-run explanation, example/model separation, West offline and zero routed users, East-only connector, exact 2000ms timing, frozen pause, resume, replay, back/next cancellation, reduced motion, topic-only scope, navigation to LAB08, font sizes and overflow.
- Existing regression cases retain all seven distinct outcomes, topic 5/6 pause/replay stages, mobile keyboard controls, glossary, and absence of the removed technical DOM. The old core-copy budget excludes only the newly authorized topic-7 teaching section.
- Screenshot outputs in the topic 5/6 specs now accept `LAB09_EVIDENCE`; defaults remain unchanged, so this run did not overwrite their older evidence folders.

Evidence: `evidence/lab09-release-explanation/browser-results.json`, `release-{width}-{theme}.png`, `reading-{width}-{theme}.png`, and scoped regression captures. Inspected actual desktop Light, 390 Dark and short 320 Light captures: desktop definition leads into balanced example/checklist columns; mobile stacks the version cards and checklist without reducing the 16px body/14px secondary text. Mobile deliberately scrolls rather than compressing the diagram or hiding the explanation.

## Environment / limitations

Rebuilt the same parent-owned preview at http://127.0.0.1:4173 without restart. This is standalone browser-local progress, no platform login. No Docker, live database, canonical dist, commit or push operations. Existing pending LAB01–08 edits were not reverted. This task verifies frontend behavior and existing unit contracts, not a fresh authenticated persistence run or actual cross-version service compatibility. The example cannot diagnose real systems; the model has no API-schema evaluator.
