# Static course contract v1

Optional account-backed **Participation Score** is specified in [participation-contract.md](participation-contract.md): generic per-course GET/POST, manifest-allowlisted simulation operations, server-owned one-point events and idempotent event UUIDs. Its numeric score is separate from grades and Activity; opted-in completion requirements use persisted v2 participation evidence for qualification and exam eligibility. Scale Lab integrates all 12 simulations / 18 action definitions; standalone remains independent.

Account photos are platform-owned, not course assets. See [profile contract](profiles-contract.md) for authenticated delivery, per-route request limits, image validation and private storage. The leaderboard API adds boolean `photo_ref` indicating whether a thumbnail exists; it does not return private storage basenames. Existing course/progress/exam semantics are unchanged.


## Ownership
- Platform (`appworks`): registration/login/logout, SQLite, session authorization, manifest discovery and static delivery.
- Each `courses/<id>` owns its source, dependencies, assets, tests and build. No platform imports, shared database queries, or imports from another course. No credentials/tokens in URLs.
- Only administrator-reviewed first-party courses: all execute on the platform origin and are NOT isolated from platform endpoints. Never install untrusted course packages/build scripts.

## Manifest (`course.json`)
```json
{"id":"scale-lab","title":"Scale Lab","subtitle":"SYSTEM DESIGN / TH","enabled":true,"order":1,"delivery":"static","build_dir":"dist","entry":"index.html"}
```
ID matches directory and `[a-z0-9]+(?:-[a-z0-9]+)*`; unique by directory. `title`/`subtitle` are nonempty strings, HTML-escaped in catalog. `enabled` is a JSON boolean, `order` integer. Only `static` delivery and dedicated `dist` output are supported in v1 (not source directory or arbitrary build_dir). Entry must be relative HTML inside dist. No absolute/dot/traversal/hidden paths or symlink components. Missing enabled entry means unavailable. Invalid manifests do not crash catalog; strict CLI returns nonzero. No manifest = no course. Sort by order then ID.

## Delivery
All `/courses/<id>/` HTML and `/courses/<id>/<file>` assets require a live platform session; guests redirect 303 to `/login`. Disabled/unknown/unbuilt courses return 404 to authenticated users. Only files inside the resolved dist directory are served; manifest/source/database directories are not mounted. Do not put secrets, source maps, source code, or databases in dist/public: dist is a publishing boundary. Build/deploy directories must not be writable by web users; avoid swapping files during active requests, stop server for local rebuilds.
Existing files are served with MIME types. Safe extensionless client routes fall back to entry; missing assets or dotted paths return 404. Reserved missing `assets`, `src`, `node_modules` paths are not SPA routes. Scale Lab itself uses in-page lesson buttons; a deep URL loads the initial lesson, not a lesson-specific router.
Build assets using `/courses/<id>/` base, not `/assets/` or localhost dev URLs. Do not use document-relative asset links on deep routes. Preserve platform CSP/no-store/security headers; assets must be self-hosted.

## Optional UI integration
`VITE_CLASSROOM_URL` is a build-time optional same-origin path ending in `/`. Scale Lab renders a return link only when configured. The platform build script sets it to `/`. Default standalone dev/build has no return link and no dependency on platform availability. Never pass account credentials in configuration or query strings.

## Operator workflow / lessons
1. Inspect source and nested `.git` before relocation. Move the entire directory, not a copy that drops history. Hash original files and verify before edits; keep reference HTML and user DB untouched.
2. Run vertical behavior tests RED → GREEN for catalog/authenticated serving, then fail-closed validation/path boundaries, then optional navigation. Keep authentication regression tests.
3. Run standalone tests/build/browser suite before integrated build. Integrated build must be LAST because standalone build overwrites the same dist base.
4. Use isolated SQLite for real browser registration. Confirm process cwd before replacing port 8080; never touch unrelated ports. Verify guest redirect, login, assets, interactive lab, deep-route refresh, return navigation, mobile and logout. Save real network results/screenshots.
5. Set `PLAYWRIGHT_BROWSERS_PATH` before dynamically importing Playwright in custom Node runners; static imports initialize its registry too early.
6. Restart final server using the real existing DB after QA, not the isolated QA database. Do not rely on delegated child server lifetime.

## Optional account-backed progress (v1 extension)

