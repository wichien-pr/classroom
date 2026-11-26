# Estimate / Framework source packaging verification

This revision packages the approved content and typography after deployment. It does not deploy, merge, or change application behavior beyond the previously approved source. Historical audit reports describe their original standalone runs; their preview addresses and absolute evidence paths are not defaults for new runs.

## Fresh-index acceptance

The reviewed Git index was exported with `git checkout-index --all --prefix=<fresh-directory>/`. Only installed dependency directories were reused; no ignored evidence, untracked fixture, local environment file or existing compiled output was copied. All builds and evidence stayed in scratch. Every served file was byte-compared with its fresh exported build before browser checks.

- Estimate: 32 unit tests; 30 existing compiled browser tests; five lessons / 40 theme-width layouts; 120 Scale-reference font-size comparisons, all passed.
- Framework: 22 unit tests; five existing compiled browser tests including intercepted account contracts; 32 content cases; 32 typography cases comprising 3,120 property and 128 padding comparisons, all passed.
- Estimate, Framework and the tracked Scale typography reference built successfully.
- All 23 Estimate and 20 Framework `src/` files matched their respective deployed-source SHA-256 inventories. Packaging edits affect only tests and documentation, not these application bytes.
- Static added-line secret/dangerous-execution scan and staged whitespace checks passed.

Browser coverage uses standalone local progress or intercepted frontend account contracts, not real authenticated backend persistence. No Docker service, canonical dist, existing preview, runtime environment or live data was changed. Existing unrelated work is excluded from this revision.

## Reproduce in an isolated checkout/export

Install each course's declared dependencies, or reuse compatible installed dependency directories. Use a compatible Node release and install the Playwright Chromium browser; the historical Estimate suites also require installed Chrome (`channel: 'chrome'`). Respect `PLAYWRIGHT_BROWSERS_PATH` when using a custom browser cache. Set `TMPDIR` to a writable scratch directory before running legacy suites.

From each of `courses/back-of-the-envelope-estimation` and `courses/framework-for-system-design-interview`:

```sh
npm test
npm run build
```

Build the tracked `courses/scale-lab` reference too. Serve each isolated `dist/` on an available loopback port; do not reuse a live deployment or overwrite an existing preview. Verify HTML and assets against those builds. Export the resulting explicit `ESTIMATE_URL`, `FRAMEWORK_PREVIEW_URL`, and `SCALE_URL` URLs.

From Estimate:

```sh
node --test --test-concurrency=1 tests/completion-ui.mjs tests/units-browser.mjs tests/latency-browser.mjs tests/availability-browser.mjs tests/traffic-browser.mjs tests/tips-browser.mjs tests/retire-rounding-browser.mjs
ESTIMATE_DIST="$PWD/dist" ESTIMATE_EVIDENCE="$TMPDIR/estimate-layouts" node tests/readability-browser.mjs
ESTIMATE_EVIDENCE="$TMPDIR/estimate-parity" node tests/typography-parity-browser.mjs
```

From Framework:

```sh
node --test --test-concurrency=1 tests/lab01-browser.mjs tests/lab02-browser.mjs tests/lab03-browser.mjs tests/lab04-browser.mjs tests/account-browser.mjs
FRAMEWORK_EVIDENCE="$TMPDIR/framework-content" node tests/content-browser.mjs
FRAMEWORK_EVIDENCE="$TMPDIR/framework-parity" node tests/typography-browser.mjs
```

Use new evidence directories per run. The external-target runners require their URL and evidence variables; none defaults to a historical localhost preview. The new Estimate runners import the declared local `@playwright/test` package, not a machine-specific module path. No baseline fixture is read from evidence. Legacy suites create their own compiled servers and repository-relative generated evidence inside the isolated export. Shut down only verification-owned servers afterward.
