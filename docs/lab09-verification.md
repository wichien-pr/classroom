# LAB09 — Data centers (implemented, not deployed)

## Location and release boundary

Implementation is in `/Users/prommeesee/Documents/04_Learning/classroom-lab09`, a detached worktree based on `f979014`. The original `/Users/prommeesee/Documents/04_Learning/classroom` source workspace remains unchanged. No staging, commit, push, production build, production database access or production service restart was performed.

This isolation is intentional: live manifest and private assessment reads are dynamic. Editing those files in the serving workspace would change qualification before deployment even without replacing dist. Release the new manifest, bank and compiled client together only after separate authorization, backup and a controlled service stop. Existing tabs must reload. Do not copy only the manifest into the live workspace.

## Source mapping

Read all three pages of the existing local `Data-centers.pdf` and rendered/inspected its figures. Source remains unchanged and ignored in the original workspace; never force-add it or copy it into public/dist.

SHA-256: `34e0625d5b11f980f536e7464b35ac614e31863f19210124e01a9fd114dc7c61`.

- Page 1 / Figure 15: GeoDNS, two data centers, normal `x% / (100 − x)%` traffic and per-site servers/database/cache → short introduction, full-width comparison and original responsive HTML diagram.
- Page 2 / Figure 16: US-West offline, target 100% traffic at US-East → explicit outage and traffic-redirection experiment.
- Pages 2–3: traffic redirection, cross-center data synchronization, asynchronous replication, testing and automated deployment → ordered experiment, supporting details and new thinking/private-assessment questions.
- Page 3: message queues as a future decoupling technique → brief continuation note, not a new queue simulation.

Supplementary caveats are explicit: GeoDNS is approximate and not an HTTP proxy; cache/TTL/existing connections delay migration; data replication is separate from routing; capacity is necessary; different versions require compatibility testing rather than necessarily causing failures. LB is shown per site to separate IP selection from HTTP handling. CDN/static content and optional shared stores are contextual notes, not simulated dependencies. This is a read-only workload model, not writer promotion, consensus, a real DNS implementation or a performance benchmark. LAB10 continues to cover multi-region writer recovery unchanged.

## Identity and history

The user explicitly approved a genuinely new lesson identity rather than inheriting Observability completion.

- New lesson/simulation: `data-centers`; main action: `dc-request`.
- New lesson-scoped original thinking actions: `quiz-answer-a` / `quiz-answer-b` (semantic choice indices remain 0 / 1 regardless of displayed randomized labels).
- New private question IDs: `data-centers-routing`, `data-centers-readiness`.
- `observe`, its actions and its old questions are removed only from active curriculum/allowlists, not from stored rows or immutable exam snapshots. Historical participation totals retain old awards; they do not qualify the replacement.
- Frozen numeric migration remains unchanged: numeric 10 still maps to `observe`, never to Data centers. Stable local storage accepts the new ID while retaining retired history.
- Programmatic comparison with HEAD confirmed all other lessons' participation definitions and private questions unchanged. Active totals remain **11 lessons / 38 action definitions**. New qualification can temporarily reduce a learner's completed-course count until the new lesson is completed; no old rows or permanent achievements are deleted.

## Implementation

New `data-centers.js` is a deterministic, validated model of a 100-request batch. `data-centers-view.js` contains Thai teaching copy, named controls, original diagram and outcome rendering; `data-centers.css` is scoped to LAB09. Shared full-width lesson layout and glossary enrichment are reused. Numbered instructions explicitly restore state before dependent steps; primary actions and live results remain visible while supporting notes collapse.

Only `dc-request` awards simulation participation; configuration changes, reset, navigation and invalid input do not. Repeated valid batches remain meaningful experiments, with server semantic deduplication preventing new points. Unavailable destinations, missing cross-center data and overload are separate, potentially overlapping risk counts, never added into a fabricated failure total.

## Verification actually executed

From the worktree course directory:

