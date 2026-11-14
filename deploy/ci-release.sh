#!/usr/bin/env bash
# Runs in GitHub Actions. Copies deploy/ to the server and releases one environment.
set -euo pipefail

if [[ -z "${APP_IMAGE:-}" || -z "${APP_ENV:-}" ]]; then
  echo "APP_IMAGE and APP_ENV are required" >&2
  exit 1
fi

# shellcheck source=ci-ssh.sh
source "$(dirname "$0")/ci-ssh.sh"
ci_ssh_setup

ci_ssh "mkdir -p /home/crm/personal-crm/deploy /home/crm/.docker"
tar -C deploy -cf - . | ci_ssh "flock /home/crm/personal-crm/deploy/.copy.lock tar -C /home/crm/personal-crm/deploy -xf -"
printf '%s\n' "$GHCR_TOKEN" | ci_ssh "export HOME=/home/crm DOCKER_CONFIG=/home/crm/.docker; docker login ghcr.io -u '$GHCR_USER' --password-stdin"
ci_ssh "chmod +x /home/crm/personal-crm/deploy/*.sh && /home/crm/personal-crm/deploy/install-backup-schedule.sh"
ci_ssh "export HOME=/home/crm DOCKER_CONFIG=/home/crm/.docker && APP_IMAGE='$APP_IMAGE' APP_ENV='$APP_ENV' /home/crm/personal-crm/deploy/release.sh"
ci_ssh "export HOME=/home/crm DOCKER_CONFIG=/home/crm/.docker; docker logout ghcr.io || true"
