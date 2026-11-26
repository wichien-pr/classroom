# Framework typography parity (historical standalone verification)

For the post-deployment fresh-index verification and portable commands, see [Estimate / Framework packaging](estimate-framework-packaging.md). `ESTIMATE_URL` must identify the freshly built reference; no reference URL is inferred.

Changes: Framework-only `src/readability.css`, one import in `src/main.js`, and `tests/typography-browser.mjs`. Align current Estimate semantic typography: font family/size/weight/leading/tracking, title/intro/prose/quiz hierarchy, controls/disclosures, navigation, completion, diagram steps/caption, content/card padding and responsive navigation. Preserve existing lesson content, identities, scoring, native checkboxes and architecture layouts.

Verification: 22 unit tests passed. Browser content regression: 32 cases passed (four lessons × light/dark × 320/390/768/1280); quizzes, exercise states, disclosures, reset, navigation retention and local completion reload. New live-reference comparison: 32 cases, 3,120 computed typography-property comparisons, 128 common-padding comparisons, zero mismatches. No page exceptions, horizontal page overflow or detected hidden-overflow clipping in tested heading/prose/button/summary elements. The reference is current Estimate preview on 4193, not Git HEAD. RED runs observed 1,072 initial typography mismatches, then separate input and diagram failures before corresponding fixes. Native selects must be compared to native selects: Chromium reports `line-height: normal`, unlike text inputs.

Inspected desktop/mobile light/dark screenshots at full resolution. Kept Framework-specific comparison cards, blue diagram canvases, brand sizing, list spacing and diagram geometry; not claiming pixel-identical layouts. Native select closed labels can still truncate long options at narrow widths (visible in LAB03 screenshots); options remain native and selectable. This is an existing control limitation, not asserted as clipping-free. No authenticated persistence or integrated platform journey was rerun for this presentation-only change.

Evidence: `$HOME/.hermes/cache/scratch/framework-typography/` contains `baseline.json`, `preservation.json`, `red/metrics.json`, `input-red/metrics.json`, `diagram-red/metrics.json`, `green/metrics.json` and screenshots, `content/results.json` and full-page screenshots, plus the compiled `dist/`. Hash comparison of 633 preexisting files found only the intended Framework `main.js` import changed. All preexisting content edits, other course source, canonical dist, manifests/banks and adapters were preserved. Docker/live data were not touched; no commit/push/deploy.

Reproduce from `courses/framework-for-system-design-interview` using the existing compatible Node:

```sh
/usr/local/bin/node --test tests/*.test.js
/usr/local/bin/node node_modules/vite/bin/vite.js build --outDir "$HOME/.hermes/cache/scratch/framework-typography/dist"
/usr/local/bin/node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4195 --strictPort --outDir "$HOME/.hermes/cache/scratch/framework-typography/dist"
ESTIMATE_URL="$ESTIMATE_URL" FRAMEWORK_PREVIEW_URL=http://127.0.0.1:4195 FRAMEWORK_EVIDENCE="$HOME/.hermes/cache/scratch/framework-typography/green" /usr/local/bin/node tests/typography-browser.mjs
ESTIMATE_URL="$ESTIMATE_URL" FRAMEWORK_PREVIEW_URL=http://127.0.0.1:4195 FRAMEWORK_EVIDENCE="$HOME/.hermes/cache/scratch/framework-typography/content" /usr/local/bin/node tests/content-browser.mjs
```

Preview HTTP 200 verified on 4195. Standalone: no platform login, browser-local progress. Parent should own/relaunch the preview before user handoff; delegated child server lifetime is not guaranteed. Existing parent-owned 4187/4193/4194 previews untouched.
