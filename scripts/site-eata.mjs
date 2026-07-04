export const EATA_URL = "https://www.eata-accreditation.org/";
export const EATA_LOGO_PATH = "/assets/images/eata-logo.svg";

export const EATA_BADGE_CSS = `<style id="pathfinder-eata-badge">
.lpEataBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 14px;
  border: 1px solid rgba(246,242,234,.1);
  border-radius: 12px;
  background: rgba(255,255,255,.96);
  text-decoration: none;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.lpEataBadge:hover {
  border-color: rgba(85,37,131,.35);
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.lpEataBadge img {
  display: block;
  width: min(100%, 168px);
  height: auto;
}
.lpEataNote {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(246,242,234,.58);
}
</style>`;

export function buildEataBadge() {
  return `<div class="lpEataWrap">
  <a class="lpEataBadge" href="${EATA_URL}" target="_blank" rel="noopener noreferrer" aria-label="Brent Kelly is registered with EATA, the European Association for Transactional Analysis">
    <img src="${EATA_LOGO_PATH}" width="168" height="55" alt="EATA — European Association for Transactional Analysis" loading="lazy" decoding="async" />
  </a>
  <p class="lpEataNote">Brent Kelly is registered with EATA.</p>
</div>`;
}

export function injectEataBadgeStyles(html) {
  if (html.includes("pathfinder-eata-badge")) {
    return html;
  }
  return html.replace("</head>", `${EATA_BADGE_CSS}\n</head>`);
}
