# LAB02 padded workspace and top navigation — deployed to local HTTPS

Workspace `/Users/prommeesee/projects/classroom`, branch `exam-new`. Deployed to the existing real-account `https://localhost` stack; no commit or push. This is a layout follow-up to the presets documented in `lab02-presets-verification.md`.

## Verified deployment — 2026-11-05

- Canonical Docker Compose build completed before downtime. Running immutable image: `sha256:328070128c3f0f72586e15aadb90f46e32e2508824a9ef731441db2039fcb66d`, healthy. Complete running `/app` hashes match the qualified image.
- Previous image: `sha256:3efb5a93175f90734ce757b8df961da1c6d469e8f8a2c5d8143aecf7df58c8a1`; retained rollback tag `classroom:rollback-lab02-layout-20261105-151732`.
- Complete old/new runtime delta is only Scale Lab dist: entry and old/new JS/CSS. Backend, other courses, manifests and private banks unchanged. New assets match the source-qualified integrated scratch build exactly.
- Actual immutable-image synthetic-account browser: **15 layout/motion checks passed**. Covers all four centered topic titles in Light/Dark at 1280/390/320, padding/overflow, keyboard heading focus, first/last disabled controls, reset, adjacent-lab scope, unchanged preset outcomes, playback cancellation and reduced motion. Separate account runner: **6 action POSTs, 0 navigation/playback POSTs, 1 persisted semantic award after reload**, no automatic completion and zero page errors.
- Evidence: `evidence/lab02-layout-image/report.json` and `evidence/lab02-layout-image-matrix/report.json`. Inspected actual-image `light-1280-1-top.png` and `dark-320-4-top.png`: centered title, inset workspace and correct Back/title/Next order; narrow title wraps without clipping. Full phone diagram still requires scrolling.
- Coordinated stopped-writer full-volume backup: `/Users/prommeesee/.hermes/backups/classroom-lab02-layout-20261105-151732/data.tar`, SHA-256 `9e1894191805d25ea8d01f65d8e6f9df9cbb8258a79b13dd301fac99a767687f`. Private directory/file permissions 0700/0600. Extracted archive matched SQLite integrity, schema, deterministic fingerprints of **25 tables**, sessions and **1 upload file**.
- Same `classroom-accounts-20261022:/data` and exact effective environment retained. Immediately after startup, before HTTP probes, all fingerprints matched. After probes all non-session tables/uploads and all preexisting sessions remained unchanged; exactly **1 new anonymous login-page session**. No live fixtures or real-account authentication used.
- Direct health and trusted-CA HTTPS `/healthz` passed, without `-k`; catalog/course guest redirects and protected API 401s verified. Report: `/Users/prommeesee/.hermes/backups/classroom-lab02-layout-20261105-151732/deployment-report.json`.
- Pending source/tests/docs, local reference PDFs, `~$Step3.docx` and host dist were hash-preserved through rollout; only this document intentionally updated afterward.
- Limits: authenticated browser verification used disposable synthetic accounts over loopback HTTP, not live HTTPS credentials. Signup/OTP and restart-persistence journeys were not rerun. Existing account-save primary-button focus loss remains; navigation heading focus passes.

## Changes

- Only LAB02 moves the existing Back/Next nodes and existing dynamic heading into a single top navigation: `« Back | 1 / 4 · แยกทรัพยากร Web และ Data | Next »`. No duplicate heading or bottom navigation. Other topic labs and LAB01 navigation are unchanged.
- Equal side grid tracks center the title independently of button width. At narrow widths the heading wraps in the center column without reordering the DOM, clipping, or shrinking below 18px; buttons remain 16px and at least 48px tall.
- Workspace uses LAB01-like 20px desktop / 14px mobile padding, compact 12px spacing, a bounded rounded scenario panel and the existing live diagram/action/result. Removes the redundant instruction kicker, not curriculum content.
- Existing first/last disabled controls, heading focus after navigation, reset, presets, model, action identity, pause/replay and animation cancellation remain intact.

## Pre-deployment source verification (historical)

TDD: top-navigation test failed with first child `experiment` instead of navigation, then passed after moving nodes. Geometry test failed at zero workspace padding, then passed after scoped CSS.

- `PATH=/usr/local/bin:$PATH npm test`: **75 passed**.
- `npx playwright test --config playwright.lesson-topics.config.js`: **36 passed**, including seven new layout/navigation tests and existing all-topic readability/contrast/preset regressions. Checks all four LAB02 titles in Light/Dark at 1280/390/320; DOM order, actual centered bounding boxes, no overflow/clipping, minimum type and button dimensions, keyboard activation/focus, reset and adjacent-lab scope.
- `npx playwright test workload-motion.spec.js database.spec.js flow-main-diagram.spec.js`: **15 passed**; includes original model, stale playback cancellation, reduced motion and unchanged LAB01 full diagram.
- Integrated isolated build: **55 modules**, `index-BJODjggM.js`, `index-BzQcERaB.css`; output `/Users/prommeesee/.hermes/cache/scratch/lab02-layout-qa/scale-lab/dist`. Both `VITE_CLASSROOM_URL=/` and `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress`, base `/courses/scale-lab/`.
- Actual isolated Flask / synthetic seeded account (`scripts/workload-motion-browser-verify.mjs`): **6 main-action POSTs, 0 playback/navigation POSTs, 1 persisted semantic award after reload**, criteria `{manual:false,simulation:true,thinking:false}`, zero page errors. Readback in `evidence/lab02-layout-account/report.json`. QA server terminated by runner finally.
- `git diff --check` passes. Host dist entry remains SHA-256 `41f192e5acf8e7a8ce85e6867873c2854a08131e175feb90e55e9e3035ffe855`, unchanged before/after scratch build. No production/container/database operations.

## Evidence and limits

24 top screenshots: `evidence/lab02-layout/{light,dark}-{1280,390,320}-{1,2,3,4}-top.png`. Visually inspected `light-1280-1-top.png` and `dark-320-4-top.png`: consistent inset, clear top hierarchy and centered wrapped phone heading. Full phone diagram still requires scrolling; text is not reduced to force a one-screen fit.

Existing account-saving primary-button focus loss is not fixed or claimed fixed. Real HTTPS accounts, signup/OTP and restart persistence were not rerun. Initial Python discovery found no `appworks/.venv` and no Flask in default Python; actual backend QA succeeded using the documented scratch venv with `QA_PYTHON_ARCH=arm64`.

Files in this revision: `src/lesson-topics.js`, `src/lesson-topics.css`, new `tests/browser/lesson-topics-layout.spec.js` (all under Scale Lab), `scripts/workload-motion-browser-verify.mjs` (optional separate evidence directory), and this document. Preexisting pending edits, local PDFs and `~$Step3.docx` were not removed or rewritten.
