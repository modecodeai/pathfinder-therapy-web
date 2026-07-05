export const GOOGLE_FEEDBACK_URL = "https://share.google/9avIEL6pz3bn4kETg";

export const LOCALLISTA_URL = "https://www.locallista.com";
export const LOCALLISTA_BADGE_PATH = "/assets/images/locallista-lis-signature-default.svg";

export const REVIEWS_CSS = `<style id="pathfinder-public-feedback">
.lpFeedbackSection { display: grid; gap: 24px; }
.lpFeedbackLead { margin: 0; font-size: 1.05rem; line-height: 1.7; color: rgba(246,242,234,.72); max-width: 42rem; }
.lpLocallistaBadge { display: block; width: fit-content; max-width: min(100%, 420px); margin: 0; }
.lpLocallistaBadge img { display: block; width: 100%; height: auto; border-radius: 12px; }
.lpFeedbackActions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.lpFeedbackDisclaimer { margin: 0; font-size: 13px; line-height: 1.65; color: rgba(246,242,234,.52); max-width: 42rem; }
.lpFeedbackThemes { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; max-width: 42rem; }
.lpFeedbackThemes li { margin: 0; padding-left: 1.1rem; position: relative; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.68); }
.lpFeedbackThemes li::before { content: ""; position: absolute; left: 0; top: .55em; width: 5px; height: 5px; border-radius: 50%; background: rgba(200,154,88,.55); }
.lpFeedbackCompact .lpFeedbackLead { font-size: 15px; }
.lpFeedbackCompact .lpFeedbackDisclaimer { font-size: 12px; }
.lpFeedbackCompact .lpLocallistaBadge { max-width: min(100%, 340px); }
</style>`;

const FEEDBACK_THEMES = `<ul class="lpFeedbackThemes" aria-label="Themes sometimes mentioned in public feedback">
  <li>Clear, professional communication</li>
  <li>Sessions starting on time and feeling well held</li>
  <li>A calm, structured approach without feeling rushed or labelled</li>
  <li>Fair pricing relative to private therapy in the UK and Portugal</li>
</ul>`;

function buildLocallistaBadge() {
  return `<a class="lpLocallistaBadge" href="${LOCALLISTA_URL}" target="_blank" rel="noopener noreferrer" aria-label="Pathfinder Therapy — Locallista Lisbon member business, trusted by expats">
  <img src="${LOCALLISTA_BADGE_PATH}" width="420" height="140" alt="Locallista Lisbon member business 2026 — trusted by expats" loading="lazy" decoding="async" />
</a>`;
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

  const innerClass = compact ? "lpLocalSectionInner" : "lpSectionHead";
  return `<section class="${sectionClass}" aria-labelledby="${titleId}">
  <div class="${innerClass}">
    <p class="lpKicker">${kicker}</p>
    <h2 class="lpSectionTitle" id="${titleId}">${heading}</h2>
    <p class="lpFeedbackLead">Some people choose to leave feedback on independent platforms. We do not confirm whether any reviewer was a client, and we do not ask current clients for reviews.</p>
    ${buildLocallistaBadge()}
    ${FEEDBACK_THEMES}
    <div class="lpFeedbackActions">
      <a class="lpSecondaryCta" href="${GOOGLE_FEEDBACK_URL}" rel="noopener noreferrer" target="_blank">Read public feedback on Google</a>
    </div>
    <p class="lpFeedbackDisclaimer">Feedback reflects individual experiences only — not clinical outcomes or guarantees. Reviews are published by third parties; Pathfinder Therapy does not confirm any therapeutic relationship.</p>
  </div>
</section>`;
}

export function injectFeedbackStyles(html) {
  if (html.includes("pathfinder-public-feedback")) {
    return html;
  }
  return html.replace("</head>", `${REVIEWS_CSS}\n</head>`);
}
