# LAB01 verification — implementation evidence

LAB01 is now deployed from the canonical checkout to Docker HTTPS. See [current deployment verification](framework-lab01-deployment.md). The implementation-stage results and worktree boundaries below are historical; fresh release tests are recorded separately.

## Boundary and artifact

- Working artifact: `/Users/prommeesee/projects/classroom-framework-lab01` (detached worktree from `4cf067f`, with the original checkout's approved uncommitted source snapshot copied before LAB01 edits).
- Original checkout `/Users/prommeesee/projects/classroom`, branch `framework-for-system-design-interview`, remains unchanged by this implementation. Do not replace that checkout wholesale: this worktree contains inherited scaffold/integration changes as well as the new lesson.
- Actual Docker mount discovery confirmed the classroom service mounts only named volume `classroom-accounts-20261022` at `/data`, not host curriculum source. Nevertheless the worktree isolates manifest/bank edits from any dynamic host reader too. No Docker deployment, live data access, commit or push was performed.
- Only this worktree's target course was built. Existing Scale Lab and Estimate Lab dist were copied for backend discovery, never rebuilt. Hash comparison with original: Scale Lab 117 existing files, Estimate Lab 50 existing files, zero differences (dependencies/browser caches excluded).
- Source PDF remains locally ignored in the original checkout. SHA256: `9c91d1a1fc6b27d955f078c1d7b3f498b7120d1f7ca96ca0fc01815c72203889`. No copy exists in this worktree or its dist/public. This is an end-of-run hash, not a claimed before/after measurement.

## Source mapping

Actual `Step1.pdf` text was extracted and all three pages rendered with pypdfium2 and visually inspected. It contains prose and dialogue, **no architecture figures**. Render evidence lives privately under `/Users/prommeesee/.hermes/cache/scratch/framework-source/page001.png` through `page003.png`; not in learner assets.

| Source | Implementation |
| --- | --- |
| p1 Jimmy anecdote; fast answers are not rewarded; do not design before understanding | Intro, concept and two-column comparison |
| p1 clarify requirements and assumptions; ask appropriate questions | Main learning objective and experiment sequence |
| p2 interviewer answers or delegates assumptions; write assumptions down | Assumption notebook, explicit unconfirmed status, note retention disclosure |
| p2 features, users, 3/6/12 month growth, existing stack/services | Eight selectable dialogue prompts; growth/stack explicitly unanswered |
| p2 both mobile/web; posting and friends' news feed | Platform and features replies |
| p2 reverse chronological versus weighted order | Order reply plus reason not to add ranking |
| p2 5,000 friends | Friends reply |
| p3 10 million DAU; images and videos | Scale and media replies |
| p3 clarify ambiguity | Scope review showing confirmed facts and unanswered prompts |

Supplementary teaching mechanisms, not claims from the document: reveal-and-review exercise, three-stage illustration, comparison wording using microservices, criterion checklist, notebook, explicit DAU-versus-QPS caveat, randomized comprehension question, four private final-assessment items. No growth/stack answer or real capacity result is invented. The “ready” state means six example requirements have been opened, **not** that every real-world requirement is resolved or a design is validated.

## Identity and platform contracts

Course `framework-for-system-design-interview`, lesson/main interaction `framework-scope`, primary action `review-scope`; thinking `check-your-thinking / quiz-answer-a|quiz-answer-b`. Exactly 1 lesson / 3 participation definitions. Original answer 0 remains incorrect A identity, original answer 1 correct B identity, independent of displayed labels. Asking/revealing/resetting/editing are unscored; reviewing incomplete scope is meaningful practice and may earn its first participation point.

Explicit account qualification requires manual + main review + either thinking choice. Standalone retains course-specific browser history semantics, not account qualification. No silent fallback or import into accounts. Generic progress/participation/integration clients are course-owned copies; completion rendering preserves the existing Estimate Lab parity messages and async guards. No runtime backend code changes.

Private `assessment.json` contains four reviewed questions covering clarify-before-design, recording assumptions, agreed feed order, and growth/existing services. Real `achievements.load_bank` validated all four. No bank or answer-key module is imported into the compiled app.

## Actual verification

Commands use `PATH=/usr/local/bin:$PATH` for the compatible Node binary.

- TDD observed RED → GREEN: missing scope model; absent manifest lesson contract; compiled empty shell missing LAB01 heading; incomplete three-item scope incorrectly ready (fixed to six confirmed example requirements); stale empty-scaffold HTML metadata. Generic copied adapter checks are regression coverage, not claimed novel REDs.
- `npm test`: **11 passed, 0 failed**. Model, manifest, metadata, account progress queue/load/save/retry, semantic thinking allowlist, participation pending guard, confirmed score and captured UUID retry.
- `npm run build`: Vite 7.3.7, 11 modules, standalone JS `index-DCC8N-OH.js` 24.43 kB, CSS `index-liNfI2MK.css` 18.03 kB; successful.
- `npm run test:e2e`: **2 passed, 0 failed**. One runner exercises desktop 1280 / mobile 390 / 320 compiled standalone interaction, wrong-answer feedback, reset retaining selection, manual completion and reload. The other exercises compiled integrated-path UI with intercepted API: failed progress load/retry, failed manual save/retry, held manual save/disabled controls, participation failure/exact UUID retry, both deterministic shuffle orders, incomplete/partial/completed qualification messages at 1280 and 320. This second runner is frontend contract QA, not persistence evidence.
- Final integrated target build: `VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/framework-for-system-design-interview/progress npm run build -- --base /courses/framework-for-system-design-interview/`: **success**, 11 modules, HTML 0.90 kB, JS `index-BKsyWaV0.js` 24.75 kB, CSS 18.03 kB.
- From `appworks`: `.venv/bin/python -m pytest -q`: **420 passed in 75.05s**. An initial invocation from root failed collection because `app` was not on the import path; rerunning from the documented appworks directory resolved it without code changes.
- `appworks/.venv/bin/python courses/framework-for-system-design-interview/tests/test_platform.py`: **2 passed**, actual isolated integrated pipeline build and validate; private bank absent from static output.
- `appworks/.venv/bin/python scripts/courses.py validate`: all three real manifests/builds valid.
- `git diff --check`: clean.

## Real account/browser evidence

`framework-lab01-qa.py` starts only loopback ephemeral HTTP with its own SQLite, uploads and two synthetic QA legacy members. No real registration/email provider, production identity/session or production database was used. Runtime-only evidence includes its server URL/PID/DB path in `evidence/framework-lab01/server.json`. The synthetic test password is confined to QA scripts, never an existing user's credential.

`node tests/real-account.mjs` returned:

```json
{"widths":[1280,390,320],"accounts":2,"errors":[],"qualification":true,"stableChoiceReplay":true}
```

Real Flask/browser journey: catalog → course → manual-first remains incomplete → review + incorrect original A qualifies → reload with opposite shuffle → same original A earns zero → return preserves login → leaderboard Level 2. Second account starts empty independently, then simulation/thinking before manual still incomplete, manual finishes. Private bank, source JS and PDF URLs return 404. No browser page errors; no horizontal overflow at all three widths.

QA server was stopped and restarted against the same disposable database (relocated into Hermes scratch before restart). `node tests/restart-account.mjs` returned:

```json
[{"account":1,"complete":true,"score":2},{"account":2,"complete":true,"score":2}]
```

Evidence under `evidence/framework-lab01/`: `standalone-{1280,390,320}.png`, `account-{1280,320}.png`, `real-account-{1280,390,320}.png`, `real-account-report.json`, `restart-report.json`, `server.json`. Desktop and narrow screenshots were opened with vision tools; mobile screenshot crop confirms Thai readability and completion strip placement. Screenshot UI is the real compiled app, not a mock image.

## Files / handoff

New/changed target ownership: `course.json`, private `assessment.json`, `index.html`, `src/{main,scope,lessons,progress,participation,integration}.js`, `src/{style,course,scope}.css`, tests and README. Removed obsolete empty-shell `shell.js` and old scaffold browser/unit assertions. Generic empty-course backend regression remains, while its source-manifest assertion now expects LAB01. Added `scripts/framework-lab01-qa.py` and this document. Inherited README/integration/deployment changes from the parent's snapshot are **not** new LAB01 changes.

## Limits

- At the implementation stage this was not deployed; that status is superseded by the current deployment report linked above. This section's original QA used HTTP loopback, not TLS/container rollout.
- Browser accounts were deliberately seeded synthetic legacy QA users; this task did not exercise OTP signup or send email. Existing full backend tests still cover registration behavior.
- One lesson, no multi-lesson navigation race to exercise. Generic adapter queue/identity regression remains covered.
- No anti-cheat claim: main participation/manual completion are client-reported. Scope review is a learning checklist, not architecture grading. Final assessment is private bank-based, not LLM generation.
- Experiment/notebook state is in-page only; no offline queue, cross-tab sync or automatic notebook persistence. Standalone progress is browser-local.
- Course-owned generic code duplication avoids coupling to other courses; no new simulation engine or platform exception was introduced.