Opt in by adding a nonempty `lessons` array to the manifest, for example:
```json
"lessons": ["request-flow", "capacity-planning"]
```
IDs must be unique strings, match `[a-z0-9]+(?:-[a-z0-9]+)*`, and be at most 80 characters. They are stable identifiers, not lesson positions or translated titles. Never reuse an ID for unrelated content. Scale Lab uses its existing unique `kind` keys (`flow`, `workload`, etc.) as permanent lesson IDs; reordering display lessons does not change saved completion. A unit test keeps its manifest and lesson keys aligned.

Omitting `lessons` preserves legacy delivery without tracking; the catalog says tracking is unavailable and the progress API returns 404. An explicitly empty/invalid list fails manifest validation. Enabled, valid, built courses only are accessible. No backend branching or template edits are needed for new courses.

### Generic same-origin API

`GET /api/courses/<course-id>/progress` returns:
```json
{"course_id":"example","completed":["request-flow"],"completed_count":1,"total":2,"csrf_token":"session-bound-token"}
```
`total` always comes from the current manifest; `completed` is the qualified IDs in manifest order (legacy courses use saved progress; combined courses use all three criteria below). Responses also include `criteria`: per-lesson `{manual,simulation,thinking}` booleans for combined courses, or `{}` for legacy courses. The catalog uses the same calculation. Removing a lesson hides its completion without deleting history; restoring that same ID restores completion. Adding lessons increases the denominator. Disable/remove a course to hide it, not to erase its records.

`POST` to the same endpoint with `Content-Type: application/json`, `X-CSRF-Token` from GET, and `{"lesson_id":"request-flow","manual":true}` records an explicit manual mark. Legacy payload `{"lesson_id":"request-flow"}` remains accepted but never creates a manual mark; it only adds legacy progress for the authenticated account. Response has the same shape as GET. Never supply a user ID. Unknown fields/types are rejected (400), unknown lesson/course or unavailable tracking returns 404. GET by a guest returns 401; POST without valid session CSRF returns 403 (an anonymous session with valid CSRF still returns 401). Foreign Origin and `Sec-Fetch-Site: cross-site` are rejected. Expired sessions must log in again. Existing Flask auth errors may be HTML; clients must check `response.ok` before parsing JSON. Responses are `no-store`; no CORS access is enabled.

```js
const endpoint = import.meta.env.VITE_CLASSROOM_PROGRESS_URL;
const loaded = await fetch(endpoint, {credentials: 'same-origin', cache: 'no-store'});
if (!loaded.ok) throw new Error('Load failed — retry or log in');
const state = await loaded.json();
// After a successful course-defined completion action:
const saved = await fetch(endpoint, {
  method: 'POST', credentials: 'same-origin',
  headers: {'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf_token},
  body: JSON.stringify({lesson_id: 'request-flow', manual: true})
});
if (!saved.ok) throw new Error('Save failed — retry or log in');
const confirmed = await saved.json();
```

The integrated builder sets `VITE_CLASSROOM_PROGRESS_URL=/api/courses/<id>/progress` only for opted-in courses (empty for others). It is a public endpoint path, not a credential. Non-Vite apps may implement the same API directly. Each course owns its adapter; `courses/scale-lab/src/progress.js` is an example with no platform imports. Await initial load before enabling completion, serialize writes to avoid out-of-order snapshots, capture the lesson ID before navigation, and render only server-confirmed completion. Show loading, load failure/retry and save failure/retry states explicitly. Never silently fall back to local storage when the account service fails. Concurrent tabs are additive on the server; reload to see other-tab/device updates (no push synchronization). Retry is safe even if a response was lost after commit.

### Scale Lab completion semantics

A prominent `ทำเครื่องหมายว่าเรียนจบ` button below the current lesson heading records an explicit manual marker through the generic API. Integrated correct quizzes never submit manual progress. Qualification additionally requires a persisted main-simulation action and any A OR B answer, correctness irrelevant. All three may happen in any order. Confirmed completion renders `✓ เรียนจบแล้ว`, survives reload/relogin, and follows the selected lesson. The count means lessons completed, not quizzes passed. Manual completion does not change quiz feedback or grade; merely opening, reading, navigating, or resetting a lesson never writes progress.

The control has an adjacent live status and load retry. Saves disable repeat actions synchronously; the captured lesson ID is retained across navigation. Failed saves leave the lesson incomplete and offer `ลองบันทึกอีกครั้ง` on that lesson, never silently importing local state. Standalone uses the existing browser-local progress and explicitly warns if storage is unavailable. Mobile uses a full-width button in the lesson content (scroll past navigation to the lesson).

