# Estimate Lab audit fixes and reading design

## Approved source revision (deployment preceded packaging)

Current packaging verification and portable commands: [Estimate / Framework packaging](../../docs/estimate-framework-packaging.md). Historical evidence and preview commands below are retained as a record, not current defaults.

Five active LABs; same stable lesson/calculator/semantic answer IDs, manual completion, account adapters, manifest and private assessment bank. No new point-earning events. No source bank is copied into the scratch build. Canonical dist and live services/data are untouched.

- LAB01: distinguish 1 PiB ≈ 1.126 PB from the rough 1 PB mnemonic; not a storage budget guaranteed to be sufficient.
- LAB02: ratio is comparison/reference, with explicit faster/slower/equal interpretation. Reversed pairs no longer claim to be slower. Original model and result-input snapshots retained.
- LAB03: current teaching table uses 1/7/30/365-day windows and two-decimal presentation. Monthly 99% is 7.20 hours; monthly 99.99% is 4.32 minutes; annual 99.99% is 52.56 minutes. Historical source table had rounded monthly/yearly differences; its calendar was not specified. This revision does not attribute the new calendar to that source. Four original availability rows retained.
- LAB04: MAU and DAU labels describe unique-user counts, not rates. Keep fixed storage example distinct from editable QPS. Added unscored native disclosure: predict 10% → 20% media, then reveal 60 TB/day and 109.5 PB over five years. Clarify 64 bytes versus 64 bits (8 bytes), without claiming a real Twitter schema.
- LAB05: rounding below the original value by about 9% is not a safe upper bound. Unscored paper/verbal synthesis of LAB04 separates provided hypothetical facts, additional assumptions and measurements needed. No text submission, persistence or grading is implied.
- README current curriculum now precedes explicitly historical release records; current counts are five lessons and fifteen participation definitions.

## Reading design

Course-owned `src/readability.css`, imported last, preserves existing palettes and glossary. Updated to the actual current Scale Lab role sizes (see comparison below): body 14px / 1.85, concept prose 15px, introduction 13px desktop / 12px mobile, title 30px desktop / 25px mobile, section heading 17px, quiz heading 19px, controls and answers 16px, tables and read-more text 14px. This supersedes the initial audit's larger 17px base; spacing and touch targets remain unchanged. Constrain prose to a comfortable reading measure and increase block spacing rather than shrinking mobile type. Two-column controls collapse to one column; navigation becomes two columns at intermediate widths and one on narrow phones. Existing mobile table row cards retained. Inputs/disclosures have 48px minimum height and action controls remain at least 44px. Native disclosures work by keyboard and do not touch participation.

Visual review caught inherited global definition-list colors on the new synthesis panel; fixed with scoped reading colors/type and added a computed contrast regression (>=4.5). This is targeted accessibility QA, not full WCAG certification.

## Verification

Evidence root: `/Users/prommeesee/.hermes/cache/scratch/estimate-ux-fixes/`.

- Unit tests: **32 passed, 0 failed**, `unit.log`.
- Existing compiled browser suites: **30 passed, 0 failed**, `legacy-browser-final.log`. Includes standalone plus intercepted account frontend contracts, retry identities, manual completion, glossary keyboard interaction, models and snapshots. Not authenticated backend persistence.
- New `tests/readability-browser.mjs`: **5/5 LABs**, all calculators, both semantic quiz choices, invalid input, reset and edit-without-recalculate/navigation snapshots; **40 layouts** (320/390/768/1280 × light/dark × five), zero document overflow and no captured console/page errors. Native exercise disclosures opened by keyboard. Reverse/equal latency checked. `green/coverage.json`, `browser.log` and 40 screenshots.
- Inspected screenshots across all five lessons; full-resolution crops for units desktop, traffic mobile and corrected tips dark disclosure. Theme QA uses the real course-owned `data-theme` CSS; standalone does not supply platform theme preference UI.
- Meaningful RED→GREEN: latency wording, calendar reference fixture, unique-user/storage practice, binary/rounding caveats and synthesis; browser typography failed at 14px before the reading layer. Later contrast regression failed at ~2.01 before scoped definition colors. Original failed logs are retained where captured; tool transcript contains other RED runs.
- `preservation-result.json`: manifest, bank, package files, model, adapters, glossary and all canonical dist files match the prior audit hashes. No changes to other courses, live data, dependencies or Docker. No commit/push/deploy.

## Reproduce

From this course:

```sh
/usr/local/bin/node --test tests/*.test.js
```

Build a bounded scratch copy of `src/`, `index.html`, `package.json` and `course.json`. Current scratch course is `.../estimate-ux-fixes/course`; only it has a dependency symlink to the existing Scale Lab node_modules. No dependency installation or source-tree symlink was needed.

