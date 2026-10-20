# Participation implementation verification

> Historical v1 evidence only. Count-every-click behavior is superseded by [Participation v2](../docs/participation-contract.md): fresh score era, first button only, old rows preserved.

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`.

## Result

Implemented account-owned Participation Score and verified real Flask/SQLite + compiled Scale Lab. All **12 simulations / 18 declared action definitions** were actually clicked through in browser QA (coverage set compared programmatically with manifest). First QA account finished with **21 saved points**, second with **1**; reload and a real server process restart retained both independently. No manual progress was written: QA `lesson_progress` remains empty; Activity contains only the existing login/course-open events, not simulation participation. SQLite integrity check: `ok`.

Production **8080 and 8081 were not stopped/restarted**; no real SQLite was opened or modified by this worker. Live `courses/scale-lab/dist` was not rebuilt. No git commit (repository lookup reaches home-directory git).

## TDD evidence

Observed vertical RED → GREEN runs in execution, not retroactive claims:

- New saved-score/dedup test: missing route **404 vs 200**, then **1 passed**.
- Strict payload slice: **7 failed / 1 passed** (server accepted extra fields/unknown definitions/bad UUID), then **8 passed**.
- Rate/conflict slice: **2 failed / 8 passed**, then **10 passed**.
- Manifest fail-closed slice: **7 failed / 10 passed**, then **17 passed**.
- Adapter test initially failed because participation module did not exist; implementation then **1 passed**.
- Browser score slice: absent `#participation-score`, then **1 passed** including captured event retry after navigation.
- Terminal action slice: completed flow incorrectly earned a sixth point; fixed exclusion, then flow/empty-worker tests passed. Test's initial queue selector was corrected from lesson 8 to the actual queue lesson 9 (test fixture error, not a product defect).
- Manifest coverage slice failed with undefined participation definitions; added all reviewed mappings, then passed.
- Blank order key slice initially earned a point; excluded INVALID operation; passed.
- Additional security/isolation/restart/concurrency/load-delay/standalone tests characterize and regress the already-implemented slices; not claimed as new RED evidence.

## Final fresh suites

| Command | Actual result | Evidence |
|---|---|---|
| `cd appworks && .venv/bin/python -m pytest -q` | **275 passed** | `evidence/participation-backend.txt` |
| `cd courses/scale-lab && npm test` | **24 passed** | `evidence/participation-course-unit.txt` |
| `npm run test:e2e` | **17 passed** | `evidence/participation-standalone-browser.txt` |
| `npx playwright test -c playwright.account.config.js` | **10 passed** | `evidence/participation-account-browser.txt` |
| `npm run build -- --outDir ../../evidence/participation-standalone-dist` | Vite success, 11 modules | isolated standalone artifact |
| QA launcher integrated build with `/courses/scale-lab/` base and isolated absolute `--outDir` | Vite success, 11 modules | QA course tree below |
| `python3 scripts/courses.py validate` | `OK scale-lab: /courses/scale-lab/` | actual command output |
| `node scripts/participation-browser-verify.mjs` | passed, 18/18 actions, two accounts, transport-loss retry, 320/390px | `evidence/participation-browser.json` |
| `node scripts/participation-browser-verify.mjs --restart` | passed, PID **14275 → 14602**, scores **21 / 1** | `evidence/participation-restart.json` |

Backend suite initially caught a **stale pre-existing Community test** expecting the intentionally hidden tab. Only those two expectations were changed to `not in`; no Community template/navigation was restored. Final suite passes the approved hidden-navigation behavior and existing Community routes.

Background shell initially selected ARM Node 26.8.1, incompatible with the existing x64 Rollup optional dependency, so its first build failed. Reran launcher with `PATH=/usr/local/bin:$PATH` (existing working x64 Node); build succeeded. No lockfile/dependency reinstall. Vite warned that isolated outDir is outside project root and will not be emptied; directories were newly created, so this is intentional.

## Real browser and storage evidence

