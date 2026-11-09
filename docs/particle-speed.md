# LAB01–08 particle cadence — standalone preview only

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

## Corrected result: every lesson is faster than its pre-task baseline

The earlier uniform 2000ms change below is superseded. It incorrectly slowed LAB01, LAB02 and LAB04. Current per-connector timings are:

| LAB | Pre-task baseline ms | Current ms |
|---|---:|---:|
| 01 | 1100 | 800 |
| 02 | approximately 1152–1200 per leg | 850 per leg |
| 03 | 3200 | 2000 |
| 04 | 1600 | 1200 |
| 05 | 2400 | 2000 |
| 06–08 | 2700 | 2000 |

LAB02 preserves its four-leg geometry in a 3400ms timeline. Its DB-down timeline is 4100ms: two 850ms legs, the original 1920ms endpoint hold, then 480ms fade. LAB04 retains sequential client→LB→backend with both duration and second-route delay at 1200ms. LAB01 retains the earlier awaited animation completion/generation guard and independent 1100ms non-route holds. No model, score, content, TTL or API changes were made for this correction; all other pending implementation remains intact.

### Correction verification

Commands from `courses/scale-lab`, with `PATH=/usr/local/bin:$PATH`:

- `npm test`: **101 passed**, zero failed/skipped; `evidence/particle-speed-correction/units.log`.
- `npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview --emptyOutDir`: **78 modules**; assets `index-Cdfr8Aaq.js`, `index-CMUhP7BI.css`.
- `npx playwright test --config playwright.particle-speed.config.js`: **18 passed**, zero failed/skipped/flaky. Per-lab actual durations, measured slope, strict faster-than-original baseline, full completion, pause/resume, replay and reduced-motion checks. Includes LAB01 same-route replay, LAB02 hold/fade keyframe boundaries and completion, and LAB04 sequential delays `[0,1200]`.
- `PARTICLE_REGRESSION=1 npx playwright test --config playwright.particle-speed.config.js`: **27 passed**, zero failed/skipped/flaky. Includes the prior 23 regressions plus three LAB02 responsive dotted-route tests and LAB04 original routing/result preservation.
- RED run caught LAB01 2000≠800, LAB02 timeline 8000≠3400 and LAB04 2000≠1200 before source correction; retained as `red-results.json`.

All correction evidence goes to `evidence/particle-speed-correction/`, including explicit `flow/` and `web/` screenshot/video destinations; prior evidence was not targeted. The combined regression-plus-speed shell hit the tool's 420s limit after the completed 27-test regression report; the entire final 18-test speed suite was rerun separately and passed.

| LAB | Measured elapsed ms | Progress percentage points | Completed initial animations |
|---|---:|---:|---:|
| 01 | 416.650 | 52.08120 | 2 |
| 02 | 433.326 | 50.97954 | 2 |
| 03 | 416.688 | 20.83440 | 1 |
| 04 | 416.768 | 34.73070 | 2 |
| 05 | 416.650 | 20.83250 | 2 |
| 06 | 416.650 | 20.83250 | 6 |
| 07 | 400.022 | 20.00110 | 6 |
| 08 | 416.658 | 20.83290 | 4 |

LAB02 records two CSS timelines containing the four sequential legs. Raw measured-motion attachments are in `results.json`; regressions are in `regression-results.json` in the correction directory.

Correction touched only `src/flow-view.css`, `src/workload-view.css`, `src/balance-view.js`, browser specs `particle-speed`, `flow-lines`, `web-visual`, the particle-speed Playwright config, this document and the default-profile lesson-preferences skill. The existing parent-owned PID27119 preview remains at `http://127.0.0.1:4173` without restart. It is standalone (no platform login). No deploy, commit, push or live database access; authenticated persistence was not rerun.

## Historical uniform-2000ms attempt (superseded; not current verification)


## Result and scope

In the superseded attempt, all eight lessons used **2000ms per connector**, for experiment and replay. This is presentation timing only: no model/action/scoring/content/TTL changes. Existing uncommitted implementation was preserved against the task-start snapshot at `/Users/prommeesee/.hermes/cache/scratch/particle-speed-baseline`, not HEAD. Of its 373 source/test/doc/script files, 356 remain byte-identical and 17 have the allowlisted changes below. No deployment, commit, push, Docker operation or live database access. Docker remains at `https://localhost` and was not exercised.

The actual baseline was **not uniformly 2700ms**: LAB01 1100ms; LAB02 4800ms for four legs (1152–1200ms per leg); LAB03 3200ms; LAB04 1600ms; LAB05 2400ms; LAB06–08 2700ms. The explicit uniform 2000ms target therefore speeds up LAB03/05–08 but slows LAB01/02/04 relative to their actual checkout baseline. Do not describe all eight as faster than their previous implementation.

