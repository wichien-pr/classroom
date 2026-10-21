# LAB01 layout aligned with LAB08 — deployed locally

## Authorized deployment

Deployed to http://127.0.0.1:8080/ after explicit user authorization. Reload existing course tabs to load the new UI. No staging or commit performed.

- Isolated integrated build and real QA-account browser check passed on 8137: simulation + thinking + manual completion, score 2 and qualified 1/11 persisted on reload; LAB08 navigation and return to catalog passed. Screenshots 320/390/1440px under `evidence/lab01-layout/integrated-<width>.png`. No browser/asset errors.
- SQLite backup API snapshot verified integrity; table fingerprints were calculated from the backup snapshot, not live rows. Backup: `backups/lab01-layout-20261021T035035Z` (DB, uploads, previous dist, manifest and assessment).
- Identified and stopped the old 8080 service before integrated build; `PATH=/usr/local/bin:$PATH python3 scripts/courses.py build` and `python3 scripts/courses.py validate` passed. Restarted the same `service:create_app` factory; observed listener PID 86438.
- Published file hashes exactly match the browser-tested isolated integrated build. Database integrity OK; schema and all 24 tables identical to snapshot before guest health requests. Uploads, protected reference files, private environment file, manifest and assessment unchanged.
- Actual HTTP checks: login 200, course and both compiled assets guest-redirect 303 to `/login`. Port 8081 retained its existing Docker listener PID 1363; no operation targeted it.
- Stopped only isolated QA process 85663. Production service remains running; no production test account/login was created. Authenticated rendering was verified against identical integrated assets with the isolated QA account, not a real account.
- Detailed evidence: `evidence/lab01-layout/deployment.json`, `deploy-browser.json`, `deploy-backup.json`.

The sections below describe the implementation verification before deployment.


## Scope

LAB01 now follows LAB08's full-width reading sequence: short introduction, dark Browser/Mobile comparison, experiment with numbered steps, optional technical details, then thinking question. Grouped controls, prominent step action, compact scoring explanation and a responsive results grid replace the narrow teaching column. Glossary enrichment covers moved prose, steps, comparison cards and details, with dark-card colors and keyboard dismissal.

Stable `flow` / `step` and original quiz choice identities, simulation stages, assessment, manifest, account APIs and storage are unchanged. This is a presentation change, not a new lesson or scoring era. During implementation verification, no deployment, staging or commit was performed and production DB, published dist and service were not modified. The later authorized deployment is recorded above.

## Verification

From `courses/scale-lab`, using `PATH=/usr/local/bin:$PATH`:

- `npx playwright test tests/browser/flow-layout.spec.js`: initial RED, 3 failures because the full-width flow layout did not exist; after implementation all passed.
- New moved-glossary test: RED because numbered steps lacked hints, then RED on computed `display:flex`; selectors and explicit grid fixed both.
- `npm test`: 59 passed.
- `npx playwright test`: 54 passed.
- `npx playwright test -c playwright.account.config.js`: 15 passed. These use intercepted account API responses, not real production accounts.
- `npm run build -- --outDir ../../evidence/lab01-layout/standalone-dist`: successful isolated standalone production build (34 modules). Vite warned that output outside the project root is not automatically emptied; the output directory was new.
- `npx playwright test -c evidence/flow-build.config.mjs`: 54 passed against the compiled standalone build, zero unexpected/skipped/flaky. QA preview port 4177 managed by Playwright; dev/account test ports 4175/4176. No live Flask registration/persistence tests were run for this UI-only change.
- `git diff --check`: passed.

Screenshots at 320, 390 and 1440 pixels: `evidence/lab01-layout/after-<width>.png`; desktop/mobile images visually inspected for hierarchy, dark-card readability and wrapping. Existing single-server checks also verify minimum SVG text size, arrow/text intersections, all six stages, JSON/HTML responses, reset and terminal no-op. Browser regressions cover LAB08 layout, navigation, glossary focus and account retry/qualification UI.

Compiled report: `evidence/lab01-layout/compiled-browser.json`. Build and QA config are local ignored evidence. The subsequent authorized deployment published the integrated build as recorded above.
