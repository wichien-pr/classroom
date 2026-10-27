# Back-of-the-envelope Estimation — developer handoff

Independent Thai course, deployed locally as **Estimate Lab** to Docker at **http://localhost:8082**. See `../../docs/estimation-verification.md` for release details and verification scope. Course ID `back-of-the-envelope-estimation`, catalog order 2. No imports from Scale Lab or the platform. Existing visual tokens, accessible term-hint controller and generic account adapters were copied into this course and are owned here.

## Remove LAB06 (deployed on host localhost:8080)

Working copy: `/Users/prommeesee/Documents/04_Learning/classroom-estimation-five`.
The proposed curriculum has **five active lessons**, ending with LAB05 Tips, and **15 active participation definitions**. Removed `estimate-rounding` from active lessons, manifest and private assessment bank. LAB01–LAB05 lesson objects and IDs remain unchanged. The shared rounding calculator remains because LAB05 uses it. The Tips reference no longer points to LAB06; the header derives its count from active lessons.

Retired `estimate-rounding` and `estimate-storage` local records are retained but excluded from active completion totals. Backend production code, historical rows, awarded points and frozen exam snapshots are untouched. An isolated backend regression verifies retired evidence cannot qualify active lessons. Historical participation totals can exceed the active definitions.

Tests: unit **29 passed**; Chrome retirement **3**, Tips **6**, completion **7**, Traffic **4**, Availability **4**, Latency **4**, Units **2** (30 browser tests); targeted backend **39 passed**. Browser account APIs are intercepted; backend tests use temporary databases. Screenshots: 320/390/1440px. Build, test logs, preservation and report: `evidence/estimation-remove-lab06/`; account candidate: `integrated-dist/`. Live source/dist/manifest/private bank hashes are unchanged. No deploy, services, Docker, live DB, mail, staging, commit or push.

Deployment update: published the verified five-lesson candidate, manifest and private bank to localhost:8080 after authorization. Real isolated OTP/account QA and restart passed (A: 5/5, 15 points; B: 1/5, 2 points). Production database rows/schema, uploads and Scale Lab preserved; guest health checks added anonymous sessions only. See `evidence/estimation-remove-lab06/deployment.json` for backup and verification. Prior no-deploy statements describe implementation QA, not current status. Earlier deployment sections below are historical six-lesson releases.

## LAB05 Tips replacement (deployed on host localhost:8080)

Implementation worktree: `/Users/prommeesee/Documents/04_Learning/classroom-estimation-tips`. After approval, the tested manifest, private bank, source and compiled client were synchronized to the main `classroom` checkout and deployed at http://localhost:8080. Published asset hashes match both frontend and authenticated QA builds. Database schema, prior rows/sessions and uploads were preserved; health checks added anonymous sessions only. Docker and Scale Lab are unchanged. Earlier LAB04 references to editable storage in LAB05 describe the prior curriculum; current LAB05 is Tips.

LAB05 replaces Storage with **Tips · ประมาณอย่างมีเหตุผล**, covering the four supplied principles: rounding/approximation, written assumptions, labeled units and practice topics (QPS, peak QPS, storage, cache, server count). The exercise compares 99,987 ÷ 9.1 with 100,000 ÷ 10, without inventing physical units. New quiz checks whether “5” without units or assumptions is sufficient. LAB06 remains unchanged. User approved one additional sentence correction at the end of the LAB04 worked example, pointing to Tips instead of a removed storage experiment.

New stable lesson/simulation ID: `estimate-tips`; action `calculate`; thinking actions `quiz-answer-a` and `quiz-answer-b`; new private question `estimate-tips-review`. Retired `estimate-storage` records and frozen exam snapshots are never rewritten into Tips. Account qualification requires new evidence. Browser-local history retains the retired ID while excluding it from the active completion total. There are still six lessons and eighteen active participation definitions; historic account scores can include retired awards.

Tests: `npm test` **27 passed**; `npm run test:tips` **6 Chrome tests passed**; completion **7**, traffic **4**, availability **4** passed against the integrated candidate. Targeted isolated backend qualification/progress tests **38 passed**, including retired history preservation, new-topic qualification, frozen snapshots and app recreation. Pre-deploy checks additionally passed genuine OTP registration using a loopback Graph double, all 18 actions across six lessons, two-account isolation, lost-response retry, reload/relogin and same-DB process restart. No production account login or real mail delivery was tested.

