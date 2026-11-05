# LAB01 full live diagram in the main experiment — deployed

Checkout `/Users/prommeesee/projects/classroom`, branch `exam-new`. Deployed to the existing `https://localhost` Classroom Docker stack on 2026-11-05. This follow-up supersedes the diagram-disclosure arrangement in the earlier topic/readability documents; those documents describe earlier deployments. No commit or push.

## Arrangement

Topic heading/instruction → focused route summary → full working architecture → client selection (topics 1/4) and **เดิน request 1 ขั้น** → latest feedback and relevant state → Back/Next → navigation note. Event history remains in the separate **ดูบันทึกเหตุการณ์** disclosure below the topic.

The existing `#architecture` container moves into the workspace before controls; no cloning or remounting, and the original renderer still updates the same container. Browser/Mobile, DNS query/return, HTTP request/response, single host Web/Application + Database/Cache and active highlights are unchanged. Presentation navigation retains simulation state and never scores. Original `flow / flow / step` identities, quizzes, manifests and private banks are unchanged.

Diagram width is capped at 360px on desktop to keep it near the action; mobile uses the topic's full available width rather than an additional inset. The original diagram and label geometry are retained. Instructions remain 17px, actions/navigation 48px minimum and lesson sidebar 16px. Other lessons untouched.

## Verification

- TDD: new browser regression failed on missing visible `#flow-topic #architecture` before implementation, then passed.
- Targeted standalone browser suites: **34 passed** (new diagram matrix, flow layout/slides, single-server behavior, topic readability/navigation contrast and sidebar readability).
- Unit suite: **74 passed**.
- Scratch compiled account-adapter matrix: **6 passed** (API interception; not backend persistence evidence).
- Actual Flask synthetic seeded-account matrix: **6 passed**, dark/light × 1280/390/320, 800px viewport. Four topics and 12 real step actions per case, original action identity; Next/Back emit no course POST. Server read-back confirms score remains 1 across reloads and completion stays empty. Retained Mobile state survives Back. Zero page errors. Owned QA server terminated.
- DOM/geometry assertions: one live architecture, not inside details, before action, dynamic active edges/host, retained container identity on Next/Back, mobile label size >=12px, no horizontal overflow. Action/latest feedback stay adjacent.
- Both standalone-base account and integrated-base Vite builds passed into scratch only. All 66 snapshotted files except the two intentionally edited layout source files retained identical SHA-256: includes host dist, source, manifests/banks, root PDFs and `~$Step3.docx`. `git diff --check` clean.

## Files and evidence

Changed `courses/scale-lab/src/single-server-layout.js`, `src/single-server-layout.css`, `tests/account/flow-slides.spec.js`. Added `tests/browser/flow-main-diagram.spec.js` and this document. Earlier approved pending files retained.

- `evidence/flow-main-diagram/`: diagram/action viewport screenshots; reviewed dark 320 and light 1280.
- `evidence/flow-main-diagram-adapter/`: compiled frontend matrix topic captures.
- `evidence/flow-main-diagram-account/`: real-backend diagram/action screenshots and sanitized `report.json`.
- Synthetic backend runner `/Users/prommeesee/.hermes/cache/scratch/flow-main-diagram-account.mjs` uses `scripts/theme-qa-server.py`, scratch arm64 Python venv and isolated courses/database.
- Builds `/Users/prommeesee/.hermes/cache/scratch/flow-main-diagram-build` and `flow-main-diagram-courses/scale-lab/dist`.

Reproduce browser/unit checks from `courses/scale-lab` with `PATH=/usr/local/bin:$PATH`:

```sh
npx playwright test tests/browser/flow-main-diagram.spec.js tests/browser/flow-slides.spec.js tests/browser/flow-layout.spec.js tests/browser/single-server.spec.js tests/browser/flow-readability.spec.js tests/browser/sidebar-readability.spec.js --reporter=list
npm test
```

## Limits / intentional trade-off

Showing the full diagram adds vertical height. Topic heading, full diagram, results and navigation do not all fit on one short phone screen; no type was reduced to force this. The adapter test retains the previous non-diagram height budget and now checks diagram/action order and action/feedback proximity instead of the obsolete all-in-one-viewport assertion. Screenshots separate diagram and action views. Event history is still optional. No signup/OTP, backend restart-persistence or live-account authentication test; no full browser-suite claim. Source QA above preceded deployment; the separate actual-image and live deployment checks follow.

## Docker HTTPS deployment

- Canonical Docker Compose build succeeded before downtime; running image `sha256:9eb352ad7778e6e0be50ee5c664d212f7a9d5bf0fc72543a14b63b33c5e5e570` is healthy. Existing HTTPS proxy unchanged.
- Full `/app` old/new hash comparison permits only Scale compiled JS/CSS/index changes (five paths including removed old hashed assets). Backend, other courses, manifests and private banks unchanged. All Scale integrated image assets match the source-qualified scratch bundle.
- Actual immutable-image synthetic-account browser matrix: **6 passed**, 1280/390/320 × dark/light, 800px viewport, zero page errors. Asserted visible working diagram outside disclosure before request action, active edge/host highlights, all four topics and twelve real `flow / flow / step` actions per case, retained Mobile state after Back, zero course POST on skipped Next/Back, score deduplication to 1 across reloads and empty completion. Screenshots reviewed at dark 320 and light 1280. This is disposable loopback HTTP QA, not live-account HTTPS authentication.
- Coordinated stopped-writer full-volume archive verified against original schema, all **25 table fingerprints**, SQLite integrity and **1 upload**; immediate post-start comparison was identical before HTTP probes. Existing `classroom-accounts-20261022:/data` mount and exact effective environment preserved. Trusted-CA HTTPS `/healthz`, `/login`, protected page redirects and API 401 responses passed without `-k`; direct health returned 200. Login probe added exactly one anonymous session; all prior sessions, non-session tables and uploads remained unchanged.
- Host dist, PDFs, `~$Step3.docx` and all snapshotted source files preserved through deployment. Only this release document updated afterward. No commit/push.
- Backup: `/Users/prommeesee/.hermes/backups/classroom-flow-main-diagram-20261105-092217/` (`data.tar`, fingerprints, private 0600 runtime environment, `deployment-report.json`). Archive SHA-256 `767f672eee05c05cc57c723a02c4c4e50a3b76bdd4f03e147f1d9499fd0290af`.
- Rollback tag `classroom:rollback-flow-main-diagram-20261105-092217` preserves previous image `sha256:9f8e37248221f568bc18309290196d10fcb8205c8d11969f8d0f353a7e0cd1cc`.
- Actual-image evidence: `evidence/flow-main-diagram-image/browser.json` and diagram/action screenshots. Scratch helpers: `flow-main-diagram-image-browser.mjs`, `deploy-classroom-flow-main-diagram-20261105.py`. Disposable image QA container removed after verification.
- QA harness issue: restarting the disposable container reassigned its ephemeral published port; initial retry refused the old port, then discovery of the new port and rerun passed. This did not affect live deployment or data.
