# Platform Dark / Light theme verification

Status: implemented on `feat/ux-ui-improvements` and **deployed to the existing local HTTPS Classroom on 2026-11-04**. Not committed or pushed.

Current release: `course-theme-verification.md` records the subsequently deployed all-course extension and approved heading copy; `header-spacing-verification.md` records the intervening layout release. Scope and image IDs below describe the historical platform-only rollout.

## Scope and behavior

- Upper-right native button on catalog, shared authenticated pages, login/signup and recovery/verification shells. Accessible pressed state, visible keyboard focus and at least 44px target.
- Semantic palette in `theme-style.html`; synchronous `theme-head.html` selects the palette before page CSS. `classroom-theme` stores only `dark` or `light`, never account data.
- System preference is the initial default. An explicit selection survives reload/navigation and synchronizes across same-origin tabs. Invalid/blocked storage falls back safely; blocked storage only retains manual choice on the current page. JavaScript is required for switching; without it the light page remains usable and the inert control stays hidden.
- Course-owned apps/diagrams/dist remain unchanged. Returning to the platform restores its preference. Community stays hidden from navigation; its existing direct route is themed.
- No backend/auth/session/security/data/schema changes. Implementation QA did not touch Docker or real storage; the separately authorized rollout below preserved the existing real volume.

## Executed verification

```sh
PYTHONPATH=appworks /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python -m pytest appworks/tests -q
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python QA_PYTHON_ARCH=arm64 node scripts/theme-browser-verify.mjs
```

- Backend: **431 passed**, including 10 new theme-shell tests (observed failing before implementation).
- Chromium: **17 grouped checks**, zero page errors. Real synthetic-account login against a disposable SQLite DB on an ephemeral loopback port; not signup/OTP or real-account verification.
- Six authenticated routes in both themes at 1280/390/320px; four guest routes in both themes at each width. Persistence, keyboard activation/focus, pressed state, system updates, cross-tab updates, malformed/blocked storage, course return, no document overflow and upper-right target bounds checked.
- Computed contrast >=4.5 for tested navigation links, toggle, main headings/paragraphs, course subtitles, leaderboard table cells/headers/ranks in both themes. This is targeted coverage, not a full WCAG audit. Contrast regressions caught and fixed inline catalog link colors, activity metadata and the highlighted leaderboard row. Visual review additionally caught composer input specificity; a regression now checks dark composer surfaces.
- Presence disclosure and composer dialog exercised in dark mode. Course source/build not modified or rebuilt. Exam page tested at normal L1 eligibility, not a seeded L8 exam attempt. Verification shell included but OTP email flow was not browser-tested in this UI task.
- Evidence: `evidence/theme/browser.json`, screenshots `evidence/theme/{catalog,leaderboards,profile,community}-{light,dark}-{1280,390,320}.png`, `login-dark-{1280,390,320}.png`, `presence-dark-320.png`, `composer-dark-320.png`.
- Owned QA server terminated after each run and listener closure verified. Final runner cleans its temporary database on SIGTERM. No preview remains running.

The runner uses the already-installed Framework course Playwright package and normal browser cache; the historical Scale Lab dependency path was unavailable on this checkout. Set `QA_PYTHON` to an interpreter with backend dependencies; use `QA_PYTHON_ARCH=arm64` when macOS Node/Python architecture differs.

## Authorized HTTPS deployment — 2026-11-04

- URL: `https://localhost` (loopback-only, existing real accounts retained). Project `classroom-docker-qa`; canonical checkout `/Users/prommeesee/projects/classroom`; all four existing Compose files retained. Only the backend container was recreated; the existing Caddy edge was left running.
- Canonical Docker build succeeded. Running image: `sha256:0682c1db1259c3d023a23093885f1a10e96481b84904ba616366293abed7be6a`; previous image: `sha256:63f33d4bfdb558e2435076791b2136ccc55cffd66de92376338ee2067dcb0136`.
- Complete `/app` hash comparison constrained the runtime delta to exactly eight theme templates: achievement-base, auth, classroom, password_reset, registration_verify, theme-head, theme-style and theme-toggle. Their hashes match canonical tested source. All course manifests, private banks, built assets, Python and platform assets are unchanged from the old image.
- Stopped-writer full-volume backup: `/Users/prommeesee/.hermes/backups/classroom-theme-20261104-122309/data.tar`. Private backup directory is 0700; archive and preserved `runtime.env` are 0600. Archive SHA-256: `ee164fad82542305a780d72561c79a4095adef4fe9f558dd74b2261f01d30bea`. Extracted archive verified against the stopped-volume schema, table fingerprints and upload hashes.
- Rollback tag: `classroom:rollback-theme-20261104-122309`. Sanitized report: `/Users/prommeesee/.hermes/backups/classroom-theme-20261104-122309/deployment-report.json`. Runtime environment was privately recovered from the existing container and compared as exact key/value mappings after recreation.
- Retained volume `classroom-accounts-20261022:/data`. Immediately after startup and before HTTP probes: SQLite integrity `ok`, schema and all 25 table fingerprints identical, one upload file identical. Retained counts include one user, three existing sessions, six manual completions, six progress rows, 15 participation awards, 25 participation request receipts and 18 activity events.
- Direct `/healthz` and CA-validated HTTPS `/healthz` succeeded; backend is healthy. HTTPS `/login` returned the theme bootstrap, style and toggle. TLS certificate/hostname checked using the existing local root CA without `-k` or trust-store modifications.
- The login probe added exactly one anonymous session. Every preexisting session row and every non-session table remained identical afterward; no probe rows were deleted. No real login, email or fixture insertion was attempted.
- Canonical tracked/untracked files and ignored reference PDFs were hashed before deployment and unchanged afterward (prior to this intentional documentation update), including `~$Step3.docx`. No commit or push.
- Limitation: the Chromium suite above exercised isolated host source, not this built image or live authenticated accounts. Runtime templates hash-match that tested source; deployed checks cover actual image identity, preserved data/environment, health and trusted HTTPS guest rendering, not a new authenticated browser journey.
