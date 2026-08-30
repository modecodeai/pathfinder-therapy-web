import { BOOKING_LABEL, BOOKING_PATH, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";

const NATIVE_BOOKING_URL = BOOKING_PATH;

export const DEFAULT_BOOKING_URL =
  (process.env.PATHFINDER_BOOKING_URL || "").trim() || NATIVE_BOOKING_URL;

function resolveConsultationDuration() {
  const env = (process.env.PATHFINDER_BOOKING_DURATION_MINUTES || "").trim();
  if (env) {
    const digits = env.replace(/[^\d]/g, "");
    if (digits) return `${digits}-minute`;
    return env.endsWith("-minute") ? env : "";
  }
  return "30-minute";
}

export const BOOKING_CONSULTATION_DURATION = resolveConsultationDuration();
export const BOOKING_CONSULTATION_PRICE =
  (process.env.PATHFINDER_BOOKING_PRICE_LABEL || "").trim() || "Free";

export function buildConsultationMetaLine() {
  const parts = [];
  if (BOOKING_CONSULTATION_DURATION) {
    parts.push(`${BOOKING_CONSULTATION_DURATION} initial consultation`);
  } else {
    parts.push("Initial consultation");
  }
  parts.push(BOOKING_CONSULTATION_PRICE, "Secure Zoom");
  return parts.join(" · ");
}

export const BOOK_PATH = "/book/";
export const BOOK_CONFIRMED_PATH = "/book-confirmed/";

export const BOOKING_CSS = `<style id="pathfinder-native-booking">
.lpBookPage { display: grid; gap: 20px; max-width: 920px; margin: 0 auto; }
.lpConsultMeta { margin: 0; font-size: 14px; letter-spacing: .04em; color: #d9b777; font-weight: 600; }
.lpBookIntro { display: grid; gap: 12px; max-width: 40rem; }
.lpBookIntro .lpTitle { font-size: clamp(1.75rem, 3.6vw, 2.4rem); }
.lpBookIntro .lpLead { max-width: 38rem; font-size: 1rem; }
.lpNativeBookingPanel { display: grid; gap: 16px; align-content: center; min-height: 280px; padding: clamp(22px, 4vw, 34px); border: 1px solid rgba(246,242,234,.12); border-radius: 18px; background: rgba(8,16,15,.72); }
.lpNativeBookingPanel p { margin: 0; max-width: 38rem; color: rgba(246,242,234,.76); line-height: 1.65; }
.lpNativeBookingPanel a { justify-self: start; display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 18px; border-radius: 999px; background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: #d9b777; font-weight: 600; text-decoration: none; }
.lpBookPrivacy { margin: 0; font-size: 13px; line-height: 1.65; color: rgba(246,242,234,.62); max-width: 40rem; }
</style>`;

export const BOOKING_INLINE_SCRIPT = `<script id="pathfinder-native-booking-inline">
(function () {
  var BOOKING_URL = ${JSON.stringify(DEFAULT_BOOKING_URL)};

  function readAttribution() {
    try {
      return JSON.parse(sessionStorage.getItem("pathfinder_lead_attribution") || "{}");
    } catch (error) {
      return {};
    }
  }

  function track(eventName, label) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, { event_category: "booking", event_label: label || "book_page" });
    }
  }

  function buildBookingUrl(baseUrl) {
    var stored = readAttribution();
    var url = new URL(baseUrl);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (key) {
      if (stored[key]) url.searchParams.set(key, stored[key]);
    });
    return url.toString();
  }

  document.addEventListener("DOMContentLoaded", function () {
    track("pathfinder_booking_page_view", "book");
    var href = buildBookingUrl(BOOKING_URL);
    document.querySelectorAll("[data-native-booking-link]").forEach(function (link) {
      link.setAttribute("href", href);
    });
    window.setTimeout(function () {
      window.location.href = href;
    }, 900);
  });
})();
</script>`;

export function buildBookingHandoffMarkup() {
  return `<div class="lpNativeBookingPanel" id="native-booking" aria-labelledby="native-booking-title">
  <p id="native-booking-title">Opening Pathfinder's secure booking page.</p>
  <p>If it does not open automatically, use the button below to choose a time in Pathfinder.</p>
  <a href="${DEFAULT_BOOKING_URL}" data-native-booking-link rel="noopener noreferrer">${BOOKING_LABEL}</a>
  <noscript>
    <p>JavaScript is needed for automatic forwarding. Use the button above to open secure booking.</p>
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
  ${buildBookingHandoffMarkup()}
  <p class="lpBookPrivacy">Your booking is handled securely by Pathfinder. Zoom details are prepared automatically after booking. This service is for non-urgent enquiries only. Prefer to ask a question first? <a href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>. For crisis support, see our <a href="/crisis-support/">crisis page</a>.</p>
</div>`;
}

export function buildBookConfirmedBody() {
  return `<section class="lpHero" style="max-width:42rem" aria-labelledby="book-confirmed-title">
  <p class="lpKicker">Booking confirmed</p>
  <h1 class="lpTitle" id="book-confirmed-title">Your initial Zoom consultation is booked.</h1>
  <p class="lpLead">Pathfinder will send your confirmation and online meeting details by email. If you do not see it within a few minutes, check your spam folder.</p>
  <ul class="lpSteps">
    <li><span class="lpStepNum" aria-hidden="true">✓</span><span>Your initial consultation time is reserved.</span></li>
    <li><span class="lpStepNum" aria-hidden="true">2</span><span>Open the Zoom link from your Pathfinder confirmation email at the scheduled time.</span></li>
    <li><span class="lpStepNum" aria-hidden="true">3</span><span>If ongoing therapy feels right, Brent will explain fees and next steps.</span></li>
  </ul>
  <div class="lpHeroActions">
    <a class="lpSecondaryCta" href="/">Return to homepage</a>
    <a class="lpSecondaryCta" href="https://wa.me/351914775365">WhatsApp Brent</a>
  </div>
  <p class="lpReassurance">Need to reschedule? Use the details in your Pathfinder confirmation email, or contact Brent through your usual route. This service is for non-urgent enquiries only.</p>
</section>`;
}
