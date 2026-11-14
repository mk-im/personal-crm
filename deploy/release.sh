#!/usr/bin/env bash
# Release one environment. APP_ENV=prod (default) saves a database backup first.
# APP_ENV=staging uses the same steps without a backup.
# Usage: APP_IMAGE=ghcr.io/mk-im/personal-crm:<sha> APP_ENV=prod|staging deploy/release.sh
set -euo pipefail

export HOME=/home/crm
export DOCKER_CONFIG=/home/crm/.docker
ROOT="/home/crm/personal-crm"
cd "$ROOT"

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "APP_IMAGE is required" >&2
  exit 1
fi

# shellcheck source=lib.sh
source "$ROOT/deploy/lib.sh"
configure_runtime "${APP_ENV:-prod}"

exec 9>"$ROOT/deploy/.deploy-${APP_ENV}.lock"
if ! flock -w 7200 9; then
  echo "Another $APP_ENV deploy is still running" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

COMPOSE=(docker compose -p "$APP_ENV" -f "$ROOT/deploy/compose.yml" --env-file "$ENV_FILE")

if [[ "$APP_ENV" == "prod" ]]; then
  "$ROOT/deploy/backup.sh"
fi

echo "Pulling $APP_IMAGE"
if ! docker pull "$APP_IMAGE"; then
  if docker image inspect "$APP_IMAGE" >/dev/null 2>&1; then
    echo "Registry pull failed. Using the copy already on the server."
  else
    echo "Could not pull $APP_IMAGE" >&2
    exit 1
  fi
fi

echo "Starting database for $APP_ENV"
"${COMPOSE[@]}" up -d --no-deps postgres
db="$(read_env POSTGRES_DB)"
user="$(read_env POSTGRES_USER)"
require_identifier "POSTGRES_DB" "$db"
require_identifier "POSTGRES_USER" "$user"
wait_for_postgres "$user" "$db"

echo "Applying migrations for $APP_ENV"
if ! "${COMPOSE[@]}" run --rm --no-deps migrate; then
  echo "Migrations failed. $APP_ENV app was not changed." >&2
  exit 1
fi

if [[ "$APP_ENV" == "prod" ]]; then
  previous_running="$(docker inspect -f '{{.Config.Image}}' prod-app-1 2>/dev/null || true)"
fi

echo "Starting $APP_ENV"
"${COMPOSE[@]}" up -d postgres app

# Remember the image we just replaced, even if the smoke check later fails.
# Rollback reads prod-previous-image and does not look at the test stand.
if [[ "$APP_ENV" == "prod" ]]; then
  if [[ -n "${previous_running:-}" && "$previous_running" != "$APP_IMAGE" ]]; then
    printf '%s\n' "$previous_running" > "$ROOT/prod-previous-image"
  fi
  printf '%s\n' "$APP_IMAGE" > "$ROOT/prod-current-image"
fi

if ! "$ROOT/deploy/smoke.sh"; then
  echo "Smoke check failed for $APP_ENV. No automatic rollback." >&2
  exit 1
fi

if [[ "$APP_ENV" == "prod" ]]; then
  "$ROOT/deploy/prune.sh" || echo "Image cleanup failed; release already succeeded." >&2
fi

echo "Release complete: $APP_IMAGE ($APP_ENV)"
