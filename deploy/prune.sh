#!/usr/bin/env bash
set -euo pipefail

# Keep the image that is running and one previous tag of this repository.
repo="${APP_IMAGE%:*}"
keep=()

running="$(docker inspect -f '{{.Config.Image}}' "$(docker compose -p prod -f /home/crm/personal-crm/deploy/compose.yml ps -q app)" 2>/dev/null || true)"
if [[ -n "$running" ]]; then
  keep+=("$running")
fi

if [[ -n "${APP_IMAGE:-}" ]]; then
  keep+=("$APP_IMAGE")
fi

mapfile -t local_images < <(docker images --format '{{.Repository}}:{{.Tag}}' "$repo" | head -n 20)

previous=""
for image in "${local_images[@]}"; do
  skip=false
  for k in "${keep[@]}"; do
    if [[ "$image" == "$k" ]]; then
      skip=true
      break
    fi
  done
  if [[ "$skip" == false ]]; then
    previous="$image"
    break
  fi
done

if [[ -n "$previous" ]]; then
  keep+=("$previous")
fi

for image in "${local_images[@]}"; do
  drop=true
  for k in "${keep[@]}"; do
    if [[ "$image" == "$k" ]]; then
      drop=false
      break
    fi
  done
  if [[ "$drop" == true ]]; then
    docker rmi "$image" >/dev/null 2>&1 || true
  fi
done

docker image prune -f >/dev/null
echo "Kept images: ${keep[*]:-none}"
