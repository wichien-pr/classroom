# Profile photo editor relocation verification

## Result
- GET `/account/profile` is read-only: card, current photo, activity note and edit link; no upload/remove/preview controls.
- GET `/account/profile/edit` contains name/username/bio and separate photo upload/removal forms. No nested forms.
- Existing POST `/account/profile` remains compatible and retains authentication, session CSRF, Origin/Sec-Fetch-Site checks, strict fields, route-scoped size limits, decoding/metadata stripping and transactional cleanup.
- Photo success returns 303 to `/account/profile/edit?photo_saved=1`; invalid images (400), file oversize and body oversize (413) render the editor, preserving the stored photo and identity. Text validation/collision still preserves submitted values. Independent forms do not submit unsaved text with a photo; rejected oversized bodies are not reparsed.
- No migration, dependencies, course source changes or course build required. Production PID 30541 on 8080 was not stopped; 8081 and production records/uploads were not modified. Parent/operator must restart the production backend to load Python/template changes together.

## TDD and backend execution
1. Changed `test_photo_shared_ui_and_initials` to require absence of controls on view and presence on editor: RED `1 failed in 0.53s` at `id="photo" not in page`; after template move GREEN `1 passed in 0.49s`.
2. Added `test_photo_results_return_to_editor`: RED `1 failed in 0.49s` at old success redirect; implementation covers success/removal and 400/413 editor responses, plus retained photo.
3. `cd appworks && .venv/bin/python -m pytest -q`: **159 passed in 27.01s**. This includes image processing, auth/CSRF/origin, account isolation, text identity validation, storage failure/security and existing platform regressions.

## Real Chromium QA
Used a fresh isolated SQLite, private upload directory and synthetic courses under `evidence/profile-card-qa-*`; exact paths in `evidence/profile-card-qa-server.json`. No production fixture creation.

```sh
appworks/.venv/bin/python scripts/profile-card-qa-server.py --port 8098
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8098/login
# 200
CLASSROOM_QA_URL=http://127.0.0.1:8098 PROFILE_QA_INFO=profile-card-qa-server.json node scripts/profile-browser-verify.mjs
CLASSROOM_QA_URL=http://127.0.0.1:8098 node scripts/profile-card-browser-verify.mjs
```

Both runners passed. Photo runner exercised clicking Edit from read-only view, local preview/save, reload, invalid bytes, client oversize and actual 413 browser navigation with recovered editor, removal/reupload, retained image after errors, authenticated delivery, second account and logout. Mobile 320/390 px had no horizontal overflow. Card runner passed **12 checks**, including text save, collision retaining input, member privacy, real level rings and dates, mobile editor, removal restoring initials. No JavaScript page errors or unexpected console errors. Existing missing `/favicon.ico` 404 is explicitly recorded as a resource warning rather than hidden or treated as a profile failure; initial card runner failed on that warning before diagnostic classification.

Evidence:
- `evidence/profile-browser.json`
- `evidence/profile-card-browser.json`
- `evidence/profile-preview.png` — local preview on editor
- `evidence/profile-desktop.png` — saved editor
- `evidence/profile-invalid.png` and `profile-photo-oversize.png` — recovery UI
- `evidence/profile-card-desktop.png` — read-only profile with current photo
- `evidence/profile-photo-editor-mobile-320.png` and `profile-photo-editor-mobile-390.png`
- `evidence/profile-card-mobile-320.png` and `profile-card-mobile-390.png`

Visually inspected desktop card and 320 px photo editor: controls are confined to editor; card shows avatar and edit link; fields and actions wrap within the viewport.
