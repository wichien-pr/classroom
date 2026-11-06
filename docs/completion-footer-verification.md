# Scale Lab completion footer — implementation verification

Workspace: `/Users/prommeesee/projects/classroom`, branch `exam-new`.
Source and scratch preview only. No commit, push, Docker operation, canonical dist build, or production/account database access.

## Behavior

- Exactly one completion section in each of the 12 lesson footers replaces `#next`; the empty top section and stale handler are removed. Sidebar and topic navigation are retained.
- Explicit completion only; neither correct answers nor button completion navigate automatically.
- Existing authoritative policy is **manual + one meaningful allowlisted simulation + either thinking answer**. Correctness is irrelevant to this participation policy. A wrong answer alone does not unlock the footer; a wrong answer plus an experiment does. Backend policy, private assessment bank, manifest, score identities, history and deduplication are unchanged.
- Account prerequisites come from server criteria after the participation/progress refresh queue. Loading, missing criteria, pending writes and errors fail closed. Footer status and its retry control expose progress and participation failures. Captured lesson IDs survive navigation and retries.
- Standalone uses the public manifest and existing meaningful model-action events, with deduplicated evidence in `scale-lab-eligibility-v1`. Existing `scale-lab-progress-v2` completions and retired identities are retained without guessed backfill or revocation. No private answers or account points are embedded. Storage denial is reported as memory-only state.

## Executed verification

- `npm test`: **78 passed**.
- `npx playwright test --config playwright.account.config.js`: **23 passed** (frontend API-intercept contracts, including failed refresh, participation retry, pending save/navigation, duplicate submission, stored completion and preserved LAB01 icons).
- Final affected standalone regression selection: **28 passed** across `app`, `cache`, `completion-footer`, `completion`, `labs`, `logging`, `participation-panel`, `participation`, `replication`, and `workload-lines` specs.
- Isolated Python regression: `test_qualification.py test_progress.py test_participation.py`: **64 passed**, using scratch TMPDIR and synthetic pytest databases.
- `scripts/completion-footer-browser-verify.mjs`: real compiled course, disposable SQLite and seeded synthetic account; **all 12 lessons qualified**, **24 semantic participation awards**, **12 explicit completion POSTs**, repeated main actions add no points, navigation/playback submit no events, reload retains completion, zero page errors. Every lesson starts disabled, remains disabled after wrong answer alone, unlocks after its allowlisted model action, and remains on that lesson after completion. QA server exits and deletes its private temporary data.
- The same runner exercised the parent-owned compiled standalone preview: experiment alone disabled; answer enables; no auto completion; click and reload preserve completion.
- Both integrated QA and standalone builds succeeded. Final asset references: account `index-DD9O163y.js`, standalone `index-CzCW6oun.js`, CSS `index-P9d13n28.css`.

## Broader-suite limitations (not a claim of full green)

A broad 188-test selection passed 184 before completion-related legacy assertions were updated. The removed `#next` and old quiz-auto-complete assertions now pass in the final 28-test selection. A fixed 150ms LAB02 particle-start assertion was timing-sensitive after layout reflow; it now polls actual motion within two seconds, preserving geometry/pause/replay checks; all three sizes passed.

The complete standalone suite still contains unrelated legacy expectations. These three representative failures were reproduced against an untouched `git archive HEAD` snapshot under scratch:

1. `lesson-layout.spec.js`: expects removed LAB02 editable fieldsets.
2. `lesson-topics-readability.spec.js`: treats icon tooltip scroll width as a clipped navigation label.
3. `single-server.spec.js`: expects the old request/response label rectangles to be side-by-side instead of the current diagram layout.

Those tests and simulation implementations were not changed for this request. Do not report the entire standalone suite as passing. Auth signup/OTP and backend process restart were not exercised by the new seeded-account runner; it verifies real authenticated course APIs and reload persistence, not signup.

## Evidence / preview

- `evidence/completion-footer/report.json`: real backend readback for all lesson IDs.
- `evidence/completion-footer/account-{unqualified,partial,eligible,completed}-{dark,light}-{1280,390,320}.png`.
- `evidence/completion-footer/standalone-{dark,light}-{1280,390,320}.png`.
- Visual review confirmed readable wrapping and balanced footer at desktop and narrow phone widths, with 48px completion controls and no horizontal overflow. LAB01/LAB02 diagram/icon implementations are unchanged.
- Parent-owned preview remains **http://127.0.0.1:4173/**, serving `/Users/prommeesee/.hermes/cache/scratch/flow-dotted-build`. Standalone only: no platform login, browser-local progress. The existing listener was not restarted.

## Changed ownership

Runtime: `courses/scale-lab/src/main.js`, new `local-eligibility.js` and `completion-footer.css`.
Tests: new local eligibility unit tests and account/standalone footer specs; existing completion/progress/qualification/participation and affected lesson navigation assertions updated. `workload-lines.spec.js` now waits for observed animation movement rather than a fixed frame delay.
Runner: new `scripts/completion-footer-browser-verify.mjs`.
Docs: participation and course contracts plus this report. Unrelated `~$Step3.docx` remains untouched.
