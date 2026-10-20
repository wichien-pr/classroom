# LAB 02 — Database

## Source mapping

Source: user-provided `Database.pdf`, 2 pages, SHA-256 `1060189ff7ece065ba9757cc7defac9239939dfd7f3a6af752d2effb0c4f63b6`. Original PDF is not modified or copied into public/dist. Both rendered pages were inspected.

- Page 1, Figure 3: web/mobile clients query external DNS, obtain IP, call the web server; web server reads/writes/updates the separate database and receives data. Independent web/data scaling is the key concept. The lesson uses an original HTML/CSS diagram, not the PDF image. Documentation domains replace source example domains.
- Page 1: relational tables/rows and SQL JOIN, MySQL / Oracle / PostgreSQL, and non-relational examples.
- Pages 1–2: four NoSQL families: key-value, graph, column, document. “Column” is clarified as wide-column in the Cassandra/HBase context, not columnar analytics.
- Page 2: reasons to investigate alternatives: very low latency, unstructured/non-relational data, serialization/deserialization (JSON/XML/YAML), and large data volumes.

## Supplementary teaching, explicitly bounded

The shopping scenarios (orders, session lookup, product documents, relationship traversal, customer/time events), resource sliders, shared-host comparison, and DB-outage toggle are teaching additions, not claims from Figure 3. Resource units are abstract allocations, NOT server counts, replicas, throughput or measured capacity. No real network/DB operations occur in the simulation. The outage represents unavailable database service, not necessarily failure of the whole host.

SQL is a starting point, not a universal winner. NoSQL selections are suggestions for the stated access patterns, not exclusive correct technologies. Qualify the source's generalization about JOIN: support depends on the product, and SQL systems can also store JSON and large data volumes. Choosing a family never guarantees latency, durability, correctness or automatic failover.

## Compatibility

The existing LAB 02 identity `workload`, simulation `workload`, action `estimate`, and thinking actions `quiz-answer-a` / `quiz-answer-b` remain unchanged to preserve existing account progress and awarded points. Display content replaces the workload calculator. Existing completion is retained; it does not certify that the learner has studied the revised material. The old pure workload helper remains for compatibility, but is no longer LAB 02's UI. Final-bank IDs `workload-3` / `workload-4` now ask about Database; already-created attempts retain their immutable snapshots. No manifest, platform API, account or SQLite migration changes.

## Verification

Vertical RED → GREEN: independent-tier model, database selection explanations, new browser lesson, final assessment content, contextual NoSQL term hint. Existing coverage is regression coverage, not newly claimed TDD.

Executed:
- `npm test`: 31 passed.
- `npx playwright test`: 27 passed (standalone).
- `npx playwright test --config playwright.account.config.js`: 15 passed (API boundary mocks).
- After new term hints: `npx playwright test tests/browser/database.spec.js tests/browser/terms.spec.js`: 3 passed.
- `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q -p no:cacheprovider`: 396 passed.
- Real compiled integration: separate registration QA server on 8123, local Graph HTTP double and private temporary SQLite; new signup with actual QA OTP receipt, login, LAB 02, deduplicated simulation award, incorrect thinking choice, manual completion, reload, return to catalog, and 320/390/1440px checks passed without page errors. After QA process restart, login and persisted `workload` qualification passed again.

Reproduce integration from root:

```sh
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8123 --evidence evidence/lab02
PATH=/usr/local/bin:$PATH node scripts/lab02-browser-verify.mjs
# Stop only identified QA PID; restart same launcher with --resume, then:
PATH=/usr/local/bin:$PATH node scripts/lab02-browser-verify.mjs --resume
```

Sanitized reports/screenshots: `evidence/lab02/browser.json`, `restart.json`, `integrated-{320,390,1440}.png`; raw OTP receipts remain in the private QA temp tree. Desktop and mobile rendered screenshots inspected. No real-provider email, real-user login or QA account creation in the production database.

## Local rollout

Backed up SQLite (integrity check `ok`), private upload directories and old dist to `backups/lab02-20261020T112231/`. Stopped only the identified Classroom process on 8080 and QA process on 8123; built integrated dist using `scripts/courses.py build`, validated manifests, then restarted `service:create_app` on loopback 8080. Login returned 200 and guest course returned 303 to login. Published JS/CSS hashes exactly match the compiled assets exercised by the real QA browser. Users, lesson progress, manual completion, v2 awards, achievements and exam attempts match the backup row-for-row. PDF hash unchanged. QA listener is closed. No commit or push was performed.
