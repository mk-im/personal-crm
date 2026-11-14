#!/usr/bin/env bash
# Replace the staging database with a fresh copy of production.
# Production is only read. The running production app is not restarted.
# Usage: deploy/refresh-staging-db.sh
set -euo pipefail

export HOME=/home/crm
export DOCKER_CONFIG=/home/crm/.docker
ROOT="/home/crm/personal-crm"
cd "$ROOT"

# shellcheck source=lib.sh
source "$ROOT/deploy/lib.sh"

if [[ -z "${APP_IMAGE:-}" ]]; then
  export APP_IMAGE="unused:none"
fi

if ! docker inspect prod-postgres-1 >/dev/null 2>&1; then
  echo "Production database container is not running" >&2
  exit 1
fi
prod_db="$(docker exec prod-postgres-1 printenv POSTGRES_DB)"
prod_user="$(docker exec prod-postgres-1 printenv POSTGRES_USER)"
require_identifier "POSTGRES_DB" "$prod_db"
require_identifier "POSTGRES_USER" "$prod_user"

configure_runtime staging
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi
staging_db="$(read_env POSTGRES_DB)"
staging_user="$(read_env POSTGRES_USER)"
require_identifier "POSTGRES_DB" "$staging_db"
require_identifier "POSTGRES_USER" "$staging_user"

echo "This will replace staging database ${staging_db} with a copy of production database ${prod_db}."
echo "Production data is not changed. Type yes to continue:"
if ! read -r answer; then
  echo "Aborted" >&2
  exit 1
fi
answer="${answer%$'\r'}"
if [[ "$answer" != "yes" ]]; then
  echo "Aborted" >&2
  exit 1
fi

dump_dir="/home/crm/personal-crm-staging/tmp"
umask 077
mkdir -p "$dump_dir"
chmod 700 "$dump_dir"
dump="$(mktemp "${dump_dir}/.prod-copy.XXXXXX")"
trap 'rm -f "$dump"' EXIT

echo "Reading production database"
if ! docker exec prod-postgres-1 sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-acl' >"$dump"; then
  echo "Could not read the production database" >&2
  exit 1
fi
magic="$(head -c 5 "$dump" || true)"
if [[ "$magic" != "PGDMP" ]]; then
  echo "Production copy is not a Postgres dump" >&2
  exit 1
fi
chmod 600 "$dump"

configure_runtime staging
export APP_IMAGE="${APP_IMAGE:-unused:none}"
COMPOSE=(docker compose -p staging -f "$ROOT/deploy/compose.yml" --env-file "$ENV_FILE")
"${COMPOSE[@]}" up -d --no-deps postgres
wait_for_postgres "$staging_user" "$staging_db"

postgres_id="$(first_line "$("${COMPOSE[@]}" ps -q postgres)")"
if [[ -z "$postgres_id" ]]; then
  echo "Staging Postgres container is not running" >&2
  exit 1
fi

container_dump="/tmp/personal-crm-staging-copy.dump"
docker cp "$dump" "${postgres_id}:${container_dump}"
"${COMPOSE[@]}" exec -T -u root postgres chmod 644 "$container_dump"

echo "Replacing staging database ${staging_db}"
postgres_cmd psql -U "$staging_user" -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${staging_db}' AND pid <> pg_backend_pid();"
postgres_cmd psql -U "$staging_user" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"${staging_db}\";"
postgres_cmd psql -U "$staging_user" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"${staging_db}\" OWNER \"${staging_user}\";"

if ! postgres_cmd pg_restore -U "$staging_user" -d "$staging_db" --no-owner --no-acl --exit-on-error --single-transaction "$container_dump"; then
  echo "Copy into staging failed. Staging app was not started." >&2
  "${COMPOSE[@]}" exec -T -u root postgres rm -f "$container_dump" >/dev/null 2>&1 || true
  exit 1
fi

"${COMPOSE[@]}" exec -T -u root postgres rm -f "$container_dump" >/dev/null 2>&1 || true
rm -f "$dump"
trap - EXIT

if [[ -n "$(docker inspect -f '{{.State.Status}}' staging-app-1 2>/dev/null || true)" ]]; then
  echo "Starting staging app again"
  "${COMPOSE[@]}" start app
fi

echo "Staging database now matches production. Production was not changed."
