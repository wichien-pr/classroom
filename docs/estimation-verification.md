# Estimation course — isolated implementation and verification

## Status

Implemented in `/Users/prommeesee/Documents/04_Learning/classroom`, branch `Back-of-the-envelope-Estimation`. **Deployed locally to Docker at http://localhost:8082 on 2026-10-22; not committed or pushed.** The authorized image release recreated only `classroom-docker-qa-classroom-1`, retaining external account volume `classroom-accounts-20261022` at `/data` and the unchanged effective private runtime environment. No platform backend or Scale Lab source files were changed. The pre-deployment hash comparison of 137 existing Scale Lab files found zero changes.

### Current release — authorized Estimate Lab rename

- **Estimate Lab** is deployed and healthy at **http://localhost:8082**. Course URL remains `/courses/back-of-the-envelope-estimation/`; lesson/action IDs and history contracts are unchanged.
- Running image: `sha256:e1124cedb1d3aea5983b4a30538223647f68b46e61786918aaeaf30bee5bd813` (`classroom:local`), deployed 2026-10-22T04:39:19Z. Built using `sh scripts/classroom-compose.sh build` while the old container remained serving.
- Complete `/app` file fingerprints between old and new images differ **only** in `courses/back-of-the-envelope-estimation/course.json`; parsed manifests differ **only** in `title` (`Back-of-the-envelope Estimation` → `Estimate Lab`). All compiled assets, private banks, backend and Scale Lab files remain identical.
- Rollback tag: `classroom:rollback-pre-estimate-lab-20261022t043808780697z`, image `sha256:433f69a6be44b5e6a6d22c3a8b2048a922f8d558e83d3e3659306d04512a909f`.
- New private coordinated backup: `backups/estimate-lab-rename-20261022T043912379297Z/`; SQLite/uploads archived with only Classroom stopped, SQLite Backup API copy and integrity/foreign-key checks passed. Prior backups were retained.
- Exact service/project, external volume `classroom-accounts-20261022:/data`, binding `127.0.0.1:8082`, and effective environment mapping retained. All tables/schema/sessions/uploads matched backup before guest checks. Afterwards only one new anonymous `/login` session was added; all preexisting sessions, every non-session table, the one account and one upload were unchanged.
- Actual-container manifest/discovery and generic catalog template verified `Estimate Lab` and stable URL construction. No authenticated production catalog/browser request or account impersonation was performed.
- HTTP `/healthz` and `/login`: 200; both course entries: 303 to `/login`; both progress/participation APIs: 401 for guests. No signup, reset, real email or synthetic QA writes. Ports 8081/8142/8143 remain running and untouched. No commit/push.
- Sanitized evidence with before/startup/after fingerprints: `evidence/estimation/rename-deployment.json`; separate operator verifier `deploy-rename.py` and output `rename-deployment-run.txt` in the same directory. Earlier 16-test Node result remains prior verification, not a newly rerun suite.

### Historical initial Docker release (superseded by rename above)

- Initial image: `sha256:433f69a6be44b5e6a6d22c3a8b2048a922f8d558e83d3e3659306d04512a909f` (`classroom:local`), healthy; binding `127.0.0.1:8082` → container 8080.
- Rollback image: `classroom:rollback-pre-estimation-20261022`, ID `sha256:4a2415639a7ed87742054c1828209a238bd0061876e854e8a670ed71d747612d`. Retain the account volume; rollback must use the same wrapper/project/volume.
- Coordinated private backup: `backups/estimation-deploy-20261022T043434Z/`. Only the Classroom service was stopped before archiving the entire volume, including SQLite and uploads. Archive extraction, SQLite Backup API copy, integrity and foreign-key checks passed. Directory is private; do not publish its contents.
- Build completed while the old service remained running. Both enabled courses were built inside Docker. All three Estimation dist files and all four Scale Lab dist files exactly match host integrated output; no host dist was rebuilt.
- Read-only discovery and private-bank validation in the exact running container: Estimation **6 lessons / 18 action definitions / 6 questions**; Scale Lab **12 lessons / 44 action definitions / 24 questions**. Both banks remain outside dist.
- Before guest smoke tests, every table fingerprint, schema, preexisting session and upload matched the stopped backup. After checks, every non-session table and preexisting session still matched; `/login` added exactly **one anonymous session**. The existing **one account**, **one uploaded file**, activity/presence and all learning/history tables were retained unchanged.
- HTTP checks: `/healthz` and `/login` 200; both course entry routes 303 to `/login`; both courses' progress and participation APIs 401 for guests. No real account impersonation, signup, reset, email or authenticated production browser test was performed. Earlier isolated browser QA below is separate evidence, not a claim of production login success.
- First recreation was automatically rolled back because an overly strict environment-array comparison treated ordering as a change. The verifier was corrected to compare effective key/value mappings privately; retry passed with no environment value changes. The first backup and sanitized `deployment-first-attempt.json` remain retained.
- Final sanitized evidence: `evidence/estimation/deployment.json`; one-shot operator verifier: `evidence/estimation/deploy-release.py`. No fixture-seeding Docker verifier was run. Other stacks, port 8081, old QA volume and previews 8142/8143 were not modified. Reload existing course tabs after this release.

