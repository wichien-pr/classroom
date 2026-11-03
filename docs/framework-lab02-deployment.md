# LAB02 deployment verification

Deployed to **https://localhost/courses/framework-for-system-design-interview/** (local-only, existing real accounts). Source synchronized from `/Users/prommeesee/projects/classroom-framework-lab02` to canonical `/Users/prommeesee/projects/classroom` on `framework-for-system-design-interview`, deployment-time HEAD `d43760af17a663816e919f634adc7f9afcb21204`. The deployment itself did not commit/push. Exactly 16 approved implementation/test files copied from the clean baseline; unrelated tracked source and both ignored PDFs unchanged. Release-only QA scripts/docs added in canonical.

## Actual deployed target
- Container `classroom-docker-qa-classroom-1`: `1e5a3e8db5130255140d3752b1de349d513eaeada0e0ae82009d1e6920b87bbc`
- Image `sha256:f6e218cdc47bc6094743695373cf973b782b932b04180eab24a1a788697fbd02`
- Rollback `classroom:rollback-framework-lab02-20261103t074427z` points to old immutable `sha256:5996f6a01e549d9d918fbaca9396a70084f40aad6e3bb437ea1cee7334d342f5`.
- Private coordinated backup: `backups/framework-lab02-https-20261103T074427Z/data.tar.gz`; SHA256 `1c0777535f5653d1c34fee6f2be91bcff8b6c643d9f3afad61d8f48d8ff467a5` (0700 directory / 0600 archive).
- Sanitized rollout evidence: `evidence/framework-lab02-deploy-20261103T074427Z/deployment.json`; source/runtime maps and browser evidence: `evidence/framework-lab02-release/`.

Built before stopping the exact single writer; used all four existing Compose files through the HTTPS wrapper. Only classroom recreated. Existing external volume `classroom-accounts-20261022:/data`, effective environment, secure-cookie/origin configuration, unpublished backend, Caddy container and CA remained unchanged. No unrelated servers stopped.

Archive extraction verified SQLite integrity, schema, deterministic fingerprints of all 25 tables and upload hashes against the stopped-volume baseline. New startup matched that baseline before HTTP probes. After probes all non-session tables/uploads/schema and prior sessions remained unchanged; one legitimate anonymous login-probe session was added. No live account login, reset, seed, impersonation or email was performed.

## Deployment-time verification (historical)
- Canonical `npm test`: **14 passed**.
- Canonical standalone `npm run build`: **14 modules**; `npm run test:e2e`: **3 passed** (LAB01, LAB02, account UI failure/retry contracts).
- `python3 tests/test_platform.py`: **2 passed**, including real isolated integrated pipeline and private-bank exclusion.
- Actual-image backend suite: **418 passed, 2 skipped**, with readonly test/scripts mounts and runtime DB/upload defaults unset; no real volume. Initial run had 2 setup failures because runtime intentionally omits `scripts/courses.py`; rerun with readonly scripts mount resolved both. Skipped cases remain unverified.
- Actual immutable-image browser (`LAB02_QA_IMAGE=sha256:f6e218cdc47bc6094743695373cf973b782b932b04180eab24a1a788697fbd02 node tests/lab02-image-account.mjs`): **2 disposable accounts**, both lessons independently qualified, score **4 each**, duplicate thinking choice no extra award, LAB01 did not qualify LAB02, both persisted through container restart. Widths **1280/390/320**, zero page errors; private bank/PDF/source authenticated requests returned 404. Mobile screenshot inspected. Synthetic QA fixture creation is limited to disposable data, no mail/OTP delivery claimed.
- Complete 58-file new runtime map equals browser-qualified immutable image and running container. Runtime delta limited to Framework manifest, private bank and compiled assets; other courses/backend unchanged. Canonical Framework integrated assets match. LAB01 source identity/private questions preserved.
- Existing-CA TLS validation (no `-k`, no machine trust modification): `/healthz` 200, `/login` 200, guest course 303 to `/login`, guest progress API 401. Container healthy.

## Source and learning boundary
LAB02 stable ID `framework-blueprint`; main action `review-blueprint`. Two active lessons, six allowed activity definitions, seven private questions. New lesson requires its own manual + main activity + either semantic thinking choice. Existing history and immutable exams retained; whole-course eligibility now requires both lessons. LAB01 keeps ลูกค้า wording.

Supplied Step2 material informs high-level proposal/buy-in, concrete use cases, feed publishing/building and API/schema detail negotiation; exercise/settings are supplementary and explicitly not a capacity or production-system simulator. Reference PDF remains private/ignored, never published. Browser verification used loopback HTTP on disposable data; live verification used validated HTTPS as guest, not an authenticated live account. Local browser trust may still require the existing CA. Existing tabs should reload. No production email delivery test, anti-cheat or public internet deployment is claimed.

Release script `scripts/framework-lab02-deploy.py` is pinned one-shot evidence; do not rerun for later releases without rediscovery/adaptation.
