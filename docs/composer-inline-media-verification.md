# Inline composer media verification

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`

## Delivered

Large square image/GIF previews beneath the plain-text body, up to 420px desktop, plus a matching dashed add tile. Existing edit attachments share the gallery; documents remain filename cards. Add appends, identical local selections are ignored, removal updates the multipart payload, and Cancel restores retained attachment state while clearing new selections. Private endpoints, server validation, links, polls and emoji remain unchanged. The sticky footer includes title/body/category guidance. This is not an interleaved rich-text editor.

## TDD evidence

Actual Chromium failures before the corresponding implementation:

- `evidence/composer-inline-red.txt`: add-image button absent (`toBeVisible`, element not found).
- `evidence/composer-inline-green-new.txt`: new gallery/append/duplicate/remove/GIF/mobile-footer slice passed.
- `evidence/composer-inline-red-edit.txt`: expected 2 retained image previews inside the gallery, received 0.
- `evidence/composer-inline-red-helper.txt`: required-field helper absent (`toBeVisible`, element not found).
- `evidence/composer-inline-green.txt`: final inline browser journey passed.

A CSS `{#` sequence initially collided with Jinja comment syntax; fixed by separating the media-query brace from the selector. No production server was restarted to debug it.

## Actual final runs

| Command | Result | Output |
|---|---|---|
| `cd appworks && .venv/bin/python -m pytest -q` | **236 passed in 48.18s** | `evidence/composer-inline-backend.txt` |
| `node scripts/composer-inline-media-verify.mjs` | PASS, no page errors | `evidence/composer-inline-green.txt`, `composer-inline-browser.json` |
| `node scripts/composer-browser-verify.mjs` | **11 checks passed**, no page errors or external requests | `evidence/composer-inline-composer-regression.txt` |
| `node scripts/community-browser-verify.mjs` | **16 checks passed**, no page errors | `evidence/composer-inline-community-regression.txt` |
| `node scripts/community-card-browser-verify.mjs` | PASS: keyboard like/unlike, reload, selected color, focus, truthful empty comments and comment anchor | `evidence/composer-inline-card-regression.txt` |

Inline journey checks actual decoded local PNG/GIF images, desktop square size and location below body, add picker, append/deduplication, document removal, four-file capacity/add-tile disappearance, rejection of fifth/oversized files, live object-URL count after redraws, 44px controls, 320/390px no horizontal overflow and reachable submit, saved private images on edit, canceled removals restored, saved removal persisted, and invalid-provider draft retaining stored media while clearing new file selections and requesting reselection.

The existing Community browser script referenced the intentionally removed visible search panel. Updated that test to assert the panel is absent and exercise the retained query endpoint instead; no search UI was reintroduced.

## Screenshots inspected

- `evidence/composer-inline-single-desktop.png`: one decoded QA PNG with matching dashed add tile and bottom actions.
- `evidence/composer-inline-desktop.png`: selected PNG and GIF.
- `evidence/composer-inline-mobile-390.png`
- `evidence/composer-inline-mobile-320.png`
- `evidence/composer-inline-edit.png`: actual retained authenticated GIF with add tile.

Colored squares are the existing generated QA PNG/GIF fixture bytes, not placeholder previews or production photos. The square display uses cover cropping; uploaded content is not cropped by the composer. Mobile screenshots are full-page captures with the dialog scrolled so submit is visible; the body remains reachable by scrolling upward.

## Isolation and deployment handoff

Used `scripts/composer-qa-server.py` on 8101 and `scripts/community-qa-server.py` on 8100, each with newly isolated QA SQLite/upload paths recorded in their evidence JSON. Both worker-owned QA servers were stopped after verification. Final listener inspection still showed the untouched production **PID 6708 on 127.0.0.1:8080**; no QA listeners remained. No production posts, accounts, upload files, schema, Python backend or course output were changed.

Parent/operator owns production reload/restart: these template changes may remain cached until that happens. No course build or new migration is necessary. Do not rerun QA against production. Current scripts create real disposable QA records; the composer regression expects a fresh QA directory for its exact file-count assertion.
