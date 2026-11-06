# LAB01 compact orthogonal lanes — source verification

Status: **deployed to existing https://localhost Docker on 2026-11-05; NOT committed or pushed**. Workspace `/Users/prommeesee/projects/classroom`, branch `exam-new`. This supersedes the round-dot runtime described in `lab01-flow-dots-verification.md`.

## Actual-image qualification and release

- Canonical Compose build succeeded before downtime. Running immutable image: `sha256:84785b5aac9103f648fb9668ada1cd77ad2d81d119c80da61fffc4a0ffa6d99f`; previous image: `sha256:31ba40e3cc072aeb19bff2a4df4ce72daeea29928238c0ce2e366c14a5d20e74`.
- Full `/app` hash comparison allows only Scale Lab dist index plus old/new JS/CSS filenames (5 changed paths). Backend, other courses, manifests and private banks are unchanged. New image dist hashes match the source-qualified integrated scratch build. Runtime dependency layers were cached during this build.
- Exact-image Chromium QA used isolated tmpfs storage and seeded synthetic accounts, never real credentials/data: **7 motion/matrix checks passed**, covering four presets × Dark/Light × 1280/390/320. Assertions cover compact nodes, orthogonal separated lanes, no markers, no node/text intersections, particle centres/movement, pause/resume/replay/cancellation and reduced motion. Evidence: `evidence/flow-orthogonal-image-matrix/report.json` and 48 diagram/viewport captures. Desktop dark viewport and 320px light full diagram visually reviewed; narrow diagrams still require scrolling.
- Separate exact-image real-backend runner passed: **4 flow/flow/step POSTs, 1 semantic award, 0 playback/navigation POSTs**, focus after save, unchanged incomplete criteria and reload persistence; no page errors. Report: `evidence/flow-orthogonal-image/report.json`.
- Existing Compose project `classroom-docker-qa`, all four YAML overrides, HTTPS proxy, effective environment and `classroom-accounts-20261022:/data` preserved. Only classroom service recreated. Missing default env file handled by saving the existing effective environment privately with mode 0600, without printing secrets.
- Coordinated stopped-writer full-volume archive verified against schema, all **25 table fingerprints**, SQLite integrity and upload hashes. Immediate post-startup comparison before HTTP probes was exact. After trusted-CA HTTPS checks, all prior sessions/non-session tables/uploads remain unchanged; exactly **1 anonymous login-probe session** was added.
- Backup/report directory: `/Users/prommeesee/.hermes/backups/classroom-flow-orthogonal-20261105-213803/` (`data.tar`, `deployment-report.json`, before/archive/after fingerprints, source/runtime maps and private runtime env). Archive SHA-256: `e6091902694ba66f45d8e69c422256aa57823d5c12198c75f16475bb54032b9a`. Rollback tag: `classroom:rollback-flow-orthogonal-20261105-213803`.
- Running full `/app` matches qualified image; healthy container, direct health 200, TLS certificate/hostname-validated `/healthz` and `/login`, guest HTML redirects 303 to `/login`, protected APIs 401. No `-k` or system trust changes.
- Pending sources, host dist, reference PDFs and `~$Step3.docx` hash-preserved during rollout. No commit/push. Disposable QA container removed after verification.
- Limits: authenticated browser checks are isolated HTTP Chromium, not live-account HTTPS, signup/OTP or backend-restart persistence. No unrelated full backend suite rerun. Source-only evidence below describes the earlier pre-deployment stage.

## Layout

