# LAB11 — remove current presentation pages 1 and 2

> Historical iteration report, not the current acceptance contract or a claim that its browser suite passes today. Superseded by [LAB11 current release verification](lab11-current-release.md). Commands, page counts, asset hashes and publication status below describe that earlier iteration only.

## Result

Implemented in `/Users/prommeesee/projects/classroom`, branch `exam-new`; source and the existing standalone scratch preview only. No deployment or commit.

Removed the **current nine-page presentation's** `change` and `build-broken` pages, not two additional original model concepts. The seven retained pages are:

| Page | Internal stage indices (zero-based) | Explicit experiment actions |
| --- | --- | --- |
| 1 — Tests ไม่ผ่าน · หยุด | 2 | run-pipeline |
| 2 — แก้ไข Code Version → Build → Test → Deploy | 3,4,5,6 | three sequential run-pipeline saves; fix unscored |
| 3 — ติดตามหลังปล่อย · รวม Error | 7 | inspect-logs |
| 4 — ดูเครื่องที่วัด | 8 | inspect-metrics |
| 5 — ดู Service Tier | 9 | inspect-metrics |
| 6 — ดู Business Metrics | 10 | inspect-metrics |
| 7 — ใช้หลักฐานก่อนแก้ไข | 11 | none |

All twelve internal model frames remain available. Independent page execution prepares prerequisite state privately without saving prerequisite actions. The first page executes the original failed Test transition from its prepared built state. Initial/reset rendering already shows Build passed, Test failed and Deploy locked, with page progress 1/7; it does not resurrect either removed page or record an experiment. Initial/reset playback remains idle and replay disabled until a page has played. Back revisits animate the failed-test frame then stop.

The merged page retains four phases and explicit ช่วง 1/4–4/4 while navigation stays 2/7. Existing runner, navigation generation guards, pause/replay/cancel timing, 1500ms connectors, `v.1`, terminology and remaining content are unchanged. No instruction strip, new action identity, model change or scoring policy was introduced.

## Fresh verification

Evidence: `evidence/lab11-remove-first-two/`; previous evidence was not overwritten.

- TDD mapping regression failed with `9 !== 7` before the map edit. The initial-context test separately failed because Test was waiting before the initial/reset renderer correction. The initial broad RED run also waited on an obsolete page boundary and timed out; this was test-development evidence, not a successful run.
- Full course unit suite: **132 passed, 0 failed**, including deterministic private prerequisites, seven-page mapping, all original frames, selected-page actions, replay, each merged save retry and cancellation boundary. `unit.log`.
- Compiled standalone focused browser suite: **20 passed, 0 failed, 0 skipped, 0 flaky**, about 4.1 minutes. `browser.json`, `browser.log`. Light/Dark at 320/390/1280px: first title and failed-test context, seven pages, first/last navigation boundaries, reset progress, keyboard/48px centered navigation, overflow, all retained page primary/replay, forward and Back autoplay stopping on the selected page, merged sequence, rapid cancellation, paused token/1500ms duration and literal `v.1`. Actual Light desktop merged and Dark narrow first-page screenshots reviewed. Short narrow viewports require scrolling; no typography reduction was made.
- Real disposable Flask/SQLite synthetic-account QA: **all seven pages**, entered out of order, use their original actions exactly. Navigation/replay **0 participation/progress POSTs**, persisted semantic score **3**, manual=false / simulation=true / thinking=false, completed=[]. Held merged save canceled by navigation cannot launch later stages. Lost response after server commit preserves the entire retry event/UUID across navigation/reset; same-page retry preserves the Build mutation and resumes remaining Test/Deploy phases. Reload retains score; no browser page errors. `account-report.json`, `account.log`.
- Scratch standalone and account builds succeeded. Expected Vite warning: scratch output is outside the project and is not emptied.
- `git diff --check` passed. Existing parent-owned PID **98524** still serves port **4173**, without restart. Standalone HTML uses `index-fiRWP6t8.js` and `index-CYArxv8h.css`; account QA uses its separate scratch bundle.

## Changes and reproduction

Production files: `src/logging-story.js` (presentation mapping only), `src/logging-presentation.js` (initial/reset failed-test context and page progress). Updated story/navigation/merged unit and browser assertions; added `tests/logging-first-page.test.js`, `playwright.lab11-remove.config.js`, `scripts/lab11-remove-browser-verify.mjs` and this document.

From `courses/scale-lab`:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview
/usr/local/bin/node node_modules/@playwright/test/cli.js test --config playwright.lab11-remove.config.js
PATH=/usr/local/bin:$PATH VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-remove-account/scale-lab/dist
```

From repository root:

```sh
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab11-remove-account QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python /usr/local/bin/node scripts/lab11-remove-browser-verify.mjs
```

Preview: **http://127.0.0.1:4173/** — standalone, no platform login. The isolated account runner seeds only its own synthetic user and stops its ephemeral server in `finally`; this is not signup/OTP or real-account verification. The full legacy browser suite and full backend suite were not rerun. Docker, live databases, canonical dist, manifests/private assessment, other labs, prior evidence and `~$Step3.docx` were not modified by this task. Prior pending work is retained. No commit, push or deployment.
