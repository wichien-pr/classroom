# LAB12 — current three-page sharding experiments

## Acceptance contract

- Page 1 shows three simultaneous model-backed comparisons: overload (16/8), Scale Up on the same database (16/32), and unavailable as a secondary replication/failover concern. Shared pause/replay/cancel controls govern concurrent visuals; the three original evaluations save serially. The former bottom sharding bridge and assumptions disclosure are absent from mounted DOM.
- Page 2 is titled `Sharding · แบ่งข้อมูล กระจายภาระงาน`. Its single balanced user_id scenario partitions 16 distinct rows across four shards, then routes 16 requests in four batches. Each shard receives four requests with capacity eight. No redundant scenario counter.
- Page 3 retains the resharding comparison: modulo-8 routing versus stationary modulo-4 data, eight changed destinations, not actual migration.
- Three outer pages; source-topic mapping `[[0,1],[2],[5]]`; five guided evaluations `[3,1,1]`. Historical hotspot/country model capabilities and source IDs remain but are not guided presets.
- Navigation/replay are unscored. Stable identity: `database-scaling / database-scaling / evaluate-data-tier`. Exact failed-event retry, semantic deduplication, and manual completion remain intact. Manifests, private assessment bank and backend scoring policies are unchanged.

## Pre-publication verification

Executed in the canonical checkout with Node 26.7.0. Builds and reports were isolated under `$HOME/.hermes/cache/scratch`; no live dist, deployment or existing preview output was modified.

| Gate | Result |
| --- | --- |
| Complete Scale Lab unit suite | 146 passed, 0 failed |
| Standalone production build | 94 modules; `index-DrwBC5vx.js`, `index-BP4VA-y3.css` |
| Current parallel comparison browser suite | 7 passed |
| Current single-balanced sharding browser suite | 8 passed |
| Account-integrated production build | 94 modules |
| Disposable Flask/SQLite authenticated account QA | Passed; no browser errors |

Browser checks used a separate compiled scratch preview on port 4189, Light/Dark at 1280/390/320px, and isolated screenshot/report destinations. They cover concurrent movement and frozen animation times, removed bottom block and spacing, balanced rows/load accumulation, pause/replay/reset/cancellation, three-page navigation, page-three migration result and completion gates.

The real-backend runner observed exactly `[3,1,1]` experiment POSTs; zero navigation/replay writes; one semantic simulation award; page-one pause during a held save; page-two save cancellation; lost-response-after-commit exact payload/UUID retry after reset and same-page retry; explicit manual completion and reload deduplication. It uses the **already tracked** `scripts/theme-qa-server.py`, not any historical LAB12 runner. The server creates a synthetic account and temporary database and removes them on shutdown. This is not registration or server-restart coverage.

Local verification artifacts (not published):
- `lab12-publish-unit.log`
- `lab12-publish-parallel/` and `lab12-publish-sharding/`
- `lab12-publish-account/evidence/account-report.json`

## Reproduction

From `courses/scale-lab`, use a compatible Node installation and installed Playwright Chromium. Set `PLAYWRIGHT_BROWSERS_PATH` to the local browser installation if needed.

```sh
npm test
npm run build -- --outDir "$TMPDIR/lab12-publish-build"
# Serve this scratch build with Vite preview on an unused loopback port.
QA_URL=http://127.0.0.1:4189 QA_EVIDENCE="$TMPDIR/lab12-publish-parallel" \
  node node_modules/@playwright/test/cli.js test --config playwright.lab12-parallel.config.js
QA_URL=http://127.0.0.1:4189 QA_EVIDENCE="$TMPDIR/lab12-publish-sharding" \
  node node_modules/@playwright/test/cli.js test --config playwright.lab12-sharding.config.js

VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ \
  npm run build -- --base /courses/scale-lab/ \
  --outDir "$TMPDIR/lab12-publish-account/courses/scale-lab/dist"
QA_COURSES_ROOT="$TMPDIR/lab12-publish-account/courses" \
QA_PYTHON=/path/to/python-with-project-dependencies QA_PYTHON_ARCH=arm64 \
QA_EVIDENCE="$TMPDIR/lab12-publish-account/evidence" \
  node ../../scripts/lab12-single-balanced-browser-verify.mjs
```

The account runner currently uses macOS `/usr/bin/arch`; choose the architecture matching Python's installed native dependencies. `TMPDIR` must point to scratch storage. Real credentials and production databases are not required.

## Publication scope

Only final LAB12 source modules, current passing unit tests, the parallel/sharding browser configs and specs, this report and the single-balanced account runner are selected. Earlier sequential-layout browser suites/configs/scripts and earlier reports remain local historical material, not current gates. LAB11 files, probes, Office lock files, evidence, build output, private data and reference documents are excluded. Publishing this code does not deploy, merge or create a PR; the existing parent-owned standalone preview at port 4178 remains separate from the main authenticated site.
