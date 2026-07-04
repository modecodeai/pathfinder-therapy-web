export const COOKIE_CONSENT_CSS = `<style id="pathfinder-cookie-consent">
.cookie-banner {
  position: fixed;
  left: clamp(10px, 2vw, 18px);
  right: clamp(10px, 2vw, 18px);
  bottom: clamp(10px, 2vw, 18px);
  z-index: 9999;
  background: rgba(8, 16, 15, 0.96);
  color: #f6f2ea;
  border: 1px solid rgba(246, 242, 234, 0.14);
  border-radius: 14px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
}
.cookie-banner[hidden] { display: none !important; }
.cookie-banner__content {
  max-width: 1180px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
}
.cookie-banner h2 {
  margin: 0 0 6px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.15rem;
  line-height: 1.2;
  color: #d9b777;
}
.cookie-banner p {
  margin: 0;
  color: rgba(246, 242, 234, 0.82);
  line-height: 1.55;
  font-size: 14px;
}
.cookie-banner__links { margin-top: 8px !important; color: rgba(246, 242, 234, 0.62); }
.cookie-banner a { color: #d9b777; }
.cookie-banner__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.cookie-btn {
  min-height: 44px;
  border-radius: 999px;
  padding: 0 18px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.cookie-btn--primary {
  border: 1px solid rgba(200, 154, 88, 0.75);
  background: rgba(200, 154, 88, 0.18);
  color: #d9b777;
}
.cookie-btn--ghost {
  border: 1px solid rgba(246, 242, 234, 0.22);
  background: transparent;
  color: rgba(246, 242, 234, 0.88);
}
@media (max-width: 760px) {
  .cookie-banner__content { grid-template-columns: 1fr; }
  .cookie-banner__actions { display: grid; grid-template-columns: 1fr; }
  .cookie-btn { width: 100%; }
}
</style>`;

export const COOKIE_BANNER_HTML = `<div id="cookieConsent" class="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent" hidden>
  <div class="cookie-banner__content">
    <div>
      <h2>Cookies &amp; privacy</h2>
      <p>We use essential cookies to make this website work. With your permission, we also use Google Analytics and Google Ads tags to understand how people find Pathfinder and measure enquiries — always in line with our privacy notice.</p>
      <p class="cookie-banner__links"><a href="/privacy/">Privacy notice</a></p>
    </div>
    <div class="cookie-banner__actions">
      <button type="button" class="cookie-btn cookie-btn--ghost" data-cookie-reject>Reject analytics</button>
      <button type="button" class="cookie-btn cookie-btn--primary" data-cookie-accept>Accept analytics</button>
    </div>
  </div>
</div>`;

export const COOKIE_CONSENT_SCRIPT = `<script id="pathfinder-cookie-consent">
(function () {
  var STORAGE_KEY = "pathfinder_cookie_consent_v1";
  var banner = document.getElementById("cookieConsent");

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function grantConsent() {
    gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted"
    });
  }

  function denyConsent() {
    gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }

  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  function showBanner() {
    if (banner) banner.hidden = false;
  }

  function setConsent(value) {
    localStorage.setItem(STORAGE_KEY, value);
    if (value === "accepted") {
      grantConsent();
    } else {
      denyConsent();
    }
    hideBanner();
  }

  document.addEventListener("click", function (event) {
    if (event.target.matches("[data-cookie-accept]")) setConsent("accepted");
    if (event.target.matches("[data-cookie-reject]")) setConsent("rejected");
    if (event.target.matches("[data-cookie-manage]")) {
      event.preventDefault();
      localStorage.removeItem(STORAGE_KEY);
      showBanner();
    }
  });

  var existing = localStorage.getItem(STORAGE_KEY);
  if (existing === "accepted") {
    grantConsent();
    hideBanner();
  } else if (existing === "rejected") {
    denyConsent();
    hideBanner();
  } else {
    denyConsent();
    showBanner();
  }
})();
</script>`;

export function injectCookieConsent(html) {
  if (html.includes('id="pathfinder-cookie-consent"')) {
    return html;
  }

  let next = html;
  if (!next.includes('id="pathfinder-cookie-consent"')) {
    next = next.replace("</head>", `${COOKIE_CONSENT_CSS}\n</head>`);
  }
  next = next.replace("</body>", `${COOKIE_BANNER_HTML}\n${COOKIE_CONSENT_SCRIPT}\n</body>`);
  return next;
}
