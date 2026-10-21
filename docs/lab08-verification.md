# LAB08 Stateless web tier — implementation / isolated QA

## Latest release: technical-term coverage deployed

User-authorized glossary update deployed: numbered steps, moved prose, expanded details and original LAB08 figures now support hints, with added vocabulary and readable dark-figure links. Backup: `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab08-layout-20261021T031516Z`. Current PID **72050**, handle **proc_c230585ec0c2**. Integrated build/validation/hash comparison and guest HTTP checks passed; DB integrity/schema/history/sessions, uploads, .env and PDF preservation passed. Port 8081 untouched. Node, browser and account suites passed before release (logs `terms-node.txt`, `terms-browser.txt`, `terms-account.txt`); compiled preview dialog and mobile screenshot inspected. No reset, commit or push.

## Previous release: numbered instructions deployed

Deployed the six numbered “ลองตามนี้” steps and separate scoring note on user authorization. Backup: `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab08-layout-20261021T023527Z`. Current server PID **60419**, handle **proc_d3b49d2d5b10**; published assets match the new isolated integrated build. Login 200, guest course/assets 303, database/schema/history/session and upload/PDF/.env preservation checks passed. Port 8081 untouched. Targeted browser/layout tests and compiled standalone six-step inspection passed before release. This supersedes the process handles below.

## Previous release: layout revision deployed

Redeployed current working-tree layout on explicit user selection **without hard reset**. Latest backup: `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab08-layout-20261021T022805Z`. Rebuilt/validated and confirmed identical layout-build hashes. Current PID **56935**, handle **proc_936525c5d3a3** replaces PID 54196; guest health and database/upload/PDF/environment preservation checks passed again. 8081 remains untouched. The following paragraph records the preceding deployment.

The user approved deploying the reviewed layout preview. Backed up DB/uploads/previous dist to `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab08-layout-20261021T022125Z` using the SQLite backup API, integrity `ok`. Identified and stopped only production PID 47292. Built integrated output with `PATH=/usr/local/bin:$PATH python3 scripts/courses.py build`; validation passed and all published files match `evidence/lab08/layout/integrated-dist`.

Current service: http://127.0.0.1:8080/, PID **54196**, handle **proc_0bd7191cfd6f**, `service:create_app`. Login 200, guest course and JS/CSS 303; database integrity/schema and all non-session tables match backup; prior sessions retained. PDF/.env/uploads unchanged. 8081 remains PID 1363, untouched. Evidence: `evidence/lab08/layout/deployment.json`.

Layout validation: Node 59, browser 46, account browser 15 passed; 320/390/1440 layout assertions and inspected screenshots, standalone compiled local/shared-request smoke passed. Backend suite and fresh integrated OTP suite were not repeated for this presentation-only revision. Main lesson/simulation/quiz identities and manifest/bank did not change. No stage/commit/push. Reload existing course tabs to load the new layout.


## Authorized local deployment — completed

User explicitly authorized deployment after QA. At release preflight 8080 had no listener, so no existing process was killed. Backed up production SQLite using its backup API (integrity `ok`), uploads and prior dist to `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab08-20261021T020707Z`. The manifest/bank in this backup reflect the already-edited dynamic source, not a rollback copy of the retired curriculum.

Ran `python3 scripts/lab08-deploy-backup.py`, `PATH=/usr/local/bin:$PATH python3 scripts/courses.py build`, and `python3 scripts/courses.py validate`. Build succeeded (32 modules); every published file matches the tested isolated integrated hashes. Started `.venv/bin/waitress-serve --listen=127.0.0.1:8080 --call service:create_app` in appworks: PID **47292**, handle **proc_2204f4c48164**. URL **http://127.0.0.1:8080/**.

`python3 scripts/lab08-deploy-verify.py` passed: login HTTP 200, guest course and both assets 303 to login, integrity `ok`, schema unchanged, all non-session tables identical to backup, previous sessions retained (guest probes may add anonymous sessions), PDF/.env/uploads unchanged. Authenticated behavior is established by the hash-identical isolated QA build, not by writing production accounts. Port 8081 remained Docker PID 1363, untouched. No staging, commit or push. Sanitized report: `evidence/lab08/deployment.json`.

The no-deployment statements below describe the earlier implementation/isolated-QA phase only and are superseded by this release section. Reload existing browser tabs: the live manifest and private bank are read dynamically, and old compiled clients must not continue against the new allowlist.


Workspace `/Users/prommeesee/Documents/04_Learning/classroom`, branch `lab08`.

## Scope and release boundary

Queue is retired from the active curriculum and private bank. New stable identity: `stateless-web / stateless-web / web-request`. It does not reuse Queue or historical Session awards. The lesson-scoped `quiz-answer-a` is original incorrect answer 0; `quiz-answer-b` is original correct answer 1, independent of shuffled visual order. New private question IDs are `stateless-web-routing` (correct option `shared`) and `stateless-web-store` (correct option `dependency`). The reviewed answers require shared state access and acknowledge the store dependency; neither treats stateless as no data/cookies/authentication.

