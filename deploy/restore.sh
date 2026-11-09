#!/usr/bin/env bash
# Replace the prod database with a backup file. Does not change the app image.
# Usage: deploy/restore.sh <backup-file>
set -euo pipefail

export HOME=/home/crm
export DOCKER_CONFIG=/home/crm/.docker
ROOT="/home/crm/personal-crm"
cd "$ROOT"

if [[ $# -ne 1 ]]; then
  echo "Usage: deploy/restore.sh <backup-file>" >&2
  exit 1
fi

file="$1"
if [[ ! -f "$file" ]]; then
  echo "Backup file not found: $file" >&2
  exit 1
fi
file="$(readlink -f -- "$file")"

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing $ROOT/.env" >&2
  exit 1
fi

if [[ -z "${APP_IMAGE:-}" ]]; then
  export APP_IMAGE="unused:none"
fi

# shellcheck source=lib.sh
source "$ROOT/deploy/lib.sh"
COMPOSE=(docker compose -p prod -f "$ROOT/deploy/compose.yml" --env-file "$ROOT/.env")

db="$(read_env POSTGRES_DB)"
user="$(read_env POSTGRES_USER)"
require_identifier "POSTGRES_DB" "$db"
require_identifier "POSTGRES_USER" "$user"

app_id="$(app_container_id)"
if [[ -z "$app_id" ]]; then
  echo "Prod app container was not found. Refusing to restore." >&2
  exit 1
fi

# Keep the image that is already running. stop/start must not pick up a new one.
APP_IMAGE="$(docker inspect -f '{{.Config.Image}}' "$app_id")"
export APP_IMAGE

echo "This will replace database ${db} with backup file ${file}"
echo "Type yes to continue:"
if ! read -r answer; then
  echo "Aborted" >&2
  exit 1
fi
answer="${answer%$'\r'}"
if [[ "$answer" != "yes" ]]; then
  echo "Aborted" >&2
  exit 1
fi

echo "Saving a copy of the current database"
"$ROOT/deploy/backup.sh"

echo "Stopping prod app"
"${COMPOSE[@]}" stop app

postgres_id=""
container_dump="/tmp/personal-crm-restore-$$.dump"
db_replaced=false
cleanup() {
  local status=$?
  if [[ -n "${postgres_id:-}" ]]; then
    "${COMPOSE[@]}" exec -T -u root postgres rm -f "$container_dump" >/dev/null 2>&1 || true
  fi
  if [[ "$status" -ne 0 && "$db_replaced" != true ]]; then
    echo "Starting prod app again. Database was not replaced." >&2
    "${COMPOSE[@]}" start app || true
  fi
  exit "$status"
}
trap cleanup EXIT

"${COMPOSE[@]}" up -d --no-deps postgres
wait_for_postgres "$user" "$db"
postgres_id="$("${COMPOSE[@]}" ps -q postgres)"
postgres_id="$(first_line "$postgres_id")"
if [[ -z "$postgres_id" ]]; then
  echo "Postgres container is not running" >&2
  exit 1
fi

docker cp "$file" "${postgres_id}:${container_dump}"
"${COMPOSE[@]}" exec -T -u root postgres chmod 644 "$container_dump"

if ! postgres_cmd pg_restore -l "$container_dump" >/dev/null; then
  echo "Backup file is not a valid archive." >&2
  exit 1
fi

# Names were checked above, so they can be quoted into SQL. psql does not
# substitute :variables inside -c.
echo "Replacing database ${db}"
postgres_cmd psql -U "$user" -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db}' AND pid <> pg_backend_pid();"
postgres_cmd psql -U "$user" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE \"${db}\";"
db_replaced=true
postgres_cmd psql -U "$user" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"${db}\" OWNER \"${user}\";"

if ! postgres_cmd pg_restore -U "$user" -d "$db" --no-owner --no-acl --exit-on-error --single-transaction "$container_dump"; then
  echo "Restore failed. Prod app is stopped. A copy of the previous database is in ${ROOT}/backups" >&2
  exit 1
fi

trap - EXIT
"${COMPOSE[@]}" exec -T -u root postgres rm -f "$container_dump" >/dev/null 2>&1 || true

echo "Starting prod app ${APP_IMAGE}"
if ! "${COMPOSE[@]}" start app; then
  echo "Database was restored, but the prod app did not start. App version was not changed." >&2
  exit 1
fi

echo "Restore finished. App version was not changed."