### Combined lesson qualification (explicit opt-in)

Scale Lab declares `"completion_requirements": ["manual", "simulation", "thinking"]`.
This exact policy requires every declared lesson to allow at least one non-`check-your-thinking` simulation and both `quiz-answer-a` / `quiz-answer-b` under `check-your-thinking`. Invalid/incomplete declarations fail closed. Other course IDs use the same generic implementation: no Scale Lab server branch.

Each lesson qualifies only with all three persisted facts for the same account/course/lesson:
1. Explicit `manual:true` POST to progress (`lesson_manual_completion`).
2. At least one currently allowlisted non-thinking simulation award in `participation_awards_v2`.
3. At least one currently allowlisted A **or** B thinking award in v2. Correctness is irrelevant.

All current lessons must qualify before a course counts. Catalog, progress, levels and final-exam eligibility share the server calculation. Numeric participation totals cannot bypass it. This verifies recorded self-reports, not whether a person really studied; trusted clients can submit valid actions directly. No score/correct/qualified fields are accepted.

The manual-marker table is additive with `(user_id,course_id,lesson_id)` primary key and server `created_at`. No historical `lesson_progress` row is assumed manual, no v1 participation is backfilled, and no records/achievements are reset. L9 remains permanent. Legacy progress/Activity hooks remain historical records; participation itself does not create lesson Activity.

**Future courses without participation:** omit `completion_requirements` to preserve legacy progress-only semantics. They are not silently forced into impossible requirements. Authors must explicitly opt in and instrument both action kinds in every lesson before adopting combined qualification. Standalone Scale Lab retains local-only manual/correct-answer progress and cannot change account Level.

Deploy backend, manifest and integrated compiled client together after backup; restart performs the additive migration. Existing browser tabs must reload. Never reset production data. QA must use separate output trees (`--outDir`) and separate DBs, not live dist.

### Storage and limitations

The existing SQLite database gains only a `CREATE TABLE IF NOT EXISTS lesson_progress` table:
- `user_id INTEGER NOT NULL`, `course_id TEXT NOT NULL`, `lesson_id TEXT NOT NULL`
- `completed_at REAL NOT NULL` (server Unix time of first completion)
- composite primary key `(user_id, course_id, lesson_id)`; `INSERT OR IGNORE` makes repeated/concurrent completion idempotent without overwriting other lessons.

No users/sessions are reset or migrated. Back up the existing SQLite DB before deployments; restarting the Flask application creates the table. No uncomplete/reset endpoint, grading enforcement, certificate, percentage rounding, offline queue or automatic progress deletion is provided. Completion is client-reported learning progress, NOT a tamper-proof assessment. Trusted same-origin course code can access platform endpoints.

Standalone Scale Lab retains browser-local storage, which is not account-owned. Platform mode never reads or imports `scale-lab-progress`, because its owner is ambiguous; it also never writes account progress there. Local deployment durability depends on retaining/backing up the SQLite file. The adapter blocks completion during initial loading and saves; leaving the page before a response may require reload/retry.

### Isolated end-to-end verification

```sh
# From project root, after standalone tests/build then integrated build LAST:
appworks/.venv/bin/python scripts/progress-qa-server.py --port 8093
# Another terminal:
CLASSROOM_QA_URL=http://127.0.0.1:8093 node scripts/progress-browser-verify.mjs
CLASSROOM_QA_URL=http://127.0.0.1:8093 node scripts/browser-verify.mjs
```
The QA launcher creates a fresh `evidence/progress-qa-*/accounts.sqlite3`, copies the integrated Scale Lab build and a synthetic future-course fixture into a separate courses root. It never registers test accounts in the real DB or adds a QA course to the live catalog. `evidence/progress-qa-server.json` records paths. Stop only that QA process after testing. Do not touch port 8081. The real 8080 process must be restarted by its owner to load new Python code; a delegated worker's server is not a durable deployment.

Unit/API tests: `cd appworks && .venv/bin/python -m pytest -q`.

## Whole-course levels and private assessment bank v1

