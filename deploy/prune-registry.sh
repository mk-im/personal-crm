#!/usr/bin/env bash
# After a successful prod release, keep the 10 newest tagged images in GHCR
# and the untagged manifests those tags still point at.
set -euo pipefail

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "GH_TOKEN is required" >&2
  exit 1
fi
if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
  echo "GITHUB_REPOSITORY is required" >&2
  exit 1
fi

exec python3 "$(dirname "$0")/prune-registry.py"
