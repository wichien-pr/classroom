# Framework LAB04 deployment

Deployed to **https://localhost/courses/framework-for-system-design-interview/** on 2026-11-04. Loopback-only HTTPS, existing real-account dataset; no production-account login, fixture insertion or email was performed. No commit/push.

- Canonical: `/Users/prommeesee/projects/classroom`, branch `main`.
- Image: `sha256:63f33d4bfdb558e2435076791b2136ccc55cffd66de92376338ee2067dcb0136`.
- Rollback: `classroom:rollback-lab04-20261104-113351` → `sha256:e4ddeeb18b7d0021c837e7c0e3c74075621aa7ad92ea28ec79d0ea1b8c23e573`.
- Private backup: `/Users/prommeesee/.hermes/backups/classroom-lab04-20261104-113351` (source snapshot, environment, stopped full-volume `data.tar`, fingerprints and deployment report).
- Existing project/container: `classroom-docker-qa` / `classroom-docker-qa-classroom-1`; volume `classroom-accounts-20261022:/data`. Existing Caddy HTTPS container was not recreated.
- Full Compose override order retained: `compose.yaml`, `compose.accounts.yaml`, `compose.https.yaml`, `compose.https-local.yaml`. Private recovered runtime environment mapping is unchanged.

## Verification

Docker built from canonical before replacing the service. Complete old/new `/app` hash comparison limits runtime changes to this course's manifest, bank and compiled assets; backend and other courses are unchanged. Compiled dist hashes match the integrated isolated worktree tested by the real two-account browser runner. Canonical dist was updated only after successful deployment.

Stopped writer → full-volume archive → restored archive verification → restart → immediate read-only fingerprint comparison, before guest probes: integrity `ok`, identical schema, all **25 table** row fingerprints and **1 upload** hash. Archive content independently matches the stopped baseline. No schema migration or additive rows were necessary.

The actual running catalog loader reports `Framework Lab`, four stable lessons and **13 validated private questions**. Previous three lesson IDs and ten questions are unchanged. Service healthy, zero restarts. Internal `/healthz` and trusted-CA **https://localhost/healthz** returned 200. Guest course request returned 303 with `Location: /login`. No TLS bypass or system trust modification.

Inherited implementation evidence (not rerun during rollout): backend 421, course unit 18, compiled browser 5 and pipeline 2 passed; two synthetic accounts exercised four lessons / twelve action definitions and retained independent progress after restart. See [implementation verification](framework-lab04-verification.md). Deployment verifies byte-identical qualified assets, not a new real-account browser login or signup/OTP journey.

The bounded integration includes 21 source/test/document files (including the inherited title regression), plus this deployment note and status updates. Unrelated tracked/untracked files, local ignored PDFs, secrets and `~$Step3.docx` were preserved. Detailed allowlist and hash evidence are in private `integration.json`, `canonical-before.json`, `runtime-delta.json`, `before.json`, `after.json`, `archive-fingerprint.json`, and `deployment-report.json`.
