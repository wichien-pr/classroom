# LAB07 CDN — implementation and verification

## Authorized local deployment

After isolated QA, deployed on explicit user authorization. Identified production `service:create_app` PID 61104 and its appworks cwd, then stopped only that process. Backup: `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab07-20261020T161114` — SQLite backup API and integrity `ok`, private profile/community uploads and old dist hash-verified before rebuilding.

`PATH=/usr/local/bin:$PATH python3 scripts/courses.py build` succeeded (29 modules, 471 ms); `python3 scripts/courses.py validate` exited 0. Every published file exactly matches the isolated integrated QA hashes below. Restarted `.venv/bin/waitress-serve --listen=127.0.0.1:8080 --call service:create_app` from verified appworks cwd, PID 81887, handle `proc_09dc533d9954`. URL: http://127.0.0.1:8080/.

Actual login HTTP 200; guest course HTML and both compiled assets HTTP 303 to login. Authenticated behavior was verified on the hash-identical isolated build, not with production accounts. Post-start database integrity `ok`, schema unchanged, all non-session tables identical to backup; existing sessions preserved, with an anonymous readiness session added. Private uploads, PDF files and `.env` unchanged. Port 8081 remains Docker PID 1363, untouched. No staging, commit or push. Machine report: `evidence/lab07/deployment.json`.

