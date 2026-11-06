# LAB01 guided model playback — implementation verification

Status: deployed to the existing **https://localhost** Classroom HTTPS Docker stack from `/Users/prommeesee/projects/classroom`, branch `exam-new`, based on `ce257746fb09034b7b5b4635907fe4b7e20a9514`. No commit or push. Running image verified: `sha256:0be0a290dd0454fcc25814a5dc21ea15e2c414562b7d06934ced42490d7d7cc7`. Docker built canonical source; host course dist, pending source changes, reference PDFs and unrelated `~$Step3.docx` were hash-preserved. Earlier source qualification used scratch builds.

## Behavior contract

LAB01 now follows LAB02's automatic-scenario interaction: centered top `« Back / index · title / Next »`, read-only premise, short instruction, full model-driven architecture, `ทดลอง` beside concise result, optional snapshot replay/pause. No client selector, advanced settings, lower state/payload/event-history panels. Reading comparison, technical caveats, quiz identities, quiz 16px and sidebar 16px remain.

| Topic | Prepared client | Explicit attempt using original `flowStep` | Result |
|---|---|---|---|
| DNS lookup | Browser, step zero | 0 → 1 → 2 | IP returned to Browser; no HTTP yet |
| HTTP request | Browser, step zero | 0 → 1 → 2 → 3 | GET directly to server after DNS lookup |
| Processing/HTML | Browser, step zero | all original six transitions | processing, direct HTML response, display |
| Mobile/JSON | Mobile app, step zero | all original six transitions | processing, direct JSON response, display |

Every topic works when skipped to independently. Preparation does not execute a transition. One explicit attempt captures original transition frames and records **one** `flow / flow / step` participation event outside the transition loop. Another explicit attempt starts a fresh cold lookup; it is not an exhausted seventh transition. The underlying model's exhausted-step no-op is unchanged. Account semantic dedup still awards only the first participation for that stable action. Replay/pause only project captured frames, cannot call `act` or score, and are canceled on topic change/reset/lesson remount. Reduced motion shows the final validated snapshot immediately. Async save focus returns only to the same connected action/topic if the learner has not moved focus.

The responsive semantic diagram keeps DNS external and Web/Application, Database and Cache inside one machine. HTTP endpoints are named explicitly so mobile stacking cannot imply DNS forwards HTTP. All diagram labels remain actual CSS 16px rather than scaling an SVG canvas. Full architecture intentionally requires scrolling on a 320×568/390×568 phone; action/result are adjacent in their own viewport, not claimed to fit with the whole diagram and navigation simultaneously.

## Verification actually run

- `npm test`: **76 passed** (including new topic/model test and original exhausted-flow regression).
- LAB01 layout, main diagram, presets, playback, keyboard/contrast, quiz/sidebar readability, standalone participation, and every lesson's topic navigation: **64 passed**.
- After the final sticky-scroll fix, `flow-presets.spec.js`: **8 passed**, including measured action/result visibility below sticky chrome at 1280×800, 390×568 and 320×568 in Light/Dark.
- Isolated compiled account-API contract suite (`FLOW_SLIDES_BUILD=... npx playwright test --config playwright.flow-slides.config.js`): **6 passed**, including held save, navigation while pending, no focus stealing, original event payload and no progress POST.
- Broader other-lab/LAB02 regression selection: **54 passed / 2 failed**. Failures are existing stale curriculum expectations: `cache.spec.js` expects 11 labs while HEAD manifest has 12; `logging.spec.js` expects Next from LAB11 to wrap to LAB01, but LAB12 now exists. These unrelated tests/source were not rewritten. This is **not** an all-suite-green claim.
- Additional glossary/LAB02/copy selection: **7 passed** after updating the obsolete LAB01 SVG selector to assert nonempty semantic labels and containment instead.
- Real authenticated synthetic-account runner `scripts/flow-presets-browser-verify.mjs`: all four independently skipped scenarios executed; **4 main-action POSTs, persisted score 1, zero navigation/playback POSTs**, readback `{manual:false, simulation:true, thinking:false}`, no auto-completion, reload persistence and no page errors. This is seeded-account QA, not OTP/signup verification.
- Real LAB02 regression runner: **6 main-action POSTs, persisted score 1, zero visual/navigation POSTs**, unchanged completion criteria and reload behavior.
- Vite integrated and intercepted-account preview builds pass under scratch. No model, manifest, private bank, migration, backend, LAB02-owned module or other-lab production source changed.
- `git diff --check` passes.

