# Scale Lab read-more consistency and LAB08 intro removal

## Scope

Based on `6528fcc2e77b0d44d33c31d4f1ca1929b38d93a2`, this change aligns all twelve readings with the currently mounted experiments and separates their observations from supplementary system-design principles.

- LAB01 keeps the existing prose layout; resource contention and shared failure are supplementary, not exercised scenarios. The rejected infographic is not included.
- LAB02 explains prepared Web/Data capacity and database selection by workload, requirements and product testing rather than SQL/NoSQL performance labels.
- LAB03 explains accessible capacity and overload despite a load balancer.
- LAB04 distinguishes round-robin request counts from CPU/time, empty pools, and four independent prepared states.
- LAB05 distinguishes replica health from freshness, bounds primary reads, and explains assumed fencing and the six scripted topics.
- LAB06 separates API TTL seconds from abstract scene units, expiry from refresh, and available-cache MISS/refill from unavailable-cache BYPASS.
- LAB07 distinguishes a usable cached copy from the latest origin version, invalidation from pushing updates, and CDN from application-data caching.
- LAB08 removes the requested introductory explanation and wrapper. The remaining reading explains missing local sessions, externalized session state, shared-store availability and untested Sticky/outage extensions. Mounting no longer relies on the removed wrapper's sibling position.
- LAB09 distinguishes additional provisioned capacity and simulated 60/40 routing from real DNS behavior or failover guarantees.
- LAB10 distinguishes stopping producers from canceling jobs, buffering from processing capacity, and the single-worker FIFO scene from real completion-order guarantees.
- LAB11 describes the actual shared simulated request batch, rounded mean latency (not p95), bounded history and pause; updates the lesson's experiment instruction.
- LAB12 describes the two mounted pages, scale-up without redundancy, prepared per-user request distribution, and real-world workload differences.

Simulation/scoring identities, manifests, private assessment banks, CSS and glossary implementation are unchanged. LAB08 rendering is the only non-copy source adjustment.

## Portable verification

Install the locked dependencies in `courses/scale-lab` with `npm ci`. Install Chromium with `npx playwright install chromium` (or set `PLAYWRIGHT_BROWSERS_PATH` to an existing cache). The runners honor an explicit browser cache, otherwise use a course-local `.browsers` directory when present or Playwright's default cache.

From `courses/scale-lab`:

```sh
npm test
npm run build -- --outDir "$QA_BUILD" --base /
npm run preview -- --outDir "$QA_BUILD" --host 127.0.0.1 --port "$QA_PORT" --strictPort
```

Choose a fresh absolute scratch directory for `QA_BUILD` and an unused `QA_PORT`. Keep the preview running in a separate terminal. Do not point the build at canonical `dist` or an existing preview. Use a standalone build without integrated progress environment overrides.

From the repository root:

```sh
READMORE_URL="http://127.0.0.1:$QA_PORT/" node scripts/scale-readmore-browser-verify.mjs
```

From `courses/scale-lab`:

```sh
READMORE_URL="http://127.0.0.1:$QA_PORT/" npx playwright test --config playwright.readmore-consistency.config.js
```

`READMORE_URL` is mandatory so neither runner silently verifies a historical preview. The reading runner checks 12 lessons × 2 themes × 3 widths (1280/390/320), native disclosure keyboard behavior, glossary visibility/full-form CI heading, current copy and overflow. It records runtime errors and POST requests and reports a missing standalone favicon separately. The bounded Playwright config covers LAB08 intro absence, session simulation/reset, existing Web presentation, and LAB11 stream/pipeline behavior.

Outputs default to fresh temporary directories. Set `TMPDIR` to the designated scratch area and optionally `READMORE_EVIDENCE` / `READMORE_TEST_OUTPUT` to new output directories. No untracked helper, historical screenshot, baseline fixture, backend account or database is required.

Before publishing, export the staged index with `git checkout-index --all --prefix=<fresh-directory>/` and run the commands there. Reuse only installed dependency/browser directories if necessary. Verify that the served HTML/assets match that export's build rather than an existing deployment.

These checks establish compiled standalone frontend behavior, not authenticated persistence or every simulation path. Builds, screenshots, evidence, backups and private environment files are intentionally outside the commit.
