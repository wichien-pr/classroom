# LAB07–11 current acceptance

## Current learner contract

- LAB07: one CDN story, MISS v1 → HIT v1 → stale v1 after Origin becomes v2 → Invalidate → MISS v2. Four original request saves; 800 ms route badges.
- LAB08: May opens the same profile through Web A then B, comparing local versus shared sessions. Four original request saves; 2000 ms routes. Sticky and outages are reading, not additional experiments.
- LAB09: one comparison of the same 100 reads at one versus two prepared sites; two original evaluations. Routing/load is not proof of successful responses. The outer reading disclosure remains; the removed nested summary does not remove its four paragraphs.
- LAB10: one photo-job story; enqueue #1–#3 while Worker is stopped, then process those same jobs after Producer stops. One enqueue and three process saves; 1500 ms routes.
- LAB11: one **ก่อนปล่อย · Build / Test / Deploy** experiment. v.1 builds then fails Test; v.2 builds, passes Test, and permits simulated Deploy. Two/three original `run-pipeline` saves respectively. Logs and Metrics are reading only; no inspect actions or observation frames in execution/replay. Historical model capabilities and action identities remain unchanged.

Setup and replay are unscored; failed saves retain their event and cancellation prevents later steps.

## Reproduce the bounded current suite

From `courses/scale-lab`, using Node compatible with Vite 7:

```sh
npm ci
npx playwright install chromium
npm test
npx playwright test --config playwright.current.config.js
```

The config uses the existing course `.browsers` directory when present, otherwise standard Playwright browser discovery. `PLAYWRIGHT_BROWSERS_PATH` can override either. Install browsers into that same chosen location. Ports default to 4191/4192; set `SCALE_LAB_TEST_PORT` to a free adjacent pair if needed. Existing servers are never reused.

Each invocation builds standalone and account-mode clients into fresh `scale-lab-current-*` temporary directories (under `TMPDIR` when set), and stores JSON results/screenshots there. All screenshots use Playwright test output paths. There are no evidence/baseline inputs or private absolute paths. Neither canonical `dist` nor an existing local preview is rebuilt. No Docker commands are used.

The explicit allowlist is:

- `cdn-current.spec.js`
- `web-presentation.spec.js`
- `dc-comparison.spec.js`
- `queue-story.spec.js`
- `logging-single.spec.js` (pipeline only, despite its historical filename)
- `logging-pipeline-boundaries.spec.js`

The boundary project intercepts `/api/qa/progress` and `/api/qa/participation` on a compiled account-mode client. It checks exact retry payloads, every failed/held pipeline-save boundary, cancellation, no inspect actions, unscored replay/setup and no completion writes. **This is frontend API-contract coverage, not real backend persistence or authenticated-account QA.**

## Verification scope and status

Packaging verification: full course unit suite **205 passed, 0 failed**; bounded browser suite **33 passed** (23 standalone + 10 intercepted API-contract tests). Browser coverage includes real animation timing/pause/replay/reset and Light/Dark at 1280/390/320 for CDN, Queue and Pipeline; Web/Data Centers each also exercise all those theme/width combinations and real-time cancellation.

The broad legacy `playwright.config.js` is **not** the current LAB07–11 acceptance gate. Its historical scenario-tour specs and old multi-page/combined LAB11 runners are superseded; no claim is made that the historical full browser suite passes. Earlier reports/evidence remain historical, not dependencies or proof for this contract. Untracked LAB02/03/05/12 work and intermediate LAB11 runners are excluded from this publication and preserved locally.

This is a source/test publication, **not a deployment**. The separately managed standalone preview on port 4178 and canonical build are left untouched; they need not contain packaging-only wording fixes. Docker may still serve older code and is not certified by these preview tests. No production build, Docker restart, PR or merge is part of this verification.
