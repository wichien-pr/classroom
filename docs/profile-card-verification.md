# Profile card / editor verification

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`.

## ผลที่ตรวจจริง

| Suite / command | Result |
|---|---|
| `cd appworks && .venv/bin/python -m pytest -q` | **158 passed**, 26.05s; `evidence/profile-card-backend-tests.txt` |
| `cd courses/scale-lab && npm test` | **21 passed**, 0 failed; `evidence/profile-card-node-tests.txt` |
| `cd courses/scale-lab && npm run test:e2e` | **16 passed**, 12.3s; `courses/scale-lab/evidence/browser-results.json` |
| `node scripts/profile-card-browser-verify.mjs` | **12 named checks passed** on isolated 8097; `evidence/profile-card-browser.json`; no page/console errors |
| `node scripts/browser-verify.mjs` | Passed on isolated 8093; `evidence/platform-browser.json` |
| `node scripts/progress-browser-verify.mjs` | Passed on isolated 8093; `evidence/account-progress-browser.json` |
| `node scripts/profile-browser-verify.mjs` | Passed on isolated 8096; `evidence/profile-browser.json` |
| `node scripts/leaderboards-browser-verify.mjs` | Passed on isolated 8095; `evidence/leaderboards-browser.json` |
| `python3 scripts/courses.py validate` | `OK scale-lab: /courses/scale-lab/` |

Existing custom integration runners report scenarios as booleans, not pytest-style test counts; no invented aggregate count is attached to them. No course source or dist was changed/rebuilt. Standalone browser tests use Vite dev on 4175, so the existing integrated dist was not overwritten; integrated browser tests exercised its actual JS/CSS responses (200).

## TDD / coverage

New file `appworks/tests/test_profile_card.py`: **38 cases** within the full backend suite. Observed RED→GREEN slices:
1. Registration UTC timestamp and legacy-null/default-handle migration: 2 expected missing-field failures, then 2 passed.
2. Edit persistence/normalization/escaped rendering/restart: missing endpoint 404, then 3 passed.
3. Validation, duplicate/unknown fields, bounds, reserved handles and collision/input preservation: 19 expected failures, then 22 passed.
4. Authenticated throttled activity excluding anonymous/assets/invalid requests: missing activity failure, then 23 passed.
5. Existing threshold-derived band progress, L8/L9 semantics, private member card and own-edit links: 15 expected failures, then full backend 158 passed.

Existing account-photo suite verifies decoding/metadata stripping, upload/removal, route-specific limits, safe paths, transaction cleanup, ownership, CSRF/Origin, restart and shared avatar behavior. Auth/course/progress/exam/leaderboard regression suites also passed. New edit tests ensure timestamp/email/password/photo fields cannot be overwritten; only name/username/bio persist. Timestamp migration tests use temporary legacy SQLite, never production.

## Real browser / visual evidence

New browser runner verifies registration, edit/reload, header and leaderboard changes, escaped script text, username normalization, collision error with retained input, own edit only, private members, uploaded avatar preview/persistence/removal, initial fallback, relative Thai time advancing without polling, legacy joined fallback, half-filled real band and L8/L9 states.

Screenshots inspected directly:
- `evidence/profile-card-desktop.png`: white rounded card, large avatar/ring, overlapping level badge, title/caption/help, name/handle/bio, dates and edit button. Synthetic robot is an explicit QA image; displayed `<script>` in bio is the XSS escaping test, not executable markup.
- `evidence/profile-card-mobile-320.png`, `profile-card-mobile-390.png`: no horizontal overflow; card and editor link stay within viewport; photo panel stacks below.
- `evidence/profile-card-editor-mobile-320.png`, `profile-card-editor-mobile-390.png`: labeled fields, help and save/cancel controls are visible and usable.
- `evidence/profile-card-editor.png`.
- `evidence/profile-card-legacy-half-ring.png`: 2 whole synthetic QA courses → Level 2, 1/2 ring, 1 remaining; no fabricated joined date and no other-user editor.
- `evidence/profile-card-level8.png`, `profile-card-level9.png`: pending ≥95% exam / maximum achievement respectively.

Initial browser run exposed a test-clock setup issue (clock installed after timers existed), not a production date bug. The runner now installs Playwright clock before navigation; the relative-time check passes. Unique per-run handles make subsequent QA runs repeatable.

## Files / dependencies / migration

Modified backend: `appworks/app.py`, `profiles.py`, `achievements.py`.
Templates: modified `profile.html`, `profile-style.html`, `leaderboards.html`; added `profile-card.html`, `profile-edit.html`.
Added tests and QA: `appworks/tests/test_profile_card.py`, `scripts/profile-card-qa-server.py`, `scripts/profile-card-browser-verify.mjs`.
Updated `README.md`, `docs/profiles-contract.md`; added this report and evidence.

No dependencies added. Existing Pillow/photo processing remains unchanged. Additive migration adds username/bio/joined_at/last_active_at, a case-insensitive unique username index and a default-handle trigger. Defaults are stable `member-<id>` and empty bio. Legacy joined/activity timestamps stay NULL; only actual new registration/request activity supplies real server time. See contract for validation, reserved handles, activity throttling and ring semantics.

## Production handoff / limits

**Production SQLite was not opened/migrated and real account fields were not edited by this work. Production PID 14873 on 8080 was only inspected, never signalled/restarted; 8081 was untouched.** Parent/operator must back up SQLite using the backup API, verify backup integrity, preserve existing photo storage, then restart the production backend so the new template/backend versions are loaded together. Do not use QA databases or synthetic course fixtures as production. QA launchers use fresh evidence directories and separate photo storage; all QA-only processes started here are stopped before handoff.

No course rebuild is necessary for this server-rendered feature. After restart, verify guest redirects and authenticated profile/header/leaderboard/photo rendering. Usernames and bios are member-visible, not public. Last active is recent authenticated request activity, **not live presence**; passive tabs do not heartbeat, and another member's updated timestamp requires reload. L1–L8 remain curriculum-dependent; L9 permanent. Real catalog still has too few courses to reach L8 until legitimate courses are added. There are no followers/following, contributions or invented points/titles.
