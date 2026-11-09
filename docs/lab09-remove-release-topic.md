# LAB09 — remove the seventh experiment topic

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

The experiment now has six independent topics. The last is **6 / 6 · ศูนย์เดียวรับไหวไหม**, with Next disabled. Removed the release topic entry, seventh original experiment instruction, topic-7 preset branch, static release/schema example and its CSS, and the renderer's now-unused topic argument/wiring. Navigation derives its bounds from the six-entry topic list.

Preserved topics 1–6, missing-data and capacity animation stages, 2000ms connectors, cancellation/reset/replay, `data-centers / data-centers / dc-request`, model `sameRelease` / `releaseMismatch`, reading/deployment notes and quizzes. Underlying release-warning unit coverage remains independent of the removed preset. Account-runner navigation/loop/report expectations now use six topics; authenticated account QA was not rerun for this presentation-only removal.

## Pre-publication verification of accumulated source

- Fresh full `npm test`: **110 passed, 0 failed, 0 skipped**.
- Fresh Vite build: **81 modules**, successful; output only to `/Users/prommeesee/.hermes/cache/scratch/scale-lab-commit-verification-dist`.
- Fresh compiled Playwright: **32 passed**, selecting `dc-release`, `dc-capacity`, `dc-missing-data`, `dc-presentation`, `dc-usability` and `data-centers` specs. Used a separate temporary server at port 4193, not the existing preview. Scratch-only report: `/Users/prommeesee/.hermes/cache/scratch/scale-lab-commit-browser/results.json`.
- `node --check`: **77 changed JavaScript/MJS files passed**. Added-line secret/dangerous-code scan found no matches; QA fixture credentials are synthetic, not production secrets.
- Corrected obsolete uniform-speed summaries in LAB06–08 documentation and one trailing CSS blank line. Historical evidence remains historical; full browser/backend suites and authenticated persistence were not rerun here.

## Earlier removal verification

- TDD: six-topic test failed with `7 !== 6` before implementation, then passed.
- Full `npm test`: **110 passed, 0 failed**.
- Scratch Vite build: **81 modules**, successful, output `/Users/prommeesee/.hermes/cache/scratch/lab08-preview`. No canonical dist write. External-output non-empty warning is expected; historical assets were not deleted.
- Focused compiled Playwright: **34 passed, 0 failed, 0 skipped**, covering content/glossary, six-topic navigation, final disabled Next, Back/forward/reset, DOM absence before/after run and replay, normal/reduced motion, pause, cancellation, 2000ms routes and topic-5/6 stages. Light/Dark and 1280/390/320 widths, plus existing 1440 reading layout.
- Inspected the actual 320px Dark final-topic screenshot: readable wrapped 6/6 heading, disabled dashed Next, primary toolbar and no release example.

Evidence: `evidence/lab09-remove-release-topic/` (`unit-results.txt`, `browser-results.json`, `browser-run.txt`, screenshots). Older evidence directories remain intact. A capacity regression initially tried Next from the now-final slide; updated its cancellation journey to Back then forward, retaining all animation assertions.

## Historical preview limitation (at removal verification)

The supplied parent preview PID 27119 and port 4173 were already absent when checked (`ps`, `lsof`, and connection refused). Rebuilt its requested scratch output without restarting/replacing port 4173. Verified that exact compiled output using a temporary foreground-owned Vite preview at **4189**, stopped after the suite. A detached preview attempt did not survive between tool calls; the successful run kept preview and tests within one foreground process. Parent must restore its own preview if a persistent 4173 URL is required.

No Docker deployment, live database, backend schema/history, canonical dist, commit or push operations. Existing pending LAB01–08 work remains untouched by this change.
