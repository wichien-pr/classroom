# LAB11 — merge original steps 4–7

> Historical iteration report, not the current acceptance contract or a claim that its browser suite passes today. Superseded by [LAB11 current release verification](lab11-current-release.md). Commands, page counts, asset hashes and publication status below describe that earlier iteration only.

## Result (source and standalone scratch preview, not deployed)

The original twelve concepts now occupy nine learner-paced pages. Page 4 is **แก้ไข Code Version → Build → Test → Deploy**, with four sequential internal phases: `fix`, `build-fixed`, `tested`, `deployed`. Other concepts retain their order and wording. Navigation shows 4/9 throughout this sequence; its scene shows explicitly labeled internal progress ช่วง 1/4 through 4/4. Other scene counters match the nine-page navigation.

| Page | Original concept indices (1-based) | Explicit actions |
| --- | --- | --- |
| 1 | 1: change | none |
| 2 | 2: build-broken | run-pipeline |
| 3 | 3: blocked | run-pipeline |
| 4 | 4–7: fix → build-fixed → tested → deployed | three sequential run-pipeline operations; fix is unscored |
| 5 | 8: logs | inspect-logs |
| 6 | 9: host | inspect-metrics |
| 7 | 10: tier | inspect-metrics |
| 8 | 11: business | inspect-metrics |
| 9 | 12: observe | none |

Back/Next and Replay project privately captured model frames for only the selected page. The combined page stops after Deploy, never automatically moving to Logs. Primary experiment awaits each stage animation and its original participation save before continuing. A failed save retains its stage mutation; retry does not execute it again. Navigation, Replay and reset cancel both presentation and explicit-operation generations. Intro/fix remain unscored, and the backend's semantic deduplication is unchanged. No compound action was introduced.

The renderer keeps the original test gate, 1500ms connector duration, literal `v.1`, Version / Service Tier / Business terminology and no mounted instruction strip. Model fixtures, shared state, manifest, assessment, scoring policy and manual completion are unchanged.

## Verification

- TDD: the new nine-page mapping/combined-frame test failed with `undefined !== 9`; after implementation it passed. Compiled-browser title/sequence test failed against the old 4/12 page; the internal-progress regression separately caught the obsolete 4–7/12 scene counters before their correction. Retry/cancellation regressions characterize retained behavior across the new boundaries.
- Full course unit suite: **130 passed, zero failed** (`evidence/lab11-merge-version-steps/unit.log`). Includes all twelve frame concepts, nine-page ordering, four-phase state progression, three original operations, full-page replay, save failure at each of the three stage boundaries and cancellation while animation/save is held.
- Final compiled-browser suite: **20 passed, zero failed**, all nine pages in both Light/Dark at 320/390/1280px. Covers primary/replay, forward/back autoplay, stop-at-page boundaries, pause through an internal phase's normal end time, ordered fix/build/test/deploy, test gate before deploy, rapid cancellation, reset, endpoint disabling, keyboard navigation, 48px controls and horizontal overflow. Final report: `browser.json`.
- Real isolated Flask/SQLite QA: all nine pages independently entered out of order; page 4 posts exactly three `run-pipeline` events. Navigation/replay produces **zero participation/progress POSTs**. Persisted semantic score **3**; manual=false, simulation=true, thinking=false, completed=[]. Held first-stage save canceled by navigation cannot start Test/Deploy. Lost response after server commit retries the identical full event/UUID after navigation/reset. Same-page retry also preserves the Build snapshot, then sends Test/Deploy with distinct new UUIDs (three unique stage events across four requests including retry). Reload retains score. No page errors. See `account-report.json`.
- Reviewed actual merged Light desktop and Dark 320px screenshots. Narrow full-section captures use a taller screenshot viewport to avoid sticky-banner stitching occlusion; the behavior/overflow runs use 800px viewport height. Existing 800px viewport and control captures are included separately. Narrow layouts remain scrollable; typography was not shrunk.
- `git diff --check` passes. Parent-owned preview PID 98524 remains on port 4173 without restart. Served HTML references `index-DgUWiPjv.js` / `index-CYArxv8h.css`; compiled browser tests exercised this build.

## Files and reproduction

Production edits are limited to `courses/scale-lab/src/logging-story.js`, `src/main.js`, and `src/logging-presentation.js`. Added `tests/logging-merged-pages.test.js`, `tests/browser/logging-merged-pages.spec.js`, `playwright.lab11-merge.config.js`, and `scripts/lab11-merge-browser-verify.mjs`; updated current story/navigation unit and browser tests. New reports/screenshots live under `evidence/lab11-merge-version-steps/`. Earlier docs/reports remain historical and untouched.

From `courses/scale-lab`:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview
/usr/local/bin/node node_modules/@playwright/test/cli.js test --config playwright.lab11-merge.config.js
PATH=/usr/local/bin:$PATH VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-merge-account/scale-lab/dist
```

From repository root:

```sh
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab11-merge-account QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python /usr/local/bin/node scripts/lab11-merge-browser-verify.mjs
```

Preview: **http://127.0.0.1:4173/** — standalone, no platform login. Account verification uses a separate scratch build and synthetic account in a disposable database; the QA runner stops its server in `finally`. This is not signup/OTP, production-account or whole legacy-browser-suite verification. No Docker, live database, canonical dist build, commit, push or deployment was performed. Unrelated preexisting pending edits and `~$Step3.docx` were preserved. Vite emits the expected warning that scratch output lies outside the project and is not emptied.
