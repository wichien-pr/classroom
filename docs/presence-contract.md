# Online member presence

## Contract

สมาชิกที่เข้าสู่ระบบเห็น **ออนไลน์ N** พร้อมรูปย่อสูงสุด 3 คน ข้าง Appworks Community ใน shared header ของ Classroom, Profile/editor, Leaderboards, Community และหน้าที่สืบทอด header เดียวกัน กดหรือใช้ Enter/Space เปิดรายชื่อ; Escape/ปุ่มปิดคืน focus ให้ปุ่มเปิด รายชื่อเป็นลิงก์ `/members/<id>` และไม่เผยอีเมล ไม่มี widget ในหน้า guest

- Online = authenticated session sent a heartbeat from a **visible document** strictly within the last **120 seconds**, and that session still exists, is unexpired and belongs to an existing user. Includes the viewing member. Unique by user ID across tabs and devices/sessions.
- Client sends on page load/visibility return, then every 30 seconds while visible. Hidden/closed pages stop; no unload deletion because another tab may share the session. A closed/hidden tab can linger for up to two minutes since its last **persisted** heartbeat. Browser timer throttling/network loss may cause earlier disappearance. Reopening becomes visible again after a successful heartbeat.
- This approximates page visibility, **not human attention, keyboard activity or actual study**. A visible idle page remains online. Trusted first-party clients can send heartbeats directly; this is not anti-bot evidence.
- Logout removes that session immediately from subsequent snapshots; another active session preserves the member. Password-reset session revocation and session expiry are respected through a live join. In-flight API requests revalidate authentication inside the transaction.
- Presence never calls learning Activity or updates `users.last_active_at`. The existing separate page-entry/login behavior remains unchanged. Polls do not award participation/progress.

## API and persistence

`GET /api/presence?page=1`: authenticated snapshot, no presence write. `POST /api/presence?page=1`: exactly `{}` JSON, existing session-bound `X-CSRF-Token` and Origin/Sec-Fetch-Site protection. Response:

```json
{"total":1,"page":1,"pages":1,"members":[{"id":1,"name":"Display name","username":"member-1","photo_url":null,"profile_url":"/members/1"}],"csrf_token":"session-bound"}
```

Never return emails, session hashes, last-seen timestamps or private photo references. All responses inherit `Cache-Control: no-store`. Invalid page/body returns 400, guests 401 (unauthenticated POST can be rejected earlier by shared CSRF middleware with 403).

Additive `member_presence(session_hash TEXT PRIMARY KEY, seen_at REAL NOT NULL)` plus `presence_seen` index. Does not alter sessions/users or existing learning records. Read-before-write coalescing and a guarded UPSERT permit **at most one persisted timestamp update per session per 25 seconds**, including concurrent tabs; excess heartbeats return a current snapshot without another update (not HTTP 429). Cleanup of timed-out presence rows runs only with permitted writes; session joins exclude revoked sessions even before cleanup. Recheck session under write lock prevents logout/reset resurrection. Reads use a transaction so total and page share one SQLite snapshot/time cutoff.

20 members/page, deterministic user-ID ordering; out-of-range pages clamp to last page. Every page request is a fresh snapshot, not a frozen multi-page roster: online changes between pages can alter membership/page count. Avatar previews correspond to the current displayed page. Client clears counts/avatars/list on failure and shows **ตรวจสอบออนไลน์ไม่ได้**, never a fabricated zero. Retry is offered for network/server failure; expired authentication requests relogin and stops polling. Empty successful snapshots genuinely show zero.

## Course integration / deployment

`presence.py` decorates authenticated successful course HTML **responses** with a deferred first-party heartbeat script. Does not inject a header into the course or rewrite any dist/manifest/curriculum file. Non-HTML assets are untouched. Course page refresh is needed after deployment. Script delivered via authenticated `/platform/presence.js`.

The two shared template entry points gate the widget with `config.PRESENCE_ENABLED`, set only by the new backend install. Already-running old backend processes therefore do not acquire a broken widget from template reload. This is not a deployment feature flag; normal new startup enables it.