New course: **6 lessons, 6 simulation actions + 12 semantic thinking choices = 18 participation definitions**. Six additional manual markers are not scored actions. Private assessment: 6 questions, one for each lesson. `course.json` order 2; generic discovery validates both existing and new courses without platform edits.

## Source map — developer-only

Reference: root `Back-of-the-envelope-Estimation.html`, immutable SHA-256:

`b40876a196611e924b7a6eddb64b96c59255d8a48e410da0d48cafef675c85de`

`python3 scripts/extract-estimation-source.py` uses Python's HTML parser, skips scripts/style/nav and writes an article-only section bounded by the introductory paragraph and Reference materials. It never executes remote scripts or fetches tracker URLs. The full extracted text is retained only in ignored evidence for line mapping; saved chrome is not lesson content. The raw page/assets contain saved personal metadata and are explicitly ignored by Git. The existing Docker context allowlist excludes these root references; neither is copied into course public/dist.

The actual article was read in full. One teaching figure, `figure-2-1-E4JWSLDE.svg`, was opened locally and rasterized without loading the saved page. It shows nested proportional squares and historical latency labels: 1/3/4 ns, 17 ns, 100 ns, 2,000 ns, 3,000 ns, 16,000 ns, etc., up to 150,000,000 ns intercontinental round trip. This 2020 visualization differs from the prose's 2010 table. The course explicitly uses selected **2010 table values** and never presents them as current benchmarks. Original Thai diagrams are drawn in HTML/CSS; source figure and page chrome are not republished.

Line ranges below refer to ignored `evidence/estimation/source-text.txt`:

| Source coverage | Lines | New lesson / treatment |
|---|---:|---|
| Purpose of rough capacity estimates, unit discipline | 39–40 | Course-wide model warnings, explicitly bounded scenarios |
| Powers of two, byte/bit, table through 2⁵⁰ | 41–49 | `estimate-units`: powers 10/20/30/40/50, bits/bytes and decimal/binary conversion |
| Historical latency table, ns/µs/ms, visualization and qualitative conclusions | 50–79 | `estimate-latency`: selected reference operations, ratios and serial cost; compression caveat and measurement requirement |
| Availability, SLA and downtime table | 80–88 | `estimate-availability`: arbitrary percentage and 1/7/30/365-day windows, explicit measurement basis |
| Exercise-only user/activity/peak assumptions | 89–101 | `estimate-traffic`: same numeric baseline in a fictional photo-posting service; not real Twitter usage |
| Media-only storage, 10%, 1 MB, five years | 102–108 | `estimate-storage`: explicit decimal units and 365-day years; metadata/text excluded |
| Rounding example, assumptions, units and common further exercises | 109–114 | `estimate-rounding`: original vs approximate division, signed error, sensitivity checklist |
| References, congratulations, buttons/sidebar/footer | 115 onward / chrome | Not taught or copied into the learner interface |

### Corrections and supplemental material

- The source labels power-of-two units KB/MB/etc. The new course distinguishes KiB/MiB/GiB/TiB/PiB from decimal KB/MB/GB/TB/PB. The source storage arithmetic is reconciled using **decimal MB/TB/PB**.
- ASCII's one-byte example is not generalized to Thai UTF-8. A 64-byte ID listed in the source is not treated as a 64-bit identifier or included in a supposedly exact media-only total.
- The source downtime table contains a missing weekly unit in the 99.9999% row and no 99.9% row. The lab derives every result rather than reproducing typographical omissions; month explicitly means 30 days, not the source's average-calendar-month convention.
- Peak ×2 is an assumption, not a guarantee. QPS is posts only, not all request types. Server counts require real load tests; none are invented.
- Replication copies, overhead, request-based SLA distinction, UTF-8 caveat and low/medium/high sensitivity advice are supplemental and identified as such. Overhead is applied to each copy. Replication is not backup.
- The course does not claim all table rows are independent lessons or measured contemporary values. Cache/server sizing are named further exercises rather than invented source chapters.

## Actual verification

