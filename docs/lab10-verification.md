# LAB10 — Message queue (implemented, not deployed)

## Isolation and release boundary

Worktree: `/Users/prommeesee/Documents/04_Learning/classroom-lab10`, detached from `f508436`. All implementation/build/evidence writes are in this worktree or the QA launcher's private temporary directory. The original workspace was used only to read the supplied PDF and reuse the Python interpreter/Chromium cache. No production database/service, 8080/8081, credentials, dist, staging, commit, push or deployment was touched.

Manifests and private assessment banks are dynamically read: release manifest, bank and compiled client together only after separate authorization. Old tabs must reload. New lesson qualification can reduce current completed-course counts until the replacement is completed; retained historical points and permanent achievements are not deleted.

## Source map (developer-only)

Read and rendered **both pages**, including both figures, of the original `Message-queue.pdf`. SHA-256: `cf829a24fca9f472d69e8fa5aede360dfef6d0ead578ace104e649a1fb6a6c91`. Source remains untouched, ignored and outside dist/public.

- Page 1, Figure 17: producer → message queue → consumer; asynchronous buffering and decoupling → introduction, comparison, original responsive HTML figure and independent outage experiment.
- Page 1 prose: producer may publish when consumer is unavailable; consumer may consume previously queued messages while producer is unavailable → deterministic state transitions and thinking/private assessment.
- Pages 1–2, Figure 18: web servers publish photo crop/sharpen/blur jobs, workers consume them; independent producer/consumer scaling, add workers for backlog and reduce when mostly empty → six ordered steps, selectable photo job types, worker count and queue display.
- Supplementary technical caveats explicitly correct the source's overly broad memory/durability description: RAM is not automatically durable; broker persistence/replication/ack configuration matters. Retry/idempotency/dead letters are explanatory, not simulated. Queue availability, finite capacity, sustained overload and measurement caveats are explicit.

No PDF filename, page number or source caption appears in the new learner-facing lesson. Source renders: `evidence/lab10/source/page-{1,2}.png`.

## Curriculum and history

- New lesson/simulation ID: `message-queue` (not retired `queue` or `region`).
- New actions: `enqueue-jobs`, `process-jobs`; original choice 0/1 retains lesson-scoped `quiz-answer-a` / `quiz-answer-b`, independent of shuffled visual labels.
- New private bank IDs: `message-queue-decoupling`, `message-queue-scaling`.
- Removed only active `region` allowlist/questions; database rows, receipts and frozen exam snapshots are never rewritten. Backend regression seeds real historical region evidence and frozen snapshot, swaps curriculum, proves no new qualification, earns fresh evidence and recreates the app on the same isolated DB.
- Frozen numeric migration unchanged: numeric 9 → `queue`, 10 → `observe`, 11 → `region`, never Message queue. New stable ID is added separately; local historical IDs survive subsequent saves.
- **11 current lessons, 39 active action definitions** (17 simulation + 22 thinking). Historical scores can exceed this count.
- Programmatic comparison with HEAD proved all non-region manifest definitions and private questions unchanged. LAB09 model/view/styles and all other lesson copy are unchanged. Existing regression expectations referring to the replaced active slot/count were updated, not historical model fixtures.

## Implementation and model limits

`message-queue.js` is a deterministic FIFO job model. Sending accepts three jobs atomically; the demonstration queue caps at 30. Processing consumes up to one job per worker (1–4 workers) per manual round. Producer and consumer availability are independent. Setup/reset do not award. Empty processing, full enqueue and an unavailable required side are no-ops with no participation POST. Two meaningful buttons award once each through existing semantic server deduplication.

Thai explanation → full-width comparison → numbered experiment → expandable caveats → thinking question reuses the existing layout. Controls are grouped, live counts/results remain visible, diagram labels use actual readable HTML text and arrows adapt to desktop/mobile. Glossary supports keyboard activation, Escape/focus return and remounts. No real images are modified, no broker/network/timers are run, and no durability, exactly-once, benchmark or automatic scaling is claimed. Reset/navigation reset the ephemeral experiment, not account progress.

## Actual TDD and verification

Observed RED→GREEN in tool execution, one vertical slice at a time:

1. New lesson identity initially failed with `region` instead of `message-queue`; local migration identity passed after replacement.
2. Independent outage processing initially failed because model export was absent; implemented and passed.
3. Finite buffer/validation initially failed because full enqueue still reported meaningful; bounded acceptance and validation passed.
4. Browser interaction/layout initially failed due to missing sequence layout; implemented controls/diagram/layout and passed.
5. Manifest/bank test failed against the old region allowlist. Backend history test also failed because historical region still qualified. Both passed after active identity replacement.
6. Producer glossary initially absent; added terms and enriched prose. A subsequent test-only typo used `#term-popover` instead of the existing `#term-hint`; corrected selector, then passed.
7. Responsive arrow regression failed (`none` instead of a right arrow); corrected desktop/mobile arrow direction and passed.

