# LAB11: unscored Logs / Metrics experiment

Workspace: `/Users/prommeesee/projects/classroom`, branch `exam-new`. Source-only change; no commit, push or deployment. Docker, live data, canonical dist, manifests, private assessment and durable scoring identities were not edited. Existing unrelated untracked work was preserved.

## Behavior

The original candidate Build / Test / Deploy experiment remains topic 1. Back/Next exposes a new topic 2, **ดู Logs และ Metrics เคลื่อนไหว**. Start/Pause/Resume controls update a generated `/orders` log batch and three charts together:

- Request rate: number of requests in each simulated second, req/s.
- Mean latency: arithmetic mean of that batch, rounded to ms (not p95).
- Error rate: HTTP 500 count divided by batch size, rounded to percent.

Every log in the latest batch is shown (at most 8); chart history retains at most 20 one-second points. Data follows a deliberately repeating educational pattern, not actual monitoring or evidence that higher load caused errors. It does not depend on pipeline outcomes. The Thai explanation distinguishes event details from time-window aggregates. No start/stop/navigation action awards participation or completion.

Playback starts only on request. Pause freezes both views; navigating away or resetting clears the interval. Revisiting starts idle. Updates are discrete with no scrolling/translating animation, including reduced-motion mode. Labels and output values remain readable without interpreting chart geometry. No background polling or service APIs are added.

## Verification

Observed vertical RED → GREEN cycles:

1. Extra-topic browser test failed because Next was absent; added navigation and static topic.
2. Aggregate model test failed because sample generator was absent; added deterministic correlated batches.
3. Playback browser test failed because Start was absent; added synchronized chart/log timer and pause/resume.
4. Narrow rendering test failed on unstyled inline SVG; added responsive chart/log styling.
5. Teaching-copy test failed because the introduction omitted Logs/Metrics; updated scoped copy.
6. Actual dark chart contrast test failed at 2.9159343372477644:1; introduced a stream-only dark accent and verified >=3:1.

Final results:

- `node --test tests/*.test.js`: **207 passed**, 0 failed.
- `node --test tests/logging*.test.js`: **24 passed**, 0 failed (subset of the full unit suite).
- Compiled standalone `playwright.lab11-stream.config.js`: **15 passed**, 0 failed. Includes 7 original pipeline browser regressions and 8 new-topic checks; actual time progression, frozen pause, resume, keyboard activation, 20-point/8-row bounds, detached-DOM cleanup, unchanged localStorage, no POSTs, and light/dark 1280/390/320 layouts.
- Compiled account-mode intercepted-API suite: **12 passed**, 0 failed. Covers original save/retry/reset boundaries plus zero stream writes and leaving a held pipeline save for the new topic. This is frontend-contract coverage, not authenticated backend persistence.
- Standalone and account-mode Vite builds: **98 modules transformed**, successful, scratch output only.
- `git diff --check`: passed.

Screenshot inspection found no clipping in the reviewed desktop/mobile scenes. Dark strokes were corrected after measured contrast failure and the final screenshots were re-inspected. Both themes and 320/390/1280 widths have screenshot evidence; mobile captures use a taller viewport to avoid sticky-header overlap, while overflow assertions run at height 900.

## Reproduce / preview

From `courses/scale-lab`, use `/usr/local/bin/node` (verified x64 dependency-compatible Node).

```sh
/usr/local/bin/node --test tests/*.test.js
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-stream-build
LAB11_URL=http://127.0.0.1:4187 LAB11_EVIDENCE=/Users/prommeesee/.hermes/cache/scratch/lab11-stream-final-evidence /usr/local/bin/node node_modules/@playwright/test/cli.js test -c playwright.lab11-stream.config.js
```

Standalone preview: `http://127.0.0.1:4187/`, **no platform login, browser-local progress**. Select LAB11 → Next → Start. Its process `proc_be1978b90594` was transferred to the parent agent; existing 4178 was left alone. Restart if needed:

```sh
/usr/local/bin/node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4187 --strictPort --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-stream-build
```

Account-contract reproduction uses a separate scratch build with `VITE_CLASSROOM_PROGRESS_URL=/api/qa/progress`; serve on a free loopback port and set `LAB11_ACCOUNT=1 LAB11_URL=<that URL>` for the same config. The temporary dev (4186) and account-contract (4188) servers were stopped after QA.

Evidence root: `/Users/prommeesee/.hermes/cache/scratch/`

- `lab11-stream-unit.txt`, `lab11-stream-browser.txt`, `lab11-stream-account-browser.txt`
- `lab11-stream-final-evidence/logging-stream-dark-1280-r-9468c-bounded-updates-and-cleanup/dark-1280.png`
- `lab11-stream-final-evidence/logging-stream-dark-320-re-c39e3-bounded-updates-and-cleanup/dark-320.png`
- Corresponding light and 390px captures in that final-evidence directory.

Scratch evidence is temporary and may be pruned when idle. No production integration or authenticated persistence claim is made; no backend code changed. Legacy historical browser suites targeting superseded earlier LAB11 designs were not represented as current acceptance tests.
