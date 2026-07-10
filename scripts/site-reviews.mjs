export const GOOGLE_FEEDBACK_URL = "https://share.google/9avIEL6pz3bn4kETg";

export const LOCALLISTA_URL = "https://www.locallista.com";
export const LOCALLISTA_BADGE_PATH = "/assets/images/locallista-lis-signature-default.svg";

export const REVIEWS_CSS = `<style id="pathfinder-public-feedback">
.lpFeedbackSection { display: grid; gap: 24px; }
.pfFeedbackSection.pfSection { padding-top: clamp(40px, 6vw, 72px); padding-bottom: clamp(40px, 6vw, 72px); }
.pfFeedbackSection .pfSectionInner { display: grid; gap: 24px; }
.lpFeedbackLead { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body); line-height: var(--pf-leading-body); color: rgba(246,242,234,.72); max-width: 42rem; }
.lpFeedbackQuotes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 0; padding: 0; list-style: none; }
.lpFeedbackQuote { margin: 0; padding: 18px 20px; border: 1px solid rgba(246,242,234,.1); border-radius: var(--pf-radius-md); background: rgba(15,24,22,.55); font-family: var(--pf-font-serif); font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); font-style: italic; color: rgba(246,242,234,.78); }
.lpLocallistaBadge { display: block; width: fit-content; max-width: min(100%, 420px); margin: 0; }
.lpLocallistaBadge img { display: block; width: 100%; height: auto; border-radius: var(--pf-radius-md); }
.lpFeedbackActions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.lpFeedbackDisclaimer { margin: 0; font-family: var(--pf-font-sans); font-size: 0.8125rem; line-height: var(--pf-leading-body); color: rgba(246,242,234,.48); max-width: 42rem; }
.lpFeedbackCompact .lpFeedbackLead { font-size: var(--pf-text-body-sm); }
.lpFeedbackCompact .lpFeedbackDisclaimer { font-size: 0.8125rem; }
.lpFeedbackCompact .lpLocallistaBadge { max-width: min(100%, 340px); }
@media (max-width: 768px) {
  .lpFeedbackQuotes { grid-template-columns: 1fr; }
}
</style>`;

const FEEDBACK_QUOTES = `<ul class="lpFeedbackQuotes" aria-label="Short excerpts from public feedback">
  <li class="lpFeedbackQuote">“Clear, professional communication and a calm, structured approach.”</li>
  <li class="lpFeedbackQuote">“Sessions felt well held — without feeling rushed or labelled.”</li>
  <li class="lpFeedbackQuote">“Fair pricing relative to private therapy in the UK and Portugal.”</li>
  <li class="lpFeedbackQuote">“A thoughtful therapist who takes time to understand what you need.”</li>
</ul>`;

function buildLocallistaBadge() {
  return `<a class="lpLocallistaBadge" href="${LOCALLISTA_URL}" target="_blank" rel="noopener noreferrer" aria-label="Pathfinder Therapy — Locallista Lisbon member business, trusted by expats">
  <img src="${LOCALLISTA_BADGE_PATH}" width="420" height="140" alt="Locallista Lisbon member business 2026 — trusted by expats" loading="lazy" decoding="async" />
</a>`;
}

export function buildPublicFeedbackSection({ compact = false, visual = false } = {}) {
  const sectionClass = visual
    ? "pfSection pfSection--dark lpFeedbackSection pfFeedbackSection"
    : compact
      ? "lpLocalSection lpFeedbackSection lpFeedbackCompact"
      : "lpSection lpFeedbackSection";
  const titleId = compact ? "local-feedback" : "home-feedback";
  const innerOpen = visual ? '<div class="pfSectionInner">' : "";
  const innerClose = visual ? "</div>" : "";

  return `<section class="${sectionClass}" aria-labelledby="${titleId}">
  ${innerOpen}
  <div class="lpSectionHead">
    <p class="pfKicker">Independent feedback</p>
    <h2 class="${visual ? "pfSectionTitle" : "lpSectionTitle"}" id="${titleId}">What people have shared publicly</h2>
    <p class="lpFeedbackLead">Some people choose to leave feedback on independent platforms. Pathfinder does not confirm whether any reviewer was a client, and current clients are not asked for reviews.</p>
  </div>
  ${FEEDBACK_QUOTES}
  ${buildLocallistaBadge()}
  <div class="lpFeedbackActions">
    <a class="lpSecondaryCta" href="${GOOGLE_FEEDBACK_URL}" rel="noopener noreferrer" target="_blank">Read public feedback on Google</a>
  </div>
  <p class="lpFeedbackDisclaimer">Feedback reflects individual experiences only — not clinical outcomes or guarantees. Reviews are published by third parties; Pathfinder Therapy does not confirm any therapeutic relationship.</p>
  ${innerClose}
</section>`;
}

export function injectFeedbackStyles(html) {
  if (html.includes("pathfinder-public-feedback")) {
    return html;
  }
  return html.replace("</head>", `${REVIEWS_CSS}\n</head>`);
}
