import { BOOKING_LABEL, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";

const CALENDLY_URL_FALLBACK = "https://calendly.com/pathfindertherapy/initial-consultation";

export const DEFAULT_CALENDLY_URL =
  (process.env.PATHFINDER_CALENDLY_URL || "").trim() || CALENDLY_URL_FALLBACK;

/** Documented in docs/google-ads-copy.md — confirm exact duration in Calendly dashboard. */
export const CALENDLY_CONSULTATION_DURATION =
  (process.env.PATHFINDER_CALENDLY_DURATION_MINUTES || "").trim() || "15–30-minute";
export const CALENDLY_CONSULTATION_PRICE =
  (process.env.PATHFINDER_CALENDLY_PRICE_LABEL || "").trim() || "Free";

export function buildConsultationMetaLine() {
  return `${CALENDLY_CONSULTATION_DURATION} initial consultation · ${CALENDLY_CONSULTATION_PRICE} · Zoom`;
}

export const BOOK_PATH = "/book/";
export const BOOK_CONFIRMED_PATH = "/book-confirmed/";

export const CALENDLY_CSS = `<style id="pathfinder-calendly">
.lpBookPage { display: grid; gap: 20px; max-width: 920px; margin: 0 auto; }
.lpConsultMeta { margin: 0; font-size: 14px; letter-spacing: .04em; color: #d9b777; font-weight: 600; }
.lpBookIntro { display: grid; gap: 12px; max-width: 40rem; }
.lpBookIntro .lpTitle { font-size: clamp(1.75rem, 3.6vw, 2.4rem); }
.lpBookIntro .lpLead { max-width: 38rem; font-size: 1rem; }
.lpCalendlyPanel { border: 1px solid rgba(246,242,234,.12); border-radius: 18px; overflow: hidden; background: rgba(8,16,15,.72); min-height: 680px; }
.lpCalendlyWidget { min-width: 320px; min-height: 680px; height: 680px; }
.lpCalendlyFallback { padding: 24px; display: grid; gap: 12px; }
.lpCalendlyFallback a { color: #d9b777; font-weight: 600; }
.lpCalendlyAlt { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.68); }
.lpCalendlyAlt a { color: #d9b777; }
.lpBookPrivacy { margin: 0; font-size: 13px; line-height: 1.65; color: rgba(246,242,234,.62); max-width: 40rem; }
@media (max-width: 900px) {
  .lpCalendlyWidget, .lpCalendlyPanel { min-height: 640px; height: 640px; }
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

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (window.Calendly) {
          loadCalendly();
        } else {
          var script = document.createElement("script");
          script.src = "https://assets.calendly.com/assets/external/widget.js";
          script.async = true;
          script.onload = loadCalendly;
          document.head.appendChild(script);
        }
      });
    }, { rootMargin: "200px 0px" });
    observer.observe(widget);

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
    <a href="${DEFAULT_CALENDLY_URL}" rel="noopener noreferrer">${BOOKING_LABEL}</a>
  </noscript>
</div>`;
}

export function buildBookPageBody() {
  const meta = buildConsultationMetaLine();
  return `<div class="lpBookPage">
  <section class="lpBookIntro" aria-labelledby="book-title">
    <p class="lpKicker">Initial consultation · Secure Zoom</p>
    <h1 class="lpTitle" id="book-title">${BOOKING_LABEL}</h1>
    <p class="lpConsultMeta">${meta}</p>
    <p class="lpLead">This is a brief introductory conversation rather than a full therapy session. It gives you an opportunity to explain what you are looking for, ask questions and decide whether working together feels appropriate. There is no obligation to continue.</p>
  </section>
  ${buildCalendlyEmbedMarkup()}
  <p class="lpBookPrivacy">Your booking is handled securely by Calendly. Zoom details are sent by email. This service is for non-urgent enquiries only. Prefer to ask a question first? <a href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>. For crisis support, see our <a href="/crisis-support/">crisis page</a>.</p>
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