- `npm test`: **62 passed**.
- `npx playwright test`: **77 passed** before the final glossary test; the final compiled suite below includes that test.
- `npx playwright test -c playwright.account.config.js`: **15 passed** on final source (API-intercepted account UI regression coverage).
- `npm run build -- --outDir evidence/lab09/standalone-dist`: successful isolated standalone build, **40 modules**.
- `npx playwright test -c evidence/lab09-build.config.mjs`: **78 passed**, final compiled standalone build.
- Final integrated build: `VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress npm run build -- --base /courses/scale-lab/` in this worktree only; **40 modules**. Production workspace dist was not touched.

Backend, using the original environment's interpreter but the worktree's code and isolated pytest fixtures:

`/Users/prommeesee/Documents/04_Learning/classroom/appworks/.venv/bin/python -m pytest -q` from worktree `appworks`: **400 passed**. Initial fresh-worktree run had four failures because ignored dist was absent; all passed after building only the isolated worktree. New regression characterizes Observability history/snapshot preservation, no new-lesson qualification from old evidence, new completion and app restart.

Observed RED→GREEN for new curriculum identity, routing behavior, data/capacity validation, browser interaction/layout and glossary enrichment. Existing historical decision test still referenced LAB09 Observability; updated that obsolete selector while preserving LAB10 decision assertions and adding new LAB09 behavior coverage.

## Real compiled account QA

`registration-qa-server.py --port 8149 --evidence evidence/lab09/integrated` created a private temporary course tree, DB and loopback Graph double, using this worktree. `scripts/data-centers-browser-verify.mjs` completed actual local-double OTP signup for two distinct QA accounts, login and real Flask/SQLite requests with no account API mocking.

Both accounts independently obtained **3 points and 1/11 qualified lessons** through the new simulation, both original thinking choices and explicit manual completion. Checked invalid-input exclusion, unscored setup, request/quiz dedup, opposite-order reload, navigation, mobile overflow and asset/page errors. Then stopped the identified QA process, rebuilt only its private compiled output with final glossary changes, restarted the same QA database with `--resume`, and ran the browser runner `--resume`: both accounts retained their own 3 points and Data centers qualification; repeated requests added zero. Final run reported no page errors and all observed asset responses HTTP 200. QA process was stopped afterward.

Reports: `evidence/lab09/integrated/browser.json`, `restart.json` and `server.json`. QA mailbox/cookies are private temporary artifacts, not deliverables. No production account/provider email used. Production 8080/8081 were not targeted.

Final standalone compiled browser report: `courses/scale-lab/evidence/lab09/compiled-browser.json`.
Screenshots: `courses/scale-lab/evidence/lab09/layout-{320,390,1440}.png`, `diagram-{320,390,1440}.png`, and `evidence/lab09/integrated/compiled-{320,390,1440}.png`. Desktop hierarchy and mobile diagram/controls were visually inspected, including final glossary colors and wrapping; automated checks cover overflow, minimum diagram text size, keyboard hint opening/Escape/focus, nested-control avoidance and remounts.

For browser reruns, provide a local Chromium installation or temporarily link the original course's `.browsers` cache; the QA symlink was removed after use so no absolute host path is staged. Dependencies were installed in the worktree with `npm ci --ignore-scripts` (audit reported zero vulnerabilities).

## Preview / next operation

Standalone preview is served separately at `http://127.0.0.1:4179/`; select LAB09. Verified HTTP 200 and an actual browser request showing the new heading and 60% East traffic with no page errors. Use `PATH=/usr/local/bin:$PATH` when launching the preview: the default background shell selected a different Node architecture and the first preview exited with a missing Rollup native-module error; the compatible existing Node resolved it without reinstalling packages. All four worktree integrated dist files were hash-compared with the final browser-tested private integrated build and match exactly. It does not save account points. This is not production deployment. All changes remain unstaged and uncommitted in the worktree; review and separately authorize publishing before changing the live curriculum.
