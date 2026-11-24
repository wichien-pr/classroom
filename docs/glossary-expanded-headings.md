# Shared glossary expanded headings

## Scope and outcome

- Shared Scale Lab dialog titles now use reviewed English forms, for example `HTTP (Hypertext Transfer Protocol)` and `CDN (Content Delivery Network)`.
- All 92 registry entries were inventoried: 162 alias declarations, 161 distinct case-insensitive aliases, 19 expanded aliases. The pre-existing duplicate `Metrics` alias still resolves to its later entry.
- Expanded aliases: CI, HTTP, NoSQL, SQL, RDBMS, DNS, GeoDNS, TLS, HTTPS, DB, RPS, LB, SPOF, RPO, RTO, TTL, CDN, ACK, AZ.
- NoSQL uses the common modern interpretation “Not Only SQL”; this does not assert that SQL is unsupported. GeoDNS is geographic DNS. DB and ACK are conventional abbreviations included for clarity. Redis/Memcached are product names, JOIN is a keyword, and p95 is percentile notation; no expansions were invented. REST is not an existing glossary entry.
- Alias headings are distinct (HTTPS does not show TLS; RDBMS does not show SQL). Canonical grouping/deduplication stays unchanged, as do concise inline labels and all original Thai meanings/examples/cautions. A source-prefix comparison against HEAD confirmed the entire original entries array is unchanged.
- No scoring, simulation, account, manifest, Docker, canonical dist, deployment or commit changes. Existing LAB11 stream edits were retained.

## Verified execution

From `courses/scale-lab` with `PATH=/usr/local/bin:$PATH`:

```sh
npm test
npm run build -- --outDir /Users/prommeesee/.hermes/cache/scratch/lab11-stream-build
node scripts/glossary-inventory.mjs
npx playwright test --config playwright.glossary.config.js
```

- Full course unit suite: **210 passed**, zero failures.
- Relevant real Chromium suite: **14 passed**, zero skipped/flaky/unexpected results.
- Strict TDD: observed HTTP heading RED (`HTTP` instead of full title), then GREEN; observed inventory behavior RED (`Continuous integration` instead of `CI (Continuous Integration)`), then GREEN. Additional unit/body/mobile checks are regression coverage, not additional claimed RED cycles.
- Browser opened every distinct registered alias through the real compiled observer/popover using test-only prose fixtures; verified heading and all three Thai body fields. These fixtures do not change lesson content.
- All 19 expanded aliases passed desktop 1440px and mobile 390/320px, light/dark, Enter/Escape focus restoration, accessible dialog names, viewport containment, and heading contrast >= 4.5:1. Existing Space activation, close button, outside dismiss, no nested action controls, and all **12 actual LAB navigation entries** passed.
- 18 screenshots captured; visually inspected narrow light HTTP and narrow dark RDBMS for title wrapping, close-control visibility, and unclipped Thai content.
- Three old LAB08 tests referenced removed steps, vocabulary and the retired diagram from the earlier lesson design. Updated those tests to current intro/notes/experiment selectors; did not restore removed UI. The complete dictionary fixture separately retains coverage of that vocabulary.

## Evidence

`courses/scale-lab/evidence/glossary/` contains:
- `inventory.json`: every registry entry, all aliases/full forms/heading expectations, body text, counts and caveats; regenerate with the script above.
- `red-http.log`, `red-all.log`, `build.log`, `unit.log`, `browser.log`.
- `browser-results.json` including the all-LAB coverage attachment (IDs 1–12).
- `{1440,390,320}-{light,dark}-{HTTP,RDBMS,CDN}.png`.

The parent-owned preview at **http://127.0.0.1:4187** was rebuilt in its existing scratch output, without replacing/stopping its server. This is **standalone frontend verification**, no platform login/account persistence or intercepted API coverage is claimed.
