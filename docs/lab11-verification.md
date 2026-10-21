# LAB11 — Logging, metrics & automation (not deployed)

## Scope and isolation

Implemented in `/Users/prommeesee/Documents/04_Learning/classroom-lab11`, detached from `b64b0d7`. The live `classroom` checkout remains clean on main. No production DB, credentials, dist or services were modified; the existing Python interpreter and Chromium cache were reused only for isolated testing. No stage, commit, push or deployment.

Replaces active Sharding with a genuinely new `logging-operations` lesson/simulation identity. Do not reuse retired `observe`: its previous topic and saved evidence are not evidence for this lesson. Keep old `shard`/`observe` local history, account rows, receipts and frozen exam snapshots. Numeric migration is frozen: 12 still means Shard and 10 means Observe. The known stable-ID set independently adds the new ID.

The current manifest has **11 lessons and 41 active action definitions**: 19 simulation actions and 22 semantic thinking choices. Historical points remain and may exceed the active count. New lesson completion requires its own manual marker, any of its three simulation actions and either original A/B choice. Existing course qualification/levels may fall until the new lesson is completed when a future deployment activates this curriculum. Permanent achievements are not removed.

Manifests and private question banks are read dynamically. An authorized deployment must coordinate the manifest, bank and compiled assets; old tabs must reload. Do not copy these source files into the live checkout as a preview.

## Source map

Source: `/Users/prommeesee/Documents/04_Learning/classroom/Logging.pdf`, 3 pages, SHA-256 `76600c846720033d21b06abfefd89a06a5e6f8c1804d02336c24415713941048`. Hash checked before/after; PDF untouched, ignored, outside dist/public. All three pages rendered with PDFium and visually inspected. Page 2 is primarily a figure, so text-only document extraction was insufficient.

- Page 1, Logging: per-server error logs versus centralized search → local/central scope and severity-filter experiment, explanation and thinking question.
- Page 1, Metrics: host CPU/memory/disk I/O, aggregate database/cache performance, business DAU/retention/revenue → three selectable metric groups with units, measurement windows and cautions.
- Page 1, Automation: automated check-in verification and build/test/deploy → deterministic stepwise CI pipeline with an explicit test gate. Distinguishes CI from automatic production deployment.
- Page 2, Figure 19: clients/DNS/CDN, load balancer, web tier, cache/database/NoSQL, message queue/workers and operational tooling → original responsive HTML conceptual diagram. Does not claim every request traverses the logging service; identifies a single data center and queue decoupling.
- Page 3: increasing data load motivates scaling the data tier → closing caveat, without retaining an unrelated Sharding experiment.

Supplemental examples, not figures from the PDF: synthetic log messages/timestamps, all numeric metrics, p95 definition, chosen pipeline outcomes and deployment gate. Supplemental cautions: no secrets in logs, access/retention controls, collection may be incomplete, small systems still benefit from basic visibility, metrics are not proof of causation and passing tests do not prove absence of bugs. No PDF filename/page/attribution appears in learner content.

## Implementation

- `logging.js`: bounded fixed synthetic log/metric data and deterministic pipeline. No network, timers, code execution or real telemetry.
- `logging-view.js` / `logging.css`: Thai academic-but-accessible explanation, two-way comparison, six ordered experiment steps, controls, conceptual architecture and separate result panels, expandable caveats and glossary support.
- `main.js`: existing progress/participation adapter, pending guards, semantic quiz identities and shared lesson layout reused.
- `course.json` / `assessment.json`: only Sharding's active definitions/questions retired; new `inspect-logs`, `inspect-metrics`, `run-pipeline` and new question IDs `logging-operations-evidence`, `logging-operations-ci`.
- All non-Shard participation definitions and private questions were programmatically compared with HEAD and found unchanged. Other lesson source copy is unchanged.

Log searches and metric reads are meaningful inspections, including searches finding no error. Their buttons award once each. Each new pipeline step is meaningful, including a failed-test step; blocked/completed pipeline clicks submit no participation. Changing scope/group/code version, reset and navigation are unscored. Changing code version restarts only the simulated pipeline, not logs, account progress or real services. There are no real deployments/tests/alerts or performance measurements in this experiment.

