# Community composer verification

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`.

## Outcome

Implemented a working reference-style modal composer (not a mock): author/avatar, title/body, icon toolbar, category, Cancel/Post, attachment previews/removal, own GIF upload, safe link and video cards, Unicode emoji and persistent single-choice polls. Native dialog focus/Escape/dirty confirmation, JS-free multipart fallback, owner edit/remove, authenticated media delivery and permanent cleanup are exercised. Source screenshot was loaded and visually inspected; desktop and 320/390px browser screenshots were also inspected.

No production content was seeded, no real account/progress/join date changed, and no production migration/restart was run by the implementation worker. Production listener 8080/PID 85519 was inspected only; 8081 was not touched. Parent/operator owns backup and deployment.

## Actual verification

| Command / suite | Observed result | Evidence |
|---|---|---|
| `cd appworks && .venv/bin/python -m pytest -q` | **235 passed**, 47.67s | `evidence/composer-backend-tests.txt` |
| `cd courses/scale-lab && npm test` | **21 passed**, 0 failed | `evidence/composer-course-node-tests.txt` |
| `cd courses/scale-lab && npm run test:e2e` | **16 passed** | `evidence/composer-course-browser.txt` |
| `python3 scripts/courses.py validate` | `OK scale-lab: /courses/scale-lab/` | Actual terminal output; no course rebuild needed/performed |
| `CLASSROOM_QA_URL=http://127.0.0.1:8101 node scripts/browser-verify.mjs` | Pass: register/login, protected assets, interactive course, return/deep route, mobile/logout | `evidence/composer-account-browser.txt`, `platform-browser.json` |
| `node scripts/composer-browser-verify.mjs` | **11 grouped checks passed**, no page errors or external requests | `evidence/composer-browser.json`, `composer-browser-run.txt` |
| Real QA process stop + same DB `--resume`, then `node scripts/composer-restart-verify.mjs` | Pass: post/poll/files persist, cancel reset, mobile 320/390, 44px toolbar, signature rejection, protected media, no-JS editor | `evidence/composer-restart.json`, `composer-restart-run.txt` |
| `node scripts/community-browser-verify.mjs` | **16 grouped checks passed** | `evidence/community-browser.json`, `composer-community-regression.txt` |
| Community card, edge and moderation browser scripts | All pass | `community-card-browser.json`, `community-edge-browser.json`, `community-moderation-browser.json` |
| Legacy Community QA process restart + restart script | Pass: session/post/pin/comment deletion persistence | `community-restart.json` |

No frontend course source or dist changed; running a course build would unnecessarily replace published output. Existing integrated course output was validated and exercised through the real authenticated server; standalone regression uses the existing Vite test server on 4175.

## Observed RED → GREEN slices

Each following RED was run before its corresponding implementation/fix; these are actual failing outputs, not invented examples:

- `composer-red-links.txt`: structured URL submission returned 400 rather than 303; implemented bounded safe links/video-provider validation and cards.
- `composer-red-files.txt`: attachment/GIF submission rejected and large file hit old request cap; implemented private upload validation/re-encoding/storage/delivery/cleanup and per-route multipart override. This original log has a large pytest bytes parameter ID; later tests use compact IDs.
- `composer-red-polls.txt`: poll submission returned 400; implemented schema, validation, atomic vote/change and structural lock.
- `composer-red-ui.txt`: missing composer/dialog controls; implemented modular form/style/script templates.
- `composer-red-nonce.txt`: nonce submission rejected; implemented per-author unique retry key and dedup-before-storage behavior.
- `composer-red-draft.txt`: validation lost URL/poll/existing-file state; retained escaped fields and current attachments.
- `composer-red-cancel.txt`: real browser found an attachment removal indicator survived Cancel; fixed reset and re-ran browser GREEN.
- `composer-red-vote-rate.txt`: 429 lacked Retry-After; added the same 600-second header as other Community limits and verified full-suite GREEN.

Boundary/security coverage added after slices is explicitly regression coverage: actual 5 MiB acceptance, oversized multipart 413, unrelated 16 KiB limit, fake MIME/signature, SVG/invalid UTF-8, GIF frame bomb and APNG rejection, trailing script stripping, injected DB-failure file rollback, cross-account file/poll mutation rejection, parent-existence delivery, poll duplicates/invalid options, concurrent upload nonce/votes, CSRF/origin/guest checks, rate retries, Activity unchanged and factory restart persistence. Full backend suite includes existing account/photo/course/community behavior.

## Browser evidence

- `evidence/composer-empty-desktop.png`: real dialog, author, title/body, six tools, category and disabled post.
- `composer-filled-desktop.png`, `composer-filled-mobile-320.png`, `composer-filled-mobile-390.png`: own selected image/GIF/document, links and poll.
- `composer-empty-mobile-320.png`, `composer-empty-mobile-390.png`, `composer-footer-mobile-320.png`, `composer-footer-mobile-390.png`: responsive tools and actions; narrow toolbar wraps rather than clipping.
- `composer-detail-desktop.png`, `composer-detail-mobile-320.png`, `composer-detail-mobile-390.png`: persisted poll, safe external cards and retained media after edit.

Browser flow uploads a QA PNG, own animated GIF and UTF-8 document; removes/re-adds a preview; adds emoji/link/video/poll; posts escaped script-like text; checks zero third-party requests; fetches authenticated bytes/headers; uses a second member to vote/change/like/comment; edits/removes a stored attachment; rejects unsupported video while retaining draft; confirms deletion and checks private directory count. Separate restart tests verify byte delivery, guest redirect, no-JS form and canceled removal restoration.

## Files and deployment delta

Backend modified: `appworks/app.py`, `appworks/community.py`. New modules: `appworks/community_media.py`, `appworks/community_polls.py`.

Templates modified: `community.html`, `community-post.html`. Added: `community-extras.html`, `community-composer.html`, `community-composer-style.html`, `community-composer-script.html`.

Tests/scripts: added `tests/test_composer.py`, `tests/test_composer_security.py`, `scripts/composer-qa-server.py`, `composer-browser-verify.mjs`, `composer-restart-verify.mjs`; updated legacy community/edge browser scripts to explicitly choose a category now that the default is a prompt. Updated root README and Community contract.

Schema: additive post link_url/video_url/nonce columns, unique user/nonce index, private attachments table/index, poll table and unique per-member votes table. No dependency changes; existing pinned Pillow 12.3.0 reused. CSP unchanged; there are no embeds or extra third-party origins. Storage config `COMMUNITY_UPLOAD_DIR` / env `APPWORKS_COMMUNITY_UPLOAD_DIR`, default beside the DB in `community-uploads`. Back up DB and private file directories together before parent restarts production.

## Limitations / honest boundaries

- PDF is signature-checked and force-downloaded, not parsed/sanitized or virus scanned. No arbitrary file types or video file hosting.
- Video is a safe outbound YouTube/Vimeo card, not inline playback. No external preview scraping/GIF service.
- GIF time checking is cooperative between bounded frames, not a hard subprocess timeout. Image decode/format/frame/pixel/byte limits are enforced.
- No crash-recovery garbage collector: a process crash between disk and DB commit can leave an unreferenced private file. Normal errors and deletes are transactionally cleaned and tested.
- Server validation remains authoritative; native browser validity does not pre-validate every provider/security rule. Invalid server submissions explain file reselection.
- QA is local Chromium, not a cross-browser production certification. The workspace resolves git to a home-level repository rather than a dedicated project repo; no broad git operations or commit were performed.
