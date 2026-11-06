# LAB02 icon controls and dotted routes — source / standalone preview

No Docker deployment, commit or push performed by this worker. Workspace: `/Users/prommeesee/projects/classroom`, branch `exam-new`.

## Change

- LAB02 uses the approved LAB01 inline SVG icon vocabulary for experiment, replay, pause/resume, previous/next and reset; preserves native buttons and original `workload / workload / estimate` scoring identity.
- 48px controls, Thai accessible names/title tooltips, focus indicators, centered title, compact three-button row and adjacent result. Narrow screens stack feedback below the complete row.
- Static round-dotted SVG tracks (`stroke-dasharray: 0 7`, round caps), independent round blue particles and responsive orthogonal client→Web→Database paths. Preserves original finite request/query/return timing; outage never returns successful data. Shared-host/split and all SQL/NoSQL presets remain unchanged.
- Playback owns no model/scoring callback. Pause freezes CSS motion, replay restarts, reduced motion settles immediately, resize/remount cleanup disconnects observers.
- Held real account-save verification exposed preexisting keyboard focus loss; LAB02 now restores the retained action only when it is connected, on the same topic and focus has not moved elsewhere. Saving preserves its icon, disabled/busy state and accessible name.
- No condition selectors, lower supplemental panels or Participation Score UI restored. LAB01 runtime files are unchanged.

## Executed verification

- TDD failures observed for missing icon, missing dotted paths and lost keyboard focus after account saving; each passed after its corresponding implementation.
- Unit suite: **76 passed**.
- Combined LAB02 + LAB01 browser regression: **72 passed**. After final semantic HTML cleanup and stronger tooltip/particle-coordinate assertions, LAB02 targeted suite: **37 passed**.
- Coverage: all four presets, 1280/390/320 Light/Dark, centered title, SVG icons/48px targets, keyboard/focus/tooltip viewport bounds, exact paused offsets after animation readiness, actual circle centers against SVG geometry, replay, reduced motion, outage, reset, no overflow and supplemental absence.
- Synthetic real Flask backend runner `scripts/workload-motion-browser-verify.mjs`: **6 main-action POSTs, 0 visual/navigation POSTs, 1 persisted award after reload**, criteria `{manual:false,simulation:true,thinking:false}`, zero page errors. Held first POST verifies saving icon/disabled name and restored keyboard focus. Uses x86_64 scratch Python at `/Users/prommeesee/.hermes/cache/scratch/lab02-python/bin/python`; private disposable DB, no real accounts.
- Account report: `evidence/lab02-icons-account/report.json`.
- Screenshots: `evidence/lab02-presets-motion/{light,dark}-{1280,390,320}.png`, `*-outage.png`, `*-action.png`; topic headers: `evidence/lab02-layout/`. Inspected desktop Light and 320px Dark toolbar screenshots. Phone diagram remains scrollable rather than shrinking text.

## Existing preview updated

Parent-owned Vite preview remains `http://127.0.0.1:4173`, output `/Users/prommeesee/.hermes/cache/scratch/flow-dotted-build`. No server restart. Latest standalone assets: `index-Bh5oDSwl.js`, `index-5yzkCPBz.css`; actual served browser confirmed these assets, six icons, two computed round-dotted paths, experiment and pause interaction.

Separate integrated scratch output: `/Users/prommeesee/.hermes/cache/scratch/lab02-icons-qa/scale-lab/dist`, JS `index-lmTMqTii.js`. Both builds transformed 58 modules. Canonical dist was not rebuilt. Existing real-account HTTPS deployment is separate and unchanged.

Limitations: no real-account HTTPS, signup/OTP or backend restart-persistence journey; synthetic runner verifies actual persisted readback/reload, not those journeys. No LAB02 video recorded; moving CSS offsets and real circle geometry were measured in-browser. Original reference PDFs and `~$Step3.docx` untouched.
