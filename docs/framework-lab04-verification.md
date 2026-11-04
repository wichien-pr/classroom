# Framework LAB04 — implementation and verification

## สถานะปัจจุบัน

Sync canonical และ deploy LAB04 แล้วบน HTTPS localhost ดู [deployment verification](framework-lab04-deployment.md). ไม่ commit/push. ข้อความด้านล่างเป็นหลักฐานช่วง implementation ก่อนอนุญาต deploy ไม่ใช่สถานะ runtime ปัจจุบัน

## ประวัติ implementation: สถานะและขอบเขต

- Implemented only in `/Users/prommeesee/.hermes/cache/scratch/classroom-lab04` (detached worktree from `3cfd51b`). **ยังไม่ sync canonical / deploy / commit / push**.
- Copied approved uncommitted `Framework Lab` manifest rename and `appworks/tests/test_empty_course.py` card-title regression from canonical before editing. These inherited changes are not a new deployment.
- Canonical `/Users/prommeesee/projects/classroom`, live HTTPS Docker and `classroom-accounts-20261022` were not written to, restarted or mounted for QA. No production accounts were read/copied/reset. The untracked `~$Step3.docx` was not touched.
- Source PDF remains in canonical, ignored and unmodified. SHA-256 verification of 22 canonical manifest/bank/dist/PDF files matches the initial snapshot. See `evidence/lab04/canonical-hashes.json` and `preservation-report.json`.

## Source coverage (developer-only)

Rendered and visually inspected both pages of `Step4.pdf` (`evidence/lab04/source-1.png`, `source-2.png`). Both are prose/bullet lists, with no diagrams or tables.

| Source | Lesson coverage |
| --- | --- |
| Page 1: follow-up conversation, bottlenecks and improvements, never claim perfection | Intro, summary/limitations comparison, bottleneck discussion |
| Page 1: recap multiple approaches | Recap explanation and checklist |
| Page 1: server failure / network loss | Failure topic with Thai definitions |
| Page 1: metrics / error logs / rollout | Operations topic with Thai definitions |
| Page 1: 1 million → 10 million users | Explicit hypothetical growth prompt, not measured capacity; exercise rejects an unsupported guarantee |
| Page 1: refinements with more time | Refinement topic and checklist |
| Page 1 Dos: clarify requirements/assumptions; no universal best design; communicate; alternatives; blueprint agreement then critical components | “ควรทำตลอดการออกแบบ” |
| Page 2 Dos: teamwork and persistence | Collaborate with customer; ask for help and revise rather than give up |
| Page 2 Don'ts: unprepared, jump to solution, premature detail, no hints, silence, assume done without feedback | “สิ่งที่ควรหลีกเลี่ยง” and early/regular feedback through customer agreement |

The decision checklist is a labeled supplementary teaching exercise, not a source diagram or performance simulator. Latency/error-rate measurement and rollback are labeled supplementary examples under details. Learner UI has no PDF filename, page reference or source attribution. Uses “ลูกค้า”.

## Identity and history

- New lesson/simulation `framework-wrap-up`; main action `review-wrap-up`.
- Durable thinking choices remain original index 0 → `quiz-answer-a`, index 1 → `quiz-answer-b`; only visual order shuffles.
- 4 active lessons, 12 action definitions, 13 private questions (3 new).
- LAB01–03 lesson objects compare equal to canonical; 13 untouched source modules/styles match byte-for-byte; all 10 prior private questions and 3 prior allowlists unchanged.
- Generic account qualification remains manual + main experiment + either thinking choice. Existing completion-strip loading/saving/missing/error/retry/completed behavior is reused, not replaced. No backend production code or database migration changed.
- Reset clears only the in-page plan, retaining thinking choice and durable history. Experiment state survives lesson navigation, not full reload. Account progress persists on server; standalone completion persists locally and does not sync into accounts.

## TDD and actual checks

Observed RED → GREEN for new lesson/allowlist/bank; checklist model; and compiled LAB04 UI (initially displayed LAB01 fallback and failed the bottleneck assertion). Historical total assertions were updated for the added lesson after meaningful failures, not treated as new RED coverage.

