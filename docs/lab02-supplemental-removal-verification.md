# LAB02 supplemental experiment block removal — deployed to local HTTPS

Workspace `/Users/prommeesee/projects/classroom`, branch `exam-new`. **Deployed to the existing real-account `https://localhost` Docker stack; no commit or push.** Existing pending changes were preserved; this revision does not change manifests, private banks, IDs or scoring.

## Verified deployment — 2026-11-05

- Canonical full-override Compose build succeeded before downtime. Running healthy immutable image: `sha256:51ee3a5f0c6674a22d442f874dda6fe23cb27afb528ed2962e10324e63c9bfc3`. Full running `/app` tree matches the tested image.
- Previous image `sha256:328070128c3f0f72586e15aadb90f46e32e2508824a9ef731441db2039fcb66d` retained as `classroom:rollback-lab02-supplemental-20261105-154221`.
- Complete runtime delta: only Scale Lab `dist/index.html`, removed `index-BJODjggM.js` and added `index-CPZpCtP-.js`. CSS, backend, other courses, manifests and private banks unchanged. Integrated image assets exactly match the source-qualified scratch build.
- Actual-image synthetic-account browser: **21 checks passed**, covering all four topics, mounted/accessibility-DOM absence, retained primary feedback and quiz, bottom-gap geometry, Light/Dark at 1280/390/320, top navigation, reset, adjacent-lab scope, playback and reduced motion. Separate actual-image account run: **6 action POSTs, 0 navigation/playback POSTs, 1 semantic award after reload**, no automatic completion and zero page errors.
- Evidence: `evidence/lab02-supplemental-image/report.json` and `evidence/lab02-supplemental-image-matrix/report.json`. Inspected actual-image Light 1280 and Dark 320 action screenshots: primary feedback/playback followed by retained reading notes and quiz, without the removed lower block or blank replacement gap. Phone content still requires scrolling.
- Coordinated stopped-writer full-volume archive: `/Users/prommeesee/.hermes/backups/classroom-lab02-supplemental-20261105-154221/data.tar`, SHA-256 `840b286e652f4c351f6812371a58c45437b2386d059a1d040c78bb743df768c3`; private directory/file modes 0700/0600. Extracted archive verified against SQLite integrity, schema, deterministic row fingerprints of **25 tables**, sessions and **1 upload file**.
- Preserved exact effective environment and `classroom-accounts-20261022:/data`. Immediate post-startup fingerprints matched before HTTP probes. After probes, every non-session table/upload and all preexisting sessions remained unchanged; exactly **1 new anonymous login-page session**.
- Direct health and trusted-CA HTTPS `/healthz` passed without `-k`; guest catalog/course redirects to login and protected API 401s verified. Report: `/Users/prommeesee/.hermes/backups/classroom-lab02-supplemental-20261105-154221/deployment-report.json`.
- Pending sources, tests/docs, local PDFs, `~$Step3.docx` and host dist hash-preserved through rollout; only this document intentionally updated afterward. No live fixtures or real-account authentication used.
- Limits: authenticated browser testing used disposable synthetic accounts over loopback HTTP, not live HTTPS credentials. Signup/OTP and backend restart persistence were not rerun. Existing primary-button focus loss during account-saving disable/re-enable remains unchanged.

## Change

Removed only the pictured LAB02 experiment lower block:
- `ผลล่าสุด` and its duplicate outcome / `เหตุผลและข้อควรระวัง` disclosure.
- `วิธีใช้และการข้ามหัวข้อ` disclosure.
- `บันทึกเหตุการณ์และข้อจำกัด`, event log and final experiment footnote.

The LAB02 outcome/event markup is no longer inserted by `main.js`; topic mounting does not create its help/history disclosures. Shared rendering tolerates these absent nodes while retaining the original simulator message/event model. Other labs still mount their outcome and history.

Preserved animation, fixed read-only scenario, ทดลอง, pause/replay, Back/Next and quiz. Primary live feedback remains in `#workload-result` immediately above the action, including resource relationship, DB failure and the model's SQL/NoSQL fit verdict. Navigation still clears stale results; replay remains presentation-only. The separate reading-notes disclosure outside the experiment and the quiz remain.

## Verification

- TDD RED: new browser assertion expected zero supplemental nodes and found eight. GREEN: all six new cases passed.
- `PATH=/usr/local/bin:$PATH npm test`: **75 passed**.
- `npx playwright test --config playwright.lesson-topics.config.js`: **42 passed**, covering all topic labs, LAB02's four scenarios, 1280/390/320 Light/Dark, readability/contrast, accessible-DOM absence, primary result, no overflow, no leftover lower-panel gap, reset and adjacent-lab scope.
- `npx playwright test workload-motion.spec.js database.spec.js flow-main-diagram.spec.js`: **15 passed**, including reduced motion, pause/replay, outage, keyboard action and unchanged LAB01 diagram.
- Integrated isolated Vite build: **55 modules**; scratch output `/Users/prommeesee/.hermes/cache/scratch/lab02-supplemental-qa/scale-lab/dist`, assets `index-CPZpCtP-.js` and `index-BzQcERaB.css`. Both Classroom integration environment variables supplied; base `/courses/scale-lab/`.
- Compiled isolated Flask + seeded synthetic account: **6 experiment POSTs, 0 navigation/playback POSTs, 1 persisted semantic award after reload**, criteria `{manual:false,simulation:true,thinking:false}`, no page errors. Evidence: `evidence/lab02-supplemental-account/report.json`. Runner terminates its own QA server in `finally`.
- Initial QA launch with arm64 failed because this scratch venv's Pillow is x86_64. Repeated successfully with `QA_PYTHON_ARCH=x86_64`; no packages or shared environments changed.
- `git diff --check` passed. Host dist entry SHA-256 remains `41f192e5acf8e7a8ce85e6867873c2854a08131e175feb90e55e9e3035ffe855`.

## Evidence and limits

Screenshots: `evidence/lab02-supplemental/{light,dark}-{1280,390,320}-action.png`. Inspected Light 1280 and Dark 320: concise primary result and playback controls followed directly by the existing reading notes and quiz, no removed text block or blank replacement space. Phone diagram still needs scrolling; type was not shrunk.

Source QA used a disposable seeded account over loopback HTTP, not real HTTPS accounts, OTP signup or restart persistence. Existing account-save focus behavior is not changed. The subsequent actual-image qualification and authorized deployment are documented above.

## Files

Runtime: `courses/scale-lab/src/main.js`, `src/lesson-topics.js`, `src/workload-view.js`.

Browser tests: new `tests/browser/lesson-topics-supplemental.spec.js`; updated `lesson-topics-workload.spec.js`, `lesson-topics-presets.spec.js`, `lesson-topics-readability.spec.js`, `lesson-topics.spec.js`, `workload-motion.spec.js`, `database.spec.js` to assert the retained primary result rather than removed secondary markup.

Account runner: `scripts/workload-motion-browser-verify.mjs` uses the primary result selector. This document is new. Paths under `src/` and `tests/` above are relative to `courses/scale-lab`.
