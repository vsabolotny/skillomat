#!/usr/bin/env bash
# Post-deploy smoke tests for Skillomat (MOB-3).
#
# Verifies the public CloudFront URL serves the SPA and the API is reachable
# through the /api/* behavior. Run by the deploy workflows after a deploy, and
# locally against the prod compose stack.
#
# Config:
#   BASE_URL      base to test (default: $CLOUDFRONT_URL, else http://localhost:80)
#   SMOKE_CHECKS  comma-separated subset of: frontend,api_health (default: all)
set -uo pipefail

BASE_URL="${BASE_URL:-${CLOUDFRONT_URL:-http://localhost:80}}"
BASE_URL="${BASE_URL%/}"
CHECKS="${SMOKE_CHECKS:-frontend,api_health}"

fail=0
run() { case ",$CHECKS," in *",$1,"*) return 0 ;; *) return 1 ;; esac; }

echo "Smoke testing ${BASE_URL} (checks: ${CHECKS})"

if run frontend; then
  echo -n "  [frontend] GET / ... "
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --retry 5 --retry-delay 3 \
    --retry-connrefused "${BASE_URL}/" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then echo "OK ($code)"; else echo "FAIL ($code)"; fail=1; fi
fi

if run api_health; then
  echo -n "  [api_health] GET /api/health ... "
  body=$(curl -fsS --retry 10 --retry-delay 3 --retry-connrefused \
    "${BASE_URL}/api/health" 2>/dev/null || echo "")
  if echo "$body" | grep -q '"status":"ok"'; then
    echo "OK"
  else
    echo "FAIL (body: ${body:-<empty>})"; fail=1
  fi
fi

if [ "$fail" -ne 0 ]; then echo "Smoke tests FAILED"; exit 1; fi
echo "Smoke tests passed."
