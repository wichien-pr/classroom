# Profile photos verification

## Outcome
Implemented own-account upload/preview/remove with shared avatar/initials in catalog/header/profile/leaderboards/exam header. Secure decoded JPEG/PNG/WebP processing, metadata stripping, private authenticated thumbnail delivery and additive SQLite reference. Requirements/storage/API: [profiles-contract.md](profiles-contract.md).

## Executed results
- `cd appworks && .venv/bin/python -m pytest -q`: **120 passed in 21.62s**, `evidence/profile-backend-tests.txt`.
- `.venv/bin/pip install 'Pillow>=12.0,<13'`: installed **Pillow 12.3.0** into existing appworks venv; requirements now pin it. `.venv/bin/pip check`: **No broken requirements found**.
- `cd courses/scale-lab && npm test`: **21 passed**, `evidence/profile-course-node.txt`.
- `npm run test:e2e`: **16 passed**, `evidence/profile-course-browser.txt`.
- `npx playwright test -c playwright.account.config.js`: **6 passed**, `evidence/profile-course-account-browser.txt`.
- `python3 scripts/courses.py validate`: **OK scale-lab**. No course source or built assets changed; no rebuild needed.
- `node scripts/profile-browser-verify.mjs`: **passed**, real Waitress/Flask/SQLite at 127.0.0.1:8096; result `evidence/profile-browser.json`. Real file input selection and blob preview, POST upload, served JPEG decoded in header/profile/catalog/leaderboard, reload persistence, other account unchanged, invalid image 400 preserving old photo, oversize client help + server 413, missing-CSRF 403, mobile overflow check, remove/reupload and guest protection. No page errors.
- `CLASSROOM_QA_URL=http://127.0.0.1:8096 node scripts/browser-verify.mjs`: **passed**, `evidence/profile-platform-browser.txt` and `platform-browser.json`; actual course JS/CSS responses 200, interactive lab, navigation, deep route, mobile and logout protections.

## TDD evidence
Sequential vertical slices, each failing before implementation:
1. `profile-red-1.txt`: profile route missing (404), then `profile-green-1.txt` full 102 passes.
2. `profile-red-2.txt`: invalid/unsupported/truncated/dimension inputs fail; `profile-green-2.txt` passes.
3. `profile-red-3.txt`: valid upload above 16 KiB incorrectly 413; route-scoped budget fixed, `profile-green-3.txt`.
4. `profile-red-4.txt`: unexpected owner field accepted; strict fields/replace/remove/cleanup implemented, `profile-green-4.txt`.
5. `profile-red-5.txt`: shared account navigation/images absent; UI implemented, `profile-green-5.txt` full regression green.
6. `profile-red-6.txt`: forced random-name collision deleted existing file; exclusive-created tracking fixed, `profile-green-6.txt`.
7. `profile-red-7.txt`: profile aria-current missing (visual review found leaderboard incorrectly active); corrected nav, final 120-pass suite.
Additional security characterization/regression tests cover real JPEG/PNG/WebP bytes, metadata/orientation/bounds, APNG/WebP/GIF animation, pixel/decompression bombs, truncated JPEG, guest/CSRF/foreign origin, other-account read/update isolation, unsafe filename/path/symlink/DB reference, transaction rollback and shared-file cleanup. These additional passing-first tests are regression evidence, not claimed RED cycles.

## Visual evidence
Screenshots: `profile-preview.png`, `profile-desktop.png`, `profile-catalog.png`, `profile-leaderboards.png`, `profile-invalid.png`, `profile-mobile.png`, `profile-leaderboards-mobile.png` under evidence. Inspected actual screenshots: clearly synthetic blue/yellow QA robot consistently appears; mobile Thai help and upload/remove buttons readable with no horizontal clipping. Final profile navigation tab correctly selected.

## Production handoff
Production PID 3697 on 8080 was inspected and **not stopped/restarted**. No QA users/photos were written to production, and no production migration was run. Read-only final production check: integrity `ok`; `photo_ref` not deployed yet; 1 user, 13 sessions, 3 progress rows, 0 exam attempts, 0 achievements. Counts are a point-in-time read, not a fabricated pre/post comparison. Parent must back up live SQLite with backup API, verify it, then own the production restart and verify authenticated UI. Existing templates changed on disk; complete activation requires backend restart.

Final QA DB and separate upload directory recorded in `evidence/profile-qa-server.json` (`evidence/profile-qa-k3q85sw0/`). QA used only 8096, never 8080/8081; final QA process was explicitly stopped after verification. Production default new runtime storage is `appworks/instance/profile-photos`; configuration override `APPWORKS_PROFILE_UPLOAD_DIR`. Retain DB and photo directory across deployments. No original reference files or skills modified.

Known limitations: process crashes can leave private orphan thumbnails; no unsafe automatic sweep is implemented. All logged-in members can view profile photos, not just the owner. Browser file-picker button text follows browser/OS locale, with Thai accessible labels/help. Existing inline-script CSP model remains, adding only `img-src 'self' blob:` for local previews.