- Runtime changes are confined to `courses/scale-lab/src/flow-view.js` and `flow-view.css`. Presets, model snapshots, scoring, navigation/action copy and other labs are unchanged.
- Desktop: 200px client on the left; 220px DNS at upper right; 220px single-host enclosure at lower right. Web/Application is inside that enclosure with Database and Cache. The two DNS lanes run horizontally. HTTP leaves the client horizontally, turns down through a dedicated central corridor, then right into Web. Response uses an adjacent separate lane, not an outside perimeter. No DNS-to-Web segment or invented storage call exists.
- Narrow containers: nodes stack at the right of a dedicated 48px HTTP corridor. DNS uses a separate two-lane vertical gap between client and DNS. The nested HTTP outbound/return ports reverse their vertical ordering at Web to avoid crossing. Labels retain their named endpoints, so stacking does not imply DNS forwards HTTP.
- All SVG marker heads are removed. Stationary solid paths, cyan round 8px travelling particles and short route labels retain directional meaning. Diagram text remains at least 16 CSS px. Responsive layout depends on the figure's container width, not only viewport width.
- Mobile architecture still needs vertical scrolling; it is deliberately not shrunk to fit a single viewport.

## Verification performed

- TDD RED: markerless-path assertion failed on the original marker-end; GREEN after removing SVG marker definition and CSS marker-end.
- TDD RED: compact geometry assertion received a 730px node against the 222px maximum. New layout passed after implementation. The lane-clearance assertion caught an initial mobile HTTP crossing; reordered Web ports fixed it.
- `npm test`: **76 passed**.
- Targeted browser suite (`flow-lines`, `flow-presets`, `flow-layout`, `flow-main-diagram`, `flow-slides`, `flow-readability`): **39 passed**. Final all-SVG-path no-marker assertion also passed in a separate motion-test rerun.
- Four topics × Dark/Light × 1280/390/320: compact node widths, orthogonal M/H/V geometry, no route crossing or <5px route proximity, no interior node intersections, no text intersections with a 4px margin, minimum 16px text, no horizontal overflow. Route endpoints retain original client→DNS, DNS→client, client→Web and Web→client identities.
- Actual circle centres match the paths at 20% and 65% of travel with under 0.1px error. Moving offset, exact paused offset after animation.ready, resume, replay reset, cancellation and reduced motion all pass; wires remain static and solid.
- Isolated compiled intercepted-account suite: **6 passed** across both themes/three widths. Both standalone-base account preview and integrated-base builds succeeded under scratch only.
- Real disposable backend with seeded synthetic account: **4 original flow/flow/step POSTs**, score **1**, **0 playback/navigation POSTs**, criteria `{manual:false,simulation:true,thinking:false}`, reload persistence and no page errors. This is not signup/OTP, real-account HTTPS or backend-restart coverage.
- `git diff --check` passed. Protected pre-build fingerprints of host dist, PDFs and `~$Step3.docx` remained unchanged (12 files). No Docker command, live volume access, deployment, commit or push was performed.

## Evidence and reproduction

`evidence/flow-orthogonal/` contains 24 full-diagram PNGs, 24 actual 900px-high viewport PNGs, `http-response-paused.png`, `directional-playback.webm` (real browser recording), and `account-report.json`. Desktop dark and narrow light normal-viewport captures plus full desktop/320px diagrams were visually inspected: compact rectangles, separated channels, readable text, no spiderweb perimeter. Remaining matrix screenshots are available for parent review.

Scratch builds:
- `/Users/prommeesee/.hermes/cache/scratch/flow-orthogonal-account`
- `/Users/prommeesee/.hermes/cache/scratch/flow-orthogonal-qa/courses/scale-lab/dist`

From `courses/scale-lab`:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH npx playwright test tests/browser/flow-lines.spec.js tests/browser/flow-presets.spec.js tests/browser/flow-layout.spec.js tests/browser/flow-main-diagram.spec.js tests/browser/flow-slides.spec.js tests/browser/flow-readability.spec.js
PATH=/usr/local/bin:$PATH FLOW_SLIDES_BUILD=/Users/prommeesee/.hermes/cache/scratch/flow-orthogonal-account npx playwright test --config playwright.flow-slides.config.js
```

From the repository root:

```sh
PATH=/usr/local/bin:$PATH TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/flow-orthogonal-qa/courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python node scripts/flow-presets-browser-verify.mjs
```

Limits: Chromium only; CSS motion-path and container-query support required. No unrelated full backend suite. Tool initially misclassified direct `npx vite build` as a server command; the normal `npm run build -- ...` command succeeded. QA servers terminate through their runners; no preview is offered as the live site.
