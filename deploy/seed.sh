#!/usr/bin/env bash
set -euo pipefail

export HOME=/home/crm
export DOCKER_CONFIG=/home/crm/.docker
ROOT="/home/crm/personal-crm"
cd "$ROOT"

# shellcheck source=lib.sh
source "$ROOT/deploy/lib.sh"
configure_runtime prod

if [[ -z "${APP_IMAGE:-}" ]]; then
  APP_IMAGE="$(docker inspect -f '{{.Config.Image}}' prod-app-1)"
fi

export APP_IMAGE
docker compose -p prod -f "$ROOT/deploy/compose.yml" --env-file "$ENV_FILE" run --rm --no-deps \
  app \
  ./node_modules/.bin/tsx src/db/seed.ts
