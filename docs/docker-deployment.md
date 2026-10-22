# Docker deployment

> **Active deployment supersedes historical verification below:** the existing 8082 project now serves one migrated host account from external volume `classroom-accounts-20261022`. Use `sh scripts/classroom-compose.sh ...` to select both Compose files. See [account-only migration and operations](account-only-migration.md). Do not run the old QA fixture verifier; host 8080 is stopped.

> Generic examples below now require a separately pre-created external volume and `CLASSROOM_DATA_VOLUME=<that-volume>`. Never select the active account volume for another project. Root Compose deliberately refuses unspecified storage. The historical `classroom` project examples are not commands for the active `classroom-docker-qa` deployment.

## Quick start (from repository root)

Requires Docker Engine/Desktop with Compose **2.30+** (`env_file.format: raw`). The image is built from this checkout, including uncommitted source changes; it does not download a Classroom release. No host Node/Python install or host course build is needed.

```sh
cp -n docker/runtime.env.example docker/runtime.env
chmod 600 docker/runtime.env
# Edit docker/runtime.env privately for your mail provider and public origin.
docker compose -p classroom -f compose.yaml config --quiet
docker compose -p classroom -f compose.yaml build
docker compose -p classroom -f compose.yaml up -d --no-build --wait --wait-timeout 180
curl --fail http://127.0.0.1:8082/healthz
```

Open <http://localhost:8082>. The default binds only loopback and does not replace the existing host application on 8080. Choose an unused `CLASSROOM_PORT` if 8082 is occupied (the active account deployment owns 8082; disposable QA uses 8083). Storage is selected by the explicit external `CLASSROOM_DATA_VOLUME`, **not the Compose project name**. Changing projects does not create a separate database when the volume name stays the same. Never attach another application instance to the active account volume.

The example deliberately has **mail disabled**; new registrations still require email OTP and fail closed until mail is provisioned. This is not a signup bypass. Configure `APPWORKS_RESET_ENABLED=1` and the existing SMTP/Graph settings in [password-reset-contract.md](password-reset-contract.md) and [registration-contract.md](registration-contract.md). Never reuse live credentials for tests. Graph placeholders are commented in the example. No credentials are included in the image or tracked config.

`CLASSROOM_ENV_FILE=/absolute/private/runtime.env` selects another runtime env file; raw format preserves literal `$` in secrets. Do not print `docker compose config` or full container inspection with real secrets: use `config --quiet` and selected fields. Docker administrators can read container environment variables. Keep env files private and encrypted in backup independently from data.

## Image and storage contract

- Multi-stage Node 22 build discovers **all enabled valid course manifests**, runs `npm ci`, then the existing `scripts/courses.py build` and `validate`. Integrated base paths and account progress configuration come from that script, not a separate course list.
- Python 3.13 slim runtime installs the current pinned `appworks/requirements.txt` (including its pytest dependency). Only backend modules/templates/platform assets and the built courses enter the runtime. Private `assessment.json` stays beside, never inside, public `dist`.
- `.dockerignore` allowlists build inputs then excludes `.env`, Git, dependencies, virtualenvs, host dist, databases, uploads, backups, evidence, browser caches and source PDFs. Do not put secrets in source or public course assets. Trusted course build scripts execute during build.
- Waitress invokes `service:create_app`, listens on **0.0.0.0:8080** inside the container and runs as **UID/GID 10001**. Host `.env` is never copied/mounted. Process environment supplies mail configuration.
- Compose uses a read-only root filesystem, drops all capabilities, enables no-new-privileges and supplies writable temporary `/tmp`. A named volume at `/data` contains `classroom.sqlite3`, `profile-photos/` and `community-uploads/`. Fresh Docker volumes inherit the image directory ownership. Existing bind mounts need explicit operator provisioning for UID/GID 10001; do not chmod world-writable.
- `/healthz` checks application/SQLite schema readability, returns only `{"status":"ok"}`, and never creates a session/cookie. It is not a mail-delivery check, full SQLite integrity check, or disk-capacity/write-readiness guarantee. Container health polls it every 30 seconds.
- **One application instance only.** SQLite and private uploads are local single-instance storage, not a supported horizontally scaled/shared-NFS database. Do not use Compose `--scale`. Back up the entire data volume together.

For remote deployment, terminate TLS at a trusted reverse proxy, set `APPWORKS_COOKIE_SECURE=1`, `APPWORKS_RESET_ALLOW_LOCAL=0`, and the canonical HTTPS `APPWORKS_RESET_BASE_URL`. Preserve the public Host and Origin for CSRF validation. Do not blindly trust forwarded headers or publish the database/uploads as static files. `CLASSROOM_BIND_IP` defaults to `127.0.0.1`; changing to `0.0.0.0` exposes the host port and requires firewall/TLS planning.

