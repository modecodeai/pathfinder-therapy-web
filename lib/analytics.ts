declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-ERMVWYL4J6";
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-10976126920";
const ADS_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;

export function trackLeadCtaClick(label: string, destination: string) {
  window.gtag?.("event", "lead_cta_click", {
    event_category: "lead_funnel",
    event_label: label,
    link_url: destination
  });
}

export function trackLandingView(page: string) {
  window.gtag?.("event", "ad_landing_view", {
    event_category: "lead_funnel",
    event_label: page,
    page_location: window.location.href
  });
}

export function trackFormStart(source: string) {
  window.gtag?.("event", "form_start", {
    event_category: "lead_funnel",
    event_label: source
  });
}

export function trackGenerateLead(source: string) {
  window.gtag?.("event", "generate_lead", {
    event_category: "contact",
    event_label: source,
    send_to: GA_ID
  });

  if (ADS_ID && ADS_CONVERSION_LABEL) {
    window.gtag?.("event", "conversion", {
      send_to: `${ADS_ID}/${ADS_CONVERSION_LABEL}`
    });
  }
}

const CONVERSION_KEY = "pathfinder_lead_converted";

export function fireConversionOnce(source: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (sessionStorage.getItem(CONVERSION_KEY)) {
    return;
  }

  trackGenerateLead(source);
  sessionStorage.setItem(CONVERSION_KEY, "1");
}
