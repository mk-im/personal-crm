#!/usr/bin/env bash
# Choose the image for Deploy prod.
# ROLLBACK=true reads the previous prod image from the server and ignores SHA.
# An empty REQUESTED_SHA uses the latest successful test-stand deploy.
# A filled SHA must be one of those successful test-stand deploys.
set -euo pipefail

# shellcheck source=ci-ssh.sh
source "$(dirname "$0")/ci-ssh.sh"

emit() {
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    printf '%s\n' "$1" >> "$GITHUB_OUTPUT"
  else
    printf '%s\n' "$1"
  fi
}

staging_job_succeeded() {
  local run_id="$1"
  local count
  count="$(gh run view "$run_id" --json jobs --jq '[.jobs[] | select(.name=="Deploy staging" and .conclusion=="success")] | length')"
  [[ "$count" != "0" ]]
}

if [[ "${ROLLBACK:-false}" == "true" ]]; then
  ci_ssh_setup
  if ! image="$(ci_ssh "tr -d '\r\n' < /home/crm/personal-crm/prod-previous-image")"; then
    echo "Could not read the remembered previous prod version." >&2
    exit 1
  fi
  if [[ -z "$image" ]]; then
    echo "The server does not remember a previous prod version yet." >&2
    exit 1
  fi
  if [[ "$image" != "ghcr.io/${GITHUB_REPOSITORY}:"* ]]; then
    echo "The remembered prod image is not usable." >&2
    exit 1
  fi
  emit "image=$image"
  emit "sha=${image##*:}"
  emit "mode=rollback"
  exit 0
fi

requested="${REQUESTED_SHA:-}"
if [[ -z "$requested" ]]; then
  found=""
  while read -r run_id head_sha; do
    [[ -n "$run_id" ]] || continue
    if staging_job_succeeded "$run_id"; then
      found="$head_sha"
      break
    fi
  done < <(gh run list --workflow deploy.yml --status success --limit 30 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"')
  if [[ -z "$found" ]]; then
    echo "No successful test-stand deploy was found." >&2
    exit 1
  fi
  full_sha="$found"
  mode="latest-staging"
else
  full_sha="$(gh api "repos/${GITHUB_REPOSITORY}/commits/${requested}" --jq .sha)"
  if [[ ! "$full_sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Could not resolve the requested SHA." >&2
    exit 1
  fi
  found=false
  while read -r run_id head_sha; do
    [[ -n "$run_id" ]] || continue
    if [[ "$head_sha" == "$full_sha" ]] && staging_job_succeeded "$run_id"; then
      found=true
      break
    fi
  done < <(gh run list --workflow deploy.yml --commit "$full_sha" --limit 20 --json databaseId,headSha,conclusion --jq '.[] | select(.conclusion=="success") | "\(.databaseId) \(.headSha)"')
  if [[ "$found" != true ]]; then
    echo "SHA $full_sha has no successful test-stand deploy." >&2
    exit 1
  fi
  mode="chosen-sha"
fi

emit "image=ghcr.io/${GITHUB_REPOSITORY}:${full_sha}"
emit "sha=$full_sha"
emit "mode=$mode"
