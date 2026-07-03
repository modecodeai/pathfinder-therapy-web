const CALENDLY_URL_FALLBACK = "https://calendly.com/pathfindertherapy/initial-consultation";

export const DEFAULT_CALENDLY_URL =
  (process.env.PATHFINDER_CALENDLY_URL || "").trim() || CALENDLY_URL_FALLBACK;

export const BOOK_PATH = "/book/";
export const BOOK_CONFIRMED_PATH = "/book-confirmed/";

export const CALENDLY_CSS = `<style id="pathfinder-calendly">
.lpCalendlyIntro { display: grid; gap: 16px; max-width: 40rem; margin-bottom: 24px; }
.lpCalendlyPanel { border: 1px solid rgba(246,242,234,.12); border-radius: 18px; overflow: hidden; background: rgba(8,16,15,.72); min-height: 720px; }
.lpCalendlyWidget { min-width: 320px; min-height: 720px; height: 720px; }
.lpCalendlyFallback { padding: 24px; display: grid; gap: 12px; }
.lpCalendlyFallback a { color: #d9b777; font-weight: 600; }
.lpCalendlyAlt { margin-top: 20px; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.68); }
.lpCalendlyAlt a { color: #d9b777; }
@media (max-width: 900px) {
  .lpCalendlyWidget, .lpCalendlyPanel { min-height: 680px; height: 680px; }
}
</style>`;

export const CALENDLY_INLINE_SCRIPT = `<script id="pathfinder-calendly-inline">
(function () {
  var CALENDLY_URL = ${JSON.stringify(DEFAULT_CALENDLY_URL)};

  function readAttribution() {
    try {
      return JSON.parse(sessionStorage.getItem("pathfinder_lead_attribution") || "{}");
    } catch (error) {
      return {};
    }
  }

  function track(eventName, label) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, { event_category: "calendly", event_label: label || "book_page" });
    }
  }

  function buildCalendlyUrl(baseUrl) {
    var stored = readAttribution();
    var url = new URL(baseUrl);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (key) {
      if (stored[key]) url.searchParams.set(key, stored[key]);
    });
    return url.toString();
  }

  document.addEventListener("DOMContentLoaded", function () {
    track("calendly_page_view", "book");
    var widget = document.querySelector(".calendly-inline-widget");
    if (!widget) return;
    widget.setAttribute("data-url", buildCalendlyUrl(CALENDLY_URL));

    function loadCalendly() {
      if (typeof window.Calendly === "undefined") return;
      window.Calendly.initInlineWidget({
        url: buildCalendlyUrl(CALENDLY_URL),
        parentElement: widget
      });
    }

    if (window.Calendly) {
      loadCalendly();
    } else {
      var script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = loadCalendly;
      document.head.appendChild(script);
    }

    window.addEventListener("message", function (event) {
      if (event.origin.indexOf("calendly.com") === -1) return;
      if (!event.data || !event.data.event) return;
      if (event.data.event === "calendly.event_scheduled") {
        track("calendly_event_scheduled", "inline_widget");
        setTimeout(function () {
          window.location.href = "/book-confirmed/";
        }, 800);
      }
    });
  });
})();
</script>`;

export function buildCalendlyEmbedMarkup() {
  return `<div class="lpCalendlyPanel" id="calendly-booking">
  <div class="calendly-inline-widget lpCalendlyWidget" data-url="${DEFAULT_CALENDLY_URL}"></div>
  <noscript class="lpCalendlyFallback">
    <p>Online booking requires JavaScript. Open Calendly directly instead:</p>
    <a href="${DEFAULT_CALENDLY_URL}" rel="noopener noreferrer">Book your initial Zoom consultation</a>
  </noscript>
</div>`;
}

export function buildBookPageBody() {
  return `<div class="lpGrid">
  <section class="lpHero" aria-labelledby="book-title">
    <p class="lpKicker">Initial consultation · Secure Zoom</p>
    <h1 class="lpTitle" id="book-title">Book a confidential initial Zoom call with Brent Kelly.</h1>
    <p class="lpLead">Choose a time that suits you. This is a short, non-urgent initial conversation to see whether therapy feels like a fit — online via Zoom.</p>
    <ul class="lpTrustList" aria-label="Professional reassurance">
      <li>NCPS registered</li>
      <li>Trauma-informed</li>
      <li>Confidential</li>
      <li>English-speaking</li>
      <li>Zoom link sent automatically</li>
    </ul>
    <ol class="lpSteps" aria-label="What happens next">
      <li><span class="lpStepNum">1</span><span>Choose a time below and enter your details securely via Calendly.</span></li>
      <li><span class="lpStepNum">2</span><span>You receive Zoom meeting details by email.</span></li>
      <li><span class="lpStepNum">3</span><span>If it feels like a fit, Brent will explain next steps for ongoing therapy.</span></li>
    </ol>
    <p class="lpCalendlyAlt">Prefer to send a brief written enquiry first? <a href="/start/">Use the consultation form</a> instead. For crisis support, see our <a href="/crisis-support/">crisis page</a>.</p>
  </section>
  <section class="lpFormPanel" aria-labelledby="calendly-booking-intro">
    <p class="lpKicker">Choose your time</p>
    <p class="lpFormIntro" id="calendly-booking-intro">Select an available slot for your initial Zoom consultation. Non-urgent enquiries only.</p>
    ${buildCalendlyEmbedMarkup()}
    <p class="lpReassurance">Zoom link by email · Sessions from €75 thereafter · Lisbon clinic or online · Non-urgent enquiries only</p>
  </section>
</div>`;
}

export function buildBookConfirmedBody() {
  return `<section class="lpHero" style="max-width:42rem" aria-labelledby="book-confirmed-title">
  <p class="lpKicker">Booking confirmed</p>
  <h1 class="lpTitle" id="book-confirmed-title">Your initial Zoom consultation is booked.</h1>
  <p class="lpLead">Calendly has sent your confirmation and Zoom details by email. If you do not see it within a few minutes, check your spam folder.</p>
  <ol class="lpSteps">
    <li><span class="lpStepNum">✓</span><span>Your initial consultation time is reserved.</span></li>
    <li><span class="lpStepNum">2</span><span>Open the Zoom link from your confirmation email at the scheduled time.</span></li>
    <li><span class="lpStepNum">3</span><span>If ongoing therapy feels right, Brent will explain fees and next steps.</span></li>
  </ol>
  <div class="lpHeroActions">
    <a class="lpSecondaryCta" href="/">Return to homepage</a>
    <a class="lpSecondaryCta" href="https://wa.me/351914775365">WhatsApp Brent</a>
  </div>
  <p class="lpReassurance">Need to reschedule? Use the link in your Calendly confirmation email. This service is for non-urgent enquiries only.</p>
</section>`;
}
