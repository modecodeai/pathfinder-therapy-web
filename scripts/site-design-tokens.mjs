export const DESIGN_TOKENS_CSS = `<style id="pathfinder-design-tokens">
:root {
  --pf-forest-deep: #0a0f0d;
  --pf-forest: #0f1816;
  --pf-forest-elevated: #141f1c;
  --pf-parchment: #f4efe6;
  --pf-parchment-muted: #ebe4d8;
  --pf-stone: #3d3a36;
  --pf-stone-muted: #5c574f;
  --pf-linen: #f6f2ea;
  --pf-linen-muted: rgba(246,242,234,.76);
  --pf-bronze: #c89a58;
  --pf-bronze-soft: #d9b777;
  --pf-gold: #d4a373;
  --pf-border-dark: rgba(246,242,234,.1);
  --pf-border-light: rgba(26,24,20,.12);
  --pf-radius-sm: 10px;
  --pf-radius-md: 14px;
  --pf-radius-lg: 18px;
  --pf-radius-pill: 999px;
  --pf-shadow-soft: 0 18px 48px rgba(0,0,0,.18);
  --pf-shadow-card: 0 8px 32px rgba(0,0,0,.12);
  --pf-space-section: clamp(48px, 7vw, 88px);
  --pf-space-inline: clamp(16px, 3vw, 40px);
  --pf-font-serif: "Cormorant Garamond", Georgia, "Times New Roman", serif;
  --pf-font-sans: "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --pf-text-body: 1rem;
  --pf-text-body-sm: 0.9375rem;
  --pf-leading-body: 1.65;
  --pf-duration: 200ms;
  --pf-header-offset: 72px;
  --color-forest-deep: var(--pf-forest-deep);
  --color-linen: var(--pf-linen);
  --color-bronze: var(--pf-bronze);
  --color-bronze-soft: var(--pf-bronze-soft);
}
.pfSection { padding: var(--pf-space-section) var(--pf-space-inline); }
.pfSectionInner { max-width: 1180px; margin: 0 auto; }
.pfSection--dark { background: var(--pf-forest-deep); color: var(--pf-linen); }
.pfSection--dark .pfSectionTitle { color: var(--pf-linen); }
.pfSection--dark .pfSectionLead { color: var(--pf-linen-muted); }
.pfSection--light { background: var(--pf-parchment); color: var(--pf-stone); }
.pfSection--light .pfKicker { color: var(--pf-bronze); }
.pfSection--light .pfSectionTitle { color: var(--pf-stone); }
.pfSection--light .pfSectionLead { color: var(--pf-stone-muted); }
.pfSection--muted { background: var(--pf-parchment-muted); color: var(--pf-stone); }
.pfSection--muted .pfSectionTitle { color: var(--pf-stone); }
.pfSection--muted .pfSectionLead { color: var(--pf-stone-muted); }
.pfSectionHead { display: grid; gap: 12px; max-width: 40rem; margin-bottom: clamp(24px, 4vw, 36px); }
.pfKicker { margin: 0; font-family: var(--pf-font-sans); font-size: 0.75rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--pf-bronze-soft); }
.pfSectionTitle { margin: 0; font-family: var(--pf-font-serif); font-size: clamp(1.75rem, 3.4vw, 2.5rem); line-height: 1.12; font-weight: 600; }
.pfSectionLead { margin: 0; font-family: var(--pf-font-sans); font-size: clamp(1rem, 1.8vw, 1.0625rem); line-height: var(--pf-leading-body); max-width: 38rem; }
.pfTitle { margin: 0; font-family: var(--pf-font-serif); font-size: clamp(2.25rem, 5vw, 3.5rem); line-height: 1.05; font-weight: 600; color: var(--pf-linen); text-wrap: balance; }
.pfLead { margin: 0; font-family: var(--pf-font-sans); font-size: clamp(1.0625rem, 2vw, 1.1875rem); line-height: var(--pf-leading-body); max-width: 36rem; }
.pfHeroActions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.pfHeroTextLink { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px; color: var(--pf-bronze-soft); font-family: var(--pf-font-sans); font-size: 0.9375rem; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
.pfFooter { margin-top: 0; padding: clamp(48px, 6vw, 72px) var(--pf-space-inline) calc(24px + env(safe-area-inset-bottom)); background: var(--pf-forest-deep); color: rgba(246,242,234,.72); border-top: 1px solid var(--pf-border-dark); }
.pfFooterInner { max-width: 1180px; margin: 0 auto; display: grid; gap: 32px; }
.pfFooterGrid { display: grid; grid-template-columns: minmax(0, 1.2fr) repeat(3, minmax(0, 1fr)); gap: clamp(24px, 4vw, 40px); }
.pfFooterBrand p { margin: 12px 0 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); color: rgba(246,242,234,.62); max-width: 22rem; }
.pfFooterLogo { font-family: var(--pf-font-serif); font-size: 1.35rem; color: var(--pf-linen); letter-spacing: .04em; }
.pfFooterLogo small { display: block; margin-top: 4px; font-family: var(--pf-font-sans); font-size: 0.6875rem; letter-spacing: .14em; text-transform: uppercase; color: var(--pf-bronze-soft); }
.pfFooterCol h2 { margin: 0 0 12px; font-family: var(--pf-font-sans); font-size: 0.6875rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--pf-bronze-soft); }
.pfFooterCol nav { display: grid; gap: 8px; }
.pfFooterCol a { font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); color: rgba(246,242,234,.72); text-decoration: none; min-height: 32px; display: inline-flex; align-items: center; }
.pfFooterCol a:hover { color: var(--pf-bronze-soft); }
.pfFooterContact p { margin: 0 0 8px; font-size: var(--pf-text-body-sm); line-height: 1.6; }
.pfFooterBottom { display: flex; flex-wrap: wrap; gap: 12px 24px; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid var(--pf-border-dark); font-size: 0.8125rem; color: rgba(246,242,234,.48); }
.pfFooterBottom a { color: rgba(246,242,234,.62); text-decoration: none; }
.pfFooterBottom a:hover { color: var(--pf-bronze-soft); }
.pfFooterCta { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border-radius: var(--pf-radius-pill); background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: var(--pf-bronze-soft); font-family: var(--pf-font-sans); font-size: 0.875rem; font-weight: 600; text-decoration: none; }
.pfFloatCta { position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 45; display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 18px; border-radius: var(--pf-radius-pill); background: rgba(200,154,88,.92); color: var(--pf-forest-deep); font-family: var(--pf-font-sans); font-size: 0.875rem; font-weight: 600; text-decoration: none; box-shadow: var(--pf-shadow-soft); opacity: 0; pointer-events: none; transform: translateY(12px); transition: opacity var(--pf-duration), transform var(--pf-duration); }
.pfFloatCta.isVisible { opacity: 1; pointer-events: auto; transform: translateY(0); }
.pfFloatCtaShort { display: none; }
@media (max-width: 900px) {
  .pfFooterGrid { grid-template-columns: 1fr 1fr; }
  .pfFooterBrand { grid-column: 1 / -1; }
  .pfFloatCtaLong { display: none; }
  .pfFloatCtaShort { display: inline; }
  .pfHeroActions { flex-direction: column; align-items: stretch; }
  .pfHeroActions .lpPrimaryCta { width: 100%; }
}
@media (max-width: 560px) {
  .pfFooterGrid { grid-template-columns: 1fr; }
}
</style>`;

