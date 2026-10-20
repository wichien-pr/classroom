# LAB 03 — Vertical scaling vs horizontal scaling

## Source and teaching boundaries

Based on the user-supplied text: scale up adds CPU/RAM to a server; scale out adds servers to a resource pool. Scale up is simple for low traffic but bounded by hardware, and does not by itself create redundancy or failover. A directly connected single web server causes unavailability when offline and may slow down or reject connections when overloaded. Load balancing introduces distribution across available servers and leads into LAB 04.

The interactive diagram, abstract capacity units, traffic input, machine-1 outage and routing toggle are supplementary teaching examples, not measured claims from the source. Power 1–4 and traffic 1–20 are UI bounds, not real hardware limits. The model assumes equal machines, evenly divisible work, no other bottlenecks and an available LB with already-known health. It does not simulate timing, in-flight retries, sessions, database capacity or network failures. Scale out alone does not guarantee availability; the direct route continues to target machine 1 even with unused healthy machines. Failed machine 1 contributes no usable capacity. Remaining machines may still be overloaded.

## Compatibility

Preserved stable lesson/simulation `stock`, action `order`, original incorrect/correct choice identities and `quiz-answer-a` / `quiz-answer-b`. No manifest/API/SQLite migration. Existing completion and awarded points remain applicable under the existing identifiers; retaining them does not certify study of the revised content. The legacy inventory model remains covered by unit tests but is no longer LAB 03's UI. Updated private final-bank questions `stock-5` and `stock-6`; existing attempt snapshots remain immutable. No bank is imported into client code.

## Verification performed

- Observed RED → GREEN for scaling model, outage/limits, new browser interaction and final-bank wording.
- `npm test`: 34 passed.
- `npx playwright test`: 28 passed.
- `npx playwright test --config playwright.account.config.js`: 15 passed (API-boundary fixtures).
- `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q -p no:cacheprovider` from appworks: 396 passed.
- `python3 scripts/courses.py validate`: OK scale-lab.
- Actual isolated integrated Vite build via registration QA launcher on 8124. Real browser signup using local Graph mail double and OTP receipt, login, scaling interaction, repeated-action deduplication, incorrect quiz award, manual completion, reload, return to catalog, and 320/390/1440px overflow checks passed without page errors. Restarted the same isolated database and verified login and completion persistence again.
- Inspected mobile and desktop screenshots. Evidence: `evidence/lab03/browser.json`, `restart.json`, `integrated-{320,390,1440}.png`; standalone diagrams under `courses/scale-lab/evidence/lab03-diagram-*.png`.

Reproduce from repository root:

```sh
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8124 --evidence evidence/lab03
PATH=/usr/local/bin:$PATH node scripts/lab03-browser-verify.mjs
# Stop only the identified QA PID, restart the same launcher with --resume, then:
PATH=/usr/local/bin:$PATH node scripts/lab03-browser-verify.mjs --resume
```

Raw OTP mail and QA database remain in the private temporary QA tree, not public assets. No real-provider mail or registration against the production database. Initial verification used only the isolated build. Following the user's build request, backed up SQLite (integrity `ok`), private uploads and old dist to `backups/lab03-20261020T123100/`; stopped the identified Classroom process on 8080, ran `scripts/courses.py build` and `validate`, and restarted `service:create_app` on loopback 8080. Login returned HTTP 200; guest course returned HTTP 303 to login. All published files match the browser-tested QA build by SHA-256. Users, lesson progress, manual completion, v2 awards, achievements and exam attempts match the backup row-for-row; SQLite integrity is `ok`. No commit or push performed.
