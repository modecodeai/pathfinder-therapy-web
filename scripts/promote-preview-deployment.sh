#!/usr/bin/env bash
set -euo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN}"
PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT:-pathfinder-therapy-web}"
DEPLOYMENT_ID="${1:-9aa49f15}"

echo "Looking up deployment ${DEPLOYMENT_ID} in project ${PROJECT_NAME}..."
DEPLOYMENTS=$(curl -s \
  -H "Authorization: Bearer ${API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments?per_page=50")

MATCHING_ID=$(echo "${DEPLOYMENTS}" | node -e "
  const payload = JSON.parse(require('fs').readFileSync(0, 'utf8'));
  const target = process.argv[1];
  const match = (payload.result || []).find((item) =>
    item.id === target ||
    item.short_id === target ||
    (item.url || '').includes(target) ||
    (item.deployment_trigger?.metadata?.branch || '').includes(target)
  );
  if (!match) process.exit(1);
  process.stdout.write(match.id);
" "${DEPLOYMENT_ID}")

echo "Promoting deployment ${MATCHING_ID} to production..."
curl -s \
  -X POST \
  -H "Authorization: Bearer ${API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${MATCHING_ID}/rollback" \
  | node -e "const payload=JSON.parse(require('fs').readFileSync(0,'utf8')); if(!payload.success){console.error(JSON.stringify(payload,null,2)); process.exit(1)}; console.log('Production now serving deployment', payload.result?.id || payload.result?.short_id || 'updated');"