- QA URL: `http://127.0.0.1:8110/courses/scale-lab/` (requires QA login).
- Launcher metadata: `evidence/participation-qa-server.json`.
- Private QA tree: `evidence/participation-qa-pze8s529/`, including `accounts.sqlite3` and compiled `courses/scale-lab/dist/`; configured photo/community paths are inside this same tree.
- `evidence/participation-browser.json`: actual request statuses, every covered lesson/simulation/action, two account scores.
- `evidence/participation-database.json`: independent SQLite readback, schema, score totals, point bounds and unchanged progress/activity semantics.
- `evidence/participation-restart.json`: different process PIDs and unchanged authenticated account scores.
- `evidence/participation-desktop.png`, `participation-mobile-320.png`, `participation-mobile-390.png`: actual saved UI, visually inspected desktop and 320px. No horizontal overflow; score is visible. Desktop screenshot was recaptured after resize paint settled (initial capture had a sticky-header paint artifact).
- `evidence/participation-a-session.json` and `participation-b-session.json`: **private disposable QA session cookies**, solely for restart verification; never publish/deploy evidence.
- Existing standalone runner also refreshed `courses/scale-lab/evidence/browser-results.json`, `desktop.png`, `mobile.png` and Playwright transient test-results.

Transport-loss test used a real POST forwarded to Flask via `route.fetch()`, then dropped its response. UI kept its old confirmed score; direct server read showed one committed event; retry after navigating reused the identical original flow UUID/payload and returned only one increment. Browser checks showed no page errors. Other unit/browser cases verify load retry, visible pending status, synchronous duplicate-action blocking, bad input, exhausted flow/worker, no-score navigation/reset and standalone no-API behavior. Backend covers strict/auth/CSRF/origin/oversize, cross-account/cross-course, 12 concurrent retries, persistent rate quota and duplicate bypass, conflict and expired session.

## Source changes

- `appworks/app.py`
- `appworks/course_registry.py`
- `appworks/participation.py` (new)
- `appworks/tests/test_participation.py` (new)
- `appworks/tests/test_community.py` (two stale navigation assertions)
- `courses/scale-lab/course.json`
- `courses/scale-lab/src/main.js`
- `courses/scale-lab/src/style.css`
- `courses/scale-lab/src/participation.js` (new)
- `courses/scale-lab/tests/participation.test.js` (new)
- `courses/scale-lab/tests/account/participation.spec.js` (new)
- `courses/scale-lab/tests/browser/participation.spec.js` (new)
- `scripts/participation-qa-server.py` (new)
- `scripts/participation-browser-verify.mjs` (new)
- `docs/course-contract.md`
- `docs/participation-contract.md` (new)
- `docs/participation-verification.md` (new)

## Parent deployment verified

Parent independently reran the full backend suite: **275 passed in 56.20s**, and real-browser restart verification returned scores **21 / 1**. Visually inspected 320px screenshot.

Backed up production SQLite via backup API to `evidence/participation-backup-20261019-093053/` (integrity ok), including profile/community upload directories. Stopped identified Classroom PID98547 only; built integrated dist successfully (11 modules), validated manifest, started production Waitress PID18569 on 127.0.0.1:8080. Login returned 200; guest course 303; guest participation API 401. Read-only database verification: integrity ok, participation table empty (0 fabricated production events), full users and lesson_progress rows identical to backup. Production dist file SHA-256 hashes match the isolated real-browser-tested build.

## Parent deployment / remaining limitations

1. Review changes and contract; retain the existing real accounts/progress. Back up SQLite using its backup API; verify backup integrity and retain profile/community private uploads.
2. Stop **only identified Classroom 8080**, not 8081. Build integrated dist while stopped: `PATH=/usr/local/bin:$PATH python3 scripts/courses.py build`; then `python3 scripts/courses.py validate`. This final production build is deliberately left to parent.
3. Restart appworks against the **same production database**, not QA metadata. Startup creates only the additive participation table. No new dependency required.
4. Verify login 200 and guest course redirect, unchanged user/progress counts, new empty participation table before real use, then authenticated score loading. Do not seed test points into production.
5. QA can be resumed with `PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/participation-qa-server.py --resume`. Its process is separate from production; parent can stop it after review.

Limits are explicit: client-reported participation is not anti-cheat grading; no offline/durable pending queue, background retry, cross-tab push, or leaderboard integration. Failed/uncommitted in-memory event can be lost on reload; committed events survive. Simulated send failures and deliberate domain retries count as new learning actions; network retries of the participation event do not. Production deployment remains pending parent review.