| Check | Actual result / evidence |
|---|---|
| Model and adapter TDD | Units initial RED; each latency/availability/traffic/storage/rounding slice RED→GREEN; adapter missing-module RED then copied, independently tested adapters. `evidence/estimation/*-red.txt`, `*-green.txt`; first units RED at `evidence/estimation-units-red.txt` |
| Calculation snapshot regression | Browser failed on edited operands rewriting old steps after remount; fixed by captured input snapshot, rerun GREEN. `snapshot-red.txt`, `standalone.json` |
| New course Node suite | **16 passed**, `unit-final.txt` |
| Full unchanged backend suite | **414 passed**, `backend.txt` |
| Generic course registry | `python3 scripts/courses.py validate` reports both `scale-lab` and `back-of-the-envelope-estimation` OK |
| Standalone compiled browser | All six calculators, both answers per lesson, invalid values, reset, local reload, malformed/denied storage, snapshot retention, keyboard glossary and all lessons at 320/390/1440px. `standalone.json` |
| Genuine account browser | Actual local-double OTP signup/login, every one of **18 declared action identities** exercised. Account A completes 6/6 with 18 points; account B independently completes 1/6 with 2. `account-browser.json` |
| Qualification and identity | Manual-first/participation-first, wrong answer qualifies but does not grade, correct answer does not create manual marker, shuffled display keeps original action IDs, repeated/new-UUID clicks do not add points |
| Faults/concurrency | Actual server commit followed by aborted response; retry retains UUID and original lesson across navigation. Explicit load failure blocks both action classes, retry recovers without local fallback. Four concurrent duplicate requests award zero; conflicting reuse returns 409. Held manual response completes original lesson after navigation |
| Auth/isolation | Guest APIs 401; course redirects to login; authenticated source/private bank/missing assets 404; deep refresh works; catalog/return retains session; both accounts' Scale Lab completion stays zero |
| Persistence | Both accounts reloaded and relogged; exact isolated process stopped/restarted on the same DB, then both accounts verified again. `restart.json` |
| Assets/console | All observed course assets HTTP 200; no page errors, `account-browser.json` |
| Build integrity | New integrated `dist` hashes exactly match the compiled assets in tested isolated QA tree. Standalone compiled build is separate. `final-inventory.json` |
| Source / existing course | Original HTML hash unchanged; 137 existing Scale Lab file hashes unchanged. `final-inventory.json` |

All paths in the table are under root `evidence/estimation/` unless explicitly stated. Evidence is local/ignored; private OTPs, user passwords and mail remain only inside the private temporary QA directory. Browser runs were repeated during development, so the isolated database contains earlier QA users too; the final report and restart verify the final two-account pair. This is not production data.

### Visual evidence actually inspected

- `source-figure.png` — actual source figure inspected.
- `standalone-estimate-traffic.png`, `standalone-320.png` — instructional sequence and full-page layout.
- `account-1440.png`, `account-320.png` — account UI, navigation, score and completion state.
- `experiment-estimate-storage-320.png` — stacked narrow inputs/results and calculation steps.
- `experiment-estimate-latency-1440.png` — desktop input/result hierarchy and units.
- `glossary-390.png` — native popover within mobile bounds.

No clipping observed in these inspected views. The calculator capture script also enumerated all six experiments at three widths and checked result widths (`visual-checks.json`). At narrow widths the long lesson intentionally scrolls vertically; no dense parallel teaching column. Some full-page screenshots are very tall; inspect element captures or originals rather than tiny downscaled thumbnails.

## Parent-verifiable preview handles

- Standalone compiled preview (no account needed): **http://127.0.0.1:8143/**
  - process handle `proc_e0325a883c22`, handed to parent
  - serves only `evidence/estimation/standalone-dist`
- Isolated authenticated preview: **http://127.0.0.1:8142/courses/back-of-the-envelope-estimation/**
  - process handle `proc_e318ce62392a`, handed to parent
  - server/temporary DB location: `evidence/estimation/server.json`
  - QA-only Graph HTTP double; no real mail/provider calls

These are loopback-only development previews, not deployments. Do not advertise QA signup as a real email service: OTPs are delivered to the private local double. Existing test credentials are deliberately absent from documentation. Parent can rerun the verification through its private fixture without exposing them.

Reproduction from repository root (ensure ports are free/owned first):

```sh
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/estimation-qa-server.py --port 8142
node scripts/estimation-browser-verify.mjs
# Stop only that identified QA process, then:
PATH=/usr/local/bin:$PATH appworks/.venv/bin/python scripts/estimation-qa-server.py --port 8142 --resume
node scripts/estimation-browser-verify.mjs --restart
```

Never use `scripts/docker-verify.py` with the live account volume. The authorized Docker release is documented above; it was built and deployed locally, not pushed to a registry. Existing `.dockerignore` continues to keep QA/source references outside the image.

## Changed paths

- `.gitignore`: preserve and exclude saved HTML/reference assets.
- `courses/back-of-the-envelope-estimation/`: independent package/lock, course/private bank, Thai lessons, deterministic models, copied owned adapters/styles/glossary, UI, tests, README, compiled ignored dist.
- `scripts/extract-estimation-source.py`: safe offline extraction.
- `scripts/estimation-qa-server.py`: isolated courses/DB/uploads plus real local Graph boundary.
- `scripts/estimation-browser-verify.mjs`: actual account/coverage/restart verification.
- `docs/estimation-verification.md`: this source/verification handoff.
- `evidence/estimation/`: ignored local evidence and standalone build.

No backend special casing, account migration, shared cross-course imports or changes to host Scale Lab history/manifest/dist. The separately authorized image release is complete; no commit or push was performed.