## Tests actually executed

Vertical RED→GREEN: new lesson identity failed while Shard occupied LAB11; log search export was absent; metrics export was absent; pipeline export was absent; browser layout assertion failed before integration. Implemented each slice and observed its corresponding GREEN. Backend history tests characterize already-existing generic qualification behavior; they are not claimed as newly failing backend behavior. Four old unit expectations initially failed due to retired active Shard/changed count, and were updated while frozen legacy fixtures and historical Shard model tests stayed intact.

| Command / boundary | Result |
|---|---|
| `npm ci` with compatible `/usr/local/bin` Node | Installed; audit reported 0 vulnerabilities |
| `npm test` | 70 passed |
| Original environment `.venv/bin/python -m pytest -q`, cwd isolated `appworks` | 403 passed in 95.86s |
| `npm run build` then `npx playwright test -c playwright.lab11-build.config.js` | 87 passed in 48.5s, final standalone suite |
| `npx playwright test -c playwright.account.config.js` | 15 passed; intercepted API race/error/navigation suite |
| `python3 scripts/courses.py build` and `validate` | Passed, final integrated build, 46 modules |
| `git diff --check` | Passed |

Use `CLASSROOM_BROWSER_CACHE=/path/to/existing/cache` for the LAB11 compiled config/runner. The temporary `.browsers` symlink used by the account suite was removed.

Browser tests cover local/central results, all metric groups, blocked and passing pipelines, terminal no-op, reset/retained thinking selection, wraparound navigation, glossary keyboard/Escape, 320/390/1440 widths, no overflow, figure font size >=14px and text contrast >=4.5. Visually inspected desktop reading order and 320px diagram; also captured integrated screenshots. Logs are escaped before insertion into HTML; controls accept only known values.

## Integrated accounts and restart

Launcher: `scripts/registration-qa-server.py --port 8151 --evidence evidence/lab11/integrated`. Runner: `node scripts/logging-browser-verify.mjs`, repeated with `--resume` after restarting the same QA DB. Actual browser OTP registration used the private local Graph HTTP double; no provider calls or auth bypass. Two accounts each earned 5 points and qualified only `logging-operations` (1/11). Verified independent initial state, both semantic thinking choices, opposite visual order after reload, duplicate-action deduplication, manual requirement, meaningful simulations, terminal no-POST behavior and persistence through relogin/process restart. All observed assets returned 200 and page-error lists were empty.

Backend regression separately seeds each of retired Shard and Observe with actual qualifying awards plus a frozen exam snapshot. Swapping to the current manifest does not qualify Logging or mutate history; fresh manual/simulation/thinking evidence qualifies it and persists after app recreation.

Evidence:
- `courses/scale-lab/evidence/lab11/browser.json`
- `courses/scale-lab/evidence/lab11/layout-{320,390,1440}.png` and `diagram-{320,390,1440}.png`
- `evidence/lab11/source/page-{1,2,3}.png`
- `evidence/lab11/integrated/browser.json`, `restart.json`, `server.json`, `graph-boundary.json`, `compiled-{320,390,1440}.png`
- Private QA mail/cookies/database remain in the launcher's temporary directory, not in source/public/dist.

Final worktree integrated build matched every file in the browser-tested QA dist:
- `index.html`: `ce7a5de1ae971dc434dc36d985fd689ec57f4f86d9149833e4334e3b6c6b8bbf`
- `assets/index-CGByiVFb.js`: `2112fa9ae835bb61d8678a4fcf3bcbd81de2d3a9374f1816e112c430d768bef7`
- `assets/index-r6gMN1Ej.css`: `fc1369de5fc7222b67efa3a1efc18fe31830b6949b29cb54658a96cd9820f861`
- Unchanged reference guide: `b028e0697bede6cf2f60420112a25b2ae0a9a3ad1f6ef7e0cfc44641749154f1`

No claim of anti-cheat grading, real monitoring infrastructure, actual external email delivery, production traffic testing or rerunning every historical integration script. Historical LAB09 forward-reference to writer recovery remains outside this change.
