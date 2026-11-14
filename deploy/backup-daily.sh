#!/usr/bin/env bash
# Nightly prod backup. The server clock is Moscow time; this still checks
# the Moscow hour so a changed server timezone does not take a backup at
# the wrong time.
set -euo pipefail

hour="$(TZ=Europe/Moscow date +%H)"
if [[ "$hour" != "03" ]]; then
  exit 0
fi

ROOT="/home/crm/personal-crm"
today="$(TZ=Europe/Moscow date +%Y-%m-%d)"
mkdir -p "$ROOT/backups"
stamp="$ROOT/backups/.daily-$today"
if [[ -e "$stamp" ]]; then
  exit 0
fi

export HOME=/home/crm
export DOCKER_CONFIG=/home/crm/.docker
export BACKUP_KIND=daily
if ! "$ROOT/deploy/backup.sh"; then
  exit 1
fi
touch "$stamp"