Programmatically counted from manifest: **11 lessons, 16 main simulation actions + 22 thinking choices = 38 current definitions**. One actual request operation replaces one worker operation. Setup, routing selection, availability switches, scenario reset and navigation are unscored. Both successful and unsuccessful requests are meaningful operations; repeated semantic actions do not earn new points.

No backend feature branch, schema change, migration or historical data rewrite. Frozen numeric local progress remains 5=Session and 9=Queue; both IDs stay in saved history but neither grants the new lesson. The known stable-ID set additionally accepts `stateless-web`. Old queue model tests remain historical regression coverage. Immutable account progress, awards, sessions and exam snapshots are not reinterpreted. Historical scores may exceed 38.

**Dynamic-read caveat:** the running platform reads source manifest and private assessment dynamically. Editing these files changes current qualification and future exam assembly even while old dist remains published. Therefore preserving dist does NOT mean production semantics were wholly isolated: old clients can temporarily be incompatible with the new allowlist. Previously frozen attempts remain unchanged. Release must coordinate manifest, bank and compiled client, and users must reload. No production account requests/writes were made during this QA.

User subsequently requested deployment. This report records completed isolated verification, not a claim that deployment has occurred. Concurrent work was detected on QA 8129 and in the shared runner; final release ownership/review must be coordinated rather than stopping an unowned process.

## Developer-only source map

Source `Stateless-web-tier.pdf`: 4 pages; SHA-256 `b9b14ce2d29f69f82bd84055d5f0e6a5997c67e8f2a4cd6a057431d2a39763f4`.

All pages were fully extracted with pypdf, rasterized with pypdfium2 at scale 1.4, and individually visually inspected. Source renders: `/var/folders/70/6pb0xycx4qqcn3yd1g5spg0r0000gn/T/lab08-source-tfy_wuvb/page-{1,2,3,4}.png`. Extraction warned about invalid object offsets; all four pages rendered and visible contents agreed with text. Original PDF bytes are preserved and not copied to public/dist.

| Source | Teaching / original diagram / model |
|---|---|
| p1, state moved out of web tier; Figure 12 local sessions A/B/C bound to servers | Thai distinction between local session and shared session; original responsive comparison figure. Initial deterministic scenario has A's valid session only at Web 1. Sending to Web 2 returns NO_SESSION. |
| p2, sticky sessions and difficulty adding/removing/failing servers; Figure 13 shared store | Sticky prefers Web 1. Health-aware fallback can select another web but cannot move session state. Shared mode allows another healthy web to read A's session. |
| p3, Figure 14 stateless web pool and separate shared state alongside broader architecture | Original live request diagram with client cookie, LB, web pool, state location and result. Thai wider-system explanation distinguishes session store, business DB, data cache and static CDN. |
| p3–4, storage choices and autoscaling | Thai scaling section explains moving shared state/files out of a particular web host, traffic-based add/remove, and separately scaling/operating the store. Web 3 can be added to the model. |
| p4, transition to multiple data centers | Context only; no claim that this lab simulates geographical routing or multi-region consistency. |

### Explicit teaching additions and caveats

Cookie/authentication remain necessary in the chosen session model; this is not a claim that all stateless designs require server-side sessions. A is already signed in; this simulation does not implement login, expiry or cryptography. Scenario changes initialize a new setup, not a real live migration. Web health detection is assumed complete and fallback deterministically chooses the first healthy web; sticky routing and state availability are different concerns. A failed shared store fails session checks in this model; no invented local caching/failover guarantee. Adding web servers does not repair store latency/capacity/outage. Redis durability depends on configuration; Memcached is volatile cache, not automatically persistent storage. SQL/NoSQL choice is workload-dependent, not a universal scaling guarantee. Shared profile-file storage, LB/store availability, expiry and recovery caveats extend the simplified source. No real timings, provider traffic, benchmarks or autoscaler are simulated.

Source/PDF/page attribution is confined to developer documentation, not the visible lesson. Figures are original accessible HTML/CSS, not copied source figures.

## TDD and regression evidence

Ignored evidence lives under `evidence/lab08/`.

Vertical slices observed RED then GREEN: new stable curriculum/history (`red-history.txt`, `green-history.txt`), local-vs-shared routing (`red-routing.txt`, `green-routing.txt`), failure/fallback/new web (`red-failure.txt`, `green-failure.txt`), compiled UI/accessibility (`red-ui.txt`, `green-ui.txt`), new bank (`red-bank.txt`, final Node suite). Existing generic backend history/qualification coverage is regression characterization, not falsely claimed as a failing backend feature test.

