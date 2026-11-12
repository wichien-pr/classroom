# Scale Lab reusable presentation timing

## Current change (not deployed)

Canonical checkout `/Users/prommeesee/projects/classroom`, branch `exam-new`, base `e1b4cc3`.
Only LAB01 connector travel is slower. Its **measured compiled baseline was 800ms**, now **1500ms** for experiment and replay. The timing change does not alter learner-facing text, styles other than animation timing, IDs, model clocks, TTL, scoring or API behavior. The accompanying LAB01–08 instruction-strip removal is documented separately. No playback sequencer was refactored.

## Configuration contract

Edit **`courses/scale-lab/src/animation-timing.js`**, then rebuild the preview. This is a source configuration, not learner UI or live mutable settings.

```js
lab01: Object.freeze({routeMs:1500}), // change e.g. to 1800 for slower connectors
```

All values are milliseconds, finite and positive; invalid values throw a key-specific RangeError at module load rather than creating infinite/zero animations or silently substituting defaults. Each experiment and replay uses the same renderer/config.

| Lesson / renderer | Key(s) | Before → after (ms) |
|---|---|---|
| LAB01 `flow-view` | `lab01.routeMs` | **800 → 1500** |
| LAB02 `workload-view` | `lab02.routeMs` | 850 → 850 per leg; normal timeline 3400 |
| LAB03 `scaling-view` | `lab03.routeMs` | 2000 → 2000 |
| LAB04 `balance-view` | `lab04.routeMs` | 1200 → 1200; second leg delay derives from same key |
| LAB05 `replication-presentation` | `lab05.routeMs` | 2000 → 2000 |
| LAB06 `cache-presentation` | `lab06.routeMs` | 2000 → 2000 |
| LAB07 `cdn-presentation` | `lab07.routeMs` | 2000 → 2000 |
| LAB08 `web-presentation` | `lab08.routeMs` | 2000 → 2000 |
| LAB09 `dc-presentation` | `lab09.routeMs` | 2000 → 2000 |
| LAB10 `queue-presentation` | `lab10.routeMs` | 1500 → 1500 |
| LAB11 `logging-presentation` | `lab11.routeMs` | 1500 → 1500 |
| LAB12 `data-tier-presentation` | `lab12.comparisonRouteMs` | 1500 → 1500; two simultaneous tokens and unavailable-node cue |
| LAB12 | `lab12.comparisonCapacityMs` | 900 → 900, simultaneous capacity reveals |
| LAB12 | `lab12.placementMs` | 1200 → 1200, four placement lanes |
| LAB12 | `lab12.requestBatchMs` | 1000 → 1000, every request batch/lane |
| LAB12 | `lab12.shardingSummaryMs` | 1600 → 1600 |

LAB02 blocked routing retains **two 850ms legs + 1920ms hold + 480ms fade = 4100ms**. Independent `lab02.blockedHoldMs` and `blockedFadeMs` are not scaled when changing `routeMs`. `workloadBlockedFrames` derives blocked offsets, including the original opacity lead (48ms at the default leg cadence). CSS retains its animation names, pause and animationend settlement; JavaScript installs generated keyframes at experiment/replay start. Normal four-leg CSS percentages remain proportional to the configured leg duration.

### Deliberately outside route configuration

These distinct non-route/local timings remain numerically unchanged: LAB01 1100ms non-route frame hold; LAB02 1200ms activation/allocation and 1000ms activation delay; LAB03 3200ms no-route hold; LAB05–07 900ms no-route holds; LAB09 1400ms local capacity/data reveals; LAB10 900ms no-route/final holds, 1300ms processing and 1000ms enqueue settling; LAB11 1500ms local reveal and 30ms reduced-motion yield. LAB12's presentation stages are explicitly named above, not collapsed into routeMs. Generic UI transitions, storage, debounce, network polling, simulated/model clocks and TTL are not centralized.

## Commit readiness verification