export const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet">`;
export const FLOATING_CTA_SCRIPT = `<script id="pathfinder-floating-cta">
document.addEventListener("DOMContentLoaded", function () {
  var floatCta = document.querySelector(".pfFloatCta");
  var hero = document.querySelector(".pfHero, .lpHomeHeroWrap, .pfServiceHero");
  var footer = document.querySelector(".pfFooter, .lpSiteFooter");
  var enquiryOpen = document.querySelector(".lpStartEnquiryPanel.isOpen, #enquiry.isOpen");
  if (!floatCta) return;
  var path = window.location.pathname;
  if (path.indexOf("/book") === 0 || path.indexOf("/start") === 0) {
    floatCta.remove();
    return;
  }
  function isVisible(el) {
    if (!el) return false;
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
  }
  function update() {
    var scrolled = window.scrollY > 480;
    var hideForHero = isVisible(hero);
    var hideForFooter = footer && footer.getBoundingClientRect().top < window.innerHeight + 40;
    var hideForMajorCta = Array.prototype.some.call(document.querySelectorAll(".lpFinalCta, .lpEndCta, .pfFinalCta, .pfServiceFinal, #calendly-booking"), isVisible);
    var hideForEnquiry = enquiryOpen || (window.location.hash === "#enquiry" && document.getElementById("enquiry"));
    var show = scrolled && !hideForHero && !hideForFooter && !hideForMajorCta && !hideForEnquiry;
    floatCta.classList.toggle("isVisible", show);
    floatCta.setAttribute("aria-hidden", show ? "false" : "true");
    floatCta.tabIndex = show ? 0 : -1;
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("hashchange", update);
  update();
});
</script>`;

export function buildFloatingCta(href, label) {
  return `<a class="pfFloatCta" href="${href}" aria-hidden="true" tabindex="-1">
  <span class="pfFloatCtaLong">${label}</span>
  <span class="pfFloatCtaShort">Initial consultation</span>
</a>`;
}