**Owner deployment required:** back up SQLite with SQLite backup API; preserve existing uploads. Restart only the identified production `service:create_app` process after review, then confirm schema and authenticated header. No dependencies, course build or environment changes required. Deploy `appworks/presence.py`, `appworks/platform-assets/presence.js`, the two new partials, app install hook and two shared template changes together. Do not delete session/progress data. No production deployment performed by this task.

## Local deployment

Deployed locally at `http://localhost:8080` after user approval. SQLite backup and private upload copies are in `backups/presence-20261022T030456Z`. All 24 preexisting tables matched the backup immediately after startup, before guest health checks; integrity check passed and the additive presence table exists. Login returned 200, guest presence API 401 and guest course 303. Authenticated production UI was not rerun; the browser verification below uses isolated QA. Reload existing tabs. Deployment evidence is local-only at `evidence/presence/deployment.json`.

## Actual verification (isolated only)

- Full backend: **413 passed in 95.29s**; log `evidence/presence/backend-tests.txt`. Includes 10 presence test cases: initial privacy, persistent coalescing/CSRF, pagination, logout/multi-session/time cutoff/no activity, shared header/course response without dist writes, in-flight GET/POST revocation, 24 concurrent heartbeats + app recreation, invalid other sessions, old-process template gate. Two existing course tests explicitly expect the new response decoration while preserving the original course body and assets checks.
- TDD observed REDs: missing API 404; unthrottled timestamp update; unbounded page list; missing shared widget; revoked in-flight GET returning 200. Each corresponding implementation rerun passed. Later concurrency/session/gate tests are additional regression coverage, not claimed as new RED cycles.
- Actual Chromium/Playwright: **14 checks passed**, no page errors, `evidence/presence/browser.json`. Real private fixture logins, two tabs/independent sessions, real photo/fallback, escaped names, member links/shared routes, 320/390/1440 layouts, Enter/Escape, 21-member pagination, logout, real 120-second closed-tab expiry, served compiled course heartbeat, server-error/expired-auth states. Hidden/visible event/timer behavior used a controlled browser visibility property and Playwright clock; not claimed as an OS background-tab experiment.
- Actual QA process restart on same DB: existing authenticated browser cookie survived; heartbeat/member present. `evidence/presence/restart.json`, `after-restart.png`. Browser state stays in the private temporary directory, never the repository/evidence.
- Browser testing caught a real focusout bug: disabling pagination controls briefly moved focus outside the widget and closed it. Removed automatic focusout dismissal; outside-click, Escape and explicit close remain. Reran full browser suite successfully. Initial photo QA fixture had the wrong reference length; corrected fixture to the existing 48-hex photo contract before successful run.
- Screenshots (desktop/mobile popovers, header, error, pagination and restart visually reviewed): `header-desktop.png`, `popover-desktop.png`, `header-320.png`, `header-390.png`, `popover-320.png`, `popover-390.png`, `member-profile.png`, `course-presence.png`, `pagination.png`, `unavailable.png`, `after-restart.png`, all under `evidence/presence/`.
- QA-only accounts preseeded directly in an isolated temporary SQLite DB (no registration/email bypass added). Separate private profile/community directories and copied existing compiled course tree; no production accounts/data/email or secrets accessed. QA on 8134 only; production PID 91656/8080 and unrelated 8081 untouched. QA stopped after verification.

Commands from repository root:

```sh
(cd appworks && .venv/bin/python -m pytest -q)
appworks/.venv/bin/python scripts/presence-qa-server.py --port 8134
# In another terminal, after curl readiness:
node scripts/presence-browser-verify.mjs
node scripts/presence-restart-verify.mjs --prepare
# Identify/stop only the QA PID reported in evidence/presence/server.json, then:
appworks/.venv/bin/python scripts/presence-qa-server.py --port 8134 --resume
node scripts/presence-restart-verify.mjs
node scripts/presence-mobile-capture.mjs
git diff --check
```

Final mobile captures use fresh 320/390 contexts through `presence-mobile-capture.mjs`: resizing the desktop Chromium viewport produced a screenshot compositing artifact (DOM still had one header and no overflow). Fresh contexts produced clean captures; their member count is a later actual snapshot, not necessarily the earlier three-member test phase.

Run the full browser runner with a fresh QA database; `--resume` is for the separate restart verifier. Evidence is ignored by repository policy but exists on disk. No commits/pushes, builds or production restarts.
