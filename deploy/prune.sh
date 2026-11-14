#!/usr/bin/env bash
# After a successful prod release, delete this repository's images that are
# older than 14 days. Always keep the two remembered prod images and the
# image the test stand is running. Do not touch other projects' images.
set -euo pipefail

ROOT="/home/crm/personal-crm"
repo="${APP_IMAGE%:*}"
if [[ -z "$repo" || "$repo" == "${APP_IMAGE:-}" ]]; then
  repo="ghcr.io/mk-im/personal-crm"
fi

keep=()
add_keep() {
  local image="$1"
  if [[ -n "$image" ]]; then
    keep+=("$image")
  fi
}

read_image_file() {
  local path="$1"
  if [[ -f "$path" ]]; then
    tr -d '\r\n' < "$path"
  fi
}

add_keep "$(read_image_file "$ROOT/prod-current-image")"
add_keep "$(read_image_file "$ROOT/prod-previous-image")"
add_keep "$(docker inspect -f '{{.Config.Image}}' prod-app-1 2>/dev/null || true)"
add_keep "$(docker inspect -f '{{.Config.Image}}' staging-app-1 2>/dev/null || true)"

cutoff="$(date -u -d '14 days ago' +%s)"
mapfile -t images < <(docker images --format '{{.Repository}}:{{.Tag}}' "$repo")

for image in "${images[@]}"; do
  if [[ "$image" == *"<none>"* ]]; then
    continue
  fi
  protected=false
  for saved in "${keep[@]}"; do
    if [[ "$image" == "$saved" ]]; then
      protected=true
      break
    fi
  done
  if [[ "$protected" == true ]]; then
    continue
  fi
  created="$(docker image inspect -f '{{.Created}}' "$image")"
  created_epoch="$(date -u -d "$created" +%s)"
  if [[ "$created_epoch" -lt "$cutoff" ]]; then
    docker rmi "$image" >/dev/null 2>&1 || true
    echo "Removed old image: $image"
  fi
done

echo "Protected images: ${keep[*]:-none}"