Artifacts: `../../evidence/estimation-tips/` contains source mapping, RED/GREEN logs, 320/390/1440px screenshots, preservation hashes and `integrated-dist/`. `TIPS_DIST` selects an existing integrated candidate; normal browser-test builds go into temporary directories. Deployment updated manifest, private bank and compiled client together and restarted only the identified host 8080 service. Health/login and guest course/asset/API protections passed. No DB migration, Docker change, real mail, staging, commit or push. Backup and deployment verification: `../../evidence/estimation-tips/deployment.json`. Reload existing course tabs; retired Storage completion does not grant Tips completion.

## Curriculum

Six lessons, six meaningful calculator actions and twelve stable thinking choices: **18 participation definitions**. Six separate manual markers are completion criteria, not point-earning actions. Private `assessment.json` has six questions covering every lesson; it is never imported into the public bundle.

| Lesson ID | Experiment | Expected baseline |
|---|---|---|
| estimate-units | Convert `amount × 2ⁿ` bytes to bits, MB and MiB | 1 MiB = 1,048,576 bytes = 1.048576 MB |
| estimate-latency | Compare historical operation times and serial repetition | 150 ms / 100 ns = 1,500,000×; ten serial operations = 1,500 ms |
| estimate-availability | Convert percentage and measurement window to equivalent downtime | 99.99% / 365 days ≈ 52.56 minutes |
| estimate-traffic | MAU → DAU → posts/day → average and assumed peak QPS | 300M × 50% × 2 / 86,400 ≈ 3,472 QPS; peak ×2 ≈ 6,944 |
| estimate-tips | Rounding example plus assumptions/unit checklist | 99,987 ÷ 9.1 compared with 100,000 ÷ 10 = 10,000 |
| estimate-rounding | Compare original division with rounded operands | 100,000 / 10 = 10,000; signed relative error visible |

Every lesson has an original Thai explanation, full-width three-step diagram, semantic numbered “ลองตามนี้”, editable deterministic calculator, visible intermediate steps, reset, limitations, explained two-choice quiz, explicit manual completion and glossary hints. Calculation results retain a snapshot of the inputs that produced them; editing without recalculating does not rewrite old arithmetic during navigation.

## Run and build

From this directory:

```sh
npm ci
npm test
npm run dev -- --port 8143 --strictPort
# Separate terminal, while standalone preview/dev is running:
npm run test:e2e
```

On this Mac background shells select a different Node architecture. Use `PATH=/usr/local/bin:$PATH` for Node build/server processes; do not delete the lockfile to fix Rollup architecture mismatch.

Standalone build: `npm run build` (no account dependency). For an isolated standalone build without replacing integrated dist:

```sh
npm run build -- --outDir ../../evidence/estimation/standalone-dist
python3 -m http.server 8143 --bind 127.0.0.1 --directory ../../evidence/estimation/standalone-dist
```

Integrated build, **new course only**, no Scale Lab changes:

```sh
VITE_CLASSROOM_URL=/ \
VITE_CLASSROOM_PROGRESS_URL=/api/courses/back-of-the-envelope-estimation/progress \
npm run build -- --base /courses/back-of-the-envelope-estimation/
```

The generic Classroom registry/build/Docker course discovery needs no backend special case. Do not run an all-course host build while protecting the existing Scale Lab dist. The checked-out new-course `dist/` is the integrated artifact; standalone output is separate under ignored evidence.

## LAB04 Twitter QPS and media storage (deployed on host localhost:8080)

Replaces LAB04 explanation with the hypothetical Twitter example: 300M MAU, 50% daily users, two tweets/day, 10% with media and five-year retention. Full-width reference tables and worked steps show 150M DAU, approximately 3,500 average QPS and 7,000 peak QPS, illustrative sizes (tweet_id 64 bytes, text 140 bytes, media 1 MB), and media-only storage of 30 TB/day and 54.75 PB ≈ 55 PB. These are exercise assumptions, not Twitter's actual metrics or schema. The peak multiplier is assumed; text bytes do not necessarily equal character count. Decimal storage units exclude text, IDs, indexes, metadata, copies and backups.

