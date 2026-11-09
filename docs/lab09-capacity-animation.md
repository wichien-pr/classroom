# LAB09 topic 6: capacity animation

> Publication review: this document preserves revision-time evidence, including historical preview PIDs, paths and “no commit/push” statements; these are not current runtime or deployment assertions. The accumulated source is being published separately from deployment. No Docker, live data, canonical dist or existing preview was changed in this review. Latest LAB09 has six topics ending at capacity; see [current source verification](lab09-remove-release-topic.md).

> Current experiment: six topics, ending at “6 / 6 · ศูนย์เดียวรับไหวไหม”; topic 7 and its illustrative release panel were removed. The implementation and verification below describe the earlier historical revision. See [current removal verification](lab09-remove-release-topic.md).

Implemented in dc-presentation.js/css only; model, seven presets, original dc-request identity and topic 5 data animation retained.

After the actual 2000ms East route, a 1400ms capacity fill shows the model-derived within-capacity count, followed by a 1400ms distinct excess reveal. Playback completion awaits both local stages. East stays machine-ready; the panel independently labels data ready and insufficient capacity. No queue, retry, latency, HTTP error or successful-response semantics are introduced. Replay uses captured frames; pause and cancellation use the existing animation lifecycle. Reduced motion settles directly.

Projection derives assigned requests and capacity from frame.result.routes and frame.state; overload follows the model's per-up-site max(0, assigned-capacity) rule. The gauge denominator is site capacity, not total requests. Tests cover capacities 0/1/59/60/99/100, below-capacity load, zero load/zero capacity and finite markup.

## Verification

- RED: new projection test failed because dcCapacity was absent. GREEN: passed.
- RED compiled browser: topic 6 never reached capacity-fill before implementation.
- Full course units: 108 passed, 0 failed.
- Compiled preview focused browser: 26 passed, 0 failed (2.9 minutes): capacity (6), prior missing-data (6), existing data-centers (5), presentation (3), usability (6).
- Capacity browser matrix: Light/Dark × 1280/390/320; actual 2000ms route, sampled route bounds/node intersections, paused frozen animation time, awaited final stage, replay reset, navigation cancellation, reduced motion and no horizontal overflow.
- Inspected final desktop Light, final 320 Dark and paused 390 Light screenshots. Filled green capacity and amber dashed overflow remain readable and separate from the ready/down nodes.
- Additional boundary assertions passed after the full suite; git diff --check passed.

Evidence: evidence/lab09-capacity-animation/browser-results.json and mid/final screenshots. Caveat: the existing missing-data spec hardcodes its older screenshot directory; running that regression refreshed those prior screenshots despite the new config's isolated outputDir. New capacity evidence is isolated. No authenticated backend persistence re-verification was performed; scoring/model source remained unchanged and existing flow tests cover snapshot-only replay and cancellation.

Built with /usr/local/bin/node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab08-preview. Existing parent-owned PID 27119 remains serving http://127.0.0.1:4173 (standalone, no platform login). No restart, canonical dist build, Docker deployment, live database access, commit or push.
