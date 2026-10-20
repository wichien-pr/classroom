# LAB06 Cache replacement — verification and private source map

## Latest copy edits and deployment

After the initial release, the Cache notes were shortened into plain Thai headings/bullets. The final heading is “ข้อมูลที่ใช้บ่อย งานที่ใช้เวลานาน ไม่ต้องทำซ้ำทุกครั้ง”; the introduction uses “ใช้เวลาประมวลผลมาก”. No simulation or scoring behavior changed. Final published JS is `index-Sc8RF0Vp.js`; the older hashes below describe the original QA build, not this copy revision.

Final wording deployment: backup `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab06-wording-20261020T152817`; service PID 61104, handle `proc_ad276bfbd9fc`. Integrated build/validation and isolated/published hash comparison passed. Login 200, guest course/JS 303; new heading present and old wording absent in published JS. DB integrity/schema and non-session rows, existing sessions, uploads and source PDF preserved; readiness creates an anonymous session. Port 8081 untouched. Evidence: `evidence/lab06/wording-deployment.json`.

Fresh precommit regressions after the final copy changes: 398 backend, 50 Node, 33 browser and 15 account-browser tests passed. These ran against the working tree including the pre-existing, intentionally uncommitted `single-server.js` edit. The copy revision had two focused source-browser checks and isolated build comparison; the earlier full authenticated compiled QA journey was not rerun for copy-only revisions.

## Authorized local deployment

Deployed after subsequent user authorization. Backup: `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab06-20261020T151040` (SQLite backup API, integrity `ok`, private uploads and previous dist hash-verified). Initial 8080 listener was absent; no process was killed. Docker PID 1363 on 8081 remains untouched.

`PATH=/usr/local/bin:$PATH python3 scripts/courses.py build` and `python3 scripts/courses.py validate` both exited 0: 26 modules, build 494 ms. Every published file matches the final isolated integrated hashes recorded below. Cache.pdf and private environment remained unchanged; credentials were not printed.

Started `.venv/bin/waitress-serve --listen=127.0.0.1:8080 --call service:create_app` from the verified `appworks` cwd, PID **54219**, handle `proc_9a1b6a618dac`. URL **http://127.0.0.1:8080/**. Actual `/login` returned 200; guest course HTML and both published JS/CSS routes returned 303 to `/login`. Authenticated functionality was tested on the hash-identical isolated build, not by using production accounts.

Post-start integrity `ok`, schema unchanged, all non-session tables match backup row-for-row, including historical Session records. Existing sessions preserved; the login readiness check adds an anonymous session. Uploads and source PDF hashes remain unchanged. Machine report: `evidence/lab06/deployment.json`. No commit/push performed. A helper-generation attempt initially raised `KeyError: content` before any deployment write; corrected generation and all backup/build/readiness/preservation checks passed.

The following sections describe the earlier implementation/isolated QA phase; their no-deployment statements apply to that phase only. Reload old tabs to use the new 11-lesson client.

## Outcome and release boundary

Implemented on existing `lab06` branch in `/Users/prommeesee/Documents/04_Learning/classroom`. Session is **removed**, not swapped into another slot. Active order: `flow workload stock balance replica cache cdn queue observe region shard`. Cache is displayed once, as LAB06; subsequent labs are numbered 07–11. No staging, commit, push or deployment was performed.

Programmatically counted from the manifest: **11 lessons, 16 simulation actions, 22 original-choice thinking actions, 38 total durable definitions, 22 private assessment questions**. The old total was 42; Session owned two simulation and two thinking actions, so removing it removes **four**, not three. Historical account participation totals still include retained Session awards and can exceed the active definition count.

No production `dist`, `.env`, SQLite, backups or listeners 8080/8081 were changed by these commands. Baseline hashes prove `Cache.pdf`, the pre-existing dirty `src/single-server.js` bytes and every existing production dist file unchanged; `Database-Replication.pdf` remains absent as it was initially. No production DB was opened or hashed by this verification. The source manifest is dynamically discovered by Flask: if a live instance points to this same source tree, metadata changes can be visible without restart. This report does **not** claim a synchronized live release of the new client; deployment must be separately authorized and coordinated.

## Source inspection (developer-only; never emitted by LAB06)

