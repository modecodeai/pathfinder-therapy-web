export const GBP_PLACE_ID = "ChIJtw3iKwwzGQ0R4etcENFtq88";

export const GBP_MAPS_URL = `https://www.google.com/maps/place/?q=place_id:${GBP_PLACE_ID}`;

export const LOCALLISTA_BUSINESS_ID = "1768931301";
export const LOCALLISTA_WIDGET_TYPE_ID = "72d389bf-99b4-43b9-a8f7-a4c539e8d5aa";

export const REVIEWS_CSS = `<style id="pathfinder-public-feedback">
.lpFeedbackSection { display: grid; gap: 24px; }
.lpFeedbackLead { margin: 0; font-size: 1.05rem; line-height: 1.7; color: rgba(246,242,234,.72); max-width: 42rem; }
.lpFeedbackWidget { min-height: 140px; display: flex; justify-content: center; align-items: center; width: 100%; }
.lpFeedbackWidget a { font-size: 12px; color: rgba(246,242,234,.42); text-decoration: none; }
.lpFeedbackActions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.lpFeedbackDisclaimer { margin: 0; font-size: 13px; line-height: 1.65; color: rgba(246,242,234,.52); max-width: 42rem; }
.lpFeedbackThemes { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; max-width: 42rem; }
.lpFeedbackThemes li { margin: 0; padding-left: 1.1rem; position: relative; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.68); }
.lpFeedbackThemes li::before { content: ""; position: absolute; left: 0; top: .55em; width: 5px; height: 5px; border-radius: 50%; background: rgba(200,154,88,.55); }
.lpFeedbackCompact .lpFeedbackLead { font-size: 15px; }
.lpFeedbackCompact .lpFeedbackDisclaimer { font-size: 12px; }
</style>`;

const FEEDBACK_THEMES = `<ul class="lpFeedbackThemes" aria-label="Themes sometimes mentioned in public feedback">
  <li>Clear, professional communication</li>
  <li>Sessions starting on time and feeling well held</li>
  <li>A calm, structured approach without feeling rushed or labelled</li>
  <li>Fair pricing relative to private therapy in the UK and Portugal</li>
</ul>`;

function buildLocallistaWidget() {
  return `<div id="locallista-widget" class="lpFeedbackWidget" aria-label="Locallista quality badge">
  <a href="https://www.locallista.com" title="Find Trusted English-Speaking Professionals for Expats">Powered by Locallista</a>
</div>
<script
  src="https://widget.locallista.com/static/widget-locallista.js"
  defer
  data-business-widget-id="${LOCALLISTA_BUSINESS_ID}"
  data-widget-type-id="${LOCALLISTA_WIDGET_TYPE_ID}">
</script>`;
}

export function buildPublicFeedbackSection({ compact = false } = {}) {
  const sectionClass = compact
    ? "lpLocalSection lpFeedbackSection lpFeedbackCompact"
    : "lpSection lpFeedbackSection";
  const titleId = compact ? "local-feedback" : "home-feedback";
  const kicker = compact ? "Public feedback" : "Independent feedback";
  const heading = compact
    ? "Third-party feedback"
    : "What people have shared publicly";

  return `<section class="${sectionClass}" aria-labelledby="${titleId}">
  <div class="lpSectionHead">
    <p class="lpKicker">${kicker}</p>
    <h2 class="lpSectionTitle" id="${titleId}">${heading}</h2>
    <p class="lpFeedbackLead">Some people choose to leave feedback on independent platforms. We do not confirm whether any reviewer was a client, and we do not ask current clients for reviews.</p>
  </div>
  ${buildLocallistaWidget()}
  ${FEEDBACK_THEMES}
  <div class="lpFeedbackActions">
    <a class="lpSecondaryCta" href="${GBP_MAPS_URL}" rel="noopener noreferrer" target="_blank">Read public feedback on Google</a>
  </div>
  <p class="lpFeedbackDisclaimer">Feedback reflects individual experiences only — not clinical outcomes or guarantees. Reviews are published by third parties; Pathfinder Therapy does not confirm any therapeutic relationship.</p>
</section>`;
}

export function injectFeedbackStyles(html) {
  if (html.includes("pathfinder-public-feedback")) {
    return html;
  }
  return html.replace("</head>", `${REVIEWS_CSS}\n</head>`);
}