## Prebuilt image, registry and platform

`CLASSROOM_IMAGE` overrides the default `classroom:local`. Example commands (replace the registry/name/tag; **not published during this work**):

```sh
export CLASSROOM_IMAGE=registry.example.com/team/classroom:release-tag
docker compose -p classroom -f compose.yaml build
# Only after registry authorization and login:
docker push "$CLASSROOM_IMAGE"
# On the destination, with compose.yaml + private runtime env already provisioned:
docker compose -p classroom -f compose.yaml pull classroom
docker compose -p classroom -f compose.yaml up -d --no-build --wait --wait-timeout 180
```

Build/push for the destination architecture. This verification built **linux/arm64** only, not an amd64 or multi-platform test. Tags for the base images follow supported minor/LTS lines; npm dependencies use the committed lockfile and direct Python requirements are pinned. This is not a byte-reproducible or vulnerability-scanned release. For immutable deployment pin the published image digest (`CLASSROOM_IMAGE=registry/...@sha256:...`) and retain the previous image identity. Image tags alone are mutable.

Offline transfer is also possible with `docker save -o classroom-image.tar classroom:local`, secure transfer, and `docker load -i classroom-image.tar`, then `up --no-build`. Runtime env/data are separate and never contained in that image archive.

## Update and migration

1. Record running image ID and selected mounts; never dump environment secrets.
2. Take a coordinated backup below before migration. Startup performs the existing additive SQLite schema migrations; it does not import accounts or reset progress. Older code is not guaranteed compatible with a newly migrated schema.
3. Build/pull the replacement **before** replacing the running service.
4. Recreate with the same project/volume: `docker compose -p classroom -f compose.yaml up -d --no-build --force-recreate --wait --wait-timeout 180`.
5. Verify health, guest protection, authenticated course/progress/photos, and image identity. Reload existing browser tabs after coordinated backend/manifest/client upgrades.

To move a local non-container installation, first stop only its positively identified process with operator authorization, then copy a consistent SQLite backup plus both private upload directories into a **fresh** Docker volume. Never mount/copy a live production database casually, never run both instances against it, and never overwrite an existing deployment volume. Import was **not** performed here; existing host data remains separate.

## Coordinated backup and restore

Example assumes an independently provisioned project `classroom` and image `classroom:local`, not the active account deployment. Discover the exact `/data` volume from that project’s container; do not infer it from the project name. Review the selected metadata before stopping any writer:

```sh
CONTAINER=$(docker compose -p classroom -f compose.yaml ps -q classroom)
test -n "$CONTAINER" || exit 1
docker inspect --format '{{json .Mounts}}' "$CONTAINER"
DATA_VOLUME=$(docker inspect --format '{{range .Mounts}}{{if and (eq .Destination "/data") (eq .Type "volume")}}{{.Name}}{{end}}{{end}}' "$CONTAINER")
test -n "$DATA_VOLUME" || exit 1
# Confirm this is the intended deployment volume before proceeding.
export CLASSROOM_DATA_VOLUME="$DATA_VOLUME"
```

Stop the writer to keep SQLite and uploads consistent. These commands leave the source volume intact. Choose a **new** backup filename, not an existing backup. Treat archives as private user data; store encrypted off-host copies.

```sh
mkdir -p backups/docker
chmod 700 backups/docker
docker compose -p classroom -f compose.yaml stop classroom
# Set a unique filename before executing:
BACKUP=backups/docker/data-UNIQUE-RELEASE.tar.gz
(umask 077; set -C; docker run --rm --network none --read-only \
  --mount "source=$DATA_VOLUME,target=/data,readonly" \
  classroom:local python -c "import tarfile,sys; t=tarfile.open(fileobj=sys.stdout.buffer,mode='w|gz'); t.add('/data',arcname='data'); t.close()" > "$BACKUP")
# Confirm backup command succeeded before treating the archive as usable.
docker compose -p classroom -f compose.yaml up -d --no-build --wait --wait-timeout 180
```

Restore **only a trusted backup to a new empty volume**. `volume-nocopy` is important: without it Docker copies the image's empty upload directories into the new volume, so the empty-target guard correctly refuses restoration. Temporary root runs only for archive extraction/ownership; the server remains non-root.

