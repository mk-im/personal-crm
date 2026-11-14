#!/usr/bin/env bash
set -euo pipefail

URL="${SMOKE_URL:-http://127.0.0.1:3000/health}"
body="$(mktemp)"
trap 'rm -f "$body"' EXIT

for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  code="$(curl -s -o "$body" -w "%{http_code}" "$URL" || true)"
  if [[ "$code" == "200" ]]; then
    echo "Smoke OK: $URL -> 200"
    cat "$body"
    echo
    exit 0
  fi
  echo "Smoke attempt $attempt: $URL -> ${code:-down}"
  sleep 5
done

echo "Smoke failed: $URL did not return 200" >&2
exit 1
