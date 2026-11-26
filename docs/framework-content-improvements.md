# Framework LAB01–04 content improvements (source + isolated preview)

## Changes
- LAB01 groups opened facts into functional requirements and scale/constraints, then separates unresolved requirements and out-of-scope features. Latency/availability targets remain questions, not invented numbers. Six-core readiness remains an initial-summary checklist, not customer approval.
- LAB02 labels fanout-on-write as this exercise's chosen architecture; compares read-time/hybrid approaches and write/storage versus read-work tradeoffs. Cache→DB arrows are relationships, not prescribed transaction order.
- LAB03 bounds topic matching to the exercise rubric, not an exhaustive list. Shortcodes may use hashing, random codes or encoded IDs with uniqueness/collision handling. A supplementary friend-fanout example connects a customer question to queue/retry tradeoffs and measurements without capacity claims.
- LAB04 separates the hypothetical 1M→10M users scenario from LAB01's 10M DAU. A six-part worked summary leads into an optional spoken/paper reflection: unscored, not automatically graded, not recorded.

Stable lesson/action/choice IDs, quiz answers, review predicates, manifest, private assessment and account adapters are unchanged. No new scoring or completion condition. Existing typography/styles retained. Supplementary architecture advice is labeled as such; customer wording retained.

## Verification
Baseline: 18 unit tests passing. Four vertical content slices each had an observed assertion failure before implementation, followed by the full green suite (19, 20, 21, then 22 tests). Final unit run: **22 passed, 0 failed**.

Final Vite standalone scratch build passed. Browser runner `courses/framework-for-system-design-interview/tests/content-browser.mjs` passed **32 cases**: four active lessons × light/dark × 320/390/768/1280px. It exercises incomplete/complete review, all five deep-dive focus matches, growth rejection and investigation, both public quiz choices, navigation retention, reset preservation, keyboard disclosures, optional reflection wording, local completion reload and horizontal overflow. Zero page exceptions. Screenshots inspected, including full-resolution narrow scope, architecture and reflection crops. This is standalone frontend coverage, not authenticated server persistence or production-capacity testing; console/network failures are not comprehensively asserted.

The initial browser run hit a test-selector timeout because filtering closed disclosures changed locator indices during iteration. Fixed the runner to enumerate stable summaries and inspect each parent's open state; subsequent full runs passed. No production UI fix was needed for that issue.

## Reproduce without deployment
From the Framework course directory, using a Node compatible with existing native dependencies:

```sh
node --test tests/*.test.js
node node_modules/vite/bin/vite.js build --outDir "$FRAMEWORK_SCRATCH/dist"
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4194 --strictPort --outDir "$FRAMEWORK_SCRATCH/dist"
FRAMEWORK_PREVIEW_URL=http://127.0.0.1:4194 FRAMEWORK_EVIDENCE="$FRAMEWORK_SCRATCH/browser" node tests/content-browser.mjs
```

For this run `FRAMEWORK_SCRATCH` was `$HOME/.hermes/cache/scratch/framework-content`, using `/usr/local/bin/node`. Evidence: `browser/results.json`, screenshots, `baseline.json`, `preservation.json`. SHA-256 comparison of 631 preexisting files under courses/appworks/docker found only the five intended Framework source files changed. Other course source/dist, Framework canonical dist, manifests, assessment and adapters were hash-preserved. Dependency/browser caches and virtual environments were excluded. Docker/live volume were not accessed or modified; no live-data verification is claimed.

Preview is standalone, no platform login, browser-local progress. Parent agent must own/relaunch the server before handing off its URL because delegated-process lifetime is not guaranteed. Ports 4187/4193 were not changed. No commit, push or deployment.
