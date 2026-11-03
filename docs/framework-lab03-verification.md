# Framework LAB03 — implementation evidence (historical)

**Current status:** synchronized to canonical and deployed to existing local HTTPS. See [fresh deployment verification](framework-lab03-deployment.md). The implementation-only boundaries and test counts below describe the earlier isolated run, not the later release.

## Artifact and boundary

- Worktree: `/Users/prommeesee/projects/classroom-framework-lab03`, detached from canonical HEAD `e61441a2e9cc1a9e55b1973c3bd8d9955df4cc0e`.
- Canonical `/Users/prommeesee/projects/classroom` remains at that SHA; no tracked modifications. Its existing untracked `Step3.docx` and `~$Step3.docx` were not touched. LAB03 is **not synchronized to canonical, committed, pushed or deployed**.
- Course title and ID unchanged. Added lesson/simulation `framework-deep-dive`, main action `review-deep-dive`, original thinking A (correct) / B (incorrect). Display order randomized, semantic action IDs unchanged by shuffling.
- Active total: 3 lessons, 9 participation action definitions, 10 private assessment questions (7 prior questions unchanged + 3 new).
- Existing LAB01/LAB02 lesson objects, answer semantics, source modules and prior allowlists/private questions preserved. Other courses have no source changes. Shared account adapters unchanged; no backend runtime/schema change.
- No Docker, service, live database, production env, real credentials or mail operation. Synthetic QA server uses an ephemeral loopback port, isolated SQLite/uploads/course tree and explicitly seeded disposable users. Server is stopped and QA database deleted in `finally`. No continuing preview is handed off.

## Complete source coverage

Read all 3 pages of the local PDF and visually inspected each rendered page, including both architecture figures. Extraction used pypdf, rendering pypdfium2; initial PyMuPDF installation was unavailable and a source build hit a certificate error, so the alternative renderer was used without weakening TLS.

Local source SHA-256: `051739ff069e22f17ca0ff9066082333cdc9c99a690d39a74d5a151279753792`.
Rendered source pages remain outside the repository: `/Users/prommeesee/.hermes/cache/scratch/lab03-source/page-{1,2,3}.png`.

| Source | Teaching coverage |
| --- | --- |
| p1, four prerequisites | Agreed goals/scope, high-level blueprint, customer feedback, initial focus from feedback. Visible list and independently selectable exercise prerequisites. |
| p1, prioritization | Select components with the customer; adapt depth to overview, senior performance/bottlenecks/resource estimates or component detail. |
| p1, examples | URL shortener hash-function design; chat latency and online/offline status. All selectable as exercise priorities/topics. |
| p1, time management | Avoid irrelevant minute detail, especially unsolicited EdgeRank detail; preserve time for explaining scalable design. Wrong-choice feedback and exercise mismatch explain why. |
| p1, news feed example | Following agreement on the high-level design, deepen publishing and retrieval separately. |
| p2, publishing figure | Browser/mobile and DNS; load balancer; web servers with authentication/rate limiting; three branches: Post Service → Post Cache → Post DB, Notification Service, Fanout Service. Fanout reads Graph DB friend IDs, User Cache → User DB, sends Message Queue work, workers update News Feed Cache. Source steps 1–5 retained in the fanout path. |
| p3, retrieval figure | Client/DNS and separate CDN media path; numbered request through load balancer/web servers and News Feed Service; News Feed Cache, User Cache → User DB and Post Cache → Post DB; web-server response returns to client. Steps 1–6 represented. |

Figures are original accessible HTML flow diagrams with semantic headings/lists and explicit directional text, not flattened copies or tiny scaled SVGs. At mobile widths publishing branches stack and repeat their Web servers origin; 16px flow labels remain readable. This is a deliberately simplified redrawing, not a transaction protocol.

### Clearly supplementary / not claimed from source

The deterministic planning exercise is added pedagogy: choose foundations, customer priority and a matching topic, inspect missing/misaligned feedback, change choices and reset. No fabricated timing budget, traffic, capacity, infrastructure execution or customer approval is claimed. Additional caveats cover DNS bypass for HTTP, tokens not in URLs, unspecified transactions/retries/cache misses/consistency, and hash collision follow-up. The original figure's token-in-query example is not promoted into a production API contract. Source filenames, page numbers and attribution are developer-only, absent from learner UI/public/dist.

## Actual fresh verification

Executed in this isolated worktree:

