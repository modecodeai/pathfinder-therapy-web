/** Legal entity and NCPS Recognised Counselling Service constants for pathfindertherapy.com */

export const BRAND_NAME = "Pathfinder Therapy";
export const LEGAL_NAME = "Pathfinder Therapy CIC";
export const COMPANY_NUMBER = "17248842";
export const COMPANY_JURISDICTION = "England and Wales";

export const TRADING_NAME_STATEMENT =
  "Pathfinder Therapy is a trading name of Pathfinder Therapy CIC.";

export const TRADING_NAME_FULL =
  "Pathfinder Therapy is a trading name of Pathfinder Therapy CIC, a community interest company registered in England and Wales under company number 17248842.";

export const NCPS = {
  label: "NCPS Recognised Counselling Service",
  membershipNumber: "RCS6035",
  url: "https://ncps.com/about-us/our-community/our-recognised-counselling-services",
  logoSrc: "/assets/images/accreditations/ncps-recognised-counselling-service.png",
  logoWidth: 1169,
  logoHeight: 484,
  logoAlt: "NCPS Recognised Counselling Service, membership number RCS6035"
};

export const LEGAL_DISCLOSURE_ROUTES = new Set([
  "/privacy/",
  "/terms/",
  "/arbitration-centre/",
  "/contact/"
]);