| Actual command | Result |
|---|---|
| `PATH=/usr/local/bin:$PATH npm test` in `courses/scale-lab` | 59 passed (`node.txt`) |
| `PATH=/usr/local/bin:$PATH npx playwright test --reporter=list` | 40 passed (`browser-suite.txt`) |
| `PATH=/usr/local/bin:$PATH npx playwright test --config playwright.account.config.js` | First 14 pass / 1 stale worker-UI test failure; updated to meaningful stateless setup exclusion. Final 15 passed (`account-suite-final.txt`) |
| `.venv/bin/python -m pytest -q` in `appworks` | 399 passed (`backend.txt`) |
| `PATH=/usr/local/bin:$PATH node scripts/lab08-standalone-verify.mjs` | Passed isolated compiled standalone, no API calls, frozen Session/Queue numeric history retained, new ID persists across reload |
| `git diff --check` | Clean at QA closure |

Older standalone/participation/progress/qualification/exam/registration runners were not all re-executed. They must not be represented as passes for this change. Current generic action loops read the manifest; no definition total change is needed. Retired Queue UI references were removed from current browser/account suites; historical pure queue behavior is retained. This new consolidated real-account runner exercises every current definition and relevant lifecycle behaviors. An early mistyped log redirection failed before running and a temporary wrong-path log was removed.

## Isolated compiled real-account verification

Initial 8129 check found it free; production 8080 PID 81887 / 8081 PID 1363 were recorded, not signalled. Initial owned launcher PID 93679 (`proc_e4930a0c85a6`) was stopped for a rebuilt semantic selector. Resume PID 94864 (`proc_52eff0ecd620`) failed because no mail request had yet created `graph-boundary.json`. A later fresh launch PID 95962 (`proc_4325633f07ef`) failed binding: another session's PID 96594 had occupied 8129. Its process was not stopped. Those attempts are not successful account QA.

A confirmed-free **8130** was used with a separate fresh launcher/evidence tree:

```sh
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8130 --evidence evidence/lab08/isolated
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8130/login
LAB08_SERVER_INFO=server.json LAB08_EVIDENCE=evidence/lab08/isolated/ PATH=/usr/local/bin:$PATH node scripts/lab08-browser-verify.mjs
# Stop identified owned PID, then restart same private DB:
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8130 --evidence evidence/lab08/isolated --resume
LAB08_SERVER_INFO=server.json LAB08_EVIDENCE=evidence/lab08/isolated/ PATH=/usr/local/bin:$PATH node scripts/lab08-browser-verify.mjs --resume
```

Both readiness checks returned 200; both account journeys passed. One restart invocation first failed before contacting the server because concurrent runner edits changed its info path to `owned/server.json`; explicit `LAB08_SERVER_INFO=server.json` resolves this without overwriting another run's handle.

`isolated/browser.json`, `isolated/restart.json` and logs verify 38/38 definitions, all 11 qualified lessons, manual+simulation+thinking (including incorrect original A), both quiz permutations and semantic replay, lost response after server commit with identical retry UUID/payload, four concurrent duplicate requests, reload/relogin, second-account isolation (independent 2 points and new-lesson completion), and same-DB restart retention of both accounts. Guest redirects, return navigation, private asset 404s, asset loading and no JS errors are checked. Deep URLs still load default lesson, then semantic navigation selects the new lesson; no lesson-router claim. OTP uses the real registration flow with a loopback Graph HTTP double; no real provider emails. No raw OTP/cookies/credentials are written in reports.

| Handle | PID | Verified state |
|---|---:|---|
| `proc_5228f4a48345` | 97381 | Fresh isolated 8130 QA passed, then stopped |
| `proc_ad91b498d40d` | 97991 | Same-DB restart passed, then stopped |

`lsof` after closure found no 8130 listener. Only owned QA PIDs were signalled. Production listeners remained 81887 and 1363 through QA closure.

## Visual inspection / artifacts

Actual `isolated/diagram-{320,390,1440}.png` and `comparison-{320,390,1440}.png` were individually visually reviewed, plus full-page screenshots at all three widths. Figures stack on mobile, readable light text on dark cards, no clipped text/overflow. Computed diagram text sizes are at least 14px; browser suite checks explicit foreground/background contrast colors. Full-page images are downscaled by the inspection tool, so individual full-resolution figure captures are the readability evidence. No PDF/page caption appears. Keyboard Enter triggers the request.

`isolated/preservation.json` records hashes of the actually tested integrated output and lifecycle. Integrated JS `assets/index-CB-jhhyW.js`: SHA-256 `83ff298c06d963f82f777a25a6e5e4387d668aba22a82693b2b8609bc9bf09eb`; CSS `assets/index-DDPMVHwU.css`: `43a5efbcf632e8231b499eb7d13269f9d6e4fbf8af767f5eac3833c5b5986d80`. Initial separate build hashes and standalone path are in `build-hashes.json` / `standalone.json`; these are not substitutes for the actual final integrated tree.

`python3 scripts/lab08-preserve.py before` captured 102 protected root PDFs, production dist, .env, instance and backup files with the sanitized hash-only approach. `after` comparison found all 102 byte-identical at QA closure. No staging, commit, push, production SQLite write or dist replacement occurred in this implementation/QA phase. Deployment requires final review and a separate authorized backup/build/hash-match/restart step; do not infer deployment from these test results.
