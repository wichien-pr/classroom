# Lab 01 — Single-server setup: source mapping and verification

## Source and fidelity

Original: root `Single-server-setup.pdf`, 3 pages; inspected metadata/text and rendered both figures before authoring. PDF 1.3, Quartz PDFContext, no title/author metadata and no encryption. SHA-256 before work: `72fda3b93d12c0a29196f37ac8141bebfe63f115a9fcac8f210fbabafab7f73e`. Original remains untouched. Figures in the app are newly drawn inline SVG, not screenshots or copies of the supplied artwork.

| Source | Teaching content and interaction |
|---|---|
| p.1, Figure 1 and paragraph | One dashed host enclosure contains Web/Application, Database and Cache. DNS remains outside. Browser/mobile selector changes the traffic source, not topology or scoring identity. |
| p.2, Figure 2, items 1–2 | User chooses a domain; first click queries external DNS; second explicitly returns IP to the client. Separate directed arrows, active highlight, inspector and event narration. |
| p.2, items 3–4 | Client sends HTTP directly to the server; response returns directly to the client, not through DNS. Manual stages request → process → response → display. |
| pp.2–3, traffic sources | Browser example receives HTML; mobile example receives JSON. Both are examples, not a rule that browsers cannot use JSON. HTML/JavaScript presentation and Java/Python server logic are explained. |
| p.3, GET /users/12 and sample JSON | Same method/path and user 12, John Smith. Inspector shows a deliberately abbreviated JSON object (omits address/phone) and an original illustrative HTML fragment, safely displayed as text. |
| p.2 DNS behavior | In-lesson quiz rejects the misconception that DNS forwards HTTP. Original wrong index 0 / correct index 1 retained. |
| p.1 single host | Private bank `flow-2` replaces unrelated DB-timeout question with single-host placement; original schema, question ID, option IDs and answer ID retained. Existing DNS bank question remains relevant. |

## Explicit supplements / simulation limits

- `api.example.test` and documentation IP `192.0.2.10` substitute for source `api.mysite.com` / `15.125.23.214`; no network request is sent by the simulation. The source IP is not represented as belonging to the user.
- Cold DNS lookup is a demonstration, not required before every request. DNS caching and connection reuse are explained.
- HTTPS is supplemental production advice, not an extra intermediary in the source flow.
- Easy initial operation, shared resources and shared failure are supplemental trade-offs, not measured capacity claims. No fabricated benchmark or failure simulation.
- The processing stage is explanatory decomposition of the source request, not a claim that every request hits both DB and cache.
- Six deterministic manual transitions, no timers, terminal clicks are genuine no-ops (no new event log entry or score POST). Reset restores Browser and initial state, but not quiz order/selection or progress.

## Durable compatibility

No manifest, backend schema or scoring service changes. `flow`, simulation `flow`, action `step`, `check-your-thinking` and original `quiz-answer-a`/`quiz-answer-b` are unchanged. Each step submits the same semantic action; server v2 uniqueness awards only once. Account qualification remains manual + main simulation + either thinking choice. Correct quiz does not mark manual. Standalone local behavior, option shuffle, aria-pressed, pending/retry guards and navigation capture remain intact. Other eleven lessons retain their content and simulation behavior.

## TDD observations

Vertical RED→GREEN slices were actually run:
1. Exact flow sequence test failed at old terminal 5; model changed to terminal 6; all 27 existing Node tests green.
2. New browser journey failed on old lesson heading; source content, topology, explicit returns, narration and terminal no-op implemented; journey green. A test-only innerText/textContent mismatch was corrected before green.
3. Mobile mode test failed because selector did not exist; non-scoring selector, mode narration and sample response implemented; 320/390/1440 cases green.
4. Private assessment test failed on removed DB-timeout prompt; `flow-2` aligned to source; Node suite green.
5. Visual inspection found response line crossing request labels; geometric SVG stroke/text intersection test failed, then routed response outside labels; green.
6. Narrow-screen font test measured 10.5px (<12); SVG font increased to 18 viewBox units, minimum rendered 12.6px at 320; green.

Old heading expectation and five-step account regression assumption were aligned to the new lesson, without weakening completion/dedup tests.

## Executed verification

- `cd appworks && .venv/bin/python -m pytest -q`: **396 passed**.
- `PATH=/usr/local/bin:$PATH npm test`: **28 passed**.
- `PATH=/usr/local/bin:$PATH npm run test:e2e`: **25 passed** (20 existing + 5 new browser cases).
- `PATH=/usr/local/bin:$PATH npx playwright test --config playwright.account.config.js`: **15 passed**.
- Real isolated compiled Flask/SQLite server: `scripts/registration-qa-server.py --port 8122 --evidence evidence/single-server`. Genuine OTP signup through the local Graph HTTP double; no external email/provider request.
- `PARTICIPATION_QA_EVIDENCE=evidence/single-server/ node scripts/participation-browser-verify.mjs`: all **42** stable button definitions exercised; account scores 42 and 1; repeat/reload/relogin/isolation and actual lost-response-after-commit retry passed. Updated this historical runner to use the mandatory OTP helper rather than waiting for direct signup.
- `node scripts/single-server-browser-verify.mjs`: both response modes, all six highlights, terminal no-op, wrong/correct feedback, manual qualifier, retained selection/order, repeated reset/reload dedup and 320/390/1440 layouts passed; 31 simulation POSTs resolve to only `flow/flow/step`; Lab01 score remains 3 after both quiz identities.
- Real QA process restart 76827 → 80575, same isolated SQLite: participation scores 42/1 persisted; Lab01 score 3 and completed `flow` persisted. `lab01-first-run.json` records original manual qualification; latest `lab01-browser.json` records post-restart verification.
- Final compiled assets `index-OVksZ26P.js` and `index-r9Ui_PFi.css`, built with Vite 7.3.7 into the isolated temporary course tree recorded in `evidence/single-server/server.json`, not live dist. Final browser observed all compiled asset HTTP responses 200, no page errors.
- Visually inspected source figures and final compiled screenshots: `diagram-320.png`, `browser-dns-return.png`, `page-1440.png`; corrected the discovered overlapping line and sticky-header screenshot occlusion. Also captured each stage for both modes, 390px and desktop evidence.

## Reproduction and boundaries

Run QA launcher with a free port and separate evidence directory. It builds into a temporary courses root; never run ordinary build against live dist during production service. To resume the existing isolated run, use the same arguments plus `--resume`. Rebuild its temporary dist explicitly if changing source; preserve `VITE_CLASSROOM_URL=/`, `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress`, `--base /courses/scale-lab/`. The Lab01 runner can replay the QA legacy account after restart; the full participation runner creates new OTP-verified isolated accounts.

No deployment, no production database writes, no `.env` reads, no service changes on 8080/8081. QA server is stopped after verification (8122 connection refused). Before/after hashes match: original PDF `72fda3b93d12c0a29196f37ac8141bebfe63f115a9fcac8f210fbabafab7f73e`, live dist index `043e313c1eaf9e4abcae479066222c6f58bec8047c8f222837cc69201b8731c1`, production SQLite `136466ef168eb82748d277e554223bc0a71e6c0a44bcc6b3b41eb927a6d3c293`. Production listener PIDs remain 65099 (8080) and 1363 (8081). Evidence contains QA session files used by the historical participation runner; treat them as private test artifacts, not public attachments. Backend tests and browser registration use isolated data only.
