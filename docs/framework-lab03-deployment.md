# LAB03 deployment verification

Deployed to **https://localhost/courses/framework-for-system-design-interview/** — loopback only, existing real accounts. Source synchronized from `/Users/prommeesee/projects/classroom-framework-lab03` into canonical `/Users/prommeesee/projects/classroom` on `framework-for-system-design-interview` at unchanged HEAD `e61441a2e9cc1a9e55b1973c3bd8d9955df4cc0e`. Deployment itself did not commit/push. The user subsequently authorized publishing the approved changes to the same branch; no merge or PR is authorized.

## Release handles
- Image: `sha256:4a401fe680355520a2e72bcc77726062aa1ac06b5abe87f546e72c968bbe8453`
- Container: `classroom-docker-qa-classroom-1`, ID `15bf4680174833eb0ed5d8d37e4b6aeecfd609685f76d82d40fcb177c3fe2f09`
- Previous immutable image: `sha256:f6e218cdc47bc6094743695373cf973b782b932b04180eab24a1a788697fbd02`
- Rollback tag: `classroom:rollback-framework-lab03-20261103t083055z`
- Private coordinated archive: `/Users/prommeesee/projects/classroom/backups/framework-lab03-https-20261103T083055Z/data.tar.gz`
- Archive SHA256: `1aceb4d698375cd5d4b0464db3953aabfa5411a1fb2386cba0686ab085f76c35`
- Sanitized deployment proof: `/Users/prommeesee/projects/classroom/evidence/framework-lab03-deploy-20261103T083055Z/deployment.json`
- Fresh test logs, source-sync and tested runtime hash map: `/Users/prommeesee/projects/classroom/evidence/framework-lab03-release/`

## Preservation and rollout
18 approved source/test/docs files synchronized only after checking canonical contents against the shared HEAD. Overwritten sources privately snapshotted under `backups/framework-lab03-source-20261103T082703Z`; unrelated tracked files and Step3 references unchanged. Release-only scripts/docs added separately. LAB01/LAB02 IDs, source modules, prior choices/questions and ลูกค้า wording preserved.

Built the actual image before stopping the single identified writer, using the existing four-override HTTPS wrapper. Recreated only classroom, preserving external `classroom-accounts-20261022:/data`, effective environment, command, security settings, unpublished backend, Caddy container and CA. Runtime delta confined to Framework manifest/private bank/compiled assets; other runtime files unchanged. Canonical Framework integrated assets and running application tree match the browser-qualified immutable image.

Stopped-volume read-only snapshot: SQLite integrity OK, schema and deterministic fingerprints of all 25 tables plus upload hashes recorded. Full coordinated volume archive has 0700 parent / 0600 archive; extraction independently matched all fingerprints. Immediately after startup and before HTTP probes, data exactly matched baseline. After probes, all prior sessions and non-session tables/schema/uploads unchanged; one legitimate anonymous login-probe session added. No real fixture insertion, login, impersonation, reset or email.

## Fresh release verification
- Canonical unit suite: **16 passed**.
- Canonical standalone compiled browser suite: **4 passed**, including all three lessons and frontend failure/retry contracts.
- Actual-image backend suite with read-only tests/scripts mounts and no real data: **418 passed, 2 skipped**. Skipped cases are not certified by this release.
- Actual-image authenticated browser: **2 synthetic accounts**, all **3 lessons**, all **9 action definitions per account**, manual-first versus participation-first qualification, prior completion does not qualify LAB03, duplicate awards remain deduplicated, both accounts retain 3 completions/9 points after container restart. Widths 1280/390/320; zero page errors; private bank/source/PDF requests 404. Mobile screenshot inspected.
- Docker build completed integrated builds/validation for all courses. Host all-course rebuild failed because Scale Lab host dependencies lack `vite`; this is not an image failure. Rebuilt only canonical Framework integrated dist successfully afterward and verified its hashes against the tested image. No dependency reinstall or unrelated dist replacement was used to conceal the host limitation.
- Existing-CA validated HTTPS: `/healthz` 200, `/login` 200, course guest 303 with `/login` location, progress guest 401. No insecure TLS bypass or machine trust change. Container read back healthy with exact new image.
- `git diff --check` passed before documentation update; final check recorded in release evidence.

Active IDs: `framework-scope`, `framework-blueprint`, `framework-deep-dive`. New main action: `review-deep-dive`. Active totals: 3 lessons / 9 action definitions / 10 private questions. Existing history and frozen exam snapshots retained; whole-course completion now needs all three.

## Limits
Browser account tests used isolated loopback HTTP and synthetic fixtures, not real-account HTTPS login or OTP/mail delivery. Live HTTPS verification was guest-only with the existing CA trusted by the test client; browser/machine trust was not changed. Local reachability only. The planning exercise is not a functioning feed service or load test; participation is not tamper-proof grading. Earlier isolated implementation counts remain historical in `framework-lab03-verification.md`.

`scripts/framework-lab03-deploy.py` is pinned one-shot release evidence, not a reusable deployment command. Rediscover target/image/storage before any later release.
