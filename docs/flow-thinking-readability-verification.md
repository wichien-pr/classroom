# LAB01 thinking typography — deployed 2026-11-05

## Current deployment

Included with the authorized LAB02–LAB12 release at **https://localhost**. Exact healthy image: `sha256:e1574cb7763cef843674d038efccfa333c9710252a52e177cae75e88d7ed379c`. Existing real-account volume/environment preserved; no commit/push. See [lesson-topics-verification.md](lesson-topics-verification.md#authorized-docker-rollout--2026-11-05) for runtime delta, full-volume backup, all-table fingerprints and trusted-CA HTTPS guest checks.

Actual immutable-image synthetic-account QA passed **6** light/dark × 1280/390/320 cases: 16px answer/feedback/glossary, original semantic `quiz-answer-b`, exactly one award after repeated answers/reloads, thinking true with manual/simulation false, no completion and zero page errors. Evidence: `evidence/lesson-topics-image-thinking/report.json` and screenshots. No live-account login, signup/OTP or backend-restart persistence tested. Host dist and unrelated sources preserved.

## Historical implementation verification (before deployment)

The no-deploy statements below describe the earlier implementation phase, not current rollout status.

Checkout `/Users/prommeesee/projects/classroom`, branch `exam-new`. This change only enlarges the screenshot's LAB01 answer choices and explanation. Existing pending diagram/sidebar changes are preserved.

## Change

- `courses/scale-lab/src/single-server-layout.css`: existing `.flow-lesson` scope; choice type 15 → 16px, explanation 12 → 16px, both line-height 1.6 (25.6px). A/B badges 10 → 12px, non-shrinking. Glossary controls retain inherited font and existing emphasis/colors.
- Responsive two-column answers retain the existing single-column breakpoint at 650px; zero-min grid tracks and wrapping prevent overflow.
- No JS, lesson copy, semantic choice IDs, shuffle, scoring, persistence, manifest, or private-bank changes.
- Added `tests/browser/flow-thinking-readability.spec.js` and `scripts/flow-thinking-browser-verify.mjs`.

## Verification

- TDD RED observed: choice computed size 15 instead of 16; separate badge RED 10 instead of minimum 12. GREEN: six thinking browser cases, dark/light × 1280/390/320, 800px height.
- Unit suite: **74 passed**.
- Main live diagram regression: **6 passed**. Sidebar regression: **6 passed** on independent rerun. Combined run had 17 pass/1 sidebar dark-320 hover failure (transparent instead of hovered background); untouched sidebar test passed on rerun, no production fix made for that transient.
- Thinking checks: computed choice/feedback/term sizes and line-height, nonempty glossary/badge sets, wrapping/no horizontal clipping, other lesson choice size still 15px, retained correct semantic selection after navigation.
- Actual Flask compiled-account QA: **6 passed**, same width/theme matrix, zero page errors. Synthetic seeded account in disposable SQLite; correct answer sends original `flow / check-your-thinking / quiz-answer-b`; real GET read-back score stays 1 across reload/repeated answers, criteria `{manual:false, simulation:false, thinking:true}`, completion stays empty. No API interception.
- Integrated Vite build succeeded into `/Users/prommeesee/.hermes/cache/scratch/flow-thinking-courses/scale-lab/dist` only. Owned QA backend terminated in finally. No deployed-image, live-account, signup/OTP or backend restart-persistence claim.
- SHA-256 preservation: 101 snapshotted source/dist/reference files, only intended layout CSS changed. Host dist, other sources, PDFs and `~$Step3.docx` identical. `git diff --check` clean. No Docker operation, deploy, commit or push.

## Evidence / reproduction

- `evidence/flow-thinking/{dark,light}-{1280,390,320}.png`; visually reviewed dark 320 and light 1280: Thai text wraps, badges remain visible, explanation/glossary unclipped.
- `evidence/flow-thinking/preservation.json`
- `evidence/flow-thinking-account/report.json` and six compiled-account viewport screenshots.

From `courses/scale-lab` with `PATH=/usr/local/bin:$PATH`:

```sh
npm test
npx playwright test tests/browser/flow-thinking-readability.spec.js tests/browser/flow-main-diagram.spec.js tests/browser/sidebar-readability.spec.js --reporter=list
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/flow-thinking-courses/scale-lab/dist
```

From repo root (TMPDIR must point to scratch):

```sh
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/flow-thinking-courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python QA_PYTHON_ARCH=arm64 node scripts/flow-thinking-browser-verify.mjs
```
