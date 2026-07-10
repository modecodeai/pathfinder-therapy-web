import { BOOKING_LABEL, BOOKING_PATH, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";

const CLINIC = {
  street: "R. Rodrigues Sampaio 76 1º Andar",
  postalCode: "1150-281",
  locality: "Lisboa",
  directionsUrl:
    "https://www.google.com/maps/dir//Pathfinder+Therapy,+R.+Rodrigues+Sampaio+76+1st+floor,+1150-281+Lisboa/@39.4892942,-8.9907968,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0xd19330c2be20db7:0xcfab6dd1105cebe1!2m2!1d-9.1462559!2d38.722773?hl=en-PT&entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D",
  embedUrl:
    "https://maps.google.com/maps?q=R.+Rodrigues+Sampaio+76,+1150-281+Lisboa,+Portugal&z=16&output=embed"
};

export const CONTACT_VISUAL_CSS = `<style id="pathfinder-contact-visual">
.pfContactPage { display: grid; gap: 0; }
.pfContactHero { padding: clamp(40px, 6vw, 72px) var(--pf-space-inline); background: var(--pf-forest-deep); color: var(--pf-linen); }
.pfContactHeroInner { max-width: 1180px; margin: 0 auto; display: grid; gap: 18px; }
.pfContactGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 1fr); gap: clamp(28px, 4vw, 40px); max-width: 1180px; margin: 0 auto; padding: clamp(40px, 6vw, 64px) var(--pf-space-inline); background: var(--pf-parchment); }
.pfContactDetails { display: grid; gap: 20px; align-content: start; }
.pfContactDetails h2 { margin: 0 0 10px; font-family: var(--pf-font-sans); font-size: 0.75rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--pf-stone-muted); }
.pfContactList { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.pfContactList li { font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); color: var(--pf-stone-muted); }
.pfContactList a { color: var(--pf-stone); font-weight: 500; text-decoration: none; }
.pfContactList a:hover { color: var(--pf-bronze); text-decoration: underline; }
.pfContactTertiaryNote { margin: 0; font-family: var(--pf-font-sans); font-size: 0.8125rem; line-height: var(--pf-leading-body); color: var(--pf-stone-muted); }
.pfContactTertiaryNote a { color: var(--pf-stone-muted); text-decoration: underline; text-underline-offset: 2px; }
.pfContactTertiaryNote a:hover { color: var(--pf-bronze); }
.pfContactMap { border: 1px solid var(--pf-border-light); border-radius: var(--pf-radius-lg); overflow: hidden; background: #fff; min-height: 360px; }
.pfContactMap iframe { display: block; width: 100%; height: 100%; min-height: 360px; border: 0; }
.pfContactFormSection { padding: clamp(32px, 5vw, 48px) var(--pf-space-inline); background: var(--pf-parchment-muted); }
.pfContactFormInner { max-width: 40rem; margin: 0 auto; }
.pfContactFormInner .contactForm { max-width: none; }
@media (max-width: 900px) {
  .pfContactGrid { grid-template-columns: 1fr; }
  .pfContactMap { min-height: 280px; }
  .pfContactMap iframe { min-height: 280px; }
}
</style>`;

export function buildContactVisualBody(formHtml) {
  return `<div class="pfContactPage">
  <section class="pfContactHero" aria-labelledby="contact-title">
    <div class="pfContactHeroInner">
      <p class="pfKicker">Contact · Lisbon clinic &amp; online</p>
      <h1 class="pfTitle" id="contact-title">Reach out when you are ready</h1>
      <p class="pfLead" style="color:var(--pf-linen-muted)">You can arrange an initial consultation directly or send an enquiry first — whichever feels easier. Both routes are confidential and non-urgent.</p>
      <div class="pfHeroActions">
        <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
        <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
      </div>
    </div>
  </section>
  <div class="pfContactGrid">
    <div class="pfContactDetails">
      <div>
        <h2>Clinic &amp; sessions</h2>
        <ul class="pfContactList">
          <li>${CLINIC.street}, ${CLINIC.postalCode} ${CLINIC.locality}</li>
          <li><a href="${CLINIC.directionsUrl}" target="_blank" rel="noopener noreferrer">Get directions</a></li>
          <li>In person at the Lisbon clinic or securely online · from €75 for 50 minutes</li>
        </ul>
      </div>
      <div>
        <h2>Other ways to reach Brent</h2>
        <ul class="pfContactList">
          <li><a href="tel:+351914775365">+351 914 775 365</a></li>
          <li><a href="mailto:hi@pathfindertherapy.com">hi@pathfindertherapy.com</a></li>
          <li><a href="https://wa.me/351914775365">WhatsApp</a></li>
        </ul>
        <p class="pfContactTertiaryNote">Phone, email and WhatsApp are for non-urgent contact. For crisis support, see our <a href="/crisis-support/">crisis page</a>.</p>
      </div>
    </div>
    <div class="pfContactMap" aria-label="Map showing Pathfinder Therapy clinic in Lisbon">
      <iframe title="Pathfinder Therapy clinic location — R. Rodrigues Sampaio 76, Lisboa" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${CLINIC.embedUrl}"></iframe>
    </div>
  </div>
  <section class="pfContactFormSection" id="consultation-form" aria-labelledby="consultation-form-intro">
    <div class="pfContactFormInner">
      <p class="pfKicker">Confidential enquiry</p>
      <h2 class="pfSectionTitle" id="consultation-form-intro" style="color:var(--pf-stone)">Send an enquiry</h2>
      <p class="pfSectionLead">This takes about two minutes. Your details are sent securely to Brent — for non-urgent enquiries only.</p>
      ${formHtml}
      <p class="pfSectionLead" style="margin-top:16px;font-size:0.8125rem">Sessions from €75 · Lisbon clinic or secure online · Professional indemnity insurance · Clinical supervision in place</p>
    </div>
  </section>
</div>`;
}
