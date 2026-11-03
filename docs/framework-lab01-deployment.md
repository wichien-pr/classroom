# LAB01 Docker HTTPS deployment — 2026-11-03

Published: https://localhost/courses/framework-for-system-design-interview/ (local machine only, authentication required).

## Current release: customer wording only — 06:42 UTC

- Deployed canonical `framework-for-system-design-interview` branch without commit/push. Exact source replacement `ผู้สัมภาษณ์` → `ลูกค้า`: `src/main.js` 3, `src/scope.js` 1, private `assessment.json` 1. Reverse-replacement hashes match the pre-copy baseline; source PDF and unrelated baseline source unchanged. Tests updated separately; no course/lesson/action identity or behavior change.
- Current image: `sha256:5996f6a01e549d9d918fbaca9396a70084f40aad6e3bb437ea1cee7334d342f5`.
- Current container: `6f1b85bdec8ec84a0dc316aa2f8d288ebe572822a778b964307e6dac0f51fdcc` (`classroom-docker-qa-classroom-1`), healthy, zero restarts at final readback.
- Previous immutable image: `sha256:d46f2127c8849c85224c994840c34ddf250f4f6f740ac24af03e33a8e99dbb7b`; retained as `classroom:rollback-framework-lab01-customer-20261103t064210z`.
- Built with all four existing HTTPS overrides before stopping the exact writer. Only classroom recreated. Effective environment, command, security configuration, unpublished backend, real volume, Caddy container and CA unchanged. Existing preview 5173 and QA 53479 preserved.
- Full `/app` old/new hashes differ only in private assessment, compiled HTML and old/new JS names. CSS, manifest, all backend and other-course runtime files identical. Canonical integrated assets, actual isolated browser-qualified image and live runtime hashes match. Live JS `index-Cj0JqVcO.js`: 4 `ลูกค้า`, zero `ผู้สัมภาษณ์`; private bank: 1 and zero respectively.
- Private coordinated full-volume backup: `/Users/prommeesee/projects/classroom/backups/framework-lab01-customer-https-20261103T064210Z/data.tar.gz` (directory 0700, file 0600), SHA256 `b0422613cdde82eaced3aeeb2148c582ac11453a3d6f4f5d4aa57d2d9c5377be`. Integrity, schema, deterministic row fingerprints for all 25 tables, and all non-database file hashes matched the stopped volume, extracted archive, and restarted service before HTTP probes. After probes all non-session tables, uploads and prior sessions remained identical; one new anonymous login-page session retained.
- Fresh tests: unit **12 passed**; compiled standalone/frontend account-contract browser **2 passed**; canonical backend **420 passed in 79.24s**, using the existing worktree virtualenv interpreter with canonical appworks cwd; isolated pipeline **2 passed**. Standalone build, final integrated target build, all-course Docker build/validation and `git diff --check` passed.
- Fresh actual-image isolated HTTP browser: two synthetic members, compiled customer wording, qualification in both action orders, stable choice replay, persistence across page reload, account isolation, Level 2, catalog return, private resource 404; widths 1280/390/320, no page errors/overflow. Screenshots inspected. Disposable tmpfs-only container removed; never mounted live volume or real runtime env. No process-restart browser or fresh isolated TLS suite in this wording-only release.
- Live HTTPS certificate/hostname validation with existing CA: health 200, login 200, guest course 303 to `/login`, progress API 401. No machine trust changes. No live credential use, impersonation, fixture insertion or email. Published assets verified from exact live filesystem against browser-tested image, not through a real authenticated HTTP session.
- Sanitized deployment evidence: `/Users/prommeesee/projects/classroom/evidence/framework-lab01-customer-deploy-20261103T064210Z/deployment.json`; fingerprints and public CA alongside it. Build/rollout logs, source audit, image qualification, runtime hash map, browser report/screenshots: `/Users/prommeesee/projects/classroom/evidence/framework-lab01-customer-release/`.
- New one-shot verifier: `scripts/framework-lab01-customer-deploy.py`, pinned to this release; older deploy scripts not rerun or modified. Initial isolated image QA failed readiness because the mounted `/tmp` script lacked the application import path; adding QA-only `PYTHONPATH=/app/appworks` passed. Canonical `.venv` was absent; using the existing worktree interpreter resolved the initial test command failure. Neither failure touched live state.

## Pre-commit verification after deployment

The deployment-stage “no commit/push” statements below describe those earlier operations, not a restriction on the separately authorized Git publication.

- Reviewed all 34 intended source/test/documentation/script files, including the lockfile and server-private assessment bank. Secret/private-key, unsafe execution and SQL scans found no production credentials or private account data. The QA password and session tokens are synthetic fixtures; dynamic SQL table names are fixed test literals or quoted database-owned identifiers. Backups, evidence, environment files, PDFs, dependencies and build output remain ignored and excluded.
- Fresh course unit tests: **12 passed**. Standalone build and compiled browser tests: **2 passed**, using a scratch copy rather than replacing canonical dist. Integrated build was also isolated.
- Fresh canonical backend suite: **420 passed in 69.58s**; existing worktree virtualenv interpreter, canonical `appworks` working directory. No live database used.
- Isolated course pipeline: **2 passed**. All three canonical course manifests/builds validate. Python additions compile; whitespace check passes.
- Read-only live-container verification: image is still `sha256:5996f6a01e549d9d918fbaca9396a70084f40aad6e3bb437ea1cee7334d342f5`. Fresh isolated integrated HTML/JS/CSS, canonical dist, manifest and private assessment hashes exactly match the live course runtime. No source wording or runtime behavior changed during review.
- Corrected README's stale empty-course count and removed the course README's pending-Git-publication status. Historical one-shot deploy scripts were inspected, not executed; their image pins and release evidence are not reusable deployment instructions. No deploy, existing-service stop, PR or merge in this verification.

