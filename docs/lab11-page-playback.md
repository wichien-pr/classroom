# LAB11 — learner-paced page playback

> Historical iteration report, not the current acceptance contract or a claim that its browser suite passes today. Superseded by [LAB11 current release verification](lab11-current-release.md). Commands, page counts, asset hashes and publication status below describe that earlier iteration only.

## Current revision (source and scratch preview only)

Supersedes continuous/full-story playback described in older LAB11 evidence. Twelve existing narrative pages remain. Back/Next cancels previous work, plays only the selected page, and stops. The primary control plays/experiments only the current page; replay is presentation-only and cannot advance. Pause/resume, reset, 1500ms motion, literal `v.1` moving token, Version / Service Tier / Business copy and the removed instruction strip remain unchanged.

Page 1 (introduction), 4 (fix/setup) and 12 (observe) use the accessible label “เล่นภาพขั้นนี้ · ไม่บันทึกกิจกรรม” and award nothing. Pages 2/3/5/6/7 retain `run-pipeline`; page 8 retains `inspect-logs`; pages 9/10/11 retain `inspect-metrics`. Meaningful actions use “ทดลองขั้นนี้ · บันทึกกิจกรรม”. Preparing a page runs pure prerequisites on private model state, without showing or recording previous actions. Fixed log/metric samples do not become causally repaired by pipeline success.

One attempt captures one page result and action. Save retries reuse that captured attempt. Navigation/reset/replay cancels its generation; an in-flight save may finish, but cannot start another page or overwrite the new selection. The shared participation adapter retains failed event payloads independently, including after navigation/reset. Existing semantic deduplication and explicit completion requirements are unchanged.

## Verification

- Test-first: new selected-page/retry/cancellation tests failed against the continuous implementation (3 failures), then passed after replacing the full-story execution loop.
- Full course unit suite: **127 passed**, zero failures (`evidence/lab11-page-playback/unit.log`).
- Compiled browser suite: **19 passed**, zero failures (`browser.json`), on the existing port 4173 preview. Light/Dark, 1280/390/320px. Covers every page's primary and replay, backward autoplay on every page, forward navigation, real 1500ms pause/resume, settled-page waits, rapid cancellation/reset, keyboard navigation, 48px controls, accessible labels, no instruction strip, overflow and disabled endpoint navigation.
- Real disposable Flask/SQLite account QA: independently enters all 12 pages out of order; each explicit action posts only its page's original identity. Intro/fix/observe, navigation and replay produce no participation/progress writes. Persisted semantic score is **3**, with `manual:false`, `simulation:true`, `thinking:false`, and **no completed lessons**. Repeated operations and reload retain that score. Held-save navigation cannot advance; a response lost after commit is retried with the **identical complete payload/event UUID** after navigation/reset. No page errors. See `account-report.json`.
- Reviewed paused `v.1` and actual viewport screenshots, including Dark 320px controls and Light desktop navigation. Tall cumulative evidence pages intentionally remain scrollable; normal viewport captures supplement full-element captures.
- All 10 canonical dist files match pre-task SHA-256 hashes. No production database operation, Docker command, deployment, commit or push was performed. Existing pending lesson changes and older evidence are retained.

This is focused LAB11 compiled-browser coverage, not a claim that the entire legacy browser suite or superseded practical/investigation QA runners passed. Historical runners describe earlier UI contracts; use the page-scoped runner below for this revision. Account QA seeds a synthetic isolated account and is not signup/OTP or production-account testing.

## Changed ownership

Production changes: `src/logging-story.js`, `src/main.js`, `src/logging-presentation.js` in `courses/scale-lab`.

Tests: `tests/logging-story.test.js`, `tests/logging-navigation.test.js`, `tests/browser/logging-story.spec.js`, `tests/browser/logging-navigation.spec.js`; new `playwright.lab11-page.config.js` and root `scripts/lab11-page-browser-verify.mjs`. No model capabilities or stable action IDs were removed. New evidence is exclusively under `evidence/lab11-page-playback/`.

## Reproduce

From `courses/scale-lab`:

```sh
npm test
npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview
/usr/local/bin/node node_modules/@playwright/test/cli.js test --config playwright.lab11-page.config.js
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-page-account/scale-lab/dist
```

From repository root:

```sh
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab11-page-account QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python node scripts/lab11-page-browser-verify.mjs
```

A background shell selected incompatible Node/Rollup architecture on one rebuild attempt. Retried successfully with the existing compatible Node; no dependency or lockfile changes. The unrelated shell startup warning about `ng` did not affect the final passing tests.

Preview: **http://127.0.0.1:4173/**, standalone without platform login. Existing parent-owned PID **98524** was not restarted. Final standalone bundle: `index-BlNvIg7g.js`; CSS remains `index-CYArxv8h.css`. Account QA uses its separate compiled bundle and temporary database; its server is stopped and cleaned up after verification.
