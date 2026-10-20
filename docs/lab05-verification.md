# LAB05 Database replication — source map and verification

## Scope and preservation

User-approved order: **LAB05 = `replica`, LAB06 = `session`**. Stable IDs, participation allowlists and original incorrect/correct quiz indices remain unchanged. The manifest changes display order only. LAB04 cross-reference now uses the new order. Session retains its original guide §7 reference; replication displays its PDF page reference instead.

No backend production code/schema changes or account migrations. Existing completion and scores are retained, not evidence of studying the revised material. Private `replica-11` / `replica-12` assessment questions retain question IDs, lesson IDs, option IDs and answer `b`; wording now connects routing and qualified reliability to the PDF. Existing exam attempts keep their frozen snapshots and grades.

Standalone writes `scale-lab-progress-v2` with `{version:2,completed:[stable IDs]}`. Only when v2 is absent, old numeric progress is interpreted through a frozen **old** curriculum (5=session, 6=replica), deduplicated/validated and saved by ID. The old key is never overwritten. Present malformed v2 fails closed; blocked storage remains usable in memory. Account mode reads/writes neither local key. There is no synchronization with old open tabs: reload after rollout.

## Source inspection and qualifications

Source: root `Database-Replication.pdf`, 5 pages, SHA-256 `1e0ac10b33c5798a3a1b23e9a7d6cffe7ba02789e47c24c6726230f90d91885b`.

All five pages were extracted and rendered with PyMuPDF and visually inspected, including the supplied Figure 6. Evidence: `evidence/lab05/source/text.txt`, `page-1.png` through `page-5.png`. **Page 2 contains a Figure 5 caption but its image area is blank** (no image/drawing objects); the new fan-out illustration is based on the accompanying text, not a claimed copy of a missing figure.

| Pages | Lesson treatment |
| --- | --- |
| 1–2 | Single-primary copies, modifications to primary, distributing read-heavy work across replicas; terminology master/slave → primary/replica |
| 2–3 | Performance, reliability, availability, each with explicit conditions rather than guarantees |
| 3 | Failed replica → healthy replica, or primary read fallback; primary failure → guarded promotion, possible missing writes, recovery/replacement |
| 4, Figure 6 | Original accessible HTML/CSS diagram: DNS returns IP to client; HTTP bypasses DNS → LB → web pool → DB read/write routes; replication flows writer → copies |
| 5 | INSERT/UPDATE/DELETE to primary; Cache LAB07 and CDN LAB08 continuation, with Session LAB06 explicitly inserted by requested order |

Explicit supplements/qualifications: primary can read (also required by page 3 fallback), asynchronous lag/read-after-write, backup vs copies, failure domains, health/capacity, fencing/split-brain, RPO/RTO. Recovery scripts cannot guarantee recovery of writes absent from all surviving logs/copies. Multi-master/circular replication remain out of scope. UI labels these distinctions.

## Simulation

Three DB nodes, manual write/read/sync, deterministic read rotation among healthy replicas, primary fallback, unavailable-primary writes returning simulated 503 without mutation. Sync sends only to healthy copies and does not award when no work/source is available. Guarded promotion requires old primary down, Replica 1 healthy, explicit fencing and explicit acceptance when writes would be lost. Promotion is unscored and cannot run twice. Old writer stays fenced until reset. Equal version numbers on different post-promotion histories are detected; sync then explicitly models a simplified reconcile/reseed, not real log replay.

Versions are abstract write steps, not global transaction IDs or elapsed time. There are no real DB/network operations, election algorithm, automatic healing, benchmark or measured RPO/RTO. Conditions/reset/promotion do not create new scoring identities. Four original simulation actions remain `write`, `read-replica`, `read-primary`, `sync`.

## Executed verification

All Node commands used `PATH=/usr/local/bin:$PATH` (existing compatible Node); no dependency/lockfile changes.

| Command / runner | Actual result |
| --- | --- |
| `cd appworks && .venv/bin/python -m pytest -q` | **397 passed**, including new isolated account/manifest-order/bank-snapshot preservation regression |
| `cd courses/scale-lab && npm test` | **44 passed** |
| `npm run test:e2e` | **31 passed** |
| `npx playwright test --config playwright.account.config.js` | **15 passed** (API-boundary browser tests) |
| `python3 scripts/courses.py validate` | `OK scale-lab: /courses/scale-lab/` (registry validation, not deployment) |
| `git diff --check` | clean |
| `node scripts/lab05-browser-verify.mjs` | real compiled Flask/OTP mail-double QA passed: all four original replica actions, lag/fallback/failure/promotion, sync no-op exclusion, incorrect/correct quiz IDs across opposite shuffled presentations, completion and second-account isolation |
| Same runner `--resume` after actual QA process restart and final rebuild | passed; 8 points and `replica`/`session` qualified, other account still empty; final screenshots refreshed |
| `PARTICIPATION_QA_EVIDENCE=evidence/lab05/ node scripts/participation-browser-verify.mjs` | passed: **42 distinct action definitions**, account scores 42/1; real response-loss-after-commit retry, captured UUIDs, reload/relogin, mobile |
| Same participation runner `--restart` | passed, actual PID changed; scores 42/1 retained |
| `CLASSROOM_QA_URL=http://127.0.0.1:8126 CLASSROOM_QA_MAIL_DIR=<private QA directory> node scripts/browser-verify.mjs` | passed: actual OTP signup/login, authenticated assets, guest/logout protection, interactive lab, return navigation, deep refresh and mobile; no browser errors |

