#!/usr/bin/env bash
# Install the nightly prod backup into the current user's crontab.
# Safe to run again: only the marked line is replaced.
# backup-daily.sh takes the backup only at 03:00 Moscow time.
# Run it every hour. "0 3 * * *" would follow the server clock, and Debian
# cron ignores CRON_TZ, so a server outside Moscow would never take a backup.
set -euo pipefail

mkdir -p /home/crm/personal-crm/backups

marker="personal-crm-daily-backup"
line="0 * * * * PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /home/crm/personal-crm/deploy/backup-daily.sh >> /home/crm/personal-crm/backups/daily.log 2>&1 # ${marker}"

current="$(crontab -l 2>/dev/null || true)"
filtered="$(printf '%s\n' "$current" | grep -v "$marker" || true)"

{
  printf '%s\n' "$filtered" | sed '/^[[:space:]]*$/d'
  printf '%s\n' "$line"
} | crontab -

echo "Nightly prod backup is scheduled for 03:00 Moscow time (checked every hour)."
