#!/usr/bin/env bash
# Dump the prod database.
# BACKUP_KIND=deploy (default) runs before a prod release.
# BACKUP_KIND=daily is the nightly copy.
# Each kind keeps its 7 newest files. Files without these prefixes are not deleted.
set -euo pipefail

export HOME=/home/crm
export DOCKER_CONFIG=/home/crm/.docker
ROOT="/home/crm/personal-crm"
cd "$ROOT"

kind="${BACKUP_KIND:-deploy}"
case "$kind" in
  deploy|daily) ;;
  *)
    echo "BACKUP_KIND must be deploy or daily" >&2
    exit 1
    ;;
esac

exec 8>"$ROOT/deploy/.backup.lock"
if ! flock -w 7200 8; then
  echo "Another database backup is still running" >&2
  exit 1
fi

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing $ROOT/.env" >&2
  exit 1
fi

# Compose interpolates APP_IMAGE for every service. Backup must not start or
# replace the app, so a placeholder is enough when the caller did not set one.
if [[ -z "${APP_IMAGE:-}" ]]; then
  export APP_IMAGE="unused:none"
fi

# shellcheck source=lib.sh
source "$ROOT/deploy/lib.sh"
configure_runtime prod
COMPOSE=(docker compose -p prod -f "$ROOT/deploy/compose.yml" --env-file "$ENV_FILE")

db="$(read_env POSTGRES_DB)"
user="$(read_env POSTGRES_USER)"
require_identifier "POSTGRES_DB" "$db"
require_identifier "POSTGRES_USER" "$user"

version="$(running_version)"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
dir="$ROOT/backups"
umask 077
mkdir -p "$dir"
chmod 700 "$dir"
outfile="$dir/${kind}_${version}_${stamp}.dump"
if [[ -e "$outfile" ]]; then
  echo "Backup already exists: $outfile" >&2
  exit 1
fi

partial="$(mktemp "${dir}/.partial.XXXXXX")"
trap 'rm -f "$partial"' EXIT

echo "Backing up database ${db}, version ${version}"
"${COMPOSE[@]}" up -d --no-deps postgres
wait_for_postgres "$user" "$db"

if ! postgres_cmd pg_dump -U "$user" -d "$db" -Fc --no-owner --no-acl >"$partial"; then
  echo "Backup failed" >&2
  exit 1
fi

magic="$(head -c 5 "$partial" || true)"
if [[ "$magic" != "PGDMP" ]]; then
  echo "Backup is not a Postgres dump" >&2
  exit 1
fi

chmod 600 "$partial"
mv "$partial" "$outfile"
trap - EXIT

mapfile -t backups < <(find "$dir" -maxdepth 1 -type f -name "${kind}_*.dump" -printf '%T@ %p\n' | sort -nr | awk '{print $2}')
index=0
for file in "${backups[@]}"; do
  index=$((index + 1))
  if [[ "$index" -gt 7 ]]; then
    rm -f "$file"
    echo "Removed old backup: $file"
  fi
done

echo "Backup written: $outfile"
