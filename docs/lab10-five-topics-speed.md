# LAB10 — five topics and 1500ms message transfers

Follow-up to `lab10-message-boxes.md` (historical six-topic/2000ms evidence). Workspace: `/Users/prommeesee/projects/classroom`. Current source revision prepared for publication on `exam-new`; no deployment is part of this change. Earlier verification and preview details below are historical run records.

## Publication verification

Fresh pre-push review passed: **117 unit tests**, **27 compiled browser tests** (zero failures, flaky or skipped), and isolated Flask/SQLite account QA (**14 experiment POSTs**, **3 semantic points**, completed `message-queue`, **zero replay/navigation POSTs**, no page errors). Browser coverage includes all five topics, 1500ms experiment/replay motion, both themes and desktop/mobile geometry. Static added-line security scan and staged whitespace checks passed; no scoped blocking review findings.

Standalone and integrated builds were written only under scratch `lab10-publish/`. The existing preview's HTML/JS/CSS were byte-identical to the fresh standalone build used for verification; its process and files were not changed. All four canonical dist files retained their baseline hashes. New reports/screenshots are scratch-only, not publication artifacts. The five-topic Playwright config now accepts an evidence-directory override to preserve historical results.

This verification does not certify production accounts, signup, server-restart persistence or deployment. Historical run details below are retained unchanged.

## Changes

- Removed only the final experiment “ระบายคิวและเริ่มใหม่”, its preset/sequence and matching `queueLayout.steps` instruction. The final topic is now **5 / 5 · เพิ่ม Workers ลดงานค้าง**, with Next disabled. General reset remains and returns to 1/5 without executing an experiment.
- All remaining topics share **1500ms per connector**, both experiment and snapshot replay (previously 2000ms). Arrival 1000ms, processing 1300ms, settled/no-route 900ms holds remain unchanged. These durations describe presentation, not model throughput.
- Retained real job IDs, single-round four-Worker assignment, staged waiting/processing/completed state, pause/cancel/reduced-motion behavior and original `enqueue-jobs` / `process-jobs` identities. Topic 4 remains enqueue → enqueue → process → enqueue, ending at **9 ingress / 1 completed / 8 waiting**.
- Model drainage and empty-queue no-op remain tested directly, without requiring a removed presentation topic. Reading, quiz, model, historical identities and general reset are retained.

## Verified results

New evidence exclusively under `evidence/lab10-five-topics-speed/`; prior evidence directories were not overwritten.

- TDD: new five-topic unit assertion failed `6 !== 5`, then passed. Compiled speed assertion failed `2000 !== 1500` (`red-speed.json`), then passed after implementation/rebuild.
- Full course units: **117 passed, zero failed** (`units.txt`). Includes topic/instruction/sequence parity and preserved drainage/no-op regression.
- Compiled browser: **27 passed, zero failed/flaky/skipped**: light matrix 3, dark matrix 3, backlog/presentation regression 9, focused regression 12. Reports and programmatic totals in `verification.json`.
- Matrix covers all five topics in Light/Dark at 1280/390/320px: actual elapsed animation time versus offset delta at 1500ms on experiment and replay, exact frozen pause after `animation.ready`, sampled box/path agreement and endpoint clearance, unique IDs, four Worker assignments, final outcomes, reduced-motion replay, navigation/reset cancellation, no page errors and zero standalone POSTs.
- Backlog regression covers intermediate phases, processing before completion, full animated replay and cancellation. Presentation regression verifies final 5/5 title/disabled Next, absence of removed topic, reset to 1/5, mobile controls, short-phone focus and feedback. Focused tests retain thinking selection/reset, glossary, LAB01 navigation and all-lesson score-panel absence.
- Real isolated Flask/SQLite account QA: **five topics, 14 experiment POSTs, 3 persisted semantic points, completed `message-queue`, zero replay/navigation POSTs**; original identities, held saves/focus, duplicate guard, lost-response same-event retry, cancellation during save, wrong-answer qualification and reload passed. Synthetic seeded account only, not signup or server-restart persistence testing. QA server cleaned up by runner. See `account-report.json`.
- Visually inspected `boxes-transfer-light-320-4.png` and `scene-dark-390-4.png`: readable ID boxes remain between nodes; four completed jobs and five waiting jobs remain distinct, with no overlap. Long diagrams still require vertical scrolling on short phones.
- Baseline comparison across **85 source/dist files** found only `queue-flow.js`, `queue-presentation.js`, and `message-queue-view.js` changed. LAB01–09, shared wiring, model, lesson content, CSS and canonical dist remain byte-identical to pre-task pending state. `git diff --check` passed.

Initial compiled regressions exposed the retained sixth `queueLayout.steps` entry causing topic/instruction mismatch; removing that presentation-only instruction fixed mounting. Two timeout-interrupted invocations are not counted as passes. A legacy browser assertion still expected six instructions; it was updated and the full focused batch rerun successfully.

## Files changed

Runtime: `src/queue-presentation.js`, `src/queue-flow.js`, `src/message-queue-view.js` (under `courses/scale-lab`).
Tests: new `tests/queue-five-topics.test.js`, new `playwright.five-topics.config.js`; updated `tests/queue-flow.test.js`, `tests/queue-message-boxes.test.js`, `tests/browser/queue-message-boxes.spec.js`, `queue-presentation.spec.js`, `queue-backlog.spec.js`, `message-queue.spec.js`.
Account runner: `scripts/lab10-presentation-browser-verify.mjs`, expectations now five topics. This document and isolated evidence are new. All inherited pending work is preserved.

## Reproduce / preview

From `courses/scale-lab`:

```sh
npm test
node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview --emptyOutDir
QUEUE_REPORT=../../evidence/lab10-five-topics-speed/browser-light.json node node_modules/@playwright/test/cli.js test --config=playwright.five-topics.config.js queue-message-boxes.spec.js --grep light
QUEUE_REPORT=../../evidence/lab10-five-topics-speed/browser-dark.json node node_modules/@playwright/test/cli.js test --config=playwright.five-topics.config.js queue-message-boxes.spec.js --grep dark
QUEUE_REPORT=../../evidence/lab10-five-topics-speed/browser-regression.json node node_modules/@playwright/test/cli.js test --config=playwright.five-topics.config.js queue-backlog.spec.js queue-presentation.spec.js
QUEUE_REPORT=../../evidence/lab10-five-topics-speed/browser-focused.json node node_modules/@playwright/test/cli.js test --config=playwright.five-topics.config.js message-queue.spec.js flow-navigation-icons.spec.js participation-panel.spec.js
```

Account QA uses isolated `/Users/prommeesee/.hermes/cache/scratch/lab10-five-qa-courses/scale-lab/dist`, built with base `/courses/scale-lab/`, `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress` and `VITE_CLASSROOM_URL=/`. Runner environment: `TMPDIR=/Users/prommeesee/.hermes/cache/scratch`, `QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/lab10-five-qa-courses`, `QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/lab08-python/bin/python`, `QA_PYTHON_ARCH=arm64`, `QUEUE_QA_EVIDENCE=/Users/prommeesee/projects/classroom/evidence/lab10-five-topics-speed`.

Existing parent-owned preview **PID 98524**, **http://127.0.0.1:4173/**, rebuilt in place without restart and exercised as compiled output. Assets: `index-CFU--bKd.js`, `index-DJbXkUzO.css`. Standalone uses browser-local progress, no platform login. No Docker deployment, live database access, canonical-dist build, commit or push.
