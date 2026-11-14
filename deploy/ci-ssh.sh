# Shared SSH setup for the GitHub Actions deploy scripts. Source this file.

ci_ssh_setup() {
  if [[ -z "${DEPLOY_HOST:-}" || -z "${DEPLOY_USER:-}" || -z "${DEPLOY_SSH_KEY:-}" ]]; then
    echo "Missing DEPLOY_HOST, DEPLOY_USER or DEPLOY_SSH_KEY" >&2
    return 1
  fi
  mkdir -p "$HOME/.ssh"
  install -m 600 /dev/null "$HOME/.ssh/deploy"
  printf '%s\n' "$DEPLOY_SSH_KEY" > "$HOME/.ssh/deploy"
  ssh-keyscan -H "$DEPLOY_HOST" >> "$HOME/.ssh/known_hosts"
}

ci_ssh() {
  ssh -i "$HOME/.ssh/deploy" -o IdentitiesOnly=yes "$DEPLOY_USER@$DEPLOY_HOST" "$@"
}
