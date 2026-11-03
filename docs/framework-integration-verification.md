# Empty framework course: historical integration and HTTPS deployment

Superseded by [LAB01 deployment](framework-lab01-deployment.md). The empty-shell state, image and verification below describe the prior release, not the current curriculum.

## Result

Published **A Framework For System Design Interviews** at
`https://localhost/courses/framework-for-system-design-interview/` in the existing
local-only HTTPS Classroom deployment. Requires authentication; the catalog has
three cards, but only Scale Lab and Estimate Lab have lessons.

The new course displays Thai awaiting-documents copy and a sticky return link.
No curriculum, quiz, assessment or learning-credit data was invented. Omitting
`lessons` already disables progress and excludes the course from whole-course
completion, levels and final-exam coverage. Registry, backend, templates, schema
and existing courses required no production code changes. Platform course-open
activity/presence still operate normally and do not mean completion.

## Actual verification

- Manifest enablement test observed RED (`false !== true`) then GREEN.
- Course unit tests: **2 passed**.
- Registry/build pipeline tests: **2 passed**, real isolated build/validate.
- Frontend browser tests: **2 passed**, standalone and integrated-path modes at
  1280/390/320px; these are not account-persistence tests.
- Backend suite in an isolated container: **418 passed, 2 skipped**. The two
  skips require a Docker CLI inside the test container. No live data mounted.
  Initial run had two upload-isolation failures because runtime image ENV pinned
  all fixtures to `/data/community-uploads`; rerun with APPWORKS_DATABASE,
  APPWORKS_PROFILE_UPLOAD_DIR and APPWORKS_COMMUNITY_UPLOAD_DIR unset passed.
- Actual image build/validate: all three enabled courses passed.
- `scripts/verify-https.py --allow-isolated-qa --image classroom:https-local`
  passed real disposable Caddy TLS certificate/hostname validation, redirect,
  Secure/HttpOnly/SameSite cookies, login/catalog/logout, CSRF and forwarded-header
  spoof rejection, with unpublished backend. Disposable volumes removed.
- `scripts/framework-browser-verify.mjs` passed actual-image authenticated
  catalog → course → return → reload → logout journeys at **1280/390/320px**.
  Synthetic account only; private tmpfs DB, no live mounts/env or email. Exact
  card title, Thai state, return with session, no progress controls, L1/zero
  completed courses/no exam eligibility, API opt-out and no page errors verified.
  Reviewed desktop catalog and narrow course/catalog screenshots.
- Runtime file hash comparison: every previous `/app` file unchanged; only four
  new files added (manifest, HTML, JS, CSS under the new course).

Backend command:

```sh
docker run --rm --network none \
  --mount type=bind,src=/Users/prommeesee/projects/classroom,dst=/repo,readonly \
  -w /repo/appworks --tmpfs /tmp:rw classroom:https-local \
  env -u APPWORKS_DATABASE -u APPWORKS_PROFILE_UPLOAD_DIR \
  -u APPWORKS_COMMUNITY_UPLOAD_DIR python -m pytest -q -p no:cacheprovider
```

## Deployment identity and preservation

- Compose project: `classroom-docker-qa` (real accounts, **not disposable QA**).
- Ordered configuration: `compose.yaml`, `compose.accounts.yaml`,
  `compose.https.yaml`, `compose.https-local.yaml` via
  `scripts/classroom-https-local.sh`.
- New container: `457c048bfaea4784af4d6d8aaa2bf6e98c3ee80df56b46b6849a54c1e0155198`.
- New image: `sha256:40c32ff42725b6dc37bf9aa6289f963dc791227562d098cdd97652d98b7cff5e`.
- Old image: `sha256:0efce9619f209b48b00ab2e2118c3dfea11433ff0477280e6c5837af42436271`.
- Rollback tag: `classroom:rollback-framework-20261103t033859z`.
- Data: `classroom-accounts-20261022:/data`; same named volume after recreation.
- Private backup: `backups/framework-https-20261103T033859Z/data.tar.gz` plus
  `fingerprints.json`; directory 0700, files 0600.
- Archive SHA-256: `51cd9a594bcdeccf59095bea8185f5c0f85f2c2e27dbdd96dde1ccfeaf9c2b4e`.

Built before stopping the single identified writer; tagged the old immutable
image; stopped writer; archived full volume via read-only/network-disabled
helper; verified archived SQLite integrity and upload hashes. Recreated only
`classroom` with the complete HTTPS override set. Caddy container/CA/ports and
runtime environment mapping unchanged; backend remains unpublished.

Before HTTP probes, integrity, schema, deterministic fingerprints of **25 tables**
and upload hashes matched exactly. Subsequent HTTPS login probe added **one
anonymous session**; all previous session rows and all non-session tables remained
unchanged. Health 200, login 200, guest course 303 to `/login`, progress API 401.
Container healthy, zero restarts at final read-back. TLS checked using existing
Caddy root CA explicitly, not `-k`; machine trust was not modified.

## Evidence and limits

- Sanitized deployment proof and before/pre-HTTP fingerprints:
  `evidence/framework-deploy-20261103T033859Z/`.
- Existing public CA exported to
  `evidence/framework-deploy-20261103T033859Z/localhost-root.crt` (no private key).
- Authenticated synthetic browser proof/screenshots:
  `evidence/framework-integration/browser.json`, `catalog-*.png`, `course-*.png`.
- Frontend-only screenshots: `evidence/framework-scaffold/`.
- `scripts/framework-deploy.py` is a **one-shot audited release script** pinned to
  these immutable image IDs. Do not reuse unchanged for a later release.

No real-account impersonation, registration mail or live authenticated browser
session was used. Account browser journey ran over isolated loopback HTTP; TLS
semantics were separately exercised by the real disposable Caddy HTTPS runner
and trusted-CA probes on the actual deployment. Browser/OS CA trust remains the
operator's choice. No commit/push, account reset, seed or data deletion occurred.