- LAB01: finite 2s CSS route; await `animation.finished` before advancing; retain 1100ms non-route processing/display holds. Generation guard prevents replay during the same route from executing both stale and current completion callbacks. Pause/resume waits for remaining animation, not a fresh route timer.
- LAB02: 8s CSS timeline contains four exact 2s connector legs. DB-unavailable uses two 2s legs plus its original 1920ms endpoint hold and 480ms fade, totaling 6400ms. Machine activation/allocation animations unchanged.
- LAB03: particle only is 2000ms; no-route 3200ms explanatory hold unchanged.
- LAB04: both route duration and second-route delay are 2000ms, retaining sequential client→LB→selected backend.
- LAB05–08: only route WAAPI duration changes; existing awaited completions, sequencers, non-route 900ms holds, model snapshots and reduced-motion immediate settlement remain.

## Verification

`PATH=/usr/local/bin:$PATH npm test`: **101 passed, zero failures**.

`PATH=/usr/local/bin:$PATH npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview --emptyOutDir`: **78 modules built**. Final assets: `index-k0dxZSRb.js`, `index-JBvJepzL.css`. Existing parent-owned preview at `http://127.0.0.1:4173` remained running; this is standalone, with no platform login.

`PATH=/usr/local/bin:$PATH npx playwright test --config playwright.particle-speed.config.js`: **18 passed**, compiled preview. All eight lessons measured progress against actual elapsed animation time, exact frozen pause, full live/replay completion, replay reset, and static reduced motion. Additional tests cover same-route LAB01 replay and preserved LAB02 unavailable hold. Initial timing tests failed in all eight lessons against actual old durations (`evidence/particle-speed/red-results.json`), before implementation.

| LAB | Measured elapsed ms | Measured progress percentage points | Observed completed animations in initial topic |
|---|---:|---:|---:|
| 01 | 433.330 | 21.6665 | 2 |
| 02 | 433.316 | 21.66575 | 2 CSS timelines, four legs |
| 03 | 416.650 | 20.8325 | 1 |
| 04 | 433.324 | 21.6662 | 2 |
| 05 | 433.332 | 21.6666 | 2 |
| 06 | 416.690 | 20.8345 | 6 |
| 07 | 416.650 | 20.8325 | 6 |
| 08 | 416.660 | 20.8330 | 4 |

Every row measures 0.05 percentage points/ms (2000ms per full leg); LAB02's enclosing animation is 8000ms, not a per-leg duration. Raw sample/replay/completion attachments are embedded in `evidence/particle-speed/results.json`.

`PATH=/usr/local/bin:$PATH PARTICLE_REGRESSION=1 npx playwright test --config playwright.particle-speed.config.js`: **23 passed**, zero skipped/flaky tests in the final run. Covers all LAB01 route geometry in both themes at 1280/390/320, full-stage motion/replay/reduced motion, LAB05 complete scenarios, Cache/CDN completion before next snapshot and preserved clock/read counts, CDN real path motion at all six theme/width combinations, and LAB08 all-topic geometry plus six-route shared-session completion in Light desktop/Dark mobile. Evidence: `regression-results.json`, `flow/`, `web/` under `evidence/particle-speed/`. Sampled LAB01 desktop and LAB08 mobile paused toolbar screenshots were visually inspected; no new clipping/readability defect was observed.

Old LAB01 geometry tests hardcoded 1100ms and a 2000ms polling deadline; adjusted them to the new cadence. CDN rAF sampling occasionally misses the last ~100ms under browser load: retain near-end actual geometry sampling (>90%) and now additionally assert the resolved animation timeline is exactly 2000ms, rather than equating the last rAF callback with completion. Final full regression rerun passed.

## Changed files

Existing source (under `courses/scale-lab/src/`):
- `flow-view.js`, `flow-view.css`
- `workload-view.css`
- `scaling-view.js`, `balance-view.js`
- `replication-presentation.js`, `cache-presentation.js`, `cdn-presentation.js`, `web-presentation.js`

Existing tests (under `courses/scale-lab/tests/browser/`): `flow-lines.spec.js`, `cache-presentation.spec.js`, `cdn-presentation.spec.js`, `web-visual.spec.js`.

New tests/config: `courses/scale-lab/tests/browser/particle-speed.spec.js`, `courses/scale-lab/playwright.particle-speed.config.js`.

Other existing files: `scripts/lab07-presentation-browser-verify.mjs` (timing assertions only), `docs/lab06-presentation.md`, `docs/lab07-presentation.md`, `docs/lab08-presentation.md` (current timing and historical-evidence qualification). New document: this file. Default-profile `classroom-lesson-preferences` skill now specifies 2.0s and records the CSS multi-leg/replay-callback pitfall.

## Limitations and evidence hygiene

No authenticated backend persistence run or full unrelated browser suite was performed; the full course unit suite and targeted compiled browser suites passed. The account QA script's updated timing assertions were not executed against a backend in this task.

**Evidence-path issue:** the first broader regression run inherited hardcoded screenshot/video destinations from existing tests before the output override was added. It refreshed files in `evidence/flow-dotted/` and `evidence/lab08-presentation/`. There was no task-start binary evidence backup, so the overwritten historical screenshots cannot be claimed preserved. Their historical JSON/account reports were not targets of those tests. Subsequent runs explicitly write to the new `evidence/particle-speed/flow/` and `web/` paths; the current measured timing reports are separate. Do not use the refreshed old screenshots as proof of old 2700ms behavior.