The fixed example does not change with QPS calculator inputs. LAB05 retains its separate editable storage experiment. Other five lessons, stable IDs, fields, model arithmetic, quiz semantics, manifest/private bank and progress adapters remain unchanged. Existing LAB03 work is preserved.

Verification: `npm test` **23 passed**; `npm run test:traffic` **4 Chrome tests passed** (standalone and intercepted integrated API contracts); `npm run test:completion` **7 passed**. `TRAFFIC_DIST` accepts an existing integrated candidate; otherwise builds go into fresh temporary directories. Evidence and tested candidate: `../../evidence/estimation-traffic/` (`integrated-dist/`, screenshots at 320/390/1440px, RED/GREEN output and preservation hashes). The implementation QA preserved live dist and used intercepted frontend contracts, not authenticated backend persistence. After deployment approval, the tested candidate was published to host http://localhost:8080; its hashes match the published files. Database integrity, schema, all non-session data and preexisting sessions were preserved; health checks added anonymous sessions only. Login/health and guest access protection checks passed. Scale Lab, uploads and Docker are unchanged. No real-account login or mail delivery was tested, and no staging, commit or push was performed. Backup and rollout results: `../../evidence/estimation-traffic/deployment.json`. Reload existing tabs.

## LAB03 availability revision (deployed on host localhost:8080)

LAB03 now explains high availability, measured 100% versus future guarantees, SLA conditions and the nines/downtime relationship. Its full-width semantic reference table has exactly 99%, 99.99%, 99.999% and 99.9999%, with labeled mobile row cards. Numerical precision is retained from the supplied screenshot; the omitted weekly unit for 99.9999% is explicitly corrected to milliseconds. Rounded monthly/yearly reference values are not the calculator's fixed 30-day/365-day calendar. No exact calendar convention is attributed to the screenshot.

Only LAB03 copy and its reference hook/styles changed. Other five lessons, fields, model arithmetic, diagram, steps, quiz semantic identities, manifest/private assessment and progress adapters are unchanged. The tested candidate is now deployed on host http://localhost:8080. Published asset hashes match the candidate; database integrity, schema and prior accounts/history were preserved. Health/login checks passed; new sessions from checks are anonymous only. Docker and Scale Lab are unchanged. No real-account login or mail delivery was tested. Backup and verification: ../../evidence/estimation-availability/deployment.json. No staging, commit or push.

Verification: `npm test` passes 21 tests; `npm run test:availability` passes four actual Chrome tests in standalone and integrated frontend-contract modes, with intercepted progress/participation APIs (not authenticated backend persistence). Checks cover all 20 table cells, all four percentages on both 365-day and 30-day windows, snapshot/navigation/reset, glossary keyboard focus, completion and 320/390/1440px layout. Builds use temporary directories only. Set `AVAILABILITY_DIST` to an existing integrated candidate to reuse it. Candidate and screenshots: `../../evidence/estimation-availability/`; candidate directory: `integrated-dist/`.

## LAB02 latency revision (deployed on host localhost:8080)

LAB02 follows `Latency-numbers-every-programmer.pdf`: all 13 rows of its historical 2010 table, nanosecond/microsecond/millisecond conversion, five design takeaways, and a separate note on the 2020 illustration. Both calculator menus use the same 2010 reference; equal timings share an explicitly labeled option to avoid duplicate numeric selection identities. No current-hardware benchmark claims are made. Other lessons, quiz identities, progress and model arithmetic are unchanged.

Run `npm test` (19 tests), `npm run test:latency` (four Chrome tests), `npm run test:units`, and `npm run test:completion`. Latency tests build to fresh OS temporary directories, exercise every reference timing, staged calculator updates, navigation/reset and 320/390/1440px layout, without backend/account/mail calls. `LATENCY_DIST` accepts an existing integrated candidate. Evidence: `../../evidence/estimation-latency/`. This revision is deployed on host **http://localhost:8080**. Published assets match the tested candidate; database/schema and prior learning history were preserved. Health/login checks passed. Docker is unchanged. See `../../evidence/estimation-latency/deployment.json` for backup and verification.

## LAB01 Power of two revision (deployed on host localhost:8080)