Commands ran with `PATH=/usr/local/bin:$PATH` for compatible Node. `npm ci` installed worktree dependencies; audit reported zero vulnerabilities (npm emitted install-script review notices). Build was created in the worktree **before** backend tests.

| Verification | Actual result |
|---|---|
| `npm test` | **66 passed**, final source |
| Full backend: original environment `.venv/bin/python -m pytest -q`, cwd worktree `appworks` | **401 passed in 92.31s**; isolated fixtures, no production DB |
| Development browser suite | First full run 82 passed / 1 selector typo failed; corrected and superseded by compiled full run |
| `npm run build` + `npx playwright test -c playwright.lab10-build.config.js` | **83 passed**, final compiled standalone, 46.0s |
| `npx playwright test -c playwright.account.config.js` | **15 passed**, final source, API-intercepted error/race/navigation regressions |
| `python3 scripts/courses.py build` and `validate` | Both successful; integrated Vite build **43 modules** |
| `git diff --check` | Passed |

Compiled browser tests cover mobile 320/390 and desktop 1440, no horizontal overflow, diagram font size >=14px, computed diagram contrast >=4.5, responsive arrow direction, model interaction, reset, retained thinking selection, glossary keyboard/remount and no source attribution. Full suite also covers all existing lessons, including LAB09.

## Real compiled account QA and restart

Launcher: `scripts/registration-qa-server.py --port 8150 --evidence evidence/lab10/integrated`. Uses an isolated temporary SQLite/course tree and real loopback Graph HTTP double. No provider traffic or bypass. Runner: `node scripts/message-queue-browser-verify.mjs`.

Two accounts completed actual emailed-code OTP registration using the private loopback mailbox, then logged in and used the compiled lesson with real Flask/SQLite. Each earned **4 points and 1/11 qualified lessons** from both simulation buttons, both semantic thinking choices and manual completion. Verified independent outages, no-op exclusion, repeated action dedup, manual/quiz distinction, shuffled-choice reload, navigation, account isolation and mobile layouts. Asset responses were all 200 and page-error list empty.

Stopped the identified QA PID, rebuilt only its private integrated dist with final visual changes, then restarted the **same DB** using `--resume` and ran the browser runner `--resume`. Both accounts retained 4 points and their own Message queue qualification. Final restart runner additionally verified empty/full no-op actions produce **zero participation POSTs**, 30-job bound, four-worker processing to 26 jobs and unchanged score. Final reports: `evidence/lab10/integrated/browser.json`, `restart.json`, `server.json`, `graph-boundary.json`. Mail/cookies remain in the private temporary directory, not in deliverables.

Final worktree integrated build exactly matches the browser-tested private QA build (all four files):

- `index.html`: `912cabaf0dd5b41e57448cc666f70f723fda90c17bad6089a914adb593b472c1`
- `assets/index-DbSOY_MK.js`: `429b1e423b6b0c560e7da6871eaf61c81e6715d91486fdc8bd8eb73e8c5f59f9`
- `assets/index-DO4IC-pO.css`: `22918f2cf6205500430644add46622854771050570102bdf38cc9c6dc2629aec`
- Unchanged reference guide: `b028e0697bede6cf2f60420112a25b2ae0a9a3ad1f6ef7e0cfc44641749154f1`

## Evidence and limitations

- Compiled browser report: `courses/scale-lab/evidence/lab10/compiled-browser.json`.
- Standalone screenshots: `courses/scale-lab/evidence/lab10/layout-{320,390,1440}.png` and `diagram-{320,390,1440}.png`.
- Integrated screenshots: `evidence/lab10/integrated/compiled-{320,390,1440}.png`.
- Visually inspected both PDF figures, final desktop direction/contrast, 320px diagram and 390px intro/comparison/instructions crop, plus integrated desktop completion/layout.
- No deployment or production data comparison was attempted, deliberately avoiding production DB/services. QA proves local loopback transport, not delivery through a real email provider.
- Account UI suite uses API interception; separate OTP integration uses the real local backend. No claim that the entire historical platform browser-runner collection was rerun. Full unit/backend/browser/account suites listed above were run.
- Existing LAB09 extended notes still contain their historical forward-reference to LAB10 writer recovery. Its source was deliberately left unchanged to honor the explicit LAB09 preservation constraint; curriculum owner should authorize correcting that reference separately. The new LAB10 itself does not teach writer promotion.
- QA process stopped after verification; temporary Chromium cache symlink removed. No preview server left running. All source changes remain unstaged/uncommitted.
