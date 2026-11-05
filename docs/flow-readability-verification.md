# LAB01 topic readability — deployed 2026-11-05

Checkout: `/Users/prommeesee/projects/classroom`, branch `exam-new`.

## Changes

Only LAB01's topic workspace typography and its existing Back/Next presentation change. Instructions and current feedback are 17px; route detail, state values, payload and controls are 16px; route heading 18px; topic heading 22px; secondary labels/notes at least 14px. Thai line height is 1.6–1.8. Next uses a solid blue accent that adapts to dark mode, while Back has a contrasting outlined surface. Both have bold 16px labels and decorative arrows, 48px minimum targets, hover/pressed/focus feedback. Disabled ends use neutral colors, dashed borders and a not-allowed cursor rather than fading active controls. The primary simulation action retains its green treatment.

All new navigation rules are scoped to `.flow-lesson #flow-topic`. No new scoring/action handlers, lesson identities, simulation transitions, manifests or banks. Navigation still skips without scoring and retains client/step state.

## Source verification performed (before deployment)

- TDD typography: six expected failures on original 12px instruction text, then six passes.
- TDD navigation: meaningful failure on original 14px button label, then full light/dark × 1280/390/320 coverage passes. An initial test-selector typo was corrected before recording the meaningful RED.
- Standalone targeted browser run: **22 passed** (existing flow-layout/flow-slides/single-server 10 plus new readability/affordance 12). Final strengthened readability-only rerun: **12 passed**.
- Unit suite: `npm test` — **74 passed**.
- Compiled intercepted account-adapter suite: **6 passed**. The old total-topic height budgets failed after increasing font sizes; explicitly revised mobile bounds from 850/950 to 1100/1200px (390/320), retaining the desktop 850px bound and unchanged instruction/action/feedback visibility within the 1000px viewport. No scoring/state assertions were removed.
- Actual isolated Flask synthetic-account suite: **6 passed**, zero page errors, all four topics and 12 original step actions per sequence. Skip/Back/Next emit no course POST; backend participation remains 1 across reloads; completion remains empty; Mobile/client step survives Back. Real progress/participation endpoints read back after each matrix case.
- Computed tests verify minimum fonts/line-height, normal and hovered button text contrast >=4.5:1, Next fill / Back border contrast >=3:1, enabled opacity/cursor, disabled ends, arrows, 48px targets, pressed translation, keyboard focus outline, sidebar computed-style stability and horizontal bounds.
- Both Vite builds passed into scratch directories only. **23 protected files** (host dist, course manifests/banks, local PDFs and `~$Step3.docx`) match the pre-edit SHA-256 snapshot. `git diff --check` clean. Disposable QA process exited; no `theme-qa-server.py` remains.
- Full browser suite was not rerun. Previously documented eight stale 11-versus-12 curriculum assertions remain untouched; these results do not claim a clean full suite.

## Files

Modified: `courses/scale-lab/src/single-server-layout.css`, `src/single-server-layout.js` (decorative arrow markup only relative to the approved topic implementation), `tests/account/flow-slides.spec.js` (documented height budget and optional evidence directory).

Added: `courses/scale-lab/tests/browser/flow-readability.spec.js`, this document. Existing approved source/tests/deployment documents retained.

## Evidence and reproduction

- `evidence/flow-readability/`: **48** actual 800px-high viewport screenshots — four topic-top and four navigation views per theme/width combination.
- `evidence/flow-readability-adapter/`: **24** compiled adapter viewport screenshots, 1000px high.
- `evidence/flow-readability-account/`: **24** real-backend viewport screenshots plus `report.json`, 1000px high.
- Visual inspection included desktop in both themes, 390px in both themes, 320px in both themes, all four topic types, active navigation and both disabled ends. Mobile navigation wraps onto two lines without horizontal overflow; longer topics require vertical scrolling. Topic-top screenshots do not imply navigation is simultaneously visible on short phones; separate nav viewports establish its appearance.

Commands from `courses/scale-lab` use `PATH=/usr/local/bin:$PATH`:

```sh
npx playwright test tests/browser/flow-readability.spec.js tests/browser/flow-slides.spec.js tests/browser/flow-layout.spec.js tests/browser/single-server.spec.js --reporter=list
npm test
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ npm run build -- --emptyOutDir --outDir /Users/prommeesee/.hermes/cache/scratch/flow-readability-build
FLOW_SLIDES_EVIDENCE=../../evidence/flow-readability-adapter FLOW_SLIDES_BUILD=/Users/prommeesee/.hermes/cache/scratch/flow-readability-build npx playwright test --config playwright.flow-slides.config.js
VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/ npm run build -- --emptyOutDir --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/flow-readability-courses/scale-lab/dist
```

Real-backend runner: `/Users/prommeesee/.hermes/cache/scratch/flow-readability-account.mjs`, using the existing `scripts/theme-qa-server.py`, arm64 scratch Python venv, temporary database and synthetic seeded account. Run with `PLAYWRIGHT_BROWSERS_PATH=/Users/prommeesee/projects/classroom/courses/scale-lab/.browsers /usr/local/bin/node <runner>`.

The source verification above did not touch Docker or production. Subsequently deployed 2026-11-05 to the existing HTTPS stack; see [deployment evidence](flow-slides-deployment.md). Current immutable image: `sha256:49c5ed116e70de4eb6fca136764fd119e58ccb7804ddc024cd8a393f9ae21490`. Actual-image synthetic-account QA passed six matrix cases with 24 topic computed-style records and 48 screenshots under `evidence/flow-readability-image/`. Existing data, environment and mount preservation were verified before/after startup. No live-account authentication, signup/OTP, restart-persistence test, commit or push.
