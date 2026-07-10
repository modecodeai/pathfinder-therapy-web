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
.pfContactCards { display: grid; gap: 12px; align-content: start; }
.pfContactCard { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 14px; padding: 16px 18px; border: 1px solid var(--pf-border-light); border-radius: var(--pf-radius-md); background: #fff; }
.pfContactCardIcon { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(200,154,88,.12); color: var(--pf-bronze); font-size: 1rem; }
.pfContactCard h2 { margin: 0 0 4px; font-family: var(--pf-font-sans); font-size: 0.8125rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--pf-stone-muted); }
.pfContactCard p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body); line-height: var(--pf-leading-body); color: var(--pf-stone); }
.pfContactCard a { color: var(--pf-bronze); font-weight: 600; text-decoration: none; }
.pfContactCard a:hover { text-decoration: underline; }
.pfContactMap { border: 1px solid var(--pf-border-light); border-radius: var(--pf-radius-lg); overflow: hidden; background: #fff; min-height: 360px; }
.pfContactMap iframe { display: block; width: 100%; height: 100%; min-height: 360px; border: 0; }
.pfContactFormSection { padding: clamp(32px, 5vw, 48px) var(--pf-space-inline); background: var(--pf-parchment-muted); }
.pfContactFormInner { max-width: 40rem; margin: 0 auto; }
.pfContactFormInner .contactForm { max-width: none; }
.pfContactTertiary { margin: 12px 0 0; font-size: var(--pf-text-body-sm); }
.pfContactTertiary a { color: var(--pf-stone-muted); text-decoration: underline; }
@media (max-width: 900px) {
  .pfContactGrid { grid-template-columns: 1fr; }
  .pfContactMap { min-height: 280px; }
  .pfContactMap iframe { min-height: 280px; }
}
</style>`;

const CARD_ICON = {
  phone: "☎",
  email: "✉",
  location: "◎",
  sessions: "◷"
};

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
      <p class="pfContactTertiary"><a href="https://wa.me/351914775365">Prefer WhatsApp? Message Pathfinder Therapy.</a></p>
    </div>
  </section>
  <div class="pfContactGrid">
    <div class="pfContactCards">
      <article class="pfContactCard">
        <div class="pfContactCardIcon" aria-hidden="true">${CARD_ICON.phone}</div>
        <div>
          <h2>Call or WhatsApp</h2>
          <p><a href="tel:+351914775365">+351 914 775 365</a></p>
        </div>
      </article>
      <article class="pfContactCard">
        <div class="pfContactCardIcon" aria-hidden="true">${CARD_ICON.email}</div>
        <div>
          <h2>Email</h2>
          <p><a href="mailto:hi@pathfindertherapy.com">hi@pathfindertherapy.com</a></p>
        </div>
      </article>
      <article class="pfContactCard">
        <div class="pfContactCardIcon" aria-hidden="true">${CARD_ICON.location}</div>
        <div>
          <h2>The clinic</h2>
          <p>${CLINIC.street}<br>${CLINIC.postalCode} ${CLINIC.locality}<br><a href="${CLINIC.directionsUrl}" target="_blank" rel="noopener noreferrer">Get directions →</a></p>
        </div>
      </article>
      <article class="pfContactCard">
        <div class="pfContactCardIcon" aria-hidden="true">${CARD_ICON.sessions}</div>
        <div>
          <h2>Sessions</h2>
          <p>In person at the Lisbon clinic or securely online · from €75 for 50 minutes · non-urgent enquiries only</p>
        </div>
      </article>
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
