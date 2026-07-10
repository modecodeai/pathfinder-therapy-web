#!/usr/bin/env node
/**
 * Promote a Cloudflare Pages deployment to production custom domains
 * and purge cached HTML/assets for pathfindertherapy.com hosts.
 */
import process from "node:process";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const PROJECT_NAME = process.env.CLOUDFLARE_PAGES_PROJECT || "pathfinder-therapy-web";
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || "";
const ZONE_NAME = process.env.CLOUDFLARE_ZONE_NAME || "pathfindertherapy.com";
const PRODUCTION_HOSTS = (process.env.PATHFINDER_PRODUCTION_HOSTS || "www.pathfindertherapy.com,pathfindertherapy.com")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required.");
  process.exit(1);
}

async function cf(pathname, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const payload = await response.json();
  if (!payload.success) {
    const message = payload.errors?.map((error) => error.message).join("; ") || response.statusText;
    throw new Error(message);
  }
  return payload;
}

function shortIdFromDeploymentUrl(url) {
  const match = String(url).match(/https:\/\/([a-f0-9]+)\./i);
  return match?.[1] || "";
}

async function resolveDeploymentId(shortId) {
  if (!shortId) {
    throw new Error(`Could not parse deployment short id from DEPLOYMENT_URL: ${DEPLOYMENT_URL}`);
  }

  const payload = await cf(
    `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments?per_page=25`
  );

  const match = (payload.result || []).find((item) => {
    const url = item.url || "";
    return item.id === shortId || item.short_id === shortId || url.includes(`${shortId}.`);
  });

  if (!match?.id) {
    throw new Error(`No deployment found matching short id ${shortId}`);
  }

  return {
    id: match.id,
    shortId,
    url: match.url || DEPLOYMENT_URL,
    environment: match.environment || "unknown"
  };
}

async function promoteDeployment(deploymentId) {
  try {
    const payload = await cf(
      `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${deploymentId}/rollback`,
      { method: "POST" }
    );
    return {
      promoted: true,
      url: payload.result?.url || payload.result?.id || deploymentId
    };
  } catch (error) {
    if (String(error.message).includes("currently in production")) {
      return { promoted: false, alreadyProduction: true, url: DEPLOYMENT_URL };
    }
    throw error;
  }
}

async function resolveZoneId() {
  const payload = await cf(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`);
  const zone = payload.result?.[0];
  if (!zone?.id) {
    throw new Error(`Active Cloudflare zone not found for ${ZONE_NAME}`);
  }
  return zone.id;
}

async function purgeProductionCache(zoneId) {
  const payload = await cf(`/zones/${zoneId}/purge_cache`, {
    method: "POST",
    body: JSON.stringify({ hosts: PRODUCTION_HOSTS })
  });
  return payload.result?.id || "purged";
}

async function main() {
  const shortId = shortIdFromDeploymentUrl(DEPLOYMENT_URL);
  const deployment = await resolveDeploymentId(shortId);
  console.log(`Resolved deployment ${deployment.shortId} -> ${deployment.id} (${deployment.url})`);

  const promotion = await promoteDeployment(deployment.id);
  if (promotion.alreadyProduction) {
    console.log(`Deployment ${deployment.id} already serving production domains.`);
  } else {
    console.log(`Promoted deployment ${deployment.id} to production domains (${promotion.url}).`);
  }

  try {
    const zoneId = await resolveZoneId();
    const purgeId = await purgeProductionCache(zoneId);
    console.log(`Purged Cloudflare cache for hosts: ${PRODUCTION_HOSTS.join(", ")} (purge id: ${purgeId})`);
  } catch (error) {
    console.warn(
      `Cache purge skipped or failed (${error.message}). Add Zone.Cache Purge + Zone.Read permissions to CLOUDFLARE_API_TOKEN or purge manually.`
    );
  }

  console.log(
    JSON.stringify({
      deploymentId: deployment.id,
      deploymentShortId: deployment.shortId,
      deploymentUrl: deployment.url,
      productionHosts: PRODUCTION_HOSTS
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
