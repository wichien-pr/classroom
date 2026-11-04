# Shared course Dark / Light — implementation verification

Status: implemented in canonical `/Users/prommeesee/projects/classroom`, branch `feat/ux-ui-improvements`, and **deployed to the existing local HTTPS Classroom on 2026-11-04** together with the approved heading copy. Not committed or pushed. All three integrated course builds are in the deployed image; host `courses/*/dist` was deliberately left unchanged. No separate worktree needs integration.

This extends the previously deployed platform-only theme described in `theme-verification.md` and `header-spacing-verification.md`; their deployment sections are historical evidence, not evidence of this extension being deployed.

## Contract and ownership

- `appworks/course_theme.py`, installed by `appworks/app.py`, decorates only successful authenticated course HTML GET responses. It inserts the existing synchronous shared bootstrap immediately after `<head>`, before course scripts/styles, without rewriting dist or exposing source files. Asset/auth routing and presence decoration remain unchanged. Transformed HTML has stale file validators removed, following the existing presence contract.
- `theme-head.html` continues to use only `classroom-theme` with allowlisted `dark` / `light`, system preference when unselected, cross-tab storage events and safe storage-denial fallback. A delegated click handler plus a bounded `#app` child-list observer rehydrates the toggle after lesson/reset remounts; listeners and preference do not multiply/reset. It also tolerates older course builds without a toggle.
- Every enabled course owns `src/theme.css`, imports it from `src/main.js`, and adds the same accessible native toggle to its existing `src/integration.js` return header. The control stays upper-right in normal flex flow, has a 44px minimum target, visible keyboard focus and accurate pressed state/label. At 320px the return link wraps without overlapping the toggle.
- Course palettes cover reading panels, instructions, grouped experiment controls, native inputs/selects/checkboxes, results, completion/participation, quiz selection, expanded notes and glossary popovers. Estimate reference tables include mobile row-card variants. Framework exercise-result headings are themed as well.
- Explicit teaching diagram canvases, warning/offline states, SVG fills/strokes and pre-existing dark comparison cards retain their original semantic palettes. Light diagram/state canvases have explicit dark text and appropriately scoped glossary colors, rather than receiving an image filter or indiscriminate white text. Dark mode is intentionally not a recoloring of every diagram pixel.
- Standalone builds retain their original light theme and no platform dependency; the shared theme bootstrap is supplied by authenticated integrated delivery. Blocked storage permits switching and lesson remounts within the current document, but cannot promise persistence across full navigation/reload. Normal available storage persists across platform/course navigation and reload.
- New courses receive the shared preference on authenticated HTML automatically, but must implement their own palette and optional `#theme-toggle` / `[data-theme-label]` control. Do not import another course's CSS or curriculum.

## Verified course coverage

Registry discovery found exactly three enabled applications:

| Course | Active lessons | Browser coverage |
|---|---:|---|
| `scale-lab` | 12 | Every active lesson, both themes, all three widths; main action + thinking answer + reset at desktop |
| `back-of-the-envelope-estimation` | 5 | Every active lesson and calculator, reference-table variants, glossary, thinking answer and reset |
| `framework-for-system-design-interview` | 4 | Scope, blueprint, deep dive and wrap-up; review actions, thinking answers, reset and results |

The integrated runner builds each enabled course into a disposable scratch directory and serves it through a real Flask login/session with a synthetic account and temporary SQLite/uploads. It does not rebuild canonical `courses/*/dist`. Private account/cookie state is removed with the scratch directory. This is actual authenticated host-source integration QA, not signup/OTP, live-account or deployed-image verification.

## Executed results

- Backend: **433 passed**, including two new course-delivery tests. The early-bootstrap assertion was observed failing before implementing delivery, then passed.
- Course unit suites: **121 passed** — Scale 74, Estimate 29, Framework 18.
- Integrated Chromium: **21 grouped checks**, **126 lesson/theme/width combinations** (21 lessons × light/dark × 1280/390/320). Zero recorded page errors or failed JS/CSS responses.
- Every course exercised platform → course → platform, direct reload, keyboard toggle/focus, remount/reset, direct system light/dark and live preference changes, storage-denial fallback, and bidirectional platform/course cross-tab changes. Main actions and thinking answers used actual successful participation POSTs, not intercepted success payloads.
- Every lesson in both themes/widths checked document overflow, control bounds and targeted computed text contrast ≥4.5. Contrast checks include paragraphs/lists/headings, labels/legends, expanded summaries, table cells, definition lists and enabled buttons. Desktop checks include rendered experiment results before reset. This is targeted contrast coverage, not a complete WCAG audit or exhaustive simulation-state verification.
- Regression catches fixed: Scale introductory prose, grouped control backgrounds, expanded notes and dark/light glossary nesting; Estimate mobile availability/traffic table headers; Framework result headings; light course-top metadata contrast.
- Existing platform Chromium suite: **25 grouped checks passed** against an isolated database; header spacing, auth pages, profile/community/presence and theme regressions retained.
- Existing Framework browser suite: **5 passed** in an isolated source/build snapshot, including all four labs and intercepted account loading/failure/retry/shuffle contracts.
- Existing Estimate completion browser suite: **7 passed** in an isolated source/build snapshot, including pending/failure/retry/navigation and standalone storage behavior.
- `git diff --check` passed. Owned integrated QA servers and build/database scratch directories were cleaned, with listener closure checked. No preview server is handed off.

Commands (repository root unless noted):

```sh
PYTHONPATH=appworks /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python -m pytest appworks/tests -q
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python QA_PYTHON_ARCH=arm64 node scripts/course-theme-browser-verify.mjs
QA_EVIDENCE=evidence/course-theme/platform-regression/ QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python QA_PYTHON_ARCH=arm64 node scripts/theme-browser-verify.mjs
# Each course: npm test
# Disposable Framework source snapshot: npm run build && npm run test:e2e
# Disposable Estimate source snapshot: npm run test:completion
```

