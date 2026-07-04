const trim = (value) => (value || "").trim();

export const GA_ID = trim(process.env.PATHFINDER_GA_ID || process.env.NEXT_PUBLIC_GA_ID) || "G-ERMVWYL4J6";
export const ADS_ID =
  trim(process.env.PATHFINDER_GOOGLE_ADS_ID || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) || "AW-10976126920";
export const ADS_LEAD_LABEL =
  trim(process.env.PATHFINDER_GOOGLE_ADS_LEAD_LABEL || process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL);
export const ADS_BOOKING_LABEL = trim(process.env.PATHFINDER_GOOGLE_ADS_BOOKING_LABEL);
export const ADS_PHONE_LABEL =
  trim(process.env.PATHFINDER_GOOGLE_ADS_PHONE_LABEL) || "phone";

export const ADS_LEAD_SEND_TO = ADS_LEAD_LABEL ? `${ADS_ID}/${ADS_LEAD_LABEL}` : "";
export const ADS_BOOKING_SEND_TO = ADS_BOOKING_LABEL ? `${ADS_ID}/${ADS_BOOKING_LABEL}` : "";
export const ADS_PHONE_SEND_TO = `${ADS_ID}/${ADS_PHONE_LABEL}`;

export function buildGtagHeadSnippet() {
  return `<script id="pathfinder-consent-defaults">
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("consent", "default", {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  wait_for_update: 500
});
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${ADS_ID}&amp;id=${GA_ID}"></script>
<script id="pathfinder-google-tag-config">
gtag("js", new Date());
gtag("config", ${JSON.stringify(ADS_ID)});
gtag("config", ${JSON.stringify(GA_ID)}, { anonymize_ip: true });
</script>`;
}

export function injectGtag(html) {
  if (html.includes('id="pathfinder-google-tag-config"') || html.includes('id="pathfinder-consent-defaults"')) {
    return html;
  }

  let next = html.replace(
    /<link rel="preload" href="https:\/\/www\.googletagmanager\.com\/gtag\/js[^>]*>/gi,
    ""
  );
  return next.replace("</head>", `${buildGtagHeadSnippet()}\n</head>`);
}

export const GOOGLE_ADS_HELPER_SCRIPT = `<script id="pathfinder-google-ads">
(function () {
  var LEAD = ${JSON.stringify(ADS_LEAD_SEND_TO)};
  var BOOKING = ${JSON.stringify(ADS_BOOKING_SEND_TO)};
  var PHONE = ${JSON.stringify(ADS_PHONE_SEND_TO)};
  var LEAD_KEY = "pathfinder_ads_lead_converted";
  var BOOKING_KEY = "pathfinder_ads_booking_converted";

  function gtagReady() {
    return typeof window.gtag === "function";
  }

  function fireAds(sendTo) {
    if (!sendTo || !gtagReady()) return false;
    window.gtag("event", "conversion", { send_to: sendTo });
    return true;
  }

  function fireGa4Lead(label, category) {
    if (!gtagReady()) return;
    window.gtag("event", "generate_lead", {
      event_category: category || "contact",
      event_label: label
    });
  }

  window.pathfinderAds = {
    fireLeadConversion: function (source) {
      if (sessionStorage.getItem(LEAD_KEY)) return;
      fireGa4Lead(source, "contact");
      fireAds(LEAD);
      sessionStorage.setItem(LEAD_KEY, "1");
    },
    fireBookingConversion: function (source) {
      if (sessionStorage.getItem(BOOKING_KEY)) return;
      fireGa4Lead(source, "calendly");
      fireAds(BOOKING);
      sessionStorage.setItem(BOOKING_KEY, "1");
    },
    firePhoneConversion: function () {
      fireAds(PHONE);
    }
  };
})();
</script>`;

export function logGoogleAdsBuildConfig() {
  console.log(`Google Ads account: ${ADS_ID}`);
  console.log(`Google Analytics: ${GA_ID}`);
  console.log(`Google Ads lead conversion: ${ADS_LEAD_SEND_TO || "NOT CONFIGURED — set PATHFINDER_GOOGLE_ADS_LEAD_LABEL"}`);
  console.log(`Google Ads booking conversion: ${ADS_BOOKING_SEND_TO || "NOT CONFIGURED — set PATHFINDER_GOOGLE_ADS_BOOKING_LABEL"}`);
  console.log(`Google Ads phone conversion: ${ADS_PHONE_SEND_TO}`);
  if (!ADS_LEAD_SEND_TO || !ADS_BOOKING_SEND_TO) {
    console.warn(
      "Google Ads conversion labels missing. Add PATHFINDER_GOOGLE_ADS_LEAD_LABEL and PATHFINDER_GOOGLE_ADS_BOOKING_LABEL as GitHub Actions secrets, then redeploy."
    );
  }
}
