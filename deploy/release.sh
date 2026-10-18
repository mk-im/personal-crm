#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/crm/personal-crm"
cd "$ROOT"

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "APP_IMAGE is not set" >&2
  exit 1
fi

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing $ROOT/.env" >&2
  exit 1
fi

export APP_IMAGE
COMPOSE=(docker compose -p prod -f "$ROOT/deploy/compose.yml" --env-file "$ROOT/.env")

echo "Pulling $APP_IMAGE"
"${COMPOSE[@]}" pull app

echo "Applying migrations"
if ! "${COMPOSE[@]}" run --rm migrate; then
  echo "Migrations failed. The running app was not replaced." >&2
  exit 1
fi

echo "Starting app"
"${COMPOSE[@]}" up -d postgres app

"$ROOT/deploy/smoke.sh"
"$ROOT/deploy/prune.sh"

echo "Release $APP_IMAGE finished"
