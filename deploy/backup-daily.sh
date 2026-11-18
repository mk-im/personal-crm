#!/usr/bin/env bash
# Nightly prod backup. Cron starts this every hour. The backup runs only when
# it is 03:00 in Moscow, so the server timezone does not matter. A stamp file
# stops a second backup on the same Moscow day.
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
