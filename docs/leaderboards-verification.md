# Leaderboards + final exam verification

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`.

## Delivered

Authenticated `/leaderboards`, nine exact levels, current whole-course ranking, and Thai `/exam` UI. Generic course discovery; no Scale Lab branch in platform. L8 progress triggers automatic bank assembly, and pre-existing eligible users initialize when opening the exam. One question per current lesson from every completed course, randomized question/option order, immutable SQLite snapshot. Missing/invalid bank fails entire assembly with actionable course list. Server-owned grade uses integer comparison >=95%; no client scores, no empty-pass, no localStorage promotion. Transactional idempotent submission and permanent L9 achievement.

New private `courses/scale-lab/assessment.json`: 24 original Thai questions grounded in the twelve `src/lessons.js` teaching summaries. Two alternatives per lesson, three options each; keys vary. Kept out of public/dist. Future authors use the same contract without platform edits.

## Actual executions

- Full backend: `cd appworks && .venv/bin/python -m pytest -q` — **101 passed**, latest log `evidence/leaderboards-backend.txt`.
- Node course suite: `npm test` — **21 passed**.
- Standalone browser: `npm run test:e2e` — **16 passed**.
- Account browser: `npx playwright test -c playwright.account.config.js` — **6 passed**.
- Standalone `npm run build` succeeded, then integrated `python3 scripts/courses.py build` succeeded LAST. Vite 7.3.7, 10 modules; integrated JS `index-Bw4YYhdc.js`, CSS `index-gkDkSCzY.css`.
- Strict `python3 scripts/courses.py validate` — `OK scale-lab: /courses/scale-lab/`.
- Actual Flask/Waitress + SQLite browser integration on isolated **8095**: `browser-verify.mjs`, `progress-browser-verify.mjs`, `leaderboards-browser-verify.mjs`, `exam-errors-browser-verify.mjs` all passed. Guest protections, registration/login, assets 200, interaction, progress persistence/isolation, generic future course, mobile overflow, threshold fixtures, zero-completion member, 20-course exam coverage, fail/retry, exact **19/20 = 95%**, L9 and no page errors.
- Stopped only QA server and restarted it using the same QA SQLite and course root; `exam-restart-browser-verify.mjs` passed after fresh login: **19/20, passed, Level 9** persisted.

TDD vertical slices observed RED then GREEN for missing leaderboard endpoint/level boundaries; exam gate/assembly; grading/retry/persistence; authenticated navigation/pages; Scale Lab bank; automatic L8 progress generation. Later regression coverage includes malicious payloads, CSRF/Origin, account ownership, missing/invalid banks, concurrent create/submit, immutable bank snapshot, below95 failure, ties, current curriculum and name escaping. Boolean bank version regression failed (200 instead of 409), then strict integer version fixed it. Original all-A bank shortcut test failed, then varied authored keys fixed it. Visual inspection found CSS `display` overriding the `hidden` attribute: real browser showed hidden retry/new-attempt controls visible. Added explicit hidden rule and browser assertions; rerun passed. Regression/characterization tests that passed immediately are not claimed as RED cycles.

## Evidence

- `evidence/leaderboards-red.txt`: first observed RED output.
- `evidence/leaderboards-backend.txt`: final 101 passing backend tests.
- `evidence/leaderboards-browser.json`, `exam-errors-browser.json`, `exam-restart-browser.json`.
- `evidence/platform-browser.json`, `account-progress-browser.json`.
- Screenshots: `leaderboards-zero.png`, `leaderboards-desktop.png`, `leaderboards-mobile.png`, `exam-mobile.png`, `exam-failed.png`, `exam-passed.png`, `exam-unavailable.png`.
- `evidence/leaderboards-qa-server.json`: isolated DB/course paths. The saved password is only for explicitly synthetic QA accounts in that separate database, never production credentials.
- Desktop and passed-result screenshots were visually inspected after the CSS correction; clean layout, readable level grid/table, no extra retry button after passing. Mobile shows stacked profile, two-column levels, contained controls, and no horizontal overflow. Initial screenshot after viewport change had a compositor artifact; reload before capture fixed it.

Reference HTML read safely as text (scripts never executed); used profile + nine-level grid + ranking-card hierarchy, not original people's metrics or fictional weekly statistics. Reference SHA256 before and after: `161abad3e874b4b69f3043832be5a854f6fd6cbc7785971bbb75bc5a6a84e1b0`.

## Migration and deployment handoff

Only additive `CREATE TABLE IF NOT EXISTS exam_attempts`, partial unique `one_active_exam` index, and `level_achievements`; accounts, sessions and lesson_progress are not reset. Real server PID **76094**, cwd `appworks`, remained listening on 8080 throughout. It has **not** been restarted and therefore needs the parent's controlled restart to load Python changes. Back up real SQLite first. No real user account rows were seeded or modified. 8081 was not touched. All tests used fixture/QA SQLite; only Scale Lab remains in the real course root.

QA server was restarted for persistence verification on 8095, then its identified PID 2354 was stopped after verification. No 8095 listener remained. The real 8080 login still returned 200 and guest course request 303. QA is not production and must not replace the real database.

## Explicit limits

Current production catalog has only one real course, so L8 is correctly unreachable until 13 real courses exist. Completion is still self-reported learning progress, not proctored assessment. Final grades are server-owned, but assessment is open-book/unlimited-retry/no timer. Draft answers are not persisted. L1–L8 are current curriculum-derived; L9 is permanent. Active exam eligibility and course coverage freeze at creation; changes affect new retries. Existing 16 KiB body limit applies to large answer payloads. Bank content needs administrator educational review before deployment; schema validation is not a substitute for subject-matter review. No LLM generation, API keys, weekly rankings, email display or fake production members.