LAB01 now introduces distributed-system data-size estimation, byte/bit and ASCII basics, followed by the five reference magnitudes from 2¹⁰ through 2⁵⁰. A full-width table shows Thousand–Quadrillion and Kilobyte–Petabyte; narrow screens show labeled row cards. Decimal KB–PB are explicitly approximate, while the note gives exact binary KiB–PiB identities. Existing calculator, quiz semantics, completion and durable IDs are unchanged; the private assessment still tests the same MB/MiB distinction. Other lessons are unchanged.

Run `npm test`, `npm run test:units` and `npm run test:completion`. The units browser runner builds into a fresh OS temporary directory and verifies all five reference rows, navigation, all calculator powers, reset, local completion and 320/390/1440px layout. Screenshots and a separate integrated build are under `../../evidence/estimation-units/`. The browser-tested integrated candidate is now deployed on host **http://localhost:8080**. Published files match the tested candidate exactly. Database/schema and prior sessions were preserved; health checks added only anonymous sessions. Docker 8082 is unchanged. Backup and verification: `../../evidence/estimation-units/deployment.json`. No real-account login or email was tested.

## Completion-strip UI parity (host localhost deployed)

The verified integrated build is now served by the host Waitress app at **http://localhost:8080**, using the original host database and its existing learning history. Docker on 8082 was not updated. Health/login/protection checks passed; database schema and all preexisting data were preserved (health checks added only anonymous sessions). No real-account login or email was tested. See `../../evidence/estimation-completion/localhost-deployment.json` for backup and verification.

The source now matches Scale Lab’s explicit missing-requirement, marked, completed, loading, saving, failure/retry and standalone-storage messages. Only the original failed lesson offers its completion retry; the existing global retry still preserves the captured lesson/event across navigation. IDs, scoring, adapters and calculator behavior are unchanged.

`npm run test:completion` builds account and standalone assets into fresh OS temporary directories, starts loopback previews on ephemeral ports, and runs seven Chrome browser tests against intercepted progress/participation APIs. No backend, account database, mail or running Docker service is used. It captures 320/390/1440px evidence in `../../evidence/estimation-completion/`. To test an already-built integrated artifact, set `COMPLETION_ACCOUNT_DIST` to its absolute path. This is frontend contract verification, not an authenticated backend journey. `npm test` now runs 19 course/model/adapter/content tests.

## State contracts

- Integrated mode loads account progress and participation, blocks controls during either load/save, never reads/imports/falls back to localStorage, and renders only confirmed server state.
- Qualification requires manual + a calculator award + either thinking choice. Wrong answers qualify as participation, not as correct assessment. Correct answers never manufacture manual completion.
- Original answer index 0 maps to `quiz-answer-a`, index 1 to `quiz-answer-b` regardless of randomized display position. Per-page shuffle and selection survive navigation/reset.
- Participation retries retain captured lesson/action/UUID. Manual retries retain the original lesson. Writes and qualification refreshes are serialized. No durable offline queue or push sync is promised.
- Standalone uses only `back-of-the-envelope-estimation-progress-v1`, no other course's keys. Retired `estimate-storage` history is retained in storage but excluded from active completion; it never grants `estimate-tips`. Manual completion or correct quizzes mark local completion. Corrupt/denied storage is tolerated and denied persistence is visible.
- Reset affects calculator inputs/results, not saved history or quiz selection.

## Verification and source mapping

See `../../docs/estimation-verification.md` for exact source grounding, corrections, commands and evidence. Isolated account launcher: `scripts/estimation-qa-server.py`; browser runner: `scripts/estimation-browser-verify.mjs` with `--restart` for the same private QA DB. Uses genuine OTP registration through an actual loopback Graph HTTP double; no production settings or real mail. Private credentials/mail are confined to the temporary QA directory, not the report.

Limits: teaching arithmetic, not infrastructure benchmarks or capacity guarantees. Source latency values are historical. Storage excludes growth/deletion/compression unless explicitly stated; copies/overhead are labeled supplemental. Public practice quiz explanations are not the private server-graded final bank. Completion is self-reported, trusted same-origin course code is not an anti-cheat boundary, and static deep links reopen the initial lesson rather than implementing a lesson router.
