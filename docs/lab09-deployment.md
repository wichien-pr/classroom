# LAB09 deployment — authorized local rollout

This report supersedes the **not deployed** status in `lab09-verification.md`, which documents the earlier isolated implementation and QA.

## Result

Published Data centers as LAB09 at `http://127.0.0.1:8080/` after explicit user authorization. Reload existing course tabs. LAB10 remains unchanged. New `data-centers / dc-request` identity requires its own learning evidence; historical Observability rows and scores are retained, not reassigned.

Copied the 19 reviewed implementation/test/documentation files from the isolated `classroom-lab09` worktree into the original Classroom workspace without staging or committing. Both worktrees were based on `f979014fe8b3125b5a0c06e0fb34201298ee9886`; the destination source workspace was clean before copying.

## Backup and preservation

Backup: `/Users/prommeesee/Documents/04_Learning/classroom/backups/lab09-20261021T065726Z`.

Contains a SQLite backup-API snapshot, previous integrated dist, profile/community uploads and the replaced source files (including old manifest and private assessment). Verified snapshot integrity before publication. Sensitive contents and account rows were not printed.

After service startup and before guest health checks, schema and **all 24 tables** matched the snapshot exactly. Uploads, private environment file and top-level PDF/HTML references were unchanged. After health checks, only one new anonymous session existed, created by GET `/login`; all existing sessions remained identical, and every non-session table still matched. No production account signup/login, test account or provider email request was used.

## Publication and verification

- Port 8080 had no listener at preflight or immediately before publication, so no old service was terminated.
- Ran the original workspace's `scripts/courses.py build` and `validate` with its Python environment and compatible `/usr/local/bin` Node PATH: both passed, 40 Vite modules.
- Published dist file hashes exactly match the final real-account browser-tested isolated integrated build. Manifest, assessment and all copied source files were also read back and compared with the worktree.
- Started `service:create_app` through the existing virtualenv's Waitress on `127.0.0.1:8080`; observed PID **53388** and cwd `/Users/prommeesee/Documents/04_Learning/classroom/appworks`. Uses the existing private environment file and database. Startup was detached with log at `evidence/lab09-deploy/service.log`.
- Actual HTTP checks: `/login` **200**; guest course HTML and the published JS/CSS assets **303** to `/login`.
- Port 8081 retained Docker listener PID **1363**; no operation targeted it.
- `git diff --check` passed; no staged changes, commit or push.

Authenticated lesson behavior was verified previously with two isolated real OTP QA accounts, including same-database process restart, against these exact compiled assets. Production checks establish published-file identity, service readiness, authentication protection and data preservation; they are not a login test using a real member account.

Evidence: `evidence/lab09-deploy/deployment.json`, `post-health-preservation.json`, `service.log`; isolated implementation/browser evidence remains in `classroom-lab09` as documented in `lab09-verification.md`.

## Rollback boundary

Do not restore the whole database merely to roll back lesson content, especially after new learner writes. With the service stopped, restore the previous source files and dist together from this backup (remove only newly introduced files listed in the deployment manifest). Preserve database rows and immutable exam snapshots. Any rollback is a separate operator decision; none was performed.
