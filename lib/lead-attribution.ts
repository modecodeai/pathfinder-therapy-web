export type LeadAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  captured_at?: string;
};

const STORAGE_KEY = "pathfinder_lead_attribution";

export const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid"
] as const;

type AttributionParam = (typeof ATTRIBUTION_PARAMS)[number];

function readAttributionFromParams(params: URLSearchParams): Partial<LeadAttribution> {
  const incoming: Partial<LeadAttribution> = {};

  for (const key of ATTRIBUTION_PARAMS) {
    const value = params.get(key)?.trim();
    if (value) {
      incoming[key] = value;
    }
  }

  return incoming;
}

export function getStoredLeadAttribution(): LeadAttribution | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeadAttribution) : null;
  } catch {
    return null;
  }
}

export function captureLeadAttribution(searchParams?: URLSearchParams): LeadAttribution | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = searchParams ?? new URLSearchParams(window.location.search);
  const incoming = readAttributionFromParams(params);
  const hasIncoming = Object.keys(incoming).length > 0;
  const existing = getStoredLeadAttribution();

  if (!hasIncoming) {
    return existing;
  }

  const merged: LeadAttribution = {
    ...existing,
    ...incoming,
    landing_page: existing?.landing_page ?? window.location.pathname,
    captured_at: new Date().toISOString()
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function appendAttributionToUrl(href: string): string {
  const attribution = getStoredLeadAttribution();
  if (!attribution) {
    return href;
  }

  try {
    const url = new URL(href, window.location.origin);

    for (const key of ATTRIBUTION_PARAMS) {
      const value = attribution[key as AttributionParam];
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

export function attributionPayload(): Record<string, string> {
  const attribution = getStoredLeadAttribution();
  if (!attribution) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(attribution).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}