- Fresh unit run: **151 passed, zero failed**. Scratch Vite build: **96 modules**, using the existing parent-owned preview output; no main dist, database, server or deployment changes.
- Fresh focused compiled browser checks: **8 strip checks passed** (all target topics in Light/Dark at 1280/390/320, reduced-motion experiment/replay for every target topic, and exact LAB09–12 DOM against the committed fixture); **6 timing checks passed** (LAB01 measured motion/pause/replay/cancel in both themes at desktop/mobile, LAB02 blocked hold/fade, LAB12 simultaneous and sharding-stage timing).
- New local outputs are isolated under scratch `strip-publish-check/` and `animation-publish-check/`; unit output is `animation-strip-publish-units.log`. These are local evidence, not runner dependencies. Earlier full-suite counts below are historical, not fresh full-suite claims.
- Run browser commands from `courses/scale-lab` against an already built standalone preview on port 4178. Set `STRIP_EVIDENCE` or `ANIMATION_TIMING_EVIDENCE` to a fresh output directory; both reporters and screenshots honor them. No baseline file is required in those directories. Install package dependencies and Playwright Chromium before running on a new checkout.
- Stale LAB02-only browser expectations and unrelated historical LAB11/12 runners/reports remain excluded and preserved locally. Commit/push is separately authorized; neither merge nor deployment is part of this change.

## Original implementation verification (historical local evidence)

- TDD: missing-config test failed, then passed; renderer-consumer contract failed before renderer wiring; blocked-offset and invalid-value tests failed before implementation. Final **151/151 Node unit/model tests passed**, including five timing tests, all config-key consumers, retained local waits, cancellation/save/await model-sequence regressions. `evidence/animation-timing-config/unit-final.txt`.
- Mechanical inventory covers **12 JS renderers + 12 matching CSS files**: `source-baseline.json` and `timing-audit.json`. Reversing timing substitutions in LAB03–12 JS recreates the exact pre-edit source, proving no other renderer edits there. LAB01 changes only add config/CSS variable; LAB02 additionally regenerates blocked keyframes to keep independent hold/fade.
- Final compiled browser suite: **27/27 passed**, `evidence/animation-timing-config/verified/browser.json`. Measures routes in all twelve labs, LAB04 delay, LAB02 blocked boundaries, LAB12 simultaneous comparison plus all four placement tokens and sixteen request-batch token traversals. Tests freeze pause, resume, replay and reduced-motion settlement; LAB01 also tests generation restart/navigation cancellation and all four topics, covering every DNS/HTTP route with fulfilled animation.finished before completion and equal replay traversals.
- LAB01 pre-edit browser sample: 16.666→233.328ms animation time, 2.08325→29.166% route offset, duration 800ms. Final desktop Light sample: 16.666→300.002ms, 1.11107→20.0001%, duration 1500ms; pause held 449.902ms / 29.9935%, replay restarted at 0ms / 0%. Raw records: `baseline-browser.json` and `verified/measured-motion.json`.
- Light/Dark screenshots at 1280×800 and 390×800: `evidence/animation-timing-config/verified/lab01-{light,dark}-{1280,390}.png`. Actual screenshots reviewed: distinct blue/cyan particle on dotted connector, retained diagram typography/geometry. Mobile scene remains vertically scrollable; these are normal-height viewport captures, not claims that the full scene fits one screen.
- Build succeeded (96 modules) into the **same parent-owned** `/Users/prommeesee/.hermes/cache/scratch/lab12-why-sharding-build`. Existing server PID 162 / `http://127.0.0.1:4178` retained. Compiled assets verified by the browser tests, not merely HTTP status.
- An initial extra all-topic probe incorrectly asserted `animation.currentTime === 1500` after the renderer had removed the completed CSS animation; removed animations can report null. The corrected acceptance criterion observes fulfilled `animation.finished`, configured duration and complete equal experiment/replay route sequences; the final entire suite passes. Earlier probe artifacts remain separately available.

Commands from `courses/scale-lab` (compatible Node: `/usr/local/Cellar/node/26.7.0/bin/node`):

```sh
$NODE --test tests/*.test.js
$NODE node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab12-why-sharding-build --emptyOutDir
ANIMATION_TIMING_EVIDENCE=../../evidence/<new-run> $NODE node_modules/@playwright/test/cli.js test --config playwright.animation-timing.config.js
```

Always choose a fresh evidence directory for future browser runs; the environment variable redirects both reporter output and screenshots. Preview is standalone, has no platform login and uses local progress. No new authenticated backend/persistence QA was run for this presentation-only change. Main dist, database, port 4173 and deployment were not targeted; no server stop, commit or push. Historical untracked QA files were preserved.
