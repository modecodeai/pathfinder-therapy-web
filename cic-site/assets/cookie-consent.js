
(function() {
  var GA_ID = "G-R3GWB48RXS";
  var STORAGE_KEY = "pathfinder_cookie_consent_v1";
  var banner = document.getElementById("cookieConsent");

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };

  function configureAnalytics() {
    if (window.__pathfinderAnalyticsConfigured) return;
    window.__pathfinderAnalyticsConfigured = true;

    gtag("consent", "update", {
      "analytics_storage": "granted"
    });

    gtag("js", new Date());
    gtag("config", GA_ID, {
      "anonymize_ip": true
    });
  }

  function denyAnalytics() {
    gtag("consent", "update", {
      "analytics_storage": "denied"
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
      configureAnalytics();
    } else {
      denyAnalytics();
    }
    hideBanner();
  }

  document.addEventListener("click", function(event) {
    if (event.target.matches("[data-cookie-accept]")) {
      setConsent("accepted");
    }
    if (event.target.matches("[data-cookie-reject]")) {
      setConsent("rejected");
    }
    if (event.target.matches("[data-cookie-manage]")) {
      event.preventDefault();
      localStorage.removeItem(STORAGE_KEY);
      showBanner();
    }
  });

  var existing = localStorage.getItem(STORAGE_KEY);
  if (existing === "accepted") {
    configureAnalytics();
  } else if (existing === "rejected") {
    denyAnalytics();
    hideBanner();
  } else {
    denyAnalytics();
    showBanner();
  }
})();