Vertical RED→GREEN slices: order/local identity migration, normal replication, failure routing, guarded promotion, divergent equal-version histories, source/private assessment wording, browser topology/interaction and second original figure. The backend preservation test is explicitly regression characterization, not claimed as a RED feature change. Two QA selector mistakes (non-unique `.eyebrow`, then two diagram matches) were corrected and final suites rerun successfully.

### Isolated build and launcher

QA launcher: `PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8126 --evidence evidence/lab05`; restart adds `--resume`. Only the identified QA process was stopped/restarted. `evidence/lab05/server.json` records its private temporary paths; raw OTP/cookies are not public artifacts.

Final standalone build:

```sh
PATH=/usr/local/bin:$PATH npm run build -- --outDir /tmp/classroom-lab05-standalone-dist --emptyOutDir
```

Final integrated build (while QA stopped, **never live dist**):

```sh
PATH=/usr/local/bin:$PATH VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir /var/folders/70/6pb0xycx4qqcn3yd1g5spg0r0000gn/T/classroom-registration-smht944r/courses/scale-lab/dist --emptyOutDir
```

Both built **23 modules** successfully. Final integrated assets: `index-Dm5iMea9.js` (124.17 kB), `index-BeedKiz0.css` (17.06 kB). Final standalone JS: `index-DN-a5Vn6.js` (118.51 kB). Hashes and exclusion checks are in `evidence/lab05/build-and-preservation.json`.

## Evidence and review

- `evidence/lab05/browser.json`, `restart.json`
- `evidence/lab05/participation-browser.json`, `participation-restart.json`
- `evidence/lab05/platform-browser.json`, `graph-boundary.json`
- `evidence/lab05/diagram-{320,390,1440}.png`, `fanout-{320,390,1440}.png`
- `evidence/lab05/integrated-{320,390,1440}.png`, `full-{320,390,1440}.png`
- `evidence/lab05/protected-files-before.json`, `build-and-preservation.json`

Diagram screenshots at 320/1440, fan-out screenshots at 320/1440, 390 integrated UI and final desktop full page were visually inspected. Both figures use real responsive text (at least 14px), semantic figure/caption markup and labeled keyboard controls; no SVG text shrinking. Browser assertions cover no horizontal overflow at 320/390/1440. This is not a formal screen-reader or WCAG audit.

During isolated implementation QA, both input PDFs and existing live dist files hashed unchanged. Source PDFs, private bank and sourcemaps were absent from public and both isolated output trees. Production SQLite/.env were not opened or modified in that phase; 8080/8081 were not used or stopped. No staging, commit, push or provider mail. The subsequent authorized deployment is recorded below.

## Authorized local LAB05 deployment — 2026-10-20

- Initial deployment discovery found **no 8080 listener**, no waitress executable process, and historical LAB04 PID 80264 absent; a direct 8080 probe failed with `URLError`. Therefore no process was killed. The unrelated Docker listener PID 1363 on 8081 was identified before and after and left untouched.
- Securely parsed private `appworks/.env` without printing credential values. No APPWORKS/OUTLOOK process overrides were present. Preserved the existing `service:create_app` configuration (Graph enabled, approved local mode, non-secure loopback cookie); no provider email was requested.
- Backup: **`/Users/prommeesee/Documents/04_Learning/classroom/backups/lab05-20261020T135911`**. SQLite backup API copied `appworks/instance/classroom.sqlite3` to `classroom.sqlite3`; integrity was `ok`. Private profile/community upload directories and existing course `dist` were copied and hash-compared before rebuilding. Backup directory permissions are private. All database tables matched the backup before build; no row contents were printed.
- `PATH=/usr/local/bin:$PATH python3 scripts/courses.py build`: exit 0, Vite 23 modules, 431 ms. `python3 scripts/courses.py validate`: exit 0, `OK scale-lab: /courses/scale-lab/`.
- All four published files match **exactly** the tested isolated hashes in `evidence/lab05/build-and-preservation.json`, including `index-Dm5iMea9.js` and `index-BeedKiz0.css`. No extra published files. Both source PDFs remain hash-identical.
- Started from `/Users/prommeesee/Documents/04_Learning/classroom/appworks`: `umask 077; exec .venv/bin/waitress-serve --listen=127.0.0.1:8080 --call service:create_app`. PID **19937**, tool process handle **`proc_a970f9d33079`**; `lsof` verified cwd and loopback listener ownership by `prommeesee`.
- Live HTTP: `/login` **200**; guest course HTML and both LAB05 JS/CSS URLs **303 → /login**. URL: **http://127.0.0.1:8080/**. Authenticated browser behavior was exercised on the isolated build above, not by creating or impersonating production accounts; published-file hashes tie this deployment to that tested build.
- Post-start SQLite integrity `ok`, schema unchanged, and all non-session tables identical row-for-row to backup, including accounts, progress/manual completion, participation, achievements and immutable exam attempts. Existing sessions are preserved; the login health probe adds an anonymous session as designed. Private uploads, `.env` and both PDFs remain unchanged.
- Sanitized machine evidence: `evidence/lab05/deployment.json`. Deployment backup/verification helper: `/tmp/classroom-lab05-deploy.py`. Build, validation and preservation verification returned exit 0; `git diff --check` passed. No build/hash/preservation failure; only the initial absent-service probe differed from the historical handoff.
- No stage, commit, push, schema migration or production account mutation. Service remains running for parent ownership/handoff and independent readiness verification; delegated process lifetime is not guaranteed beyond the tool session.
