# LAB02–07: full-width UX/UI aligned with LAB01/08

## Authorized local deployment

Deployed to http://127.0.0.1:8080/ after explicit user authorization. Reload existing tabs to load the new lesson UI. No staging or commit.

- Backup: `backups/lab02-07-layout-20261021T042119Z` contains a verified SQLite backup-API snapshot, uploads, prior published dist, manifest and assessment. Fingerprints were taken from the backup snapshot.
- Stopped the identified 8080 service (PID 86438) before building; integrated `scripts/courses.py build` and `validate` passed (37 modules). Restarted the same `service:create_app` factory; observed listener PID 3738.
- Published hashes match the previously browser-tested isolated integrated build exactly. Integrity is OK; schema and all 24 database tables match the snapshot. Uploads, private environment file, protected references, manifest and assessment are unchanged.
- Post-deploy HTTP: login 200; guest course and both compiled assets redirect 303 to `/login`. Port 8081 retained the observed Docker listener PID 1363; no operation targeted it.
- Authenticated behavior for all six lessons was verified in isolated QA against identical compiled assets, not by logging into a production account. Production verification used file hashes, read-only database comparisons and guest HTTP checks.
- Evidence: `evidence/lab02-07-layout/deployment.json` and `deploy-backup.json`.


## Scope

Updated six lessons: `workload` (02), `stock` (03), `balance` (04), `replica` (05), `cache` (06), `cdn` (07).

Shared presentation modules `src/lesson-layout.js`, `lesson-layout-data.js` and `lesson-layout.css` provide short introductions, full-width dark comparison cards, ordered experiment instructions with separate caveats, grouped controls, primary actions, collapsed supporting notes and full-width thinking questions. Existing notes/figures remain accessible inside details. Score help collapses while score/save/error/completion controls stay visible. Existing nodes are moved rather than cloned so event handlers, simulation IDs and durable scoring identities remain intact. Glossary enrichment follows moved prose and lists; light diagrams retain dark term colors. LAB04's obsolete Session reference now points to Cache and its learner-facing page attribution is removed.

Implementation changed no backend, manifest, assessment or simulation algorithms. Existing uncommitted LAB01 work was retained. The later authorized deployment rebuilt published assets and restarted the service as recorded above; no staging or commit.

## Verification

From `courses/scale-lab`, prefix Node commands with `PATH=/usr/local/bin:$PATH`:

- `npm test`: 59 passed.
- `npx playwright test`: 72 passed before the additional action-order test; final compiled suite below includes all final tests.
- `npx playwright test tests/browser/lesson-layout.spec.js`: 19 passed, including all six lessons at 320/390/1440px and main-action/extra ordering.
- `npx playwright test -c playwright.account.config.js`: 15 passed on final source. Intercepted API tests cover action identities/dedup UI, loading/errors/retry, progress and qualification races.
- `npm run build -- --outDir ../../evidence/lab02-07-layout/standalone-dist --emptyOutDir`: successful isolated build, 37 modules. Only this dedicated QA output directory was emptied.
- `npx playwright test -c evidence/lessons-build.config.mjs`: final compiled standalone suite **73 passed**, zero skipped, unexpected or flaky.
- `git diff --check`: passed.

Each new lesson was enabled in the browser test before its presentation data: observed RED for missing full-width layout, then GREEN after implementation. Further observed RED checks caught dark-card colors leaking onto light diagrams, obsolete attribution, a half-width CDN control panel and supplementary controls preceding primary actions. Fixed and reran. CDN figure visibility regression now explicitly opens the supporting details before asserting both retained figures are visible.

Visually inspected desktop comparison/instruction sections and mobile controls for every lesson. Refined mobile CDN label wrapping and Cache/Replication action ordering; inspected the updated controls again. Full-page screenshots (18 verified files) and control captures: `evidence/lab02-07-layout/<kind>-<width>.png` and `<kind>-controls-<width>.png`. Browser assertions also cover overflow, compact checkboxes, glossary keyboard/Escape/focus, popover bounds, remounts and absence of styles on LAB01. Existing LAB01/08 suites pass.

## Real isolated integrated check

`PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/registration-qa-server.py --port 8137 --evidence evidence/lab02-07-layout/integrated-qa` compiled integrated assets into a private temporary QA course tree and used a separate SQLite database and existing QA legacy-account fixture. No production login or provider email call was used.

`PATH=/usr/local/bin:$PATH node evidence/lab02-07-layout/integrated-browser.mjs` passed for all six lessons: main simulation action, original thinking choice, explicit manual completion, 390px layout, and reload persistence of 6 qualified lessons / 12 points. Zero page/asset errors. This is not an OTP-registration or cross-process persistence test. QA process was stopped after checking its listener ownership.

Reports: `evidence/lab02-07-layout/compiled-browser.json`, `integrated-browser.json`, `integrated-batches.json`. Integrated screenshots: `integrated-<kind>-390.png`.

Production now serves the verified integrated build for these six lessons following separate deployment authorization.
