# Header spacing verification

Status: implemented in canonical `/Users/prommeesee/projects/classroom`, branch `feat/ux-ui-improvements`, and **deployed to the existing local HTTPS Classroom on 2026-11-04**. Not committed or pushed. Supersedes the earlier Dark/Light image recorded in `theme-verification.md`; its historical evidence remains intact.

Current release: the all-course theme and approved heading deployment in `course-theme-verification.md` supersedes the image below while preserving this header layout. The sections below record the earlier header-only release.

## Cause and scoped fix

The authenticated `.top` reserved 132px right padding (116px on mobile) for an absolutely positioned theme toggle at `top:22px`. The account link's auto margin independently pushed profile/logout right, while logout inherited different font/line-height/padding in the two shells. This produced an overlay aligned to the top rather than the control centers, unequal gutters and inconsistent heights.

- Keep the existing centered 1160px header/content rail, with symmetric 24px desktop / 16px mobile gutters; remove reserved overlay space.
- Group logo/brand/online presence and profile/logout/theme separately. Center-align the groups; normalize logo/avatar/logout/theme to 44px and action gaps to 12px. Toggle participates in normal flow.
- At 320/390px, retain the brand and presence, followed by profile and a shared logout/theme row; long names wrap without clipping. Header/nav remain in document flow.
- Preserve names, avatars, online disclosure, profile navigation, CSRF logout, theme bootstrap/storage/accessibility and existing palette. Guest auth/recovery layout and all course content/builds are unchanged.

Changed implementation: `appworks/templates/classroom.html`, `appworks/templates/achievement-base.html`, `appworks/templates/theme-style.html`. Regression runner extended: `scripts/theme-browser-verify.mjs` (optional `QA_EVIDENCE` separates evidence from the deployed theme's historical run).

## Executed verification

```sh
PYTHONPATH=appworks /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python -m pytest appworks/tests -q
QA_EVIDENCE=evidence/header-spacing/ QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python QA_PYTHON_ARCH=arm64 node scripts/theme-browser-verify.mjs
git diff --check
```

- RED: browser regression failed on the original source with `header theme toggle must participate in normal layout, not an overlay`; owned QA process terminated and listener closed.
- GREEN: **431 backend tests passed**; **25 grouped Chromium checks passed**, zero page errors. Whitespace check passed.
- Layout assertions cover six authenticated routes in light/dark at 1920, 1280, 900, 768, 390 and 320px: centered/max-width rail, right gutter, normal-flow toggle, equal logout/theme height and alignment, 12px gap, nonoverlapping profile, mobile reading order, touch targets and no overflow.
- Existing theme regression coverage retained: system default/changes, keyboard/focus, explicit preference/reload, navigation/course return, cross-tab updates, invalid/blocked storage, guest auth/recovery, targeted contrast, presence disclosure and community composer.
- Added long-display-name wrapping checks at desktop/tablet/mobile (DOM stress fixture only), actual header profile navigation and CSRF logout with subsequent protected-catalog redirect.
- Screenshots visually inspected, not merely geometry-tested: desktop dark catalog, light header, tablet shared header, 390px light/dark and 320px light/dark. Controls align, desktop gutters match and narrow headers retain readable branding without an overlay or cramped reserved column.

Evidence: `evidence/header-spacing/browser.json`; focused screenshots `evidence/header-spacing/header-{light,dark}-{1280,390,320}.png`; full-page screenshots `catalog`, `leaderboards`, `profile`, `community` for every tested theme/width. Original failure capture: `evidence/header-spacing-red/header-before-layout-check.png`.

Implementation QA used only disposable synthetic-account SQLite/upload directories and ephemeral loopback ports, then removed the owned servers and verified listener closure. No Docker commands, real database access, deployment, course rebuild, commit or push. Existing uncommitted theme work and unrelated local documents/PDFs were not reverted. Browser verification is isolated host-source coverage, not live-account or deployed-image coverage.

## Authorized HTTPS deployment — 2026-11-04

- `https://localhost`, existing project `classroom-docker-qa`, canonical checkout and all four Compose files preserved. Built successfully before downtime; recreated only the backend, retaining the existing Caddy edge.
- Actual healthy running image: `sha256:df9a1a8ed403de9278e21f03ab6fdff001777c889e48bd4b6b563814a1ffe23c`. Previous immutable image: `sha256:0682c1db1259c3d023a23093885f1a10e96481b84904ba616366293abed7be6a`.
- Full old/new `/app` hash comparison proved exactly three changed runtime files: `appworks/templates/achievement-base.html`, `appworks/templates/classroom.html`, `appworks/templates/theme-style.html`. All match browser-qualified canonical source. Complete running-container `/app` hashes match the new image. Backend, course manifests, private banks, course builds and other assets are unchanged.
- Runtime inspection verified both authenticated shells contain `header-brand`/`header-actions` groups and the deployed CSS contains `html .header-actions #theme-toggle{position:static;margin:0;height:44px;line-height:22px}` plus symmetric desktop header padding. This is deployed-file inspection, not live authenticated geometry testing.
- Retained `classroom-accounts-20261022:/data` and exact effective environment mappings. Missing default runtime.env was handled by privately preserving the current container environment in the new backup directory (0600), without exposing values.
- Coordinated stopped-writer full-volume archive: `/Users/prommeesee/.hermes/backups/classroom-header-20261104-130144/data.tar`; SHA-256 `d2f407cf79477309cb4ef44ca136ab57228b4ed37ed16fd3a0b3e7b76f0427ab`. Backup directory 0700, archive 0600. Extracted archive matched the stopped baseline, including schema, every table fingerprint and upload hash.
- Immediately after startup, before guest HTTP probes: SQLite integrity `ok`; schema, all 25 table fingerprints and one upload file identical. Retained one user, four sessions, six manual completions, six progress rows, 15 participation awards, 25 participation request receipts and 19 activity events. These are this rollout's baseline, not the earlier theme rollout's counts.
- Direct and CA-validated HTTPS `/healthz` passed. HTTPS login returned theme markers. Guests receive 303 to `/login` for `/` and `/leaderboards`, and 401 for `/api/leaderboards`. Used the existing local CA; no `-k` or trust-store modifications.
- The login probe added one anonymous session. All preexisting session rows, every non-session table, schema and upload hash remained identical afterward. No real-account login, email, fixtures or probe cleanup was performed.
- Rollback tag: `classroom:rollback-header-20261104-130144`. Sanitized evidence: `/Users/prommeesee/.hermes/backups/classroom-header-20261104-130144/deployment-report.json`. Unique helper: `/Users/prommeesee/.hermes/cache/scratch/deploy-classroom-header-20261104.py`.
- All tracked/untracked source and ignored reference PDFs, including `~$Step3.docx`, were hash-preserved through deployment before this intentional documentation update. No commit or push.
- Limitation: no authenticated live-browser journey or built-image browser suite was performed. The earlier 431 backend tests and 25 grouped Chromium checks are isolated host-source qualification; actual deployment verification covers source/image/runtime hash equality, corrected selectors, data/environment preservation, health and trusted HTTPS guest protection.
