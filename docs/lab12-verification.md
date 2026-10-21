# LAB12 — Database scaling

Implementation: isolated `/Users/prommeesee/Documents/04_Learning/classroom-lab12`, based on the LAB12 branch's starting commit. No production deployment, staging, commit or push performed. Original workspace and supplied PDF remain unchanged.

## Source mapping
Source: `../classroom/Database-scaling.pdf`, 7 pages; text extracted and rendered figures inspected.
- p1–2 / Figure 20: vertical resources, hardware/cost/single-host limits versus horizontal sharding. Historical RAM/product and Stack Overflow figures are omitted, not presented as current facts.
- p2–5 / Figures 21–22: same schema, distinct rows; user_id modulo 4; choosing a sharding key. Simulation uses user IDs 0–15.
- p6: resharding due to growth/imbalance; hotspot/celebrity problem; joins and denormalization; selective NoSQL use.
- p7 / Figure 23: integrated architecture explained in the final teaching section.

Supplements/clarifications: horizontal scaling is broader than sharding; replication is not partitioning or backup. Distributed joins are difficult rather than universally impossible. Consistent hashing does not perform migration or solve hot keys by itself. Ready means modeled capacity, not production readiness.

## Model
Pure `evaluateDataTier` validates configuration. Every round has 16 synthetic requests; per-machine capacity is 8 times selected power (1–4). Uniform requests visit each ID once. Hotspot requests visit user 4 thirteen times and users 0,1,2 once. Country mode intentionally gives every row key 0. Horizontal row placement is a proposal; moves compare against the immutable original user_id % 4 layout. No database is accessed or moved. Availability switch disables all machines, not one shard. No replication, migration concurrency, transactions or benchmark claims.

## Identity and history
New `database-scaling` lesson/simulation and `evaluate-data-tier` action. Active manifest: 12 lessons, 44 definitions (20 simulation + 24 original thinking choices), 24 private bank questions. Existing definitions and questions retained. Frozen numeric 12 remains retired `shard`; legacy completion never grants this new lesson. New standalone stable identity can persist independently. Account policy remains manual + simulation + either thinking choice. No backend schema changes or history migration.

## Verification actually run
- RED→GREEN model/identity slices in `tests/database-scaling.test.js`.
- `npm test`: 74 passed.
- `npm run build`: successful isolated standalone artifact.
- Existing application venv, `python -m pytest -q` in isolated appworks: 403 passed.
- `PLAYWRIGHT_BROWSERS_PATH=<existing classroom browser cache> node tests/lab12-browser.mjs`: passed against compiled preview. Checks capacity, outage, modulo4, hotspot, remapping, reset, correct quiz, reload persistence and no page errors. Widths 1440/390/320 have no document overflow.
- Screenshots and browser report: `courses/scale-lab/evidence/lab12/`. Desktop and mobile results visually inspected.
- `git diff --check`: passed before final docs.

Not performed: authenticated end-to-end LAB12 award/restart journey, full existing browser suite, production deployment. Backend regression tests do not substitute for that account UI journey.

Preview: loopback-only `http://127.0.0.1:8132`, served from isolated course dist. Restart using `python3 -m http.server 8132 --bind 127.0.0.1 --directory courses/scale-lab/dist` from this worktree root.
