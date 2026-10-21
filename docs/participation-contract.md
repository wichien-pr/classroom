# Participation Score v2 — first participation per button

Participation points are not grades or levels and do not write learning Activity. For courses explicitly opting into combined completion, persisted v2 awards also provide simulation/thinking evidence to qualify lessons for levels and exam eligibility. Each stable button earns one server-owned point only once per account/course/lesson/interaction. Repeated clicks, new UUIDs, concurrent devices, reset, reload and relogin earn zero. The two original choices are separate stable buttons regardless of their randomized visual A/B positions; correctness does not determine participation. This is self-reported participation, not anti-cheat grading.

## User-approved fresh scoring era

The user explicitly chose to restart Participation scores from zero for everyone while retaining old history and lesson progress. Startup creates empty `participation_awards_v2` and `participation_requests_v2` tables if absent. **No legacy backfill, deletion, regrading, or update occurs.** `participation_events` is retained as historical data and is no longer written or summed by this API. Old quiz rows did not record choices: do not invent A/B attribution. All v2 buttons start eligible, including those used under v1. This is a one-time transition, not a reset on every restart. Existing v2 awards always persist. Progress, accounts, Activity and achievements are untouched.

## Generic opt-in and stable identity

A valid enabled built course declares `lessons` and `participation` in `course.json`:
```json
{"lessons":["intro"],"participation":{"intro":{"demo":["run"],"check-your-thinking":["quiz-answer-a","quiz-answer-b"]}}}
```
Object keys are lesson → interaction → allowed actions; wire field remains `simulation_id`. IDs are stable lowercase hyphenated identifiers ≤80 characters. Manifest validation rejects unknown lessons, duplicate/empty actions and malformed definitions. Never rename/recycle existing IDs casually: new IDs create new scoring eligibility. Scale Lab has 16 simulation actions plus 22 quiz buttons across 11 lessons (38 active award definitions). LAB06 retires Session, removing its two simulation actions and two thinking buttons from the active allowlist without deleting historical awards or receipts. LAB08 retires Queue and adds genuinely new `stateless-web / stateless-web / web-request` plus new lesson-scoped original A/B choices. One meaningful request operation replaces one worker operation, so totals remain 16 simulation + 22 thinking = 38; setup/reset/navigation do not score. Queue and Session history, old receipts and frozen exam snapshots are retained without reinterpretation, backfill or automatic completion. Old awards cannot qualify the new lesson. Manifest and private-bank reads are dynamic: editing these live source files changes current qualification and future exam assembly even before dist is replaced. Deploy manifest, bank and compiled client together; the no-dist-write QA boundary is not complete production semantic isolation. Existing account scores still include those historical awards; 38 is not a cap on historical account scores. Removed Session evidence never qualifies Cache. Cache retains its original three actions and original A/B choice identities. `quiz-answer-a` identifies original `answers[0]`; `quiz-answer-b` identifies original `answers[1]`. These durable identifiers are NOT visual A/B labels. Scale Lab randomizes the two choices once per lesson per page load (both permutations possible), before rendering; navigation and simulation reset preserve that order and selection. Display labels A/B follow position, while `data-answer`, correctness, selection, captured retries and award actions follow original choice identity. Reload may reorder choices but never creates new scoring eligibility. Source answer arrays and manifest IDs must not be reordered/renamed as a presentation change. Old ambiguous `quiz-answer` is no longer accepted by the Scale Lab manifest; refresh old open clients after deployment.

## API and persistence

Authenticated `GET /api/courses/<id>/participation` returns `{course_id,score,csrf_token}`. Score sums only this user's course rows in `participation_awards_v2`.

POST same endpoint with JSON and session-bound `X-CSRF-Token`:
```json
{"lesson_id":"flow","simulation_id":"check-your-thinking","action":"quiz-answer-a","event_id":"00000000-0000-4000-8000-000000000001"}
```
Exact fields only, canonical lowercase UUID-v4, manifest-validated lesson/simulation/action. No client user ID, points, timestamp or correctness accepted. Same-origin/session/CSRF/Fetch Metadata protections and 16 KiB body limit remain. Unknown action/malformed payload 400; unavailable course 404; guest GET 401; CSRF failures 403.

POST returns GET snapshot plus `awarded` (whether this request added a point) and `reason`: `awarded` or `already_counted`. Duplicate button and exact request retry are successful HTTP 200 with no new point, not errors. Reusing an accepted UUID with a different permitted payload returns 409, including UUIDs from zero-point submissions. Retry the same entire captured payload after transport failure. Idempotency is scoped to v2, user and course; legacy UUIDs are not imported.