Source: root `Cache.pdf`, 3 pages, SHA-256 `85753dce0c36acb74c00d333e193b113d11a006ea06f91cf1d7d785e3e7d0d91`. All extracted text was read, and all three rendered page images were visually inspected before implementation. Artifacts: `evidence/lab06/source-text.txt`, `source-1.png`, `source-2.png`, `source-3.png`. The supplied file was not modified or copied into public/dist.

| Source location | Inspected content/figure | Implementation |
|---|---|---|
| Page 1, Cache / Cache tier, Figure 7 | Web servers branch to a separate cache tier and databases; temporary in-memory data, repeated DB calls, independent scaling | Thai motivation/tier discussion; original responsive DOM diagram showing client/app, cache lookup, hit return, miss DB read/refill |
| Page 2, continuation / considerations | Check cache → on miss query DB, store result, respond; Memcached set/get and 3,600-second example; read-heavy/write-light fit; volatile memory; expiration tradeoffs; consistency outside one transaction; failure mitigation and memory headroom | Full Thai sections, illustrative API snippet, serial cache-aside simulation, manual TTL clock, invalidation, outage fallback and restart |
| Page 3, Figure 8 / eviction | Left: many web servers rely on one failed cache; right: multiple cache servers reduce single-server dependence. LRU/LFU/FIFO eviction | Original single-dependency/fallback figure plus explicit multi-server/failure-domain caveats; eviction comparison cards |

Terminology review: the text calls its app-driven miss/refill example “read-through.” The lesson distinguishes operational ownership: this simulator is **cache-aside/lazy loading** because the application performs the DB read/set; strict read-through delegates loading to the cache layer/loader. It does not claim Memcached `get` queries a DB automatically. This clarification is deliberate, not a silent claim that both architectures are identical.

Teaching supplements, not source benchmarks: product prices 100/220, TTL 3 manual units, no-op scoring guards, stale-refill race, cache stampede, bounded-concurrency/timeout fallback and business correctness. Expiration is distinguished from eviction; no-expiry does not mean data cannot be evicted or lost. There is no real latency/load measurement, network/DB, concurrent refill, distributed transaction, automatic multi-cache failover or eviction-policy simulator. Cache loss never changes the durable DB model. The diagrams are original HTML/CSS illustrations, not copied source figures.

The visible Cache lesson contains no filename, PDF or page attribution. Browser checks assert this at 320/390/1440px. Source mapping is kept here only.

## Durable identities and history

- Existing `cache` lesson/simulation identity and `read-cache`, `update`, `invalidate` actions remain unchanged.
- Original `answers[0]` / `answers[1]` text and `quiz-answer-a` / `quiz-answer-b` identities remain; visual A/B order still shuffles independently.
- Cache private question IDs `cache-13`, `cache-14`, option IDs a/b/c, and correct IDs a/b remain. Wording now covers volatile storage and TTL/consistency. Session questions are removed only from the active bank. Existing immutable attempt snapshots are not rewritten.
- Frozen numeric local history is still 5=Session, 6=Replica, 7=Cache, 12=Shard, regardless of current display numbers. Versioned storage retains retired Session IDs when a different lesson completes; only current IDs contribute to display. Account mode never imports browser history.
- Backend behavior is unchanged. New preservation characterization proves retained Session manual/progress/award/receipt rows never qualify Cache, historical score remains, current qualification needs its own evidence, and a pre-removal immutable exam remains submittable after application recreation. Old Cache completion is retained; it does not certify that the learner revisited revised content. Permanent L9 history is not reset.
- Existing LAB05 preservation fixture is now frozen independently from the active Session-free bank.

## Actual verification