L1 is registration. L2–L8 require >=1,3,5,7,9,11,13 completed courses. A course counts only if it is currently discoverable (enabled, valid, built), has nonempty declared lessons and all current lessons qualify under the manifest's completion policy. Added lessons may lower L1–L8; disabled/deleted courses stop counting without deleting history. L9 is a permanent server-issued achievement; manual completion and localStorage never supply an exam grade. Ranking uses level descending, completed course count descending, then immutable user ID ascending. Names are escaped, emails never included in the leaderboard API. No invented weekly metrics.

Each course author owns `courses/<id>/assessment.json` **outside dist/public**:
```json
{"version":1,"questions":[{"id":"request-routing-1","lesson_id":"request-flow","prompt":"Which layer resolves the hostname?","options":[{"id":"dns","text":"DNS"},{"id":"db","text":"Database"}],"answer":"dns"}]}
```
One or more questions must cover **every current declared lesson**. IDs unique per bank, lowercase letters/digits/hyphens, 1–80 characters; option IDs unique per question; 2–6 nonempty options; correct answer must name an option. Prompt nonempty. Question fields are exactly the five shown. Administrator review is required; original Thai Scale Lab bank has two questions per lesson (24 total), grounded in `src/lessons.js`, with varied answer positions. Never include this JSON or answer keys in static builds. No imports from course code into Flask. The fixed filename is generic across all manifests; unavailable banks do not hide the course from ordinary study.

After an authenticated progress POST (or opted-in participation POST) commits, the platform attempts to assemble an exam if the user has >=13 completed courses and no previous attempt. Existing eligible accounts also initialize when opening `/exam` (the UI calls a CSRF-protected POST). It selects one random question per lesson in **every completed course**, shuffles question and option order, and retains option IDs so grading cannot use stale indexes. This is automatic assembly from reviewed banks, **not AI-generated new questions**. Any missing/invalid bank aborts the entire assembly with 409 and affected course IDs; saved learning progress remains intact. The exam page displays an actionable administrator instruction.

Creation stores an immutable private snapshot of the completed course set, questions, options and keys. Eligibility is captured at creation; later course/lesson/bank changes do not invalidate an active snapshot. New completed courses after creation enter the next retry, not the existing attempt. Failed attempts may be retried immediately without a limit; refresh reuses active attempt. Passing grants permanent L9. Draft answers are browser-memory only and lost on reload, as stated in UI. No correct keys or per-question correctness are returned, even after grading.

### APIs / security
- `GET /api/leaderboards`: authenticated members `{id,name,level,completed_courses,rank}`, current user ID and CSRF token.
- `GET /api/exam`: authenticated current eligibility/count, latest own attempt or null, and CSRF token.
- `POST /api/exam`: exactly `{}`; current L8 required; creates or reuses active/passed attempt. A previous failure permits a new attempt using current curriculum.
- `POST /api/exam/<id>/submit`: exactly `{"answers":{"course-id:question-id":"option-id"}}`. Own-attempt lookup only; exact set of questions and valid string options required. No score/correct flags accepted. Every POST uses existing session CSRF, Origin/Sec-Fetch-Site protections.
- Server checks `correct * 100 >= total * 95`, rejects empty exams, and never rounds for promotion. `BEGIN IMMEDIATE` serializes creation/submission; a partial unique index permits only one active attempt per user. Duplicate valid submissions return the first committed result; concurrent duplicate submissions award once.
- New additive tables: `exam_attempts(id,user_id,snapshot,status,correct,created,submitted)` and `level_achievements(user_id PRIMARY KEY,attempt_id,awarded)`. No destructive migration; existing SQLite must be backed up and retained across restarts. Snapshot and results persist across app recreation.

Limitations: unproctored learning assessment, unlimited retry, no time limit/certificate; manual course progress remains client-reported. Trusted same-origin course JS remains trusted. The existing 16 KiB request-body limit applies to exam submission (very large curricula need an explicitly reviewed limit increase). Do not publish the project root, QA evidence databases or private bank files through a static file server. Current live catalog has one real course, so L8 legitimately stays locked until at least 13 real courses exist. QA launcher seeds only its separate database/courses tree under evidence and labels fixture accounts QA.

Course tests: `npm test`, `npm run test:e2e`, and `npx playwright test -c playwright.account.config.js` from Scale Lab. The account UI suite intercepts network responses only to exercise load/save errors and navigation races; the separate integration runner uses actual Flask/SQLite and browser login. Evidence is under root `evidence/progress-tdd.txt`, `account-progress-browser.json`, `platform-browser.json`, and `account-progress-*.png`.
