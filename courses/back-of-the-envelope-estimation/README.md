# Back-of-the-envelope Estimation — developer handoff

Independent Thai course, deployed locally as **Estimate Lab** to Docker at **http://localhost:8082**. See `../../docs/estimation-verification.md` for release details and verification scope. Course ID `back-of-the-envelope-estimation`, catalog order 2. No imports from Scale Lab or the platform. Existing visual tokens, accessible term-hint controller and generic account adapters were copied into this course and are owned here.

## Curriculum

Six lessons, six meaningful calculator actions and twelve stable thinking choices: **18 participation definitions**. Six separate manual markers are completion criteria, not point-earning actions. Private `assessment.json` has six questions covering every lesson; it is never imported into the public bundle.

| Lesson ID | Experiment | Expected baseline |
|---|---|---|
| estimate-units | Convert `amount × 2ⁿ` bytes to bits, MB and MiB | 1 MiB = 1,048,576 bytes = 1.048576 MB |
| estimate-latency | Compare historical operation times and serial repetition | 150 ms / 100 ns = 1,500,000×; ten serial operations = 1,500 ms |
| estimate-availability | Convert percentage and measurement window to equivalent downtime | 99.99% / 365 days ≈ 52.56 minutes |
| estimate-traffic | MAU → DAU → posts/day → average and assumed peak QPS | 300M × 50% × 2 / 86,400 ≈ 3,472 QPS; peak ×2 ≈ 6,944 |
| estimate-storage | Media/day × retention, optionally copies and overhead | 30 TB/day; 54.75 PB logical in five 365-day years |
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
- Standalone uses only `back-of-the-envelope-estimation-progress-v1`, no other course's keys. Manual completion or correct quizzes mark local completion. Corrupt/denied storage is tolerated and denied persistence is visible.
- Reset affects calculator inputs/results, not saved history or quiz selection.

## Verification and source mapping

See `../../docs/estimation-verification.md` for exact source grounding, corrections, commands and evidence. Isolated account launcher: `scripts/estimation-qa-server.py`; browser runner: `scripts/estimation-browser-verify.mjs` with `--restart` for the same private QA DB. Uses genuine OTP registration through an actual loopback Graph HTTP double; no production settings or real mail. Private credentials/mail are confined to the temporary QA directory, not the report.

Limits: teaching arithmetic, not infrastructure benchmarks or capacity guarantees. Source latency values are historical. Storage excludes growth/deletion/compression unless explicitly stated; copies/overhead are labeled supplemental. Public practice quiz explanations are not the private server-graded final bank. Completion is self-reported, trusted same-origin course code is not an anti-cheat boundary, and static deep links reopen the initial lesson rather than implementing a lesson router.