| Command (cwd where relevant) | Result |
|---|---|
| `cd appworks && .venv/bin/python -m pytest -q` | **398 passed** |
| `cd courses/scale-lab && npm test` | **50 passed** |
| `PATH=/usr/local/bin:$PATH npx playwright test` (course) | **33 passed** |
| `PATH=/usr/local/bin:$PATH npx playwright test -c playwright.account.config.js` (course) | **15 passed** |
| `node scripts/lab06-browser-verify.mjs` | Fresh real OTP registrations through loopback provider double; every one of **38** current action definitions exercised; all **11** lessons qualified |
| `node scripts/lab06-browser-verify.mjs --resume` | Same QA DB, different actual process; every current action re-exercised with no extra award; all 11 qualifications, manual markers and isolated second-account zero state persisted |
| `node scripts/lab06-standalone-verify.mjs` | Compiled standalone build; OS-selected loopback port; no account API calls; frozen numeric migration, retired Session retention, miss/hit/stale/TTL, layout checks passed; server closed in finally |
| `python3 scripts/courses.py validate` | Current manifest validates; does not rebuild published dist |
| `discover_courses(qa_courses_root, strict=True)` | Isolated integrated manifest/build valid with 11 lessons |
| `git diff --check`; `node --check` over 32 `scripts/*verify.mjs` files | Passed |

Total unit/API/browser/account cases: **496**, plus the isolated compiled integration/standalone/restart journeys. Log files are under `evidence/lab06/`. Other historical one-off QA launchers were not rerun; their curriculum-count assertions were updated where applicable. This is not a claim that every historical manual runner or unrelated provider integration ran.

TDD vertical slices: curriculum removal (RED extra Session → GREEN); retaining retired local history on save (RED missing merge → GREEN); manual-TTL cache model (RED missing model → GREEN); invalid/no-op actions and outage fallback (RED → GREEN); browser wiring/content/wraparound (RED old 12-label → GREEN); assessment wording (RED missing memory/TTL coverage → GREEN); computed visual contrast (RED ratio below 4.5 → GREEN); preserving other lessons’ reference chapters after slot removal (RED shifted chapter → GREEN). Logs retain initial failures. The initial browser test also exposed a test-selector strict-mode ambiguity; it was narrowed to the lesson heading, not hidden by weakening the assertion. Existing backend preservation tests are explicitly **characterization**, not claimed new RED→GREEN backend behavior.

### Compiled browser checks

Real registration creates pending signup, consumes an actual locally captured OTP, then logs in; no registration bypass and no provider mail. Graph boundary report records two token requests, two mail requests, `externalNetwork:false`; raw codes/cookies remain only in the private temporary QA directory, never reports.

Verified: cache miss/hit/stale/invalidation and TTL, outage DB bypass/restart, invalid and no-op operations excluded from scoring, manual-first completion using an incorrect thinking answer, participation-first completion for remaining lessons, both shuffled quiz permutations preserving semantic dedup, repeated/reset/reload/relogin dedup, lost response after real commit with identical retry payload/UUID, concurrent duplicate requests, all definitions/lessons, account isolation and same-DB process restart. Private assessment/PDF course URLs return 404. Asset responses and browser errors are checked. No secret/session storage files are published in evidence.

### Builds and visual review

Both builds used existing dependencies and `PATH=/usr/local/bin:$PATH`; no install or lockfile changes. Standalone command was `npm run build -- --base / --outDir <isolated-standalone>/dist --emptyOutDir` with empty integration variables. Integrated command was `VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir <qa-courses>/scale-lab/dist --emptyOutDir`. Exact paths are in `standalone.json` and `server.json`. The ordinary integrated build script was **not** run in build mode because it would overwrite production dist.

Final integrated JS: `assets/index-uT92CFVi.js`, SHA-256 `16f437ad20abc95f39be7e8c8920a61ffd6452b02a7734e309b4aabc699c8255`.
Final standalone JS: `assets/index-BL_0uTMP.js`, SHA-256 `d089890bbc356eb63196731f855053934f129b0af0454d9c0627c6fa0e098580`.
Shared CSS: `assets/index-w1RZB6tk.css`, SHA-256 `9752b3729cb7080db1e94a200313df4d76d494b37ad7b067305c41082dce2f9a`.
Full asset/HTML hashes: `build-hashes.json`. Supplied PDF and private bank are absent from both builds.

Screenshots: `integrated-320.png`, `integrated-390.png`, `integrated-1440.png`, `diagram-*.png`, `failure-*.png`, `full-*.png`. Actual screenshot review found the first dark-card colors inherited dark text; colors were fixed, a >=4.5 computed contrast regression added, isolated assets rebuilt and screenshots reviewed again. Final mobile diagram/failure labels and desktop path branches are readable without clipped labels or crossing connector strokes. Browser assertions found no horizontal overflow at any requested width. Tall element captures avoid sticky-header obstruction.