```sh
/usr/local/bin/node /Users/prommeesee/projects/classroom/courses/scale-lab/node_modules/vite/bin/vite.js build /Users/prommeesee/.hermes/cache/scratch/estimate-ux-fixes/course --outDir /Users/prommeesee/.hermes/cache/scratch/estimate-ux-fixes/dist --emptyOutDir
PLAYWRIGHT_MODULE=/Users/prommeesee/projects/classroom/courses/scale-lab/node_modules/playwright/index.mjs ESTIMATE_DIST=/Users/prommeesee/.hermes/cache/scratch/estimate-ux-fixes/dist ESTIMATE_EVIDENCE=/Users/prommeesee/.hermes/cache/scratch/estimate-ux-fixes/green /usr/local/bin/node tests/readability-browser.mjs
```

Existing suites were copied to that scratch course; only their evidence-root paths were redirected to `estimate-ux-fixes/legacy-browser-evidence/`. From scratch course:

```sh
/usr/local/bin/node --test --test-concurrency=1 tests/completion-ui.mjs tests/units-browser.mjs tests/latency-browser.mjs tests/availability-browser.mjs tests/traffic-browser.mjs tests/tips-browser.mjs tests/retire-rounding-browser.mjs
```

## Preview handoff

`http://127.0.0.1:4193/` — isolated compiled standalone, **no platform login**, browser-local progress only. Parent-owned preview PID 85251 / handle `proc_bf461ba5ae3a` was retained; its scratch output was refreshed with the latest typography source. No server was stopped.

Restart from scratch course (only after identifying/stopping that owned preview if still listening):

```sh
/usr/local/bin/node /Users/prommeesee/projects/classroom/courses/scale-lab/node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4193 --strictPort --outDir /Users/prommeesee/.hermes/cache/scratch/estimate-ux-fixes/dist
```

Existing Scale preview 4187 was not touched. This preview is a compiled snapshot; rebuild scratch after any further approved source edits.

## Typography parity follow-up

User requested the actual Scale sizes, not an arbitrary smaller preset. Reference is current compiled Scale LAB01 at `http://127.0.0.1:4187/`, checked against `src/style.css`, `single-server-layout.css` and computed styles. Scale uses distinct roles, not a universal body size. The input/action mapping uses its current 16px main experiment control; Estimate-only tables use the 14px reading scale, and numeric result emphasis remains 26px (no equivalent reference metric was asserted).

| Role | Estimate before | Scale reference = Estimate after |
| --- | --- | --- |
| Body | 17px | 14px |
| Title desktop / mobile | 35.84px at 1280 / 28px | 30 / 25px |
| Intro desktop / mobile | 19 / 18px | 13 / 12px |
| Concept prose | 17px | 15px |
| Concept heading | 22px | 17px |
| Experiment panel heading | 22px | 15px |
| Read-more / summary | 17px | 14px |
| Input / primary action / answer | 17px | 16px |
| Quiz heading | 22px | 19px |
| Diagram caption | 15px | 14px |
| Sidebar navigation | 15px | 16px |
| Completion status | 15px | 15px (preserved) |

- `tests/typography-parity-browser.mjs` compares 15 semantic roles directly against the live reference at 320/390/768/1280 in both themes. Meaningful RED: 112 mismatches across 8 layouts before CSS edits; GREEN: all 120 comparisons pass. Selector-discovery timeouts preceded the valid RED and are not counted as TDD evidence.
- Refreshed the bounded scratch source copy before building; never rebuilt canonical dist. Updated `readability-browser.mjs` to assert reference-derived body/intro values rather than obsolete >=17/18px rules. Existing leading, spacing, touch-target and contrast coverage remains.
- Fresh verification: **32 unit tests**, **30 legacy compiled browser tests**, **5/5 LABs and 40 layouts** pass; zero captured console/page errors in the 5-LAB runner, zero document overflow, controls >=44px. Legacy tests include intercepted account contracts, not real backend persistence.
- Evidence: `.../estimate-ux-fixes/typography/{red,green}/parity.json`, `red.log`, `green.log`, `unit.log`, `legacy-browser.log`, `layouts/coverage.json`. Actual paired desktop/mobile light/dark screenshots are in `green/`; all-LAB screenshots in `layouts/`. Inspected full-resolution paired reading screenshots: Thai wraps without clipping; hierarchy and compact intro match Scale while Estimate retains its original generous spacing.

Re-run parity from this course:

```sh
PLAYWRIGHT_MODULE=/Users/prommeesee/projects/classroom/courses/scale-lab/node_modules/playwright/index.mjs ESTIMATE_EVIDENCE=/Users/prommeesee/.hermes/cache/scratch/estimate-ux-fixes/typography/green /usr/local/bin/node tests/typography-parity-browser.mjs
```

The test requires explicit `SCALE_URL`, `ESTIMATE_URL` and `ESTIMATE_EVIDENCE`; there are no preview defaults. Both new runners import the declared `@playwright/test` dependency locally; `PLAYWRIGHT_MODULE` is no longer needed. The commands and evidence above describe the historical QA run, not portable defaults. No Scale source, curriculum content, model, durable IDs, scoring, manifest, bank, glossary, dependencies, Docker or live data was edited in this follow-up. No commit/push/deploy.
