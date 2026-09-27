#!/usr/bin/env bash
# Verify a domain's agent-readiness against the Ora standard (the same four
# layers this skill builds toward). Optional convenience wrapper around the
# public Ora API. No auth required. Sends only the domain to ora.ai.
#
# Usage:
#   ./verify-with-ora.sh yourdomain.com          # cached score, or fresh scan if none
#   ./verify-with-ora.sh yourdomain.com --fresh  # always run a fresh scan
#
# Requires: curl. jq is optional (used for pretty output if present).

set -euo pipefail

DOMAIN="${1:-}"
MODE="${2:-}"

if [ -z "$DOMAIN" ]; then
  echo "usage: $0 <domain> [--fresh]" >&2
  exit 2
fi

# A bare hostname only: it is interpolated into a URL path and a JSON body.
if ! printf '%s' "$DOMAIN" | grep -Eq '^[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$'; then
  echo "error: expected a bare domain like example.com, got: $DOMAIN" >&2
  exit 2
fi

API="https://ora.ai/api"

pretty() {
  if command -v jq >/dev/null 2>&1; then jq .; else cat; fi
}

fresh_scan() {
  curl -sS -X POST "$API/scan" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$DOMAIN\"}" | pretty
}

if [ "$MODE" = "--fresh" ]; then
  echo "Running a fresh Ora scan for $DOMAIN ..." >&2
  fresh_scan
  exit 0
fi

SCORE_FILE="$(mktemp)"
trap 'rm -f "$SCORE_FILE"' EXIT

echo "Looking up cached Ora score for $DOMAIN ..." >&2
status=$(curl -sS -o "$SCORE_FILE" -w "%{http_code}" "$API/score/$DOMAIN")

if [ "$status" = "200" ]; then
  pretty < "$SCORE_FILE"
else
  echo "No cached score (HTTP $status). Running a fresh scan ..." >&2
  fresh_scan
fi