The no-deployment statements in the implementation sections below describe the earlier isolated QA phase only.

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`, branch `lab07`.

## Result and scope

Replaced the existing LAB07 CDN policy-only exercise with Thai static-content teaching, three original responsive HTML/CSS figures, and a stateful CDN exercise. No lesson reordering or removal: 11 stable lessons, 38 durable action definitions remain. No backend, schema, migration, manifest, dependency, production build or account-data change. No staging, commit, push or deployment.

The request button retains `cdn / cdn / decision`. Each click actually attempts an image request (including failure), so it is meaningful; the server still awards that semantic action only once. Setting TTL, changing URL/key policy, advancing time, publishing, invalidating, failure switches, reset and navigation never submit participation. The quiz retains original index 0/1 and `quiz-answer-a` / `quiz-answer-b`; incorrect remains index 0, correct remains index 1 regardless of randomized display order. Private bank IDs `cdn-15`, `cdn-16`, option IDs a/b/c and correct ID a are preserved. Other questions and immutable historical data are unchanged. The private assessment bank is source-read: future live exam assembly may see the revised wording even without replacing client dist. No production attempt was created in QA; already frozen attempt snapshots are not rewritten.

Old CDN awards and completion remain valid; this replacement does **not** certify that previously qualified accounts have studied the new material. Existing manual + simulation + thinking qualification, account ownership, retry and deduplication remain platform-owned.

## Developer-only source map

Source: root `cdn.pdf`, **4 pages**, SHA-256 `043fdfff2e84284a13be9a713c9e33a58a13b55dc109a62fe78ebfcaeba96863`.

All four pages were text-extracted with `pypdf`, rendered at scale 1.4 with `pypdfium2`, and visually inspected individually. Private renders: `/var/folders/70/6pb0xycx4qqcn3yd1g5spg0r0000gn/T/lab07-source-h_hnn1sx/page-{1,2,3,4}.png`. The extractor warned about six invalid object offsets; all pages rendered and the extracted text agreed with the visible pages. The PDF was not rewritten, copied into public/build output or staged.

| Source | Teaching / original figure / simulation |
|---|---|
| p1: geographically dispersed servers; images/video/CSS/JS; static focus, dynamic caching out of scope; figure 9 compares origin distance and distributed CDN | Lesson introduction; `cdn-distance` compares direct origin with a nearby service point. Original text boxes, not a copied map. No invented latency numbers. |
| p2: figure 10, A requests → cache miss → origin response with lifetime → store/return → B requests → cache hit | `cdn-diagram` shows client/CDN/origin and separate HIT/MISS routes; ordered six-step explanation; first request loads origin, subsequent request uses the same edge copy. Origin can be web server or object storage. |
| p2: third-party data transfer costs and low-use assets | Cost section explains measuring usage/hits/bytes and considering whether rarely used files benefit; no fabricated prices or guaranteed savings. |
| p3: expiry tradeoff | TTL selector (1/3/6 abstract units), explicit time button, stale copy after origin changes, expiry boundary and reload on next request. HIT never refreshes expiry. |
| p3: clients detect CDN outage and request origin | Separate CDN/origin availability and explicitly enabled client fallback. CDN outage without fallback fails; fallback needs an available origin and does not refill the failed CDN. |
| p3: vendor invalidation API and URL versioning (`image.png?v=2`) | Invalidate current key; publish new origin version; use a new URL; demonstrate query-key inclusion versus ignoring query. |
| p4: figure 11 separates static CDN delivery from load-balancer/web/cache/database/replicas | `cdn-system` explicitly separates the static route from web/API and data-cache routes. Database replicas are not CDN nodes. |

### Technical caveats / teaching additions (not claims made by the source)

- “Nearest” is a routing/service selection goal, not a guarantee of the geographically nearest point or universally lower latency.
- HTTP freshness uses policies such as `Cache-Control: max-age` plus CDN configuration, not a universal header literally named TTL. Expiry is not a guarantee that data remains stored until then; real systems may evict/revalidate. The exercise refetches the full file after expiry.
- Version query parameters must participate in the cache key, and the page must reference the new URL. Versioning does not physically remove the old cached URL. The model's origin returns its current image for every query; a real versioned publication must map URLs to the intended content.
- Purge propagation takes time in real deployments. The model assumes a successful purge at its single simulated edge; it does not promise instant global invalidation.
- Fallback needs explicit client behavior, a usable origin URL/permissions and sufficient capacity. A fresh cached hit can still work during an origin outage; expired/missing content cannot be fetched in this model. No stale-on-error guarantee is invented.
- Figures retain DNS/IP and web/DB context only for orientation; the simulation does not implement DNS or database replication.
- No real network requests, latency, throughput, prices, eviction, concurrent requests, revalidation or multi-edge propagation are simulated. Units are abstract, not seconds.

These provenance references exist only here, not in visible LAB07 content. At all tested widths, the browser asserted no PDF/source/page attribution. Existing unrelated lessons were not rewritten.

## TDD and regression results

Logs are in ignored local `evidence/lab07/` (not public assets).

Vertical slices, each followed by an actual green run:

1. First request MISS / next request HIT: `red-request.txt` initially failed because the new module did not exist, then `green-request.txt`; full initial Node regression passed.
2. Origin update / stale copy / exact TTL boundary: `red-ttl.txt` failed `1 !== 2`, then `green-ttl.txt` passed.
3. Invalidation / URL cache-key separation: `red-invalidation.txt` failed expected MISS versus HIT, then `green-invalidation.txt` passed.
4. CDN/origin outage / explicit fallback: `red-failure.txt` failed expected failure versus miss, then `green-failure.txt` passed.
5. Browser controls and accessible figures: `red-ui.txt` failed against the old policy-only UI, then all four new browser tests passed in `green-ui.txt`.
6. Source-grounded lesson/private bank wording with stable IDs: `red-content.txt` failed against the old lesson wording; `node-final.txt` passed.

| Actual command (working directory) | Final result |
|---|---|
| `PATH=/usr/local/bin:$PATH npm test` (`courses/scale-lab`) | **55 passed**, 0 failed |
| `PATH=/usr/local/bin:$PATH npx playwright test --reporter=list` (`courses/scale-lab`) | **37 passed**, 0 failed (`browser-final.txt`) |
| `PATH=/usr/local/bin:$PATH npx playwright test --config playwright.account.config.js` (`courses/scale-lab`) | **15 passed**, 0 failed |
| `.venv/bin/python -m pytest -q` (`appworks`) | **398 passed**, 0 failed |
| `python3 scripts/courses.py validate` (root) | `OK scale-lab: /courses/scale-lab/` |
| `git diff --check` (root) | clean |

The first full browser run had **36 pass / 1 fail**: the old cross-lesson test expected the retired CDN private/public selector. Its observe/region assertions remain, while CDN now has dedicated HIT/MISS/failure UI coverage. The rerun passed all 37. One attempted log redirection used an incorrect extra `../` and failed before running; reran/retained the correct root evidence path. No dependencies were installed or deleted.

## Compiled standalone and integrated QA

### Isolated builds

- Integrated: launcher ran `npm run build -- --base /courses/scale-lab/ --outDir /var/folders/70/6pb0xycx4qqcn3yd1g5spg0r0000gn/T/classroom-registration-cuy_da9z/courses/scale-lab/dist` with `VITE_CLASSROOM_URL=/` and `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress`.
- Standalone: `PATH=/usr/local/bin:$PATH npm run build -- --outDir /var/folders/70/6pb0xycx4qqcn3yd1g5spg0r0000gn/T/classroom-lab07-standalone-4g9retwt/dist`; log `build-standalone.txt`. No integration environment supplied.
- `PATH=/usr/local/bin:$PATH node scripts/lab07-standalone-verify.mjs`: passed compiled HIT/MISS/stale/expiry, 320/390/1440 overflow/attribution checks, no account requests, local reload persistence and retained retired Session history. Its OS-selected HTTP listener is closed in `finally`.
- Both builds were scanned: no PDF, private assessment, source map or SQLite files. `preservation.json` includes every build-file hash and final source hashes.

| Build asset | SHA-256 |
|---|---|
| Integrated `assets/index-DMQvXTto.js` | `0ab670d9f97a9f69c365bd9258f7287ef899bbc4c471bd8b6f32c0e1ce84ad41` |
| Standalone `assets/index-C42jBGGx.js` | `f654302d544113dd3cb2dea12969fda4acc5bf27b2ea800ff7105cf65f6022c0` |
| Both `assets/index-i6PGIk0n.css` | `ae0d0a1588fa5a76b9bb01a8da6be3c116bd6ee8bbfd9f0ae14332c9cf577617` |

### Real OTP account journeys

Initial free port check found no 8128 listener. Exact commands from root:

```sh
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8128 --evidence evidence/lab07
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8128/login
PATH=/usr/local/bin:$PATH node scripts/lab07-browser-verify.mjs
# After stopping only the identified QA process:
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8128 --evidence evidence/lab07 --resume
PATH=/usr/local/bin:$PATH node scripts/lab07-browser-verify.mjs --resume
```

Every readiness request returned 200. Registration used actual browser OTP verification with the launcher's loopback Graph HTTP double, no production provider request or registration bypass. Raw mail/OTP and DB remain in its private temporary directory, not evidence. Reports contain no cookies, CSRF values, passwords or raw OTP.

`browser.json`, `restart.json` and run logs verify:

- All **38/38** current durable action definitions exercised through compiled controls, all 11 lessons qualified only after manual + simulation + thinking.
- CDN manual-first with an incorrect thinking choice qualifies; second account uses thinking → request → manual, not quiz-auto-completion.
- Both semantic quiz identities remain deduplicated across opposite display permutations and reload; original index 0 remains incorrect and index 1 correct.
- Main account score stays 38 after repeated requests, all-definition replay, reset/reload/relogin and process restarts. Four concurrent duplicate POSTs award zero; lost response after actual commit retries with identical captured UUID/payload.
- Extras produce zero participation POSTs. Failure requests remain meaningful but cannot create a second semantic award.
- Second account starts empty, then independently earns 2 points and CDN completion. Main account remains 38 points / 11 lessons. Further process restarts verify both accounts retain their independent state on the same DB. The final strict run requires the second account to have 2 points **before any new action** and its existing completion before replay (`restart-strict-run.txt`).
- Guest protection, return-to-catalog, logout/relogin, direct deep-route reload, successful assets, no JS errors; PDF and assessment URLs return 404. Deep routes still open the default lesson; navigation selects CDN (no lesson-router claim).

Server history (all owned QA listeners stopped):

| Handle | PID | State |
|---|---:|---|
| `proc_b57598b8fbde` | 73962 | initial build/server; terminated before first restart |
| `proc_dbedef034f39` | 75600 | same DB first restart; terminated before second restart |
| `proc_478b03ce1cab` | 76805 | same DB second restart; verified, then terminated |
| `proc_eb4cc755986c` | 78836 | final strict persistence rerun; verified, then terminated |

The process tracker reported the first wrapper already exited while its verified PID still listened; used `ps`/`lsof` and `kill -TERM` on the exact owned PID. Final `lsof` shows no 8128 listener. `ps` showed terminated `<defunct>` children awaiting parent reaping, not running servers. Production 8080 PID **61104** and 8081 PID **1363** remained the same throughout; neither was signalled.

### Visual review

Actual screenshots at **320 / 390 / 1440**: `integrated-*`, `diagram-*`, `distance-*`, `system-*`, `full-*`. The legacy-named `failure-*` shots also contain the system figure. Inspected the three diagram families at every width plus integrated/full-page views and a full-page crop. Thai text is readable, no clipping/overlap, no source caption; `.cdn-box small` computed size is at least 14px. Mobile stacks paths instead of shrinking an SVG viewBox. Keyboard Enter activates the request button. Layout checks use normal 1000px viewport height; figure captures use 2600px height to avoid sticky-header occlusion.

## Preservation and reproducibility

`python3 scripts/lab07-preserve.py before` recorded **313** baseline file hashes before implementation: tracked sources, root PDFs, production dist, `.env`, instance data and backups. `after` and `python3 scripts/lab07-final-proof.py` verify **94 protected files byte-identical**, unchanged source manifest, all private question/option/correct identities, unchanged non-CDN questions, no staged files, no PDFs in public/builds. Both root PDFs are ignored; the existing case-insensitive PDF ignore rule was unchanged. Production SQLite bytes and its historical exam snapshots were never mutated or opened for writes.

Only the planned CDN sources, lesson row, private assessment wording, tests, QA/proof scripts, README and this document change. Evidence and source renders are not deployment artifacts. Existing production remains the previously deployed release. To deploy later requires separate authorization and the established backup/build/restart workflow.