export function buildNcpsLink({ text = NCPS.label, className = "" } = {}) {
  const cls = className ? ` class="${className}"` : "";
  return `<a href="${NCPS.url}"${cls} target="_blank" rel="noopener noreferrer">${text}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
}

/** Footer / trust-indicator block with authorised NCPS logo when available. */
export function buildNcpsAccreditationBlock({ compact = false } = {}) {
  const membership = `Membership number: ${NCPS.membershipNumber}`;
  return `<div class="pfNcpsBlock${compact ? " pfNcpsBlock--compact" : ""}">
  <a class="pfNcpsLogoLink" href="${NCPS.url}" target="_blank" rel="noopener noreferrer" aria-label="${NCPS.label}, membership number ${NCPS.membershipNumber} (opens in a new tab)">
    <img
      class="pfNcpsLogo"
      src="${NCPS.logoSrc}"
      alt="${NCPS.logoAlt}"
      width="${NCPS.logoWidth}"
      height="${NCPS.logoHeight}"
      loading="lazy"
      decoding="async"
    />
  </a>
  <div class="pfNcpsCopy">
    <p class="pfNcpsTitle">${buildNcpsLink({ className: "pfNcpsTextLink" })}</p>
    <p class="pfNcpsMeta">${membership}</p>
  </div>
</div>`;
}

export function buildTradingNameBlock() {
  return `<div class="pfLegalEntity">
  <p class="pfLegalEntityStatement">${TRADING_NAME_STATEMENT}</p>
  <p class="pfLegalEntityName">${LEGAL_NAME}</p>
  <p class="pfLegalEntityMeta">Company number: ${COMPANY_NUMBER}</p>
  <p class="pfLegalEntityMeta">Registered in ${COMPANY_JURISDICTION}</p>
</div>`;
}

export function buildLegalPageDisclosureSection({ headingId = "legal-entity" } = {}) {
  return `<section class="approachEssay" aria-labelledby="${headingId}">
  <div class="approachEssayInner">
    <p class="sectionKicker">Legal entity</p>
    <h2 class="approachSectionTitle" id="${headingId}">Who operates this website</h2>
    <div class="approachBody">
      <p>${TRADING_NAME_FULL}</p>
      <p>${LEGAL_NAME} is an <a href="${NCPS.url}" target="_blank" rel="noopener noreferrer">${NCPS.label}<span class="visually-hidden"> (opens in a new tab)</span></a> (membership number ${NCPS.membershipNumber}).</p>
    </div>
  </div>
</section>`;
}

export function injectLegalPageDisclosure(mainInner, route) {
  if (!LEGAL_DISCLOSURE_ROUTES.has(route)) {
    return mainInner;
  }
  if (mainInner.includes("trading name of Pathfinder Therapy CIC")) {
    return mainInner;
  }

  const section = buildLegalPageDisclosureSection({
    headingId: route === "/contact/" ? "contact-legal-entity" : "legal-entity"
  });

  if (route === "/contact/") {
    const contactLegal = `<section class="pfContactLegal" aria-labelledby="contact-legal-entity">
  <div class="pfContactFormInner">
    <p class="pfKicker">Legal entity</p>
    <h2 class="pfSectionTitle" id="contact-legal-entity" style="color:var(--pf-stone)">Who you are contacting</h2>
    <p class="pfSectionLead">${TRADING_NAME_FULL}</p>
    <p class="pfSectionLead" style="margin-top:8px">${LEGAL_NAME} is an ${buildNcpsLink()} (membership number ${NCPS.membershipNumber}).</p>
  </div>
</section>`;
    if (mainInner.includes("pfContactPage") && mainInner.includes("</div>")) {
      return mainInner.replace(/<\/div>\s*$/, `${contactLegal}</div>`);
    }
    return `${mainInner}${contactLegal}`;
  }

  if (mainInner.includes('class="relatedPages"')) {
    return mainInner.replace('<aside class="relatedPages"', `${section}<aside class="relatedPages"`);
  }
  if (mainInner.includes("</article>")) {
    return mainInner.replace("</article>", `${section}</article>`);
  }
  return `${mainInner}${section}`;
}

export const LEGAL_ENTITY_CSS = `<style id="pathfinder-legal-entity">
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.pfLegalEntity { margin-top: 14px; display: grid; gap: 4px; }
.pfLegalEntityStatement { margin: 0; font-family: var(--pf-font-sans); font-size: 0.8125rem; line-height: 1.55; color: rgba(246,242,234,.55); max-width: 22rem; }
.pfLegalEntityName { margin: 8px 0 0; font-family: var(--pf-font-sans); font-size: 0.8125rem; font-weight: 600; color: rgba(246,242,234,.68); }
.pfLegalEntityMeta { margin: 0; font-family: var(--pf-font-sans); font-size: 0.75rem; line-height: 1.5; color: rgba(246,242,234,.48); }
.pfNcpsBlock { display: grid; gap: 12px; align-content: start; }
.pfNcpsLogoLink { display: inline-flex; max-width: 100%; text-decoration: none; }
.pfNcpsLogo {
  display: block;
  width: min(100%, 200px);
  height: auto;
  border-radius: 8px;
  background: #fff;
  padding: 8px 10px;
  border: 1px solid rgba(246,242,234,.12);
}
.pfNcpsCopy { display: grid; gap: 4px; }
.pfNcpsTitle { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: 1.45; font-weight: 600; color: rgba(246,242,234,.86); }
.pfNcpsTextLink { color: #d9b777; text-decoration: none; }
.pfNcpsTextLink:hover { text-decoration: underline; }
.pfNcpsMeta { margin: 0; font-family: var(--pf-font-sans); font-size: 0.75rem; line-height: 1.5; color: rgba(246,242,234,.55); }
.pfNcpsNote { margin: 8px 0 0; font-family: var(--pf-font-sans); font-size: 0.75rem; line-height: 1.55; color: rgba(246,242,234,.48); max-width: 18rem; }
.pfFooterStandards .pfFooterColNavNote { margin: 10px 0 0; font-size: 0.75rem; line-height: 1.55; color: rgba(246,242,234,.48); }
.pfContactLegal { padding: clamp(24px, 4vw, 36px) var(--pf-space-inline) clamp(40px, 6vw, 56px); background: var(--pf-parchment); border-top: 1px solid var(--pf-border-light); }
.pfContactLegal .pfSectionLead { color: var(--pf-stone-muted); }
.pfContactLegal a { color: var(--pf-bronze); }
@media (max-width: 900px) {
  .pfNcpsLogo { width: min(100%, 180px); }
}
</style>`;