| Command | Result |
| --- | --- |
| Course `npm test` | **16 passed**. Model, manifest/private-bank alignment and prior adapter regressions. |
| Course `npm run build` | Standalone compiled successfully. |
| Course `npm run test:e2e` | **4 passed**: LAB01, LAB02, LAB03 compiled journeys and account frontend-contract suite. |
| `QA_PYTHON=/Users/prommeesee/projects/classroom-framework-lab01/appworks/.venv/bin/python node tests/lab03-real-account.mjs` | Passed: 2 isolated accounts, all 3 lessons, all 9 action definitions per account, repeated-action deduplication, reload/relogin, server restart and independent persistence; no page errors. |
| Root `PATH=/usr/local/bin:$PATH python3 scripts/courses.py build` | All 3 integrated course builds passed. |
| Root `python3 scripts/courses.py validate` | All 3 courses valid. |
| In `appworks`: `/Users/prommeesee/projects/classroom-framework-lab01/appworks/.venv/bin/python -m pytest -q` | **420 passed in 70.14s** after updating the prior two-lesson curriculum assertion. Real private-bank loader verifies 10 questions and LAB03 coverage. |
| `git diff --check` | Passed. |

The final Framework dist is integrated, rebuilt after standalone tests using:

```sh
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/framework-for-system-design-interview/progress npm run build -- --base /courses/framework-for-system-design-interview/
```

The standalone browser runner requires a standalone build first; do not point it directly at the final integrated bundle without the account environment.

### TDD evidence

1. New model test initially failed `deep dive model exists`; implemented the pure planner, then passed.
2. New curriculum contract test failed because `framework-deep-dive` was missing; added independent metadata, manifest allowlist and bank, then passed.
3. New compiled-browser test failed `0 !== 2` because LAB03 figures/rendering were absent; added scoped markup/style/event dispatch, then passed.
4. Existing LAB02 unit/browser and backend checks still expected a two-lesson curriculum. Updated only their enumeration/count assumptions, retaining prior behavior checks. This was regression maintenance, not a claim of new TDD behavior.

### Browser coverage and evidence

- Standalone all 3 lessons at **1280, 390, 320**: navigation both directions, no LAB03 DOM/style container after leaving it, retained exercise state on return, reset clears exercise but preserves quiz selection, local reload completion, no horizontal overflow or page errors.
- LAB03 asserts every diagram component, minimum 16px flow-label font, customer terminology, no PDF/source filename in lesson UI, missing foundations, mismatched EdgeRank and matching publishing, and independent completion total `1 / 3`.
- Account frontend-contract runner: all 3 lessons with both deterministic shuffle orders at desktop/320, blocked initial load, failed load/manual/participation save, pending disable states, explicit retries, identical captured retry payloads, original quiz-choice identity and completed wording. These are intercepted API contracts, not persistence evidence.
- Real isolated Flask/browser: account 1 manual-first, account 2 participation-first. Manual alone never qualifies; simulation+thinking alone never qualifies account 2. Completing LAB01 leaves LAB02 and LAB03 entirely false. Each account completes all 3 and reaches Level 2 only on whole-course completion. All original choices and main actions are exercised; repeated actions keep score unchanged. Both accounts independently retain 3 completions / 9 points through server restart/relogin.
- Authenticated `assessment.json`, `Step3.pdf`, `src/deep-dive.js` return 404. Dist contains no private bank, PDF or source map.

Evidence paths (local/gitignored):

- `evidence/framework-lab03/unit.log`
- `evidence/framework-lab03/browser.log`
- `evidence/framework-lab03/account.log`
- `evidence/framework-lab03/integrated-report.json`
- `evidence/framework-lab03/standalone-{1280,390,320}.png`
- `evidence/framework-lab03/integrated-{1280,390,320}.png`
- Prior-lesson regression screenshots refreshed under `evidence/framework-lab01/` and `evidence/framework-lab02/`; account contract screenshots include `account-framework-deep-dive-{1280,320}.png` in the former directory.

Visually inspected all three integrated widths plus enlarged source/diagram crops. Readable light diagram cards, full-width learning sequence, stacked mobile branches and completion strip follow the existing course vocabulary. No overlap/clipping was observed. Design audit: no new decorative cards, gradients, fake metrics or unrelated hero; existing typography/palette retained.

## Limits

No deployment or trusted-CA HTTPS test was performed. Isolated account tests use actual Flask/authenticated assets and disposable seeded users, not registration/OTP/mail; those remain covered by unchanged backend regressions. The exercise is a discussion checklist, not a news-feed implementation or load test. Qualification is trusted-client participation, not tamper-proof grading. Only active course completion is tested at Level 2; final-exam assembly coverage is validated through the real bank loader and backend suite, not a new synthetic L8 browser exam. Lesson navigation is in-page, not new deep-route semantics. No production data hashes or backup claims are made because production storage was not accessed.
