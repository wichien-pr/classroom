#!/bin/sh
# Existing account volume, localhost TLS, loopback-only public ports.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
export CLASSROOM_DOMAIN=localhost
export CLASSROOM_IMAGE="${CLASSROOM_IMAGE:-classroom:https-local}"
# Preserve private settings when present; otherwise mail remains disabled.
if [ -z "${CLASSROOM_ENV_FILE:-}" ]; then
    if [ -f docker/runtime.env ]; then
        CLASSROOM_ENV_FILE=./docker/runtime.env
    else
        CLASSROOM_ENV_FILE=./docker/runtime.env.example
    fi
fi
export CLASSROOM_ENV_FILE
exec sh scripts/classroom-compose.sh -f compose.https.yaml -f compose.https-local.yaml "$@"
