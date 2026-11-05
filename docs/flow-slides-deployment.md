# Scale LAB01 simulation slides — deployment

## Current deployment — readability and Back/Next improvements

Deployed 2026-11-05 to **https://localhost**, using existing real accounts. No commit or push.

- Running immutable image: `sha256:49c5ed116e70de4eb6fca136764fd119e58ccb7804ddc024cd8a393f9ae21490`.
- Previous image: `sha256:ea8fcb4b1f89787432f909fb58574ed7f1d8b3337e110855c39cb5b7a02b169b`; rollback tag: `classroom:rollback-flow-readability-20261105-084718`.
- Private coordinated backup/report: `/Users/prommeesee/.hermes/backups/classroom-flow-readability-20261105-084718/{data.tar,deployment-report.json}`. Archive SHA-256: `ce311786592cd42a5138f72f4a5b44e168ed638141c7b2d0e253fa25df21b029`. Recovered runtime environment retained privately mode 0600.
- Canonical Docker build and manifest validation passed before downtime. Complete runtime delta is only Scale dist JS/CSS/index (five added/removed/changed paths); compiled files match the source-tested integrated bundle. Backend, other courses, manifests and banks unchanged. Existing pending sources, host dist, PDFs and `~$Step3.docx` preserved.
- Same project, four ordered Compose files, external `classroom-accounts-20261022:/data` mount and exact effective environment. Caddy was not recreated.
- Stopped-writer archive extraction, SQLite integrity, schema, all **25 table fingerprints** and **one upload** matched. Immediately after startup all matched again. HTTPS probes added exactly **one anonymous session**; prior sessions and every non-session table remained unchanged.
- Actual immutable-image synthetic-account Chromium QA: **6 passed**, light/dark × 1280/390/320, four topics each (**24 computed-style records**, **48 screenshots**). Verified 17px instruction/result, 22px heading, 16px navigation, minimum 48px targets, arrows, enabled/disabled ends, solid versus dashed borders and cursors. Skip/Next/Back caused no course POST; client/step state retained; real actions keep one semantic award across reloads and completion empty; zero page errors or horizontal overflow. Evidence: `evidence/flow-readability-image/browser.json`. Visually inspected light desktop and dark 320 screenshots; mobile text/buttons wrap and vertical scrolling remains necessary.
- Running `/app` hashes match the qualified image. Healthy backend; direct and trusted-CA HTTPS health 200, login 200, guest course HTML 303 to login and APIs 401. No TLS bypass or live-account login.
- Limits: image QA uses isolated HTTP and synthetic seeded account, not signup/OTP, process-restart persistence or live authenticated HTTPS. Source verification reports 74 unit / 22 targeted browser / 6 adapter / 6 Flask passes; these source suites were not rerun for deployment. Previously documented eight stale 11-versus-12 assertions remain outside scope; no clean full-suite claim.

Helpers: `/Users/prommeesee/.hermes/cache/scratch/deploy-classroom-flow-readability-20261105.py` and `flow-readability-image-browser.mjs`. Source details: [flow-readability-verification.md](flow-readability-verification.md).

## Historical deployment — complete topic workspaces (superseded)

Deployed 2026-11-04 to **https://localhost**, preserving existing accounts. LAB01 Next/Back now switches the complete instruction/visual/action/result workspace across four topics. No commit or push.

- Running image: `sha256:ea8fcb4b1f89787432f909fb58574ed7f1d8b3337e110855c39cb5b7a02b169b`.
- Previous image: `sha256:554dff0c14be8bb41f29df7d3bd761277da972fed0b2a4c37ccbc107c56931ba`.
- Rollback: `classroom:rollback-flow-topics-20261104-165151`.
- Verified backup/report: `/Users/prommeesee/.hermes/backups/classroom-flow-topics-20261104-165151/{data.tar,deployment-report.json}`. Archive SHA-256: `d3c39775f16442e1a5c71b40bcb0c2bb9a6ec156c13e9e19c0d058d741b9feb4`.
- Canonical Docker build and manifest validation passed before downtime. Full runtime delta is exactly Scale dist JS/CSS/index (five changed/added/removed paths). Compiled Scale files match the source-tested isolated integrated bundle. Backend, other courses, manifests and banks are unchanged; host dist, source, PDFs and `~$Step3.docx` were preserved.
- Same Compose project, four-file HTTPS override set, external account volume and effective environment. Private recovered environment is stored mode 0600 in the new backup. Caddy was not recreated.
- Stopped-writer full-volume archive extraction, integrity, schema, all 25 table fingerprints and one upload matched the baseline. Immediately after startup everything matched; HTTPS probes added exactly one anonymous login session, with all prior sessions and non-session tables unchanged.
- Actual immutable-image real-backend synthetic-account Chromium QA: **6 passed**, light/dark × 1280/390/320, all four topics and 12 original actions per sequence. Skip/Back/Next issue no course POST; retained mobile/step state, semantic award stays 1 across reloads, completion remains empty, no overflow/page errors. Evidence: `evidence/flow-topics-image/browser.json` and 24 screenshots. Dark 320 topic three was visually inspected. Disposable QA has no live data/environment mounts.
- Running `/app` hashes equal the qualified image. Healthy backend, direct and trusted-CA HTTPS health 200; login 200; all three guest course HTML routes 303 to login and progress APIs 401. No TLS bypass.
- Limitations: actual-image QA is isolated HTTP with a seeded synthetic account, not signup/OTP, process-restart persistence or authenticated live HTTPS. Source handoff reports unit 74, targeted 10, adapter 6 and actual Flask 6 passes; not rerun here. Full old standalone suite remains 80 passed/8 stale 11-versus-12 failures. Viewports are 1000px high, not a promise of scroll-free short phones.

