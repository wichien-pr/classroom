# LAB05: current six-topic acceptance

## Publication and scope

This is the current acceptance document for the LAB05 source change on `exam-new`, prepared for the authorized commit and push. It does not claim a merge, PR, deployment or production validation. Publication is verified separately by comparing the pushed `refs/heads/exam-new` SHA with local HEAD; the commit containing this document is the source publication artifact.

The earlier eight-topic, ten-learner-stage and in-scene-caption browser suites/reports are superseded, not current acceptance. They are preserved locally rather than packaged as runnable acceptance. The caption-named **unit** test is current: it asserts the restored below-map result.

## Current learner contract

- Six outer topics. Topics 1–5 have no supplemental comparison/consequence panels; their map versions and actual write/read-return/sync animations remain meaningful.
- Topic 6 has three learner beats: old Primary down; fence the old writer and explicitly accept the missing write before promotion; new Primary writes and explicit sync catches Replica up.
- One live `#replication-result` stays in the toolbar **below the diagram**. The following figcaption states nonautomatic failover, committed loss and no recovery of lost data. No in-map caption row, duplicate ledger or guard badge dashboard.
- Ten underlying operations remain: rejected promote, fence, rejected promote, accept loss, promote, write, Primary read, divergent Replica read, sync, final Replica read. Model indices are independent of the three learner beats.
- Original `replica / replica` identities and four meaningful action types (`write`, `read-primary`, `read-replica`, `sync`) remain. Five meaningful saves occur in topic 6; prerequisites/promotion remain unscored. Equal versions do not imply matching histories. Explicit sync adopts the new Primary history rather than recovering lost writes.
- Preserve 2000ms routes, named local holds, before-state labels during transfer, pause/replay/cancellation, reduced motion, exact failed-save retries and manual completion semantics.

## Publication verification

Fresh checks for this publication:

- **172 unit tests passed**, zero failures/skips, including all ten transitions, five failed-save boundaries and restored result placement.
- Standalone and integrated builds succeeded into separate scratch directories (97 modules each). No main dist, database or parent-owned port 4178 preview was rebuilt or restarted.
- **8 compiled browser tests passed** using `playwright.lab05-simple.config.js`: six Light/Dark × 1280/390/320 current-story cases plus two updated presentation orchestration cases. Covers first-five panel absence and outcomes/replay, every recovery model stage and three-beat mapping, below-map result geometry, paused 2000ms sync, divergent pre-sync state, role change, final loss caveat, keyboard, overflow, reduced motion and cancellation.
- Real disposable authenticated backend passed all six action sequences, four semantic awards, zero navigation/replay writes, all five lost-response-after-commit exact payload/UUID retries, pause/cancel during save and canceled retry without restarting operations. Manual completion unchanged; zero page errors. Synthetic seeded account only, not signup/OTP coverage. Runner cleans up its own server and temporary SQLite database.
- Selected runner imports/file reads audited: source modules and `scripts/theme-qa-server.py`/Flask app already tracked; all added unit tests depend only on repository source. No screenshot/DOM baseline is loaded from historical evidence or an absolute local path.

Local publication evidence (not committed): scratch `lab05-publish-units.log`, `lab05-publish-browser/results.json`, and `lab05-publish-account/account-report.json` under the operator's Hermes scratch directory. These are outputs, not prerequisites.

## Reproduce

Use a supported Node version (publication used Node 26.7.0), installed Scale Lab npm dependencies and Playwright Chromium. Set `SCRATCH` to an existing disposable directory outside the checkout. From `courses/scale-lab`:

```sh
node --test tests/*.test.js
node node_modules/vite/bin/vite.js build --outDir "$SCRATCH/lab05-build"
node node_modules/vite/bin/vite.js preview --outDir "$SCRATCH/lab05-build" --host 127.0.0.1 --port 4189 --strictPort
# In another terminal in courses/scale-lab:
QA_BASE_URL=http://127.0.0.1:4189 QA_EVIDENCE="$SCRATCH/lab05-browser" \
  node node_modules/@playwright/test/cli.js test --config playwright.lab05-simple.config.js
```

Set `PLAYWRIGHT_BROWSERS_PATH` when using a nondefault browser installation (publication used `.browsers`). All current browser screenshots, reports and artifacts respect `QA_EVIDENCE`; default output is `test-results/lab05-current`. A fresh empty evidence directory works without historical baselines. Stop only the preview you started, not an existing parent-owned preview.

For real account verification, build the integrated bundle separately from `courses/scale-lab`:

```sh
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress \
  node node_modules/vite/bin/vite.js build --base /courses/scale-lab/ \
  --outDir "$SCRATCH/lab05-courses/scale-lab/dist"
# From repository root; QA_PYTHON must have appworks requirements installed:
QA_COURSES_ROOT="$SCRATCH/lab05-courses" QA_EVIDENCE="$SCRATCH/lab05-account" \
  QA_PYTHON=/path/to/venv/bin/python TMPDIR="$SCRATCH" \
  node scripts/lab05-simple-browser-verify.mjs
```

On macOS only, optionally set `QA_PYTHON_ARCH=arm64` or `x86_64` to match installed native wheels. Publication used the existing arm64 QA interpreter. Never point `QA_COURSES_ROOT` at the live courses tree. The runner copies tracked manifests into the isolated tree and uses the tracked disposable-server helper; no private account data, historical runner or evidence fixture is required.