## Evidence and preservation

- `evidence/course-theme/browser.json`: enabled manifests/lesson IDs and integrated result.
- `evidence/course-theme/contrast-failure.json`: final empty list.
- 48 integrated screenshots under `evidence/course-theme/`: `{course}-{first-or-last-lesson}-{light,dark}-{1280,390,320}.png` plus Scale/Estimate glossary screenshots.
- `evidence/course-theme/platform-regression/browser.json` and screenshots; unit logs `*-unit.log`; `framework-browser-regression.log` and `estimate-completion-regression.log` plus their isolated regression screenshots.
- Visually reviewed final desktop Scale dark and Framework wrap-up dark (including full-resolution crops), Estimate dark 320px glossary, and Scale light 320px header/lesson; earlier review caught pale grouped controls/notes before the final fixes. Not every screenshot was manually reviewed.
- `baseline-hashes.json` captures the pre-edit source/dist snapshot; `preservation.json` verifies 463 original files with the expected bounded changes. All 23 protected files, including all 10 published-dist files, manifests/private banks, reference PDFs, unrelated `~$Step3.docx`, approved platform heading copy and header-layout templates remain hash-identical. Existing approved theme bootstrap/QA scripts were intentionally extended, not reverted.
- During implementation QA above, no Docker commands, real volume/database access, deployment, commit or push occurred. The separately authorized deployment below supersedes that historical no-deployment state.

## Authorized HTTPS deployment — 2026-11-04

- URL: `https://localhost`, same real-account project `classroom-docker-qa`, all four existing Compose files and `classroom-accounts-20261022:/data` retained. Only backend recreated; Caddy unchanged. Exact effective environment preserved privately, with no secrets printed.
- Canonical Docker build completed before downtime, building and validating all three registry-enabled courses. Build log: `/Users/prommeesee/.hermes/cache/scratch/classroom-course-theme-build-20261104.log`. Host dist was not overwritten.
- Healthy running image: `sha256:d8302b181abdd89394f6188ff63b752899f9f38c4baa6f3e9d8c5548503e1a1b`. Previous image: `sha256:df9a1a8ed403de9278e21f03ab6fdff001777c889e48bd4b6b563814a1ffe23c`.
- Complete old/new `/app` hash maps constrain changes to `appworks/app.py`, new `course_theme.py`, `theme-head.html`, approved heading copy in `auth.html` / `classroom.html`, and the three courses' rebuilt HTML/JS/CSS. All manifests/private banks unchanged; all image backend/template/platform files match canonical source. Running `/app` equals the qualified immutable image. Existing header layout and theme palette retained.
- Before release, actual immutable-image Chromium smoke QA used a separate read-only disposable container, temporary synthetic account/database/uploads, no live data/env mounts, and loopback HTTP. **12 theme/course/width checks passed** (three courses × light/dark × 1280/320); zero page errors or failed JS/CSS responses. Verified real login, both approved headings, early theme injection before module scripts, actual theme CSS, toggle pressed state, lesson remount, reload and return-to-catalog persistence, and no horizontal overflow. This supplements, rather than repeats, the exhaustive host-source suite above.
- Evidence: `evidence/course-theme/release-image/browser.json` and 12 screenshots. Visually inspected Framework dark 320px and Scale light 1280px: readable visible content and normal-flow controls with no clipping observed. QA container removed after verification; no preview handed off.
- Stopped-writer full-volume archive: `/Users/prommeesee/.hermes/backups/classroom-course-theme-20261104-140634/data.tar`; SHA-256 `42b16227277125200a588e8a019028eb4714d24739aaec35ea31046d97aa674a`. Directory 0700; archive/runtime.env 0600. Extracted archive matched stopped baseline schema, all deterministic table fingerprints and upload hashes; SQLite integrity `ok`.
- Immediately after restart, before HTTP probes: all **25 tables**, schema and **one upload** identical. Baseline included one user, five sessions, six manual completions, six progress rows, 15 participation awards, 25 request receipts and 19 activity events. No migration/curriculum/account changes.
- Direct and CA-validated HTTPS `/healthz` passed; HTTPS `/login` includes `พื้นที่เรียนรู้<br>สู่การทำงานร่วมกับ AI` and theme markers. Catalog/leaderboards/all three course entries redirect guests 303 to `/login`; leaderboard API and all three course progress APIs return 401. Existing local CA used without `-k` or trust-store changes.
- Exactly one anonymous login-probe session added. Every preexisting session and every non-session table/schema/upload preserved afterward. No live-account login, fixture insertion, email or probe-row deletion.
- Rollback: `classroom:rollback-course-theme-20261104-140634`. Sanitized report and full runtime/source hash maps: `/Users/prommeesee/.hermes/backups/classroom-course-theme-20261104-140634/deployment-report.json` and sibling files. Helper: `/Users/prommeesee/.hermes/cache/scratch/deploy-classroom-course-theme-20261104.py`.
- All tracked/untracked source and ignored reference PDFs, including unrelated `~$Step3.docx`, remained hash-identical through deployment before these intentional verification-document updates. No commit/push.

## Limits

Chromium only; no Safari/Firefox or live HTTPS authenticated journey. Actual-image synthetic-account HTTP smoke coverage is separate from the earlier exhaustive host-source tests and trusted-CA live guest checks. No full Scale historical browser suite, exhaustive combinatorial failure/outage states, new signup/OTP run or synthetic-account process-restart persistence run was added for this styling task. Production restart preservation was verified using schema/table/upload fingerprints. Curriculum, stable identities, private questions and progress qualification remain unchanged.
