# LAB 04 — Load balancer replacement

## Source and teaching scope
- User source: root `Load-balancer.pdf`, preserved unchanged (SHA256 `365dbed811d855388d4b9c0cbc9c85b1138af88840adf1def0acd60a02a54125`). Source renders are private QA evidence at `evidence/lab04/source/page-{1,2}.png`; neither source PDF nor images enter public/dist.
- Page 1 / Figure 4: traffic distribution, external DNS returning IP to client, client HTTP to public LB and LB HTTP to private server pool. Original responsive HTML/CSS diagram, not a source screenshot. Replaces source mywebsite.com / 88.88.88.1 with example.test / 192.0.2.20; retains private 10.0.0.1 and 10.0.0.2.
- Page 2: Server 1 failure, healthy Server 2 receiving new requests, replacing/adding healthy servers for growing traffic. Optional Server 3 (10.0.0.3) illustrates addition after registration and health check, not automatic provisioning.
- Supplements explicitly qualify private routing/firewall/VPN, capacity, health detection delay, in-flight failure, LB SPOF and single DB redundancy. DB replication points to LAB 06; LAB 05 remains session. Round-robin and immediate health knowledge are simulation assumptions, not production guarantees or benchmarks.

## Compatibility
Stable `balance` lesson, existing simulation/action mapping and `route` action are unchanged. Original incorrect/correct choice identities remain indices 0/1. Private `balance-7` and `balance-8` questions now follow the supplied material, retaining question/option identifiers. No manifest/backend/schema changes and no immutable exam-attempt snapshot modifications.

Existing completion and participation remain retained; they are **not re-certification of study of the replacement material**. Changes to controls and reset are unscored; explicit route experiments (including observing all-down 503) retain the existing simulation action. Delivery counters count only successful routing. Initial pool has two active servers; reset clears simulation counts, not saved participation or progress.

## Verification actually run
Three vertical RED→GREEN slices: missing model assertion → route/counter model; missing `.balance-diagram` browser assertion → diagram/controls/failover/reset integration; missing DNS source content assertion → revised lesson/private bank.

Commands run with compatible `PATH=/usr/local/bin:$PATH`:
- `npm test` in `courses/scale-lab`: **36 passed, 0 failed**.
- `npm run test:e2e`: **29 passed, 0 failed**.
- `npx playwright test -c playwright.account.config.js`: **15 passed, 0 failed**.
- `.venv/bin/python -m pytest -q` in `appworks`: **396 passed in 90.37s**.
- `git diff --check`: passed.

Compiled integration used `scripts/registration-qa-server.py --port 8125 --evidence evidence/lab04`, which built a separate temporary course tree. `node scripts/lab04-browser-verify.mjs` passed with real OTP registration via private local Graph mail double, login, repeated-action deduplication, incorrect quiz without completion, manual combined completion, reload, failover/all-down/Server 3, reset, 320/390/1440px screenshots, catalog exit, logout/relogin and persisted deduplication. No browser errors or failed course assets.

Stopped only owned QA PID 77878; resumed same database with the same launcher arguments plus `--resume` (PID 78317), then `node scripts/lab04-browser-verify.mjs --resume` passed. Stopped that QA PID and verified 8125 had no listener. Existing 8080/8081 listeners were left untouched. No real account, provider traffic, .env access, commit, staging, push or deployment.

Evidence (git-ignored local artifacts):
- `evidence/lab04/browser.json`, `restart.json`, `verification.json`, `graph-boundary.json`
- `evidence/lab04/integrated-{320,390,1440}.png`
- `evidence/lab04/diagram-{320,390,1440}.png` (320px diagram and desktop inspected visually; corrected screenshot scroll/height so sticky header does not obscure DNS)
- `evidence/lab04/full-{320,390,1440}.png`
- `evidence/lab04/server.json` holds private temporary QA paths, not production paths.
- `evidence/lab04/live-dist-before.json`: compared file-by-file after QA; live dist unchanged. Isolated build contains only index, training markdown and compiled JS/CSS, no source PDF/images/private assessment.

QA server is stopped; isolated DB and build remain available for independent review. No implementation blockers.

## Authorized local deployment
After the user's deployment request, backed up SQLite using its backup API (integrity `ok`), private uploads and old dist to `backups/lab04-20261020T125643/`. Identified and stopped only Classroom PID 68356 on loopback 8080, ran `python3 scripts/courses.py build` and `validate` successfully, then restarted `service:create_app` on 8080 (PID 80264). Port 8081 was not touched.

Login returned HTTP 200 and unauthenticated course returned HTTP 303 to login. Every published file matches the browser-tested isolated QA build by SHA-256. Users, lesson progress, manual completion, v2 participation awards, achievements and exam attempts match the backup row-for-row; SQLite integrity remains `ok`. Source PDF SHA-256 is unchanged. No commit or push performed.
