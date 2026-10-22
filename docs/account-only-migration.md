# Active local account-only Docker deployment

## Operate this deployment

URL: **http://localhost:8082**. Keep project `classroom-docker-qa` despite its historical QA name; do not launch a competing project on 8082.

```sh
# From repository root. This wrapper always supplies project + BOTH Compose files.
sh scripts/classroom-compose.sh config --quiet
sh scripts/classroom-compose.sh ps
sh scripts/classroom-compose.sh up -d --no-build --no-deps --wait --wait-timeout 180 classroom
# Authorized future code updates: build first, then recreate the same service.
sh scripts/classroom-compose.sh build classroom
sh scripts/classroom-compose.sh up -d --no-build --no-deps --force-recreate --wait --wait-timeout 180 classroom
```

The wrapper uses `compose.yaml` then `compose.accounts.yaml`, with external volume **`classroom-accounts-20261022`** at `/data`. Root Compose requires explicit `CLASSROOM_DATA_VOLUME`; a bare old command now fails rather than silently returning to the QA volume. The override pins the selected volume even if a shell has a different variable. Do not remove this guard or use `down -v`/volume removal as an update technique. Missing external volume is an error, not permission to create a replacement empty database.

Runtime configuration remains private `docker/runtime.env`, byte-equivalent effective environment to the pre-migration container. Mail is enabled as previously provisioned; no email was sent by this migration. Keep its origin `http://localhost:8082` and loopback binding unless separately authorizing TLS/remote deployment.

## What was migrated

Exactly **one existing account**, copying raw stored values for:

- `id`, `name`, `email`, `password_hash` (no rehash/reset)
- `username`, `bio`
- `joined_at`, `last_active_at`, `email_verified_at`, preserving NULLs and original values

`last_active_at` is retained solely as existing account profile timestamp metadata, not a reconstructed activity stream. No new signup/verification timestamps were invented. `photo_ref` is explicitly NULL: no photo/upload migration was requested, so retaining the old reference would create a broken image. Original host photos remain untouched.

The actual users schema has **no stored identity-level field**. Levels derive from progress and achievements, which are excluded: the imported account starts at **L1**, not its historical learning level.

Excluded entirely: sessions, presence, login attempts/rate limits, lesson progress/manual completion, participation events/awards/receipts, activity events and old tracking inception, exam attempts, level achievements, community posts/comments/likes/attachments/polls/votes/rate events, pending registrations/OTP state, password reset capabilities/limits, registration limits, sequence history and every upload. No account was seeded or invented.

“Master/default data” is the unchanged image's real `scale-lab` manifest, compiled course assets, private assessment bank, application schema/indexes/triggers and startup defaults. Course discovery and private-bank validation succeeded. The single `activity_tracking` row is the **new schema's real inception default**, not copied history or a learning event. Every non-account table is empty except that default row.

## Implementation and safeguards

- `scripts/migrate_accounts.py`: reviewed users-column allowlist, immutable read-only source, source sidecar refusal, source integrity, exclusive new destination creation, current-image schema bootstrap, empty/default-only target check, transaction, exact in-memory account comparison, photo clearing, non-account unchanged checks, SQLite integrity/foreign-key checks and source fingerprint/mtime comparison. Unknown account columns fail closed for review. It never resets existing targets. On failure the target is retained; inspect privately, never auto-delete/retry over it.
- `scripts/test_account_migration.py`: isolated fixture RED→GREEN account-copy test plus guard/rollback regression coverage; no live account fixture.
- `scripts/account-migration-run.py`: one-shot operator orchestration, refuses existing target volume, checks 8080 is stopped, creates private SQLite Backup API snapshot, provisions a **fresh** volume with `volume-nocopy`, runs current image offline (`--network none`, mail disabled, no runtime env file), and restores UID/GID 10001. This is specific to this authorized deployment; do not rerun it or change its target casually.
- `scripts/verify-account-migration.py`: sanitized readback of live target, private exact field comparison with host, source hash/size/mtime verification, unchanged QA DB fingerprint, unchanged runtime environment fingerprint, image/health/mount checks, all table counts, L1, catalog/private bank, no upload files and UID/GID. It intentionally expects initial empty history; after real use, nonzero sessions/activity are legitimate and this initial-state verifier will fail.

## Preserved originals and verification

- Host `appworks/instance/classroom.sqlite3`: read-only throughout; SHA-256, size and modification timestamp unchanged. Host 8080 remains stopped. Port 8081 and other stacks were not modified.
- Private full source backup: `backups/account-only-20261022/source.sqlite3` (SQLite Backup API, integrity `ok`, mode 0600; directory 0700). It contains original history for recovery **only**; only allowlisted account fields entered the new volume. Private source/runtime fingerprints are beside it. These files are gitignored and must not be published.
- Previous QA volume **`classroom-docker-qa_classroom-data`** remains intact and detached; its database fingerprint is unchanged. No old QA account was merged.
- Same image: `sha256:4a2415639a7ed87742054c1828209a238bd0061876e854e8a670ed71d747612d`; no rebuild, commit or push for this migration.
- Container `classroom-docker-qa-classroom-1` recreated using only its service, same project and real runtime mail environment. Healthy at 8082; `/healthz` returns 200, guest course 303, protected progress API 401. Health probes do not allocate anonymous sessions.
- Live SQLite integrity `ok`, zero foreign-key violations, exact account fields match, zero photo refs/uploads, DB and application UID/GID 10001. All history/auth-state tables empty at verification.
- Sanitized evidence: `evidence/docker/account-only.json`, `evidence/docker/account-only-verification.json`.

No real-user login, password reset, OTP/signup, mailbox delivery or authenticated UI test was performed; do not claim those from health checks. Existing stored password hashes are unchanged, but login remains for the account owner to verify. **Never run `scripts/docker-verify.py` against the migrated deployment**: its fixtures belong only to the former isolated QA environment. Earlier Docker verification documentation describes the pre-migration state and is not the current volume selection.
