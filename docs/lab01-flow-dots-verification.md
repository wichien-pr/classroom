# LAB01 round connector particles — verification and deployment

Status: **deployed to the existing https://localhost Classroom HTTPS stack; not committed or pushed**. This supersedes the moving-dash release documented in `lab01-flow-lines-verification.md`. Workspace: `/Users/prommeesee/projects/classroom`, branch `exam-new`.

## Verified Docker release

- Canonical Docker build succeeded before downtime. Running immutable image: `sha256:31ba40e3cc072aeb19bff2a4df4ce72daeea29928238c0ce2e366c14a5d20e74`.
- Previous live image was verified as `sha256:cc0836dab1bac832ccf136404df2f897033e54887b658735dcb680de9c5be1cb`; retained rollback tag: `classroom:rollback-flow-dots-20261105-205800`.
- Complete old/new `/app` comparison permits only Scale Lab dist index and replaced JS/CSS assets (five added/removed/changed paths). Backend, other courses, manifests and private banks remain identical. Image Scale assets match the source-qualified scratch integrated build. Host dist, pending sources, reference PDFs and `~$Step3.docx` were hash-preserved.
- Exact-image disposable synthetic-account QA passed: seven motion/layout checks covering all four presets, four directed routes, both themes and 1280/390/320 widths. Actual circle geometry and path positions, active-only visibility, static solid wires, real movement, exact pause freeze, resume, same-stage replay reset, cancellation and reduced motion passed. Desktop and narrow screenshots were visually inspected; the cyan circle is distinct, labels remain readable and the narrow diagram requires vertical scrolling.
- Separate actual-image backend browser readback: four original `flow/flow/step` POSTs, one semantic award, zero playback/navigation POSTs, unchanged qualification `{manual:false, simulation:true, thinking:false}`, persistence on reload and zero page errors. Evidence: `evidence/flow-dots-image/report.json` and `evidence/flow-dots-image-matrix/report.json` (24 matrix PNGs).
- Stopped the single live writer and archived the complete existing `classroom-accounts-20261022:/data` volume. Private backup/report directory: `/Users/prommeesee/.hermes/backups/classroom-flow-dots-20261105-205800/`; report `deployment-report.json`, archive `data.tar` (SHA-256 `e3df7baf6fca6c38254242c38ebd445e6f0c43e8a16e66355629da78c85b6fcb`). Extracted archive integrity, schema, all 25 deterministic table fingerprints and upload hashes match the stopped-volume baseline.
- Immediately after startup, before HTTP probes, all schema/table/upload fingerprints matched exactly. Effective environment and named-volume mount preserved. A fresh private 0600 runtime environment snapshot avoids the missing default env file; no secrets were printed.
- Running container healthy and full `/app` matches the qualified image. Direct and trusted-CA HTTPS `/healthz` passed without `-k`; guest HTML routes redirect to `/login` (303), protected APIs return 401. The login probe added exactly one anonymous session; all original sessions, other tables and uploads remain unchanged.
- Existing real accounts/data remain in the same HTTPS deployment; no real-account login or credentials were used. Actual-image browser checks used isolated loopback HTTP Chromium and synthetic accounts, not signup/OTP or backend-restart persistence. No Safari/Firefox or unrelated full backend suite was run. The cached Python runtime layers were reused.

## Scope

- Production edits only `courses/scale-lab/src/flow-view.js` and `flow-view.css`. Retained full diagram, four presets, 16px diagram labels, top navigation, original model and scoring identities. No backend, manifest, quiz/bank or other-lesson edits.
- Thin solid blue-grey SVG connectors remain stationary with subtle directional arrowheads. One cyan-blue SVG circle (radius 4 CSS px) travels only on the current snapshot's route; inactive routes have no visible particles. No animated dashes.
- Each circle's CSS motion path is the exact responsive SVG path computed for its wire. Browser→DNS, DNS→Browser IP, Browser→Web HTTP and Web→Browser response have their own physically directed paths. Database/Cache have no invented calls.
- CSS motion pauses with existing snapshot pause; resume continues the particle position. Replay explicitly resets animation time, including replay while paused in the same first stage. Navigation/reset stop playback. Reduced motion shows the final static highlighted route without visible particles or motion.
- ResizeObserver updates both wire and motion path without changing phase; existing cleanup disconnects it. No dependencies added.

## Earlier source qualification (before deployment)

- TDD RED: circle assertion initially received `path`. GREEN after circle implementation.
- Additional RED: replay in the same paused stage retained about 94% progress; GREEN after explicitly resetting particle animation currentTime.
- `npm test`: **76 passed**.
- Relevant browser regression command: **39 passed** (`flow-lines`, `flow-presets`, `flow-layout`, `flow-main-diagram`, `flow-slides`, `flow-readability`). Final motion/pause/replay/reduced-motion test additionally **passed three repeated runs**.
- Matrix covers all four presets × Dark/Light × 1280/390/320. Every directed path's circle centre matches `getPointAtLength` at 20% and 65% of its animation timeline (error under 0.1 CSS px), with round 8px geometry. Real running offset advances, freezes exactly after awaiting animation.ready, then resumes. Solid wires have no animations or dash arrays. Inactive circles are hidden.
- Every route is sampled against text bounds with a 4px particle-radius margin; no intersections. Named endpoints remain adjacent, labels remain at least 16px, no horizontal overflow.
- Integrated and account-preview Vite builds succeeded exclusively under scratch (`flow-dots-qa/courses/scale-lab/dist` and `flow-dots-account-preview`). **6 compiled intercepted-account tests passed**.
- Real isolated backend and synthetic account: **4 explicit `flow/flow/step` POSTs, score 1, zero playback/navigation POSTs**. Readback criteria `{manual:false, simulation:true, thinking:false}`, no automatic completion, retained on reload; zero page errors. Runner terminates its own disposable server.
- `git diff --check` passed. No Docker operations, deployment, host dist build, production account access, commit or push. Existing pending files, PDFs and `~$Step3.docx` were not edited.

## Evidence

`evidence/flow-dots/`:
- 24 matrix PNGs (`dark-1280-topic1.png` etc.).
- `http-response-paused.png`.
- `directional-playback.webm`: actual Playwright browser recording, not synthesized motion.
- `account-report.json`: real-backend readback report.

Desktop response and narrow 320px Mobile/JSON captures were visually inspected: cyan circle is distinct from faint solid connectors, full labels remain readable, no text collisions. The technical canvas remains dark in either page theme. Full narrow architecture still requires vertical scrolling.

## Reproduction

From `courses/scale-lab`, use the existing Playwright config and the six specs above. Account preview:

```sh
FLOW_SLIDES_BUILD=/Users/prommeesee/.hermes/cache/scratch/flow-dots-account-preview npx playwright test --config playwright.flow-slides.config.js
```

From repository root:

```sh
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/flow-dots-qa/courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python node scripts/flow-presets-browser-verify.mjs
```

Limits: browser evidence is Chromium only; Safari/Firefox are not tested. CSS offset-path support is required for moving particles. Account coverage uses seeded synthetic accounts over isolated loopback HTTP, not signup/OTP, real-account HTTPS login or backend-restart persistence. No unrelated full-course/backend suite was rerun.
