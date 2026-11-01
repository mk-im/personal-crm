#!/usr/bin/env bash
set -euo pipefail

export HOME=/home/crm
export DOCKER_CONFIG=/home/crm/.docker
ROOT="/home/crm/personal-crm"
cd "$ROOT"

if [[ -z "${APP_IMAGE:-}" ]]; then
  APP_IMAGE="$(docker inspect -f '{{.Config.Image}}' "$(docker compose -p prod -f "$ROOT/deploy/compose.yml" ps -q app)")"
fi

export APP_IMAGE
docker compose -p prod -f "$ROOT/deploy/compose.yml" --env-file "$ROOT/.env" run --rm --no-deps \
  app \
  ./node_modules/.bin/tsx src/db/seed.ts
