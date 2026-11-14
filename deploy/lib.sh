# Shared helpers for prod backup and restore. Sourced by the scripts, not run directly.

read_env() {
  local key="$1"
  local file="${ENV_FILE:-$ROOT/.env}"
  local line
  line="$(grep -E "^${key}=" "$file" | tail -n 1 || true)"
  printf '%s' "${line#*=}" | tr -d '\r'
}

# APP_ENV is prod or staging. The compose file reads the exported values.
configure_runtime() {
  local env_name="${1:-${APP_ENV:-prod}}"
  case "$env_name" in
    prod)
      ENV_ROOT="/home/crm/personal-crm"
      APP_PORT="3000"
      POSTGRES_VOLUME="prod_prod_postgres"
      APP_MEMORY="512m"
      POSTGRES_MEMORY="256m"
      ;;
    staging)
      ENV_ROOT="/home/crm/personal-crm-staging"
      APP_PORT="3001"
      POSTGRES_VOLUME="staging_postgres"
      APP_MEMORY="256m"
      POSTGRES_MEMORY="128m"
      ;;
    *)
      echo "APP_ENV must be prod or staging" >&2
      return 1
      ;;
  esac
  export APP_ENV="$env_name"
  export ENV_ROOT APP_PORT POSTGRES_VOLUME APP_MEMORY POSTGRES_MEMORY
  export ENV_FILE="${ENV_ROOT}/.env"
  export SMOKE_URL="http://127.0.0.1:${APP_PORT}/health"
}

require_identifier() {
  local label="$1"
  local value="$2"
  if [[ ! "$value" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    echo "$label is missing or is not a plain identifier" >&2
    exit 1
  fi
}

first_line() {
  local value="$1"
  printf '%s' "${value%%$'\n'*}"
}

app_container_id() {
  local id
  if ! id="$("${COMPOSE[@]}" ps -q app)"; then
    echo "Could not list the prod app container" >&2
    exit 1
  fi
  id="$(first_line "$id")"
  if [[ -z "$id" ]]; then
    if ! id="$("${COMPOSE[@]}" ps -aq app)"; then
      echo "Could not list the prod app container" >&2
      exit 1
    fi
    id="$(first_line "$id")"
  fi
  printf '%s' "$id"
}

# Image tag of the app container that is up now. This is the release that a
# deploy is about to replace. "none" when that container does not exist.
running_version() {
  local id image tag
  id="$(app_container_id)"
  if [[ -z "$id" ]]; then
    printf 'none'
    return
  fi
  image="$(docker inspect -f '{{.Config.Image}}' "$id")"
  tag="${image##*:}"
  tag="${tag//[^A-Za-z0-9._-]/_}"
  if [[ -z "$tag" || "$tag" == "$image" ]]; then
    printf 'none'
    return
  fi
  printf '%s' "$tag"
}

postgres_cmd() {
  "${COMPOSE[@]}" exec -T postgres \
    sh -c 'export PGPASSWORD="${POSTGRES_PASSWORD:-}"; exec "$@"' \
    sh "$@"
}

wait_for_postgres() {
  local user="$1"
  local db="$2"
  local attempt
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do
    if postgres_cmd pg_isready -U "$user" -d "$db" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "Postgres did not become ready" >&2
  exit 1
}