## Earlier LAB01 feature release (historical)

The following image/container/tests describe the preceding release, not the current wording-only deployment.

## Release and preservation

- Canonical source: `/Users/prommeesee/projects/classroom`, branch `framework-for-system-design-interview`. Bounded synchronization from `/Users/prommeesee/projects/classroom-framework-lab01`: 25 new/updated files, three obsolete scaffold files removed. Other source unchanged before documentation updates; no commit/push. Source audit: `evidence/framework-lab01-release/source-sync.json`.
- `Step1.pdf` remains ignored and unchanged: SHA256 `9c91d1a1fc6b27d955f078c1d7b3f498b7120d1f7ca96ca0fc01815c72203889`. No PDF in runtime/public assets.
- Full original Compose order retained: `compose.yaml`, `compose.accounts.yaml`, `compose.https.yaml`, `compose.https-local.yaml`, via `scripts/classroom-https-local.sh`; canonical source provenance unchanged.
- Container `classroom-docker-qa-classroom-1`: `3c293e73078b0354c29f339b057de72edd18cb487ae24d723811ab5415005a81`.
- Image: `sha256:d46f2127c8849c85224c994840c34ddf250f4f6f740ac24af03e33a8e99dbb7b`.
- Previous image: `sha256:40c32ff42725b6dc37bf9aa6289f963dc791227562d098cdd97652d98b7cff5e`; rollback tag `classroom:rollback-framework-lab01-20261103t061941z`.
- Built before stopping the exact writer. Only classroom service recreated; Caddy container/CA, ports, effective environment mapping, command, security settings and real volume `classroom-accounts-20261022:/data` preserved. Backend unpublished. Final readback healthy, zero restarts.
- Private full-volume archive: `/Users/prommeesee/projects/classroom/backups/framework-lab01-https-20261103T061941Z/data.tar.gz` (directory 0700, files 0600). SHA256 `0ea65aee50a724cf8e20cfabdddadd5deb9aa5058fce1a0f3c6e8cef8825ff53`.
- Writer stopped for read-only/network-disabled backup. Archive integrity, schema, deterministic fingerprints for all 25 tables and every non-database file matched the stopped volume. Immediately after recreation, before HTTP probes, all matched again. After probes, every non-session table and preexisting session remained unchanged; one new anonymous login-page session was retained. Upload hashes unchanged.
- Full old/new `/app` tree comparison found changes only in this course's manifest/private bank/compiled output. Scale Lab, Estimate Lab and backend runtime files unchanged. Deployed runtime and assets exactly match the actual browser-qualified image and canonical integrated target build.

## Fresh verification in this release

- `npm test`: 11 passed.
- Worktree `appworks/.venv/bin/python -m pytest -q` from appworks: 420 passed in 68.71s. Worktree implementation sources matched the canonical sync; no live volume used.
- Pipeline tests: 2 passed; real isolated target build/validation.
- Canonical standalone build followed by `npm run test:e2e`: 2 passed. An initial worktree browser invocation failed because dist was the integrated-path build, not standalone; rerunning after a canonical standalone build passed without source changes. Parent-owned worktree QA process was not stopped or rebuilt.
- Final canonical integrated target build passed and its manifest/bank/HTML/JS/CSS hashes matched the tested runtime. All three image courses built and validated during Docker build.
- Actual immutable image in a disposable container, private tmpfs database and two synthetic members: authenticated catalog → LAB01, manual-first and participation-first qualification, incorrect original A qualification, opposite shuffle replay without extra points, reload persistence, account isolation, Level 2, return navigation, protected source/bank/PDF 404. Browser widths 1280/390/320; no page errors or horizontal overflow. Narrow screenshot visually inspected. Report: `evidence/framework-lab01/real-account-report.json` and `real-account-*.png`.
- Real isolated Caddy HTTPS runner passed certificate/hostname validation, HTTP redirect, health, Secure cookie, login/catalog/logout, CSRF and forwarded-header spoof rejection, unpublished backend. Disposable TLS project/volumes removed. Output: `evidence/framework-lab01-release/https-qa.log`.
- Live probes use the existing Caddy public root certificate explicitly, without changing machine trust: health 200, login 200, guest course 303 to `/login`, guest progress API 401.

## Evidence and limits

Sanitized release proof: `/Users/prommeesee/projects/classroom/evidence/framework-lab01-deploy-20261103T061941Z/deployment.json`; before/pre-HTTP fingerprints and existing public CA are beside it. Build/rollout logs, source-sync audit and browser-qualified runtime hash map: `/Users/prommeesee/projects/classroom/evidence/framework-lab01-release/`.

`scripts/framework-lab01-deploy.py` is a separate one-shot verifier pinned to this release, not a reusable deploy command. Original `framework-deploy.py` was not rerun or modified.

No live fixture insertion, real-member impersonation, email, database reset, commit or push. Authenticated browser checks used isolated loopback HTTP; TLS checks were separate. No fresh process-restart account-browser test in this release (historical implementation restart evidence is not counted). No live authenticated asset fetch: deployed filesystem hashes were compared to the authenticated browser-tested image instead. Browser/OS CA trust unchanged. Parent's QA server and unrelated preview/services were not stopped.
