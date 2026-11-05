# LAB01 topic workspaces — deployed

Canonical checkout `/Users/prommeesee/projects/classroom`, branch `exam-new`. Deployed to the existing **https://localhost** account-backed Docker stack; see [current deployment evidence](flow-slides-deployment.md). Image `sha256:ea8fcb4b1f89787432f909fb58574ed7f1d8b3337e110855c39cb5b7a02b169b` passed six additional actual-image browser cases. Full-volume archive and immediate table/schema/upload fingerprints verify preservation. No commit or push.

The implementation/source-QA evidence below predates deployment; those QA runs themselves did not touch the live stack or host dist.

## Experience

Four complete topic views occupy the same experiment region:
1. ค้นหา IP ก่อนส่งคำขอ — client selection, DNS route, step count/domain/received IP and current feedback.
2. ส่งคำขอเข้าเครื่องเดียว — HTTP route, step action, step count/IP/request and current feedback; irrelevant client selector and response are hidden.
3. รับคำตอบและแสดงหน้าเว็บ — response route, step action, response/payload and current feedback.
4. เปลี่ยนเป็นแอป แล้วเทียบคำตอบ — client selection returns, response route/payload follow the actual selected client, step action and current feedback.

Next/Back replace the topic's instruction, focused route and visible settings/results together. Existing control/result nodes move into one workspace, not clones. Full original architecture and event history are accessible in a disclosure below, rather than separating the action from its instruction. Other lesson prose and labs are unchanged.

Navigation is unrestricted and never advances simulation or grants credit. It retains client and step. If a topic was skipped, the learner explicitly walks from the retained step (instructions state target step 4 or 6). Changing client explicitly starts at 0 as before. Reset starts topic one. Existing `flow / flow / step`, quiz identities, banks, manifests and histories are unchanged. Scores are earned by original actions only.

## Verification

- TDD: observed the new co-location/filtered-topic test fail before implementation, then pass. Separate RED→GREEN regressions covered dark result-text color and response route following the retained mobile client.
- Unit suite: `npm test` — **74 passed**.
- Full standalone Playwright: **80 passed, 8 failed**. Failures are the preexisting 11-versus-12 curriculum assumptions (app/cache/completion/labs/participation/quiz-order and LAB11 wraparound); not hidden or edited in this scope.
- Final LAB01 targeted suite (`flow-slides`, `flow-layout`, `single-server`) — **10 passed**.
- Final isolated compiled account-adapter suite — **6 passed**, dark/light × 1280/390/320. APIs intercepted for this suite. Tests cover all four real action sequences, skip without POST, state retention, keyboard focus, visible instruction/action/feedback within the 1000px viewport, bounded topic height, readable dark state values, no horizontal overflow and no page errors.
- Actual Flask integration with a seeded disposable synthetic account and a temporary database — **6 passed**, same theme/width matrix. Twelve original step actions per sequence; server score stays 1 across six reloads, completion stays empty, skip sends no course POST, and client/step survive Back. Read-back of real progress/participation endpoints verifies the result. This is authenticated course QA, not signup/OTP or restart-persistence coverage. Owned QA process exits after testing.
- Builds passed into scratch-only directories; host dist was never used as an output target. Sixteen protected host dist/manifest/bank file hashes matched the pre-edit snapshot.

## Evidence and reproduction

- `evidence/flow-topics/`: 24 viewport screenshots from compiled frontend-adapter QA.
- `evidence/flow-topics-account/`: 24 viewport screenshots and `report.json` from actual authenticated Flask QA. Screenshots start at the topic below sticky chrome, not giant full-page captures. Dark 320, light 390 and dark 1280 examples were visually inspected; parent should review the final images too.
- Account runner: `/Users/prommeesee/.hermes/cache/scratch/flow-topics-account.mjs`. Uses existing `scripts/theme-qa-server.py`, `QA_COURSES_ROOT`, arm64 scratch Python venv, no .env or real account fixtures.
- Isolated frontend build: `/Users/prommeesee/.hermes/cache/scratch/flow-topics-build`.
- Isolated integrated course root: `/Users/prommeesee/.hermes/cache/scratch/flow-topics-courses`.

Build environment: `PATH=/usr/local/bin:$PATH VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress VITE_CLASSROOM_URL=/`. Use `npm run build -- --emptyOutDir --outDir <scratch-output>`; integrated output additionally uses `--base /courses/scale-lab/`. Run adapter tests with `FLOW_SLIDES_BUILD=<scratch-output> npx playwright test --config playwright.flow-slides.config.js`.

## Limitations

1000px-high viewport evidence does not imply every short phone screen fits without scrolling. The mobile topic is much shorter than the former full architecture/history stack, and its action and feedback are adjacent. Full diagram/history intentionally remain optional. Navigation preserves an unfinished request, so skipping a topic is not a shortcut that runs its simulation. No authenticated production-account journey was performed. Deployment and guest HTTPS checks were subsequently completed as documented above.
