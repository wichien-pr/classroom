# Course navigation palette correction

Status: **implemented, verified and deployed to `https://localhost` on 2026-11-04; not committed or pushed.** Workspace `/Users/prommeesee/projects/classroom`, branch `feat/ux-ui-improvements`. This follows the shared-theme release in `course-theme-verification.md`.

## Change

The shared course theme previously styled reading surfaces without overriding the original evergreen sidebar/header or pastel selected lesson. Course-owned `src/theme.css` in Scale Lab, Estimate Lab and Framework now explicitly styles navigation surfaces in both integrated themes:

- Dark sidebar, return header and course topbar: `#1b2432`; light: `#ffffff`.
- Neutral hover surfaces: dark `#263347`, light `#eef2f8`; readable primary/muted navigation text and brand/progress labels.
- Active lesson: `#176b5b` with white text and an inset accent; hovered active: `#125747`. Both `aria-current=page` (Scale) and `aria-current=step` (Estimate/Framework) are covered without changing those semantics.
- Return link no longer appears as a glaring white card in dark mode. Keyboard focus remains a visible 3px outline. Navigation colors do not target teaching diagrams, SVGs, quizzes or content panels.
- No JS application, lesson, manifest, private assessment, progress or bootstrap/template change. Standalone without `data-theme` keeps its original palette.

## Actual verification

- TDD RED recorded in `evidence/course-navigation/red.log`: computed light sidebar was `rgb(32, 44, 42)` instead of the requested light surface.
- Extended `scripts/course-theme-browser-verify.mjs`, with new `scripts/course-navigation-checks.mjs`, checks computed sidebar/header/active/hover/return-link colors, selected text, navigation text contrast and real Tab/Shift+Tab focus outlines. Selectors account for the existing page/step semantics.
- Integrated Chromium GREEN: **21 grouped checks, 126 lesson/theme/width combinations**, all 21 lessons (12 Scale, 5 Estimate, 4 Framework), light/dark at 1280/390/320. Every combination checks navigation; smallest measured navigation text contrast **6.33:1**, above 4.5:1.
- Existing runner also verifies real authenticated experiment/answer POSTs, reset/remount, reload, platform return, cross-tab/system/storage fallback, main-content contrast, bounds and overflow. Zero recorded page errors or failed JS/CSS responses.
- Backend **433 passed**; course unit suites **121 passed** (74 Scale, 29 Estimate, 18 Framework). `git diff --check` passed.
- Three integrated builds used disposable output directories and a synthetic account on an ephemeral loopback Flask server. Each runner invocation cleaned its own server, database and builds and checked listener closure. No preview is handed off.

Commands, from repository root:

```sh
QA_EVIDENCE=evidence/course-navigation/ QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python QA_PYTHON_ARCH=arm64 node scripts/course-theme-browser-verify.mjs
PYTHONPATH=appworks /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python -m pytest appworks/tests -q
npm --prefix courses/scale-lab test
npm --prefix courses/back-of-the-envelope-estimation test
npm --prefix courses/framework-for-system-design-interview test
git diff --check
```

## Evidence and preservation

All evidence is in `evidence/course-navigation/`:

- `browser.json`, `browser.log`, `navigation.json` (actual computed colors/contrast for all combinations), `contrast-failure.json` (empty), `red.log`.
- `backend.log`, `{course-id}-unit.log`.
- **48 screenshots**: first/last lessons in every theme/width plus glossary views. `navigation-contact-sheet.png` additionally assembles the first-lesson desktop/390px screenshots for all three courses in both themes. Visually reviewed that 12-image sheet: navigation uses matching neutral surfaces, selected green remains readable, and no header/sidebar clipping is apparent. Semantic light diagram canvases intentionally remain light. Not every full screenshot was manually reviewed.
- `baseline.json` snapshots 626 original files; `preservation.json` verifies only the three theme stylesheets and existing browser runner changed before this new documentation was added. All **10 canonical dist files**, manifests/private banks, other course sources, existing heading/header/theme bootstrap files, reference PDFs and unrelated `~$Step3.docx` remain unchanged. New helper/document/evidence are additions, not replacements of prior work.

During source implementation/QA above, no Docker command, real account/volume/database access, deployment, commit or push was performed. The separately authorized deployment below supersedes that historical state.

## Authorized HTTPS deployment — 2026-11-04

- Existing `https://localhost` project `classroom-docker-qa`, four Compose files, Caddy and `classroom-accounts-20261022:/data` retained. Only backend recreated; effective runtime environment exactly preserved privately.
- Canonical build succeeded before downtime. Running healthy image: `sha256:e030ff17442918e9548ee192696ee0a85eb51e70add5918cf57af144d1df35b2`. Previous image: `sha256:d8302b181abdd89394f6188ff63b752899f9f38c4baa6f3e9d8c5548503e1a1b`. Build log: `/Users/prommeesee/.hermes/cache/scratch/classroom-course-navigation-build-20261104.log`.
- Complete runtime hash comparison permits only three courses' dist CSS/JS/index changes. JS and HTML compare identical after normalizing content-hashed asset references. Backend, platform templates/assets, manifests and private banks unchanged. Running `/app` equals the browser-qualified immutable image; canonical host dist, all source/reference PDFs and unrelated `~$Step3.docx` preserved before this intentional documentation update.
- Actual immutable-image Chromium QA: **12 checks passed**, three courses × light/dark × 1280/320, using a separate read-only container with synthetic account and temporary data; no live environment/data mounts. Verified computed navigation/active/hover colors, white active text, navigation contrast ≥4.5, keyboard focus, early bootstrap, remount/reload/return, headings and overflow; zero page errors or failed JS/CSS responses. Evidence: `evidence/course-navigation/release-image/browser.json` and 12 screenshots. Disposable container removed.
- Coordinated stopped-writer backup: `/Users/prommeesee/.hermes/backups/classroom-course-navigation-20261104-142954/data.tar`; SHA-256 `9c51642872a697ae7cf54d96e6b158e591c1d7503e8c602e00e2a0b6bd276f17`. Directory 0700, archive and recovered runtime.env 0600. Extracted archive matched SQLite integrity, schema, deterministic all-table fingerprints and uploads.
- Immediately after restart and before HTTP checks: all **25 tables**, schema and **one upload** unchanged; integrity `ok`. After HTTP checks: all preexisting sessions and all non-session tables/schema/uploads unchanged; exactly one anonymous login-probe session added. No live-account login, fixtures, emails or deletion of probe rows.
- Direct `/healthz` 200 and trusted-CA HTTPS `/healthz` returned `{"status":"ok"}`. HTTPS `/login` retained heading/theme markers. Catalog, leaderboards and three course entries returned 303 to `/login`; leaderboard and course-progress APIs returned 401. No `-k` or trust-store changes.
- Rollback tag: `classroom:rollback-course-navigation-20261104-142954`. Sanitized report: `/Users/prommeesee/.hermes/backups/classroom-course-navigation-20261104-142954/deployment-report.json`; sibling files retain source/runtime maps and before/archive/after fingerprints. Release helper: `/Users/prommeesee/.hermes/cache/scratch/deploy-classroom-course-navigation-20261104.py`.
- No commit or push.

Limits: Chromium only; actual-image synthetic-account HTTP checks are separate from exhaustive source QA and live trusted-CA HTTPS guest checks. No live-account authenticated HTTPS journey or Safari/Firefox run. Targeted contrast checks are not a full accessibility audit. No new signup/OTP or exhaustive failure/outage simulation; production restart data preservation was verified by schema/table/upload fingerprints.