`BEGIN IMMEDIATE` serializes request lookup, **persisted semantic award lookup before writing**, rate check, award/receipt insert and score snapshot. `participation_awards_v2` primary key `(user_id,course_id,lesson_id,simulation_id,action)` enforces uniqueness even if API checking is bypassed. It also has unique `(user_id,course_id,event_id)` and points CHECK=1. `participation_requests_v2` stores immutable payload receipts under `(user_id,course_id,event_id)`, including zero-point requests. Rate limit is 60 new awards per member across courses per rolling 60 seconds, persistent across restarts; 429 includes Retry-After 60. Duplicates bypass award quota. Receipt growth/invalid traffic is not separately throttled; no general abuse prevention claim.

## UI and exclusions

Display only server-confirmed score, with explicit load/save/retry errors and successful “ปุ่มนี้นับคะแนนแล้ว · กดซ้ำไม่เพิ่มคะแนน” guidance. The server remains authoritative; no localStorage dedup or optimistic +1. During loading/save/retry, shared guards disable participation and quiz actions; integrated correct quizzes do not mark manual completion. After participation saves, the client refreshes server qualification through a serialized progress read; failures expose explicit retry. Captured UUID/lesson/action survive navigation for in-memory retries. Reload may discard an uncommitted pending operation. No offline queue or live cross-tab score push.

Each actual simulation button may be used repeatedly for learning but awards once. Invalid input, exhausted flow/worker, navigation, reset, manual completion, page opening and help never award. Selection feedback survives navigation/reset in page memory, not reload. Standalone does not call participation APIs or claim account points. Community and existing hidden platform navigation remain unchanged.

## Deployment and verification

Not deployed by this worker. Operator must back up SQLite with its backup API and retain uploads, stop only identified Classroom process, build integrated course output (`python3 scripts/courses.py build` and `validate`), and restart backend against the same database. Backend, manifest and compiled client must deploy together; old clients need reload. Do not touch 8081. No dependency addition. Migration is additive and automatically starts the user-approved fresh v2 score while preserving historical rows. Rollback to old code would expose old scoring semantics and must not be presented as v2.

QA uses `scripts/participation-qa-server.py --port 8116 --info evidence/participation-v2/participation-qa-server.json` and `PARTICIPATION_QA_EVIDENCE=evidence/participation-v2/ node scripts/participation-browser-verify.mjs`, then launcher `--resume` and browser `--restart`. QA builds isolated dist and databases; do not publish evidence/session files. Prior v1 verification documents are historical and superseded by this contract.

## LAB08 active definitions

The active count remains programmatically verified at 38 = 16 simulation actions + 22 thinking choices over 11 lessons. Queue’s `queue / work` and its thinking choices are retired, not renamed or mapped. New `stateless-web / stateless-web / web-request` represents an actual authenticated-profile request attempt; failed requests are meaningful too. Changing the scenario, selected target, sticky routing, web availability or store availability, plus reset/navigation, is unscored. Original new-lesson answer 0 stays wrong (`quiz-answer-a`), answer 1 stays correct (`quiz-answer-b`) in either display permutation. Old Queue/Session receipts and awards remain immutable and do not qualify the replacement. See [LAB08 verification](lab08-verification.md).

## LAB10 current active definitions

Supersedes earlier active totals: **39 definitions = 17 simulation + 22 thinking** across 11 lessons. Retire `region / region / decision` and its thinking choices without deleting historical awards. Add `message-queue / message-queue / enqueue-jobs` and `process-jobs`, plus lesson-scoped original A/B choices. Queue enqueue scores only when accepted; worker processing scores only when at least one job completes. Full/empty/unavailable no-ops, setup, worker scaling and reset do not submit participation. Historical `queue` awards do not qualify this new namespace. See [LAB10 verification](lab10-verification.md).

## LAB11 active definitions

Current total: **41 definitions = 19 simulation + 22 thinking** over 11 lessons. Retire `shard / shard / shard` and its lesson-scoped thinking allowlist without deleting historical receipts/awards. Add `logging-operations / logging-operations / inspect-logs`, `inspect-metrics`, and `run-pipeline`, plus its original thinking A/B identities. Inspection is meaningful even with zero matching errors. Pipeline steps score only when advancing; failed-test/completed terminal repeats submit nothing. Setup/reset are unscored. `observe` evidence is not transferred. See [LAB11 verification](lab11-verification.md).