Helper: `/Users/prommeesee/.hermes/cache/scratch/deploy-classroom-flow-topics-20261104.py`; browser runner: `/Users/prommeesee/.hermes/cache/scratch/flow-topics-image-browser.mjs`. Source detail: [flow-topics-verification.md](flow-topics-verification.md).

## Historical deployment — instruction-only slides (superseded)

The following evidence describes the earlier deployment, not the current runtime.

Deployed 2026-11-04 to **https://localhost**, the existing HTTPS Classroom stack using existing real accounts. No commit or push.

## Scope

LAB01 has four instruction slides sharing one live simulation. Next/Back permits skipping without running the experiment, changing the selected client, awarding participation, or completing a lesson. Simulation DOM/state and durable lesson/simulation/action identities remain unchanged. Reset/lesson remount starts at slide one.

Canonical checkout: `/Users/prommeesee/projects/classroom`, branch `exam-new`.

Running immutable image: `sha256:554dff0c14be8bb41f29df7d3bd761277da972fed0b2a4c37ccbc107c56931ba`.

Previous image: `sha256:77ef7f048989f3ffc778f0e5b4b8abcd513f5dda015590702dc0a39a65dff6b4`.

Rollback tag: `classroom:rollback-flow-slides-20261104-162223`.

## Runtime/data preservation

Full canonical Docker build succeeded before downtime. Complete old/new `/app` hash comparison allowed only Scale Lab dist JS/CSS and their index references (five added/removed/changed paths). Backend, platform templates/assets, other course bundles, all course manifests and private assessment banks remained identical. Host source/dist/reference PDF hashes and the unrelated `~$Step3.docx` were preserved through rollout.

Project `classroom-docker-qa` retained the full ordered Compose set: `compose.yaml`, `compose.accounts.yaml`, `compose.https.yaml`, `compose.https-local.yaml`. Application mount remains external named volume `classroom-accounts-20261022:/data`. Effective environment key/value mappings matched exactly; a private 0600 environment file was preserved in the new durable backup directory. Caddy was not recreated.

Coordinated stopped-writer backup directory:
`/Users/prommeesee/.hermes/backups/classroom-flow-slides-20261104-162223`

Archive: `data.tar`, SHA-256 `63b1b725df44de23e43e3beee45c15487f6c88b46255f034a4b7ef68958edee6`.

Archive extraction, SQLite integrity, schema, deterministic all-table fingerprints and upload hashes matched the stopped-volume baseline. Immediately after startup, all 25 tables and one upload matched exactly. After HTTPS probes, every non-session table and all preexisting session rows remained unchanged; GET `/login` legitimately added one anonymous session. No production fixtures, account mutations or migrations were introduced.

Machine-readable report with full delta and fingerprint evidence:
`/Users/prommeesee/.hermes/backups/classroom-flow-slides-20261104-162223/deployment-report.json`

## Verification and limitations

- Deployment build and manifest validation passed. Running `/app` hash map matched the new immutable image; Docker health was healthy, restart count zero.
- Trusted local CA validation (no insecure TLS bypass) passed for HTTPS health/login. Direct backend health returned 200. All three course HTML routes redirected guests to login (303); their progress APIs returned 401.
- Actual immutable-image Chromium QA used an isolated read-only container, temporary synthetic account/database, no production environment or data volume, and real backend APIs. Six light/dark combinations at 1280/390/320 passed: unrestricted next/back, no scoring/progress POST on skip, retained mobile-client/DNS simulation state, stable flow/step award deduplication across reloads, and no horizontal overflow/page errors. Disposable container was removed.
- Evidence: `evidence/flow-slides-image/browser.json` and six screenshots. Dark 320 and light 1280 screenshots were visually inspected. Original source evidence remains under `evidence/flow-slides/`.
- Prior implementation handoff reported 74 unit, 10 targeted browser and 6 mocked account-adapter tests passing. Those counts are source-QA handoff evidence, not reruns during deployment. Full browser suite reported **80 passed, 8 failed** on stale 11-lesson assertions versus current 12 lessons; these were not silently fixed.
- Source account-adapter QA mocked APIs and did not prove backend persistence. Actual-image QA added real backend/reload/deduplication coverage, but did not test process-restart persistence, signup/OTP, or authenticated live HTTPS accounts. Guest HTTPS checks are not a real-user learning journey.

Deployment helper: `/Users/prommeesee/.hermes/cache/scratch/deploy-classroom-flow-slides-20261104.py`. Isolated browser runner: `/Users/prommeesee/.hermes/cache/scratch/flow-slides-image-browser.mjs`.