## QA lifecycle and preserved artifacts

Launcher: `PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8127 --evidence evidence/lab06`, restarted with the same options plus `--resume`.

Owned handles: `proc_fe795e8e0f69` (PID 45386), `proc_471eb3634700` (PID 47153), final `proc_93eed93084dc` (PID 50227). All stopped using their exact owned handles. Final loopback connect check proves port 8127 closed. No production service was stopped or started. `lifecycle.json` records the result. Temporary QA DB/mail/build files and evidence are preserved for review; no production backup was created or modified. The shell emitted a pre-existing `.zshrc` missing `ng` warning; it did not prevent any build/test/service execution.

No implementation blocker remains. Deployment is deliberately unperformed. The separate app/server and source manifest must be released together under an authorized rollout; old tabs should reload.

## Exact source files changed by this task

The pre-existing dirty `courses/scale-lab/src/single-server.js`, deleted `Database-Replication.pdf`, and untracked `Cache.pdf` are excluded from this ownership list because they were preserved, not authored here.

- `README.md`
- `appworks/tests/test_exam_security.py`
- `appworks/tests/test_lab05_preservation.py`
- `appworks/tests/test_lab06_preservation.py`
- `courses/scale-lab/assessment.json`
- `courses/scale-lab/course.json`
- `courses/scale-lab/src/cache-view.js`
- `courses/scale-lab/src/cache.css`
- `courses/scale-lab/src/cache.js`
- `courses/scale-lab/src/lessons.js`
- `courses/scale-lab/src/local-progress.js`
- `courses/scale-lab/src/main.js`
- `courses/scale-lab/tests/account/completion.spec.js`
- `courses/scale-lab/tests/account/navigation.spec.js`
- `courses/scale-lab/tests/account/participation.spec.js`
- `courses/scale-lab/tests/account/progress.spec.js`
- `courses/scale-lab/tests/account/qualification.spec.js`
- `courses/scale-lab/tests/browser/app.spec.js`
- `courses/scale-lab/tests/browser/cache.spec.js`
- `courses/scale-lab/tests/browser/completion.spec.js`
- `courses/scale-lab/tests/browser/labs.spec.js`
- `courses/scale-lab/tests/browser/participation.spec.js`
- `courses/scale-lab/tests/browser/quiz-order.spec.js`
- `courses/scale-lab/tests/browser/regressions.spec.js`
- `courses/scale-lab/tests/browser/replication.spec.js`
- `courses/scale-lab/tests/browser/terms.spec.js`
- `courses/scale-lab/tests/cache-curriculum.test.js`
- `courses/scale-lab/tests/cache-history.test.js`
- `courses/scale-lab/tests/cache.test.js`
- `courses/scale-lab/tests/lesson-order.test.js`
- `courses/scale-lab/tests/participation.test.js`
- `courses/scale-lab/tests/quiz-contract.test.js`
- `docs/course-contract.md`
- `docs/lab06-verification.md`
- `docs/participation-contract.md`
- `scripts/lab02-browser-verify.mjs`
- `scripts/lab03-browser-verify.mjs`
- `scripts/lab04-browser-verify.mjs`
- `scripts/lab05-browser-verify.mjs`
- `scripts/lab06-browser-verify.mjs`
- `scripts/lab06-standalone-verify.mjs`
- `scripts/participation-browser-verify.mjs`
- `scripts/password-reset-browser-verify.mjs`
- `scripts/password-reset-graph-browser-verify.mjs`
- `scripts/progress-browser-verify.mjs`
- `scripts/qualification-browser-verify.mjs`
- `scripts/qualification-restart-verify.mjs`
- `scripts/quiz-shuffle-browser-verify.mjs`
- `scripts/registration-browser-verify.mjs`
- `scripts/single-server-browser-verify.mjs`

Evidence is an additional ignored directory `evidence/lab06/`; `report.json` contains the machine-readable counts, definition coverage, preserved hashes, build hashes and owned file inventory. Existing historical evidence reports were not rewritten by the new LAB06 runners. The normal course suites still use their pre-existing course-local test-output locations.