## Evidence and reproduction

- `evidence/flow-presets/`: Light/Dark at all three widths, separate navigation/diagram/action viewport PNGs. Final mobile action and desktop diagram screenshots were visually inspected; the sticky-header-hidden action capture was corrected and re-tested.
- `evidence/flow-presets-account/report.json`: real backend readback summary.
- `evidence/flow-lab02-regression/report.json`: real LAB02 regression summary.
- Scratch integrated build: `/Users/prommeesee/.hermes/cache/scratch/flow-guided-qa/courses/scale-lab/dist`.
- Scratch intercepted-account preview: `/Users/prommeesee/.hermes/cache/scratch/flow-guided-account-preview`.

```sh
# From courses/scale-lab; never omit the scratch outDir here.
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/ --outDir /Users/prommeesee/.hermes/cache/scratch/flow-guided-qa/courses/scale-lab/dist --emptyOutDir
# From repo root; uses disposable DB, synthetic account, and an ephemeral loopback port.
TMPDIR=/Users/prommeesee/.hermes/cache/scratch QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/flow-guided-qa/courses QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python node scripts/flow-presets-browser-verify.mjs
```

The source-verification scratch Python/Pillow environment runs through `arch -x86_64`; no shared dependency environment changes. Existing main-site users cannot log into disposable QA datasets.

## Actual-image release verification

- Canonical Docker build succeeded before downtime. Full old/new `/app` hash comparison permits only Scale Lab `dist/index.html` and the replaced JS/CSS bundles (five added/removed/changed paths). Backend, other course bundles, manifests and private banks are identical. Every new Scale asset matches the source-qualified integrated scratch build.
- Fresh `npm test`: **76/76 passed**. Immutable-image synthetic-account browser: **four independent topic attempts, four original `flow/flow/step` POSTs, score 1, zero navigation/playback POSTs**, unchanged criteria, no auto-completion and reload persistence. Saving restores action focus in LAB01.
- Immutable-image visual/playback matrix: **8/8 passed**, including paused snapshot freeze/resume, cancellation, reduced motion and Light/Dark at 1280×800, 390×568 and 320×568. Actual desktop diagram and mobile action/result screenshots visually inspected. Evidence: `evidence/flow-guided-image/report.json` and `evidence/flow-guided-image-matrix/`.
- Separate synthetic-account LAB02 regression: **six main-action POSTs, score 1, zero playback/navigation POSTs**, reload and no auto-completion; `evidence/flow-guided-lab02-image/report.json`.
- Stopped the sole live writer, archived the full `classroom-accounts-20261022` volume, extracted and verified archive fingerprints, then recreated only Classroom with the same mount and exact environment. SQLite integrity `ok`; schema, **all 25 table fingerprints and one upload** matched immediately after healthy startup, before HTTP probes. Preserved one user, six manual markers, six progress rows, 16 awards, 102 request receipts and all 11 preexisting sessions. Guest `/login` verification added exactly **one anonymous session**; every preexisting session and all non-session tables remained unchanged.
- Trusted-root HTTPS verification (no `-k`): `/healthz` healthy, login 200, protected HTML 303 to login and protected APIs 401. Running `/app` matches the qualified immutable image; current environment and account volume unchanged.
- Private backup/report: `/Users/prommeesee/.hermes/backups/classroom-flow-guided-20261105-162218/deployment-report.json`; coordinated archive `data.tar` SHA-256 `bf6e24e80f491b1fc67d2f5df6e19c914518179c8a41e390d06c29e0749dbd65`. Rollback tag: `classroom:rollback-flow-guided-20261105-162218`, preserving old image `sha256:51ee3a5f0c6674a22d442f874dda6fe23cb27afb528ed2962e10324e63c9bfc3`.

Limits: actual-image authenticated browser testing used disposable synthetic accounts over loopback HTTP, not real-account HTTPS login or OTP/signup. Reload persistence was tested, not a disposable-backend restart. Earlier broad-suite result remains **54/56 with two documented stale curriculum assertions**, not an all-suite-green claim. No fixture or credential was inserted into production; existing main-site accounts remain on their original volume.
