# LAB09 usability revision — standalone preview only

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

> Current experiment: six topics, ending at “6 / 6 · ศูนย์เดียวรับไหวไหม”; topic 7 and its illustrative release panel were removed. The implementation and verification below describe the earlier historical revision. See [current removal verification](lab09-remove-release-topic.md).

## Historical follow-up: technical section removed

The entire “เหตุผลและรายละเอียดทางเทคนิค” disclosure and `#dc-route` are now removed from the generated DOM, not hidden. Its import, CSS and detail-only glossary selector are removed; playback no longer writes to the deleted target. Primary outcomes, figure caption, seven presets, navigation and 2000ms connector timing remain. Existing scene glossary styles remain applicable to enriched outcome prose.

Verified on the rebuilt parent-owned standalone preview at http://127.0.0.1:4173/ (PID 27119 unchanged): **106 unit tests and 16 scoped compiled browser tests passed**. Browser coverage includes all seven scenarios in Light/Dark at 1280/390/320, DOM absence before/after experiment, reduced-motion replay, normal pause/resume/replay, 2000ms motion, cancellation, geometry and retained reading glossary. Reviewed the 320px Dark overload screenshot: result and caption remain visible with no trailing disclosure. `git diff --check` passed.

Evidence: `evidence/lab09-remove-details/` (RED unit failure, final unit/build/browser logs, JSON report and screenshots). Initial browser failures were obsolete assumptions that every scene contains a glossary term; these were narrowed to retained reading terms and contrast checks for terms actually present. The account QA runner’s removed-detail assertions were updated but that account suite was not rerun; no authenticated persistence claims are added. No Docker deployment, canonical dist build, commit/push or live DB access.

The following records the **previous revision**, including its then-present disclosure and historical measurements; its evidence is preserved.

## What changed

Inspected actual compiled desktop/mobile screenshots before editing (`evidence/lab09-usability/before-*`). The old workspace repeated the premise, routing counts, unrun status and technical qualifications in the instruction, client cards, destination cards, status rows, result and caption. At 390px it stacked four tall cards and placed the action far below the premise.

The revised experience is one short Thai situation → two compact source/destination pairs → one primary experiment and one adjacent plain-language outcome. Each route has one model-derived count, rather than duplicate count/percentage/status labels. Initial counts are `?`, not precomputed results masquerading as an executed experiment. Mobile retains readable side-by-side pairs. Actual down sites remain red; limited capacity remains on the site card. The seven outcomes retain normal split, outage, old DNS, new DNS (East 60 → 100), missing data, overload and release warning.

Technical route status, full overlapping-risk counts, DNS/HTTP architecture, component vocabulary and caveats are in a native keyboard-accessible disclosure. A short non-delivery disclaimer remains visible. Original reading/comparison, seven preset definitions, model, actions, quiz and scoring are unchanged. Glossary enrichment now includes the optional detail paragraphs. No interaction/event wiring changed.

## Measured result

Visible topic text after first experiment: **1172 → 322 characters (73% less)** in both desktop/mobile layouts. This is DOM `innerText`, not an estimated word count; collapsed explanations remain available.

| Width | Topic height before | After |
| --- | ---: | ---: |
| 1280 | 909px | 656px |
| 390 | 1587px | 751px |
| 320 | 1798px | 790px |

Actual screenshots reviewed: desktop Light/Dark, short 390px phone, 320px Dark overload and desktop old-DNS failure. Full diagram/result hierarchy is clearer, without shrinking primary result text (17px). Short phones still require scrolling between topic heading and action; the action and result remain adjacent. No claim that the entire topic fits a 600px viewport.

## Verification

- TDD: concise-outcome export assertion failed, then passed after implementation.
- `npm test`: **106 passed, 0 failed** (`unit-final.log`).
- Compiled LAB09 content, glossary, geometry, motion and keyboard tests: **10 passed** (`browser-results.json`). All seven topics × 1280/390/320 × Light/Dark. Sampled paths stay outside nodes; dotted tracks; 48px controls; readable result; no overflow; actual 2000ms animations, exact paused positions, replay and cancellation.
- Additional density/disclosure tests: **6 passed** (`density-results.json`), all seven scenarios in each viewport/theme, under 500 visible characters, adjacent outcome, <250px route map and keyboard disclosure.
- Relevant existing compiled regressions: **25 passed** (`regression-results.json`): LAB01 icon navigation, all-lesson score-panel/completion journey and LAB01–08 speed/pause/replay/reduced motion.
- Fresh isolated integrated build + Flask/SQLite synthetic account: **13 experiment POSTs**, only original `data-centers / data-centers / dc-request`, **2 persisted semantic awards**, **0 navigation/replay POSTs**, completion only after explicit action and either quiz answer. Held-save focus/duplicate guard, lost-response UUID retry, cancellation during save and reload verified. See `account-report.json`. QA server closed after run. Not signup/OTP or server-restart coverage.
- 82 current-working-tree source/dist files hashed before edits. Only `dc-presentation.js`, `dc-presentation.css`, and the LAB09-only selector addition in `terms.js` differ. LAB01–08 modules, shared main/topic wiring and published dist match baseline; pending edits preserved. See `preservation.json`. `git diff --check` passes.

## Files in this revision

Implementation: `courses/scale-lab/src/dc-presentation.js`, `dc-presentation.css`, `terms.js` (scoped glossary selector).
Tests: new `tests/dc-usability.test.js`, `tests/browser/dc-usability.spec.js`, `playwright.lab09-usability.config.js`; updated `tests/browser/dc-presentation.spec.js`, `dc-visual.spec.js`, `data-centers.spec.js` to assert the concise view and retained details.
QA: new `scripts/lab09-usability-inspect.mjs`; `scripts/lab09-presentation-browser-verify.mjs` accepts `QA_EVIDENCE` and checks the moved technical premise. This document and new `evidence/lab09-usability/` preserve prior evidence.

## Preview

**http://127.0.0.1:4173/** → LAB09, standalone, no platform login, browser-local progress. Rebuilt the same parent-owned `/Users/prommeesee/.hermes/cache/scratch/lab08-preview`. PID 27119 remains unchanged; never stopped/restarted. QA integrated assets are separate at scratch `lab09-usability-qa/scale-lab/dist`.

No Docker deployment, canonical dist changes, commit/push or live database access. Full backend pytest and all historical browser suites were not run.
