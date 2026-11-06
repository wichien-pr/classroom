# LAB01 directional connector lines — source verification

> Historical deployed moving-dash release. The later round-dot source change is **not deployed**; see `lab01-flow-dots-verification.md` for its verification and evidence.

Status: **deployed to the existing `https://localhost` HTTPS Docker stack on 2026-11-05** from `/Users/prommeesee/projects/classroom`, branch `exam-new`; **not committed or pushed**. This is a visual follow-up to the previously deployed guided presets described in `lab01-guided-playback-verification.md`. Existing uncommitted preset changes were retained. Browser QA used disposable synthetic accounts, never live accounts; production storage was accessed only for coordinated backup and read-only preservation checks.

## Verified HTTPS release

- Running immutable image: `sha256:cc0836dab1bac832ccf136404df2f897033e54887b658735dcb680de9c5be1cb`; prior image confirmed as `sha256:0be0a290dd0454fcc25814a5dc21ea15e2c414562b7d06934ced42490d7d7cc7`.
- Canonical Docker build succeeded before downtime. Complete `/app` hash comparison permits only Scale Lab's index and old/new JS/CSS assets (five changed paths). Backend application files, other course bundles, manifests and private banks are unchanged. Scale Lab assets exactly match the source-qualified integrated scratch build. Docker resolved a newer Python base image during this build; the application-tree comparison is not a claim that OS layers or installed dependency versions are identical.
- Fresh source verification: **76 unit, 39 browser and 6 intercepted-account tests passed**.
- Actual immutable-image Chromium QA: **7 checks passed**, comprising route geometry/end arrows, actual moving/frozen/resumed computed dash offsets, model-stage synchronization, replay/reset and reduced-motion checks, plus all four presets at 1280/390/320 in both themes. The 24 screenshots and report are in `evidence/flow-lines-image-matrix/`; desktop and 320px captures were visually inspected. Static screenshots alone are not motion evidence.
- Actual-image real-backend report: `evidence/flow-lines-image/report.json`. Four explicit `flow/flow/step` POSTs persisted exactly one semantic award; navigation/playback produced zero course POSTs. Reload retained score 1 and simulation-only qualification, without automatic completion or page errors.
- Stopped-writer full-volume archive and private evidence: `/Users/prommeesee/.hermes/backups/classroom-flow-lines-20261105-202748/`. `data.tar` SHA-256: `057320e4609aff0c917821c739f67f32a6a14f98ff8b93f5eb7cb11b52c6d77e`. Extracted archive integrity/schema/all **25 table fingerprints** and upload hashes matched the stopped source. Immediately after startup, before HTTP probes, they matched again exactly.
- Same `classroom-accounts-20261022:/data` mount and effective environment retained. After trusted-CA HTTPS probes, all non-session tables/uploads/schema and all preexisting sessions remained unchanged; precisely one anonymous login-probe session was added. No fixtures, credentials or scoring writes were sent to live storage.
- Exact running `/app` matches the qualified image; application health is healthy, direct and HTTPS health return 200, guest HTML redirects to `/login` with 303, and protected APIs return 401. TLS validation used the existing local root CA, not `-k`.
- Rollback image retained as `classroom:rollback-flow-lines-20261105-202748`; full sanitized rollout report is `deployment-report.json` beside the archive. Pending sources, local PDFs, `~$Step3.docx` and host dist hashes were preserved. Only this verification document was intentionally updated after the preservation comparison.
- Scope limits: authenticated browser checks used isolated loopback HTTP and synthetic seeded accounts, not live HTTPS account login, OTP/signup or backend-restart persistence. No full unrelated-course/backend suite was rerun; unchanged application assets were hash-verified. Short mobile screens still require vertical scrolling for the full architecture.

## Change boundary

