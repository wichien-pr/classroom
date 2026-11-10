# LAB11 — merge observation into page 3

> Historical iteration report, not the current acceptance contract or a claim that its browser suite passes today. Superseded by [LAB11 current release verification](lab11-current-release.md). Commands, page counts, asset hashes and publication status below describe that earlier iteration only.

Implemented in `/Users/prommeesee/projects/classroom`, branch `exam-new`. Source and parent-owned standalone scratch preview only; not deployed or committed. Prior documents/evidence remain historical and unchanged.

## Actual mapping

The former pages 3–7 were centralized Error logs, host metrics, Service Tier metrics, Business metrics and observe/evidence. They now form **one page 3**, not removed concepts:

| Learner page | Internal stage indices | Explicit original operations |
| --- | --- | --- |
| 1 — Tests ไม่ผ่าน · หยุด | 2 | run-pipeline (failed Test) |
| 2 — แก้ไข Code Version → Build → Test → Deploy | 3–6 | unscored fix, then three awaited run-pipeline operations |
| 3 — Logs → Metrics → ตรวจหลักฐาน | 7–11 | inspect-logs, three awaited inspect-metrics operations, unscored observe |

The only production change in this revision is `src/logging-story.js`'s page map and page-3 title. The existing page runner, isolated prerequisites, cumulative metric rendering and projection-only navigation already support grouped phases. No model/scoring/content changes were required. All twelve internal frames remain. Page 2 retains four phases; page 3 uses ช่วง 1/5 through 5/5, reveals metrics in order, retains both Error events, all three metric panels and final evidence. Counter/boundaries/reset derive from three pages. Fixed sample-data, windows/cohorts, noncausal caveats, Version / Service Tier / Business wording, `v.1`, 1500ms connectors and absence of the instruction strip are preserved.

## Fresh verification

Evidence: `evidence/lab11-merge-observation/`.

- Mapping TDD regression failed meaningfully with `7 !== 3`, then passed after grouping the map.
- Full course unit suite: **134 passed, 0 failed**, `unit.log`. Includes all frames and original action lists, each of the four observation save retry boundaries, retained mutation on retry, animation/save cancellation and unscored replay. New observation tests characterize the existing grouped runner rather than claiming new runner implementation.
- Compiled standalone focused Playwright suite: **21 passed, 0 failed, 0 skipped, 0 flaky**, `browser.json` / `browser.log`. All three pages, both themes, 320/390/1280 widths, real-time selected-page primary/replay and Back/Next stop behavior, five ordered observation phases, four unchanged Version phases, pause/resume, rapid cancellation, reset, 48px keyboard navigation, overflow, 1500ms token motion and `v.1`.
- Real disposable Flask/SQLite synthetic-account QA: all three pages entered out of order; page 3 emits exactly inspect-logs + three inspect-metrics, page 2 three run-pipeline, page 1 one run-pipeline. Navigation/replay **0 participation/progress POSTs**. Semantic score **3** after repeats; manual=false / simulation=true / thinking=false, completed=[]. Both page-2 and page-3 in-flight cancellation stop later operations. Lost response after actual server commit retries the exact full UUID payload after reset; same-page retries resume without repeating the mutation. Reload retains score and completion stays disabled. No page errors. `account-report.json` / `account.log`.
- Standalone and separate account builds succeeded. Expected Vite warning: scratch output outside project root is not emptied.
- Actual screenshot review: Light desktop final evidence and cropped Dark 320px metric panels readable, all retained. Full-scene captures use a tall viewport to avoid sticky-banner overlap; separate layout assertions run at 800px height. Narrow final page is deliberately scrollable, not shrunk to fit one screen.
- `git diff --check` passed. Parent PID **98524** remains on **4173**, not restarted. Served HTML references `index-BP6RCn3f.js` and unchanged `index-CYArxv8h.css`.

## Files and reproduction

Updated `src/logging-story.js`, mapping/story/first-page/navigation unit assertions and current navigation/story/merged browser specs. Added `tests/logging-observation.test.js`, `tests/browser/logging-observation.spec.js`, `playwright.lab11-observation.config.js`, `scripts/lab11-observation-browser-verify.mjs` and this document.

From `courses/scale-lab`:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview
/usr/local/bin/node node_modules/@playwright/test/cli.js test --config playwright.lab11-observation.config.js
PATH=/usr/local/bin:$PATH VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-observation-account/scale-lab/dist
```

From repo root:

```sh
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab11-observation-account QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python /usr/local/bin/node scripts/lab11-observation-browser-verify.mjs
```

Preview **http://127.0.0.1:4173/** is standalone without platform login, using browser-local progress. Account QA uses only a synthetic seeded user and stops its ephemeral server in finally; it is not signup/OTP or real-account verification. Full legacy browser/backend suites were not rerun. No Docker, live database, canonical dist, manifest/private bank, other lesson implementation, commit, push or deployment changes. Existing pending work remains intact.
