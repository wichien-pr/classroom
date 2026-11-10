# LAB11 learner-paced story navigation

> Historical iteration report, not the current acceptance contract or a claim that its browser suite passes today. Superseded by [LAB11 current release verification](lab11-current-release.md). Commands, page counts, asset hashes and publication status below describe that earlier iteration only.

## Current contract

The latest request restores Back/Next within the single twelve-stage story (not experiment-topic missions). The retained LAB09-style icon navigation uses equal 48px side columns and a centered count/title. Back is disabled at stage 1; Next at stage 12.

Every navigation click cancels current playback and any unfinished full-story sequencer, then animates the selected stage automatically. Previously viewed stages animate again. Navigation stops at that stage's end, without skipping ahead. Replay repeats that selected snapshot; pause/resume and reset remain available. Reset returns to the unplayed initial view. Connector and local reveal intervals remain 1500ms.

`loggingStageFrames()` runs the same pure transition helper as the explicit story on a fresh private model, returning independent snapshots. It has no record callback or reference to the mounted experiment. Jumping never executes scored preparatory actions. The explicit full-story experiment retains `run-pipeline`, `inspect-logs`, and `inspect-metrics`; its asynchronous generation guard prevents later actions after navigation/reset/unmount, including late failed-save retry callbacks. A save already in flight may finish but cannot continue the canceled story.

Instructions and the explicit action's accessible label distinguish watching a stage from recording participation. Version, Service Tier and Business terminology is preserved. Reading, quizzes, history, manifests and backend policy were not changed by this navigation revision.

## Actual verification

- RED: new pure-snapshot unit test failed because the function was missing; new compiled browser test failed because Back was absent.
- `npm test`: **126 passed**, zero failures (full course unit suite).
- `PATH=/usr/local/bin:$PATH npx playwright test --config playwright.lab11-navigation.config.js`: **16 passed** against the rebuilt existing port 4173 preview. Includes explicit full-story normal motion, both gates, all 12 captured stages, selected-stage autoplay Next/Back, stopping, rapid cancellation, frozen pause/resume, 1500ms timing, replay/reset, keyboard activation, progress and 48px centered navigation at 320/390/1280 in Light and Dark.
- `scripts/lab11-navigation-browser-verify.mjs`: real isolated Flask/SQLite and compiled account bundle; synthetic seeded account (not signup QA). Navigation through all stages forward/back and replay produced **zero participation/progress POSTs** and no initial eligibility. Explicit full-story actions persisted the three original semantic awards; repeating the story left the score at **3**. Held-save navigation and failed-save retry did not restart the canceled sequencer. Reload retained score 3, manual/thinking remained false, and completed lessons remained empty. No browser errors.
- Inspected actual paused, desktop Dark and cropped 320px Light screenshots. An initial theme test only set storage and produced a Light capture; corrected it to set/assert the actual theme before the final successful run. Earlier selector ambiguity between course progress and story progress was corrected by scoping the assertion.

Evidence: `evidence/lab11-story-navigation/` contains `browser.json`, `account-report.json`, screenshots and the unit output. Previous evidence directories were preserved. Full-story captures are in its `full-story/` subdirectory.

## Build / environment

Rebuilt standalone output at `/Users/prommeesee/.hermes/cache/scratch/lab08-preview`, served by the existing parent process PID 98524 on `http://127.0.0.1:4173`; did not restart it. Standalone has no platform login. Final standalone entry references `index-DgkKXcUN.js` and `index-CYArxv8h.css`.

Account verification built only `/Users/prommeesee/.hermes/cache/scratch/lab11-nav-account/scale-lab/dist` with the course base and progress/participation URLs. The runner used `/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python` through `arch -arm64`; the assumed repo `.venv` did not exist. The ephemeral QA server was terminated by the runner, and its temporary database is disposable.

No Docker, canonical dist, live database, commit, push or deployment. Full-course browser suite and backend unit suite were not rerun; the reported browser coverage is scoped to LAB11. Backend QA verifies course persistence/awards, not registration or production operation.