- Changed only `courses/scale-lab/src/flow-view.js` and `flow-view.css` in production source.
- Added `courses/scale-lab/tests/browser/flow-lines.spec.js` and this note.
- SVG overlay follows actual CSS-pixel node geometry with a ResizeObserver, without scaling text. Four arrowheaded paths connect Client→DNS, DNS→Client, Client→Web and Web→Client. HTTP never connects to DNS. Database/Cache remain inside the host without invented query edges.
- Bright traveling dashes follow each path's start-to-end direction. Only the current model snapshot's route moves; processing/display have no moving route. Removed rectangle flashing. Text and subtle node borders identify the stage too.
- All four presets, original labels (Browser/HTML and Mobile app/JSON), action identity, result model, navigation and scoring are unchanged. The last route snapshot now receives its full 1100 ms display interval before finishing, so DNS-return and request-only presets visibly travel rather than ending immediately.
- Pause freezes both snapshot progression and CSS motion, resume continues, replay reprojects recorded frames, and cleanup disconnects the geometry observer and stops playback. Reduced motion immediately shows the final validated snapshot with a static highlighted arrow.
- Mobile keeps 16px labels and stacks HTTP labels/storage instead of shrinking text. The full architecture intentionally needs scrolling on short phones; action and result remain adjacent.

## Actual verification

- TDD: new connector assertion failed with zero paths before implementation. A second assertion caught identical dash/base stroke colors; traveling segments now have distinct high-contrast color and width.
- `npm test`: **76 passed**.
- Browser command below: **39 passed**, including all four topics at 1280/390/320 in Light/Dark, real nonzero SVG path lengths, geometric endpoints adjacent to named nodes, end markers, route-stage identity, sampled stroke/text nonintersection, no horizontal overflow and 16px minimum labels. Actual computed dash offsets advance, freeze and resume. Reset/replay/navigation/re-entry and reduced-motion regressions pass.
- The motion/pause test additionally passed **three repeated runs**. Initial fixed-50-ms pause sampling was flaky because Chromium's CSS animation pause was still pending under load; inspection of `Animation.pending/currentTime` confirmed this. The final test awaits animation `ready` and then checks exact unchanged dash offset, rather than loosening its tolerance.
- Compiled intercepted-account contract suite: **6 passed**, including held-save navigation and focus behavior in both themes at all three widths.
- Real isolated backend with synthetic account and compiled scratch assets: **4 explicit `flow/flow/step` POSTs**, persisted score **1**, **0 navigation/playback POSTs**, criteria `{manual:false, simulation:true, thinking:false}`, no automatic completion, reload persistence and no page errors. This is seeded-account coverage, not OTP/signup or real-account HTTPS QA.
- Integrated and account-preview Vite builds succeeded under scratch. `git diff --check` passed. Fingerprinted preexisting host dist/reference/temporary-document artifacts were unchanged.

## Evidence

`evidence/flow-lines/` contains:

- `dark-1280-topic1.png` through the four-topic, two-theme, three-width matrix (24 PNGs).
- `http-response-paused.png`, showing Web→Browser response without DNS transit.
- `directional-playback.webm`: actual Playwright browser recording, not a synthesized animation. Motion is also tested via computed offsets; screenshots alone are not evidence of movement.
- `account-report.json`: fresh real-backend readback summary.

Desktop query/response and 320px Mobile/JSON captures were visually inspected. The diagram deliberately retains a dark technical canvas in both page themes. Full 1400px-tall element captures document complete narrow diagrams; separate existing action-viewport tests retain the short 568px mobile checks. No full unrelated-course or backend suite was run for this visual-only change.

## Reproduce without replacing host dist

From `courses/scale-lab`:

```sh
npm test
npx playwright test tests/browser/flow-lines.spec.js tests/browser/flow-presets.spec.js tests/browser/flow-layout.spec.js tests/browser/flow-main-diagram.spec.js tests/browser/flow-slides.spec.js tests/browser/flow-readability.spec.js
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/flow-lines-qa/courses/scale-lab/dist --emptyOutDir
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/flow-lines-account-preview --emptyOutDir
FLOW_SLIDES_BUILD=/Users/prommeesee/.hermes/cache/scratch/flow-lines-account-preview npx playwright test --config playwright.flow-slides.config.js
```

From repository root:

```sh
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/flow-lines-qa/courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python node scripts/flow-presets-browser-verify.mjs
```

The existing account runner writes `evidence/flow-presets-account/report.json`; this run's report was copied into `evidence/flow-lines/account-report.json`. It starts and terminates its own disposable ephemeral-port server. Production data and published dist are not inputs or outputs.
