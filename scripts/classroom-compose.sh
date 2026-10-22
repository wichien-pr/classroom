#!/bin/sh
# Always select the existing 8082 project and reviewed account volume override.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
export CLASSROOM_DATA_VOLUME=classroom-accounts-20261022
exec docker compose -p classroom-docker-qa -f compose.yaml -f compose.accounts.yaml "$@"