Run from course directory unless noted:

```sh
export PATH=/usr/local/bin:$PATH
npm test
npm run build
npm run test:e2e
TMPDIR=/Users/prommeesee/.hermes/cache/scratch /usr/bin/arch -arm64 /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python tests/test_platform.py
QA_PYTHON_ARCH=arm64 QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python node tests/lab04-real-account.mjs
# Integrated build LAST; this overwrites only isolated course dist:
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/framework-for-system-design-interview/progress npm run build -- --base /courses/framework-for-system-design-interview/
# From worktree root:
TMPDIR=/Users/prommeesee/.hermes/cache/scratch PYTHONPATH=appworks /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python -m pytest appworks/tests -q
python3 scripts/courses.py validate
git diff --check
```

Actual results:

- Course unit tests: **18 passed**.
- Compiled frontend browser suite: **5 passed**, covering LAB01–04 and account API-contract states; LAB04 tested at **1280 / 390 / 320px**, no horizontal overflow or page errors.
- Isolated registry/pipeline tests: **2 passed**, including actual generic build+validate and private bank exclusion.
- Full backend suite: **421 passed** (85.48 seconds). Real bank loader validates all 13 questions. Earlier run was 420 passed / 1 outdated curriculum-total assertion, corrected and rerun.
- Standalone and integrated Vite builds passed. Final integrated assets: `index-Bhd-G5Bh.js`, `index-DxAKDaNN.css`.
- Registry validation: all 3 enabled courses passed; other courses' existing dist was copied into the isolated tree, not rebuilt on canonical.
- `git diff --check` passed.

## Real authenticated browser QA

`tests/lab04-real-account.mjs` starts a disposable Flask server on an ephemeral loopback port, seeds two synthetic accounts directly, tests actual login/catalog/course/API behavior, restarts the same disposable DB, and deletes its DB/server when finished. It does not load production `.env` or copy real accounts.

Both accounts exercise all 4 current lessons and all 12 main/thinking action definitions. Account 1 is manual-first; account 2 is participation-first. Checks cover empty independent initial state, prior lesson completion leaving LAB04 unqualified, level remaining L1 until every lesson qualifies, reload/deduplication, account-owned 4/4 completion with 12 participation points, return-to-catalog preserving session, and both accounts retaining their progress/score after process restart. Private assessment, source JS and PDF requests return 404. The report has `restart: true`, `errors: []`.

Evidence:

- `evidence/lab04/integrated-report.json`, `account-run.log`
- `evidence/lab04/standalone-{1280,390,320}.png`
- `evidence/lab04/integrated-{1280,390,320}.png`
- Account-contract screenshots for LAB04: `evidence/framework-lab01/account-framework-wrap-up-{1280,320}.png` (shared historical runner output folder)

Visually inspected standalone desktop/mobile and integrated desktop/320px screenshots: full-width reading order, stacked comparison on mobile, readable checkboxes, visible completion strip and return link. API-intercept browser cases cover held loading/saving, load/manual/award errors, stable retry payloads and both randomized thinking orders across all four lessons. These frontend contract tests are distinct from real backend persistence tests.

## Issues and limits

- PDF tooling was absent; installed pypdfium2/pypdf/Pillow only into a scratch venv and rendered both pages. No source PDF changes.
- x64 Node initially launched universal Python as x64 against arm64 Pillow wheels. Fixed QA launcher with optional `QA_PYTHON_ARCH=arm64`; shared dependencies were not reinstalled. Final portable runner was rerun successfully.
- QA uses synthetic pre-seeded accounts and HTTP loopback, not signup/OTP, production-account login, trusted-CA HTTPS or production data migration. Production data preservation is by non-interference, not by claiming a fresh audit of real account rows.
- No actual capacity, availability, server/network failure or rollout benchmark was performed. This is an educational review checklist, not production-readiness certification.
- No persistent preview server remains. Final dist is integrated; rerun standalone build before standalone browser suite/preview, then restore integrated build last.