```sh
docker volume create classroom-restore-NEW
docker run --rm -i --user 0:0 --network none --read-only \
  --mount source=classroom-restore-NEW,target=/data,volume-nocopy \
  classroom:local python -c "import tarfile,sys,os; from pathlib import Path; p=Path('/data'); assert not list(p.iterdir()), 'Restore requires empty target'; t=tarfile.open(fileobj=sys.stdin.buffer,mode='r|gz'); t.extractall('/',filter='data'); [os.chown(q,10001,10001) for q in [p,*p.rglob('*')]]" < "$BACKUP"
docker run --rm --network none --read-only \
  --mount source=classroom-restore-NEW,target=/data \
  classroom:local python -c "import sqlite3; d=sqlite3.connect('/data/classroom.sqlite3'); assert d.execute('PRAGMA integrity_check').fetchone()[0]=='ok'; print('integrity ok')"
```

Use a reviewed Compose override mapping `volumes.classroom-data` to `{external: true, name: classroom-restore-NEW}` and an unused port/project for restore validation. Keep the original volume/image until authenticated verification succeeds. Never restore over the source volume, delete account rows, or use `docker compose down -v` as an update/rollback technique. `stop` and ordinary `down` preserve named data volumes.

## Verification performed on this branch

No commit/push, registry publication, production import, host dist build, or existing service restart was performed. The host Python listener **PID 11073 on 8080** and unrelated **8081** container remained present after verification.

Historical commands (record only; **do not rerun** against the now-active account project):

```sh
# Safe example env, no real mail credentials:
docker compose -p classroom-docker-qa -f compose.yaml config --quiet
docker compose --progress plain -p classroom-docker-qa -f compose.yaml build
docker compose -p classroom-docker-qa -f compose.yaml up -d --no-build --wait --wait-timeout 180
(cd appworks && .venv/bin/python -m pytest -q)
node --test scripts/presence-timer-test.mjs
appworks/.venv/bin/python scripts/docker-verify.py
```

The integration runner is now **one-shot**, hard-scoped to project `classroom-container-smoke`, external disposable volume `classroom-container-smoke-data`, and `127.0.0.1:8083`. It requires `--allow-destructive-qa`. Before any HTTP or exec, selected-field Docker inspection must confirm the exact `/data` volume, Compose project/service labels and port mapping; mismatches (including any account volume) fail closed. Recreation pins that same volume, loopback port and `docker/runtime.env.example` regardless of ambient deployment settings. It also refuses a nonempty users table. Provision the disposable project separately using those exact values and the example mail-disabled env file; this runner does not create or empty volumes. Never repoint it at production or delete data just to rerun. Its randomly generated legacy-account fixture lives only in the fresh QA volume; password/cookies never appear in reports. It tests real HTTP login, not a registration bypass, and installs no production auth switch.

Results:

- Health TDD: observed **404 → 200**, no session/cookie growth; evidence `health-red.txt` and full green regression suite.
- **414 backend tests passed**, **7 Node presence tests passed**.
- Actual multi-stage Docker build succeeded. Image: `sha256:4a2415639a7ed87742054c1828209a238bd0061876e854e8a670ed71d747612d` (`linux/arm64`).
- **36 container HTTP/integration/persistence checks passed**: guest protection, real login/logout, compiled JS/CSS and deep route, private bank/source rejection, presence injection/heartbeat, CSRF rejection, manual + simulation + thinking qualification, actual profile-photo upload/read, and retained session/progress/photo across forced container recreation. The community-directory check is a marker file, not a composer upload test.
- Ten health probes added **zero sessions**. Runtime audit confirmed UID 10001, read-only code/bank, private assessment present, no forbidden secret/database/reference paths under `/app`. SQLite integrity returned `ok`.
- Stopped-volume backup was restored into a separate new volume and verified non-root: integrity, one QA user, manual marker, profile photo and community marker. First restore attempt safely refused Docker's prepopulated empty directories; the corrected verified command uses `volume-nocopy`.
- Historical final container (superseded by the active account deployment above): `classroom-docker-qa-classroom-1`, project `classroom-docker-qa`, main volume `classroom-docker-qa_classroom-data`, URL **http://127.0.0.1:8082**, healthy. Restored copy: `classroom-docker-qa-restore-verified`. Private QA backup: `backups/docker-qa/data.tar.gz` (not committed).

Sanitized local evidence is in `evidence/docker/`: `build.txt`, `health-red.txt`, `backend-tests.txt`, `presence-node.txt`, `integration.json`, `image-audit.json`, `container.txt`, `restore.json`. Evidence and private backup are gitignored. No browser rendering suite, real email delivery, registry pull from another machine, amd64 build, load test or vulnerability scan is claimed. The runtime image has no QA credentials or seeded database; only the isolated verification volume contains a QA account.
