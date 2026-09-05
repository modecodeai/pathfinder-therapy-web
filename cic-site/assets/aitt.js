/**
 * AITT pilot page behaviour: status badge, FAQ analytics, form handling.
 * Privacy-conscious: never send names, clinical fields or free text to analytics.
 */
(function () {
  const cfg = window.PATHFINDER_AITT || {};

  function track(eventName) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, {
          event_category: "aitt_pilot",
          send_to: undefined
        });
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: eventName });
    } catch (_) {
      /* analytics optional */
    }
  }

  function applyStatusBadge() {
    document.querySelectorAll("[data-aitt-status-badge]").forEach(function (el) {
      el.textContent = cfg.statusBadge || "Pilot launching in 2026";
    });
    document.querySelectorAll("[data-aitt-pilot-status]").forEach(function (el) {
      el.textContent = cfg.pilotStatus || "In development";
    });
  }

  function wireCtas() {
    document.querySelectorAll("[data-aitt-cta='participant']").forEach(function (el) {
      el.addEventListener("click", function () {
        track("aitt_participant_cta_click");
      });
    });
    document.querySelectorAll("[data-aitt-cta='professional']").forEach(function (el) {
      el.addEventListener("click", function () {
        track("aitt_professional_cta_click");
      });
    });
  }

  function wireFaq() {
    document.querySelectorAll(".aitt-faq details").forEach(function (details) {
      details.addEventListener("toggle", function () {
        if (details.open) track("aitt_faq_open");
      });
    });
  }

  function setStatus(statusEl, message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "form-status " + (type || "");
  }

  function wireForm(formId, eventPrefix, successMessage) {
    const form = document.getElementById(formId);
    if (!form) return;
    const status = form.querySelector(".form-status") || document.getElementById(formId + "Status");
    const button = form.querySelector('button[type="submit"]');
    const pageSource = form.querySelector('input[name="pageSource"]');
    let started = false;

    function updatePageSource() {
      if (pageSource) pageSource.value = window.location.pathname || "/";
    }
    updatePageSource();

    form.addEventListener("focusin", function () {
      if (!started) {
        started = true;
        track(eventPrefix + "_form_start");
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setStatus(status, "", "");

      if (!form.checkValidity()) {
        form.reportValidity();
        const firstInvalid = form.querySelector(":invalid");
        if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
        return;
      }

      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());

      // Multi-select checkboxes for interest areas
      const interests = data.getAll("interestAreas");
      if (interests.length) payload.interestAreas = interests.join(", ");

      if (payload.website) {
        setStatus(status, successMessage, "success");
        form.reset();
        updatePageSource();
        return;
      }

      payload.turnstileToken = data.get("cf-turnstile-response");
      delete payload["cf-turnstile-response"];

      if (!payload.turnstileToken) {
        setStatus(status, "Please complete the verification check before sending.", "error");
        return;
      }

      const originalButtonContent = button ? button.innerHTML : "";
      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }
      form.setAttribute("aria-busy", "true");

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(function () {
          return {};
        });
        if (!response.ok || !result.ok) {
          throw new Error("submit_failed");
        }
        track(eventPrefix + "_form_submit");
        setStatus(status, successMessage, "success");
        form.reset();
        updatePageSource();
        if (window.turnstile) window.turnstile.reset();
      } catch (_) {
        setStatus(
          status,
          "The form could not be sent yet. Please email hello@pathfindertherapy.org.uk directly.",
          "error"
        );
        if (window.turnstile) window.turnstile.reset();
      } finally {
        form.removeAttribute("aria-busy");
        if (button) {
          button.disabled = false;
          button.innerHTML = originalButtonContent;
        }
      }
    });
  }

  function renderTracker() {
    const host = document.getElementById("aittStatusTracker");
    if (!host || !Array.isArray(cfg.statusTracker)) return;
    host.innerHTML = "";
    cfg.statusTracker.forEach(function (stage) {
      const row = document.createElement("div");
      row.className = "aitt-tracker-row";
      const label = document.createElement("span");
      label.textContent = stage.label;
      const status = document.createElement("span");
      status.className = "aitt-tracker-status";
      status.textContent = stage.status;
      row.appendChild(label);
      row.appendChild(status);
      host.appendChild(row);
    });
  }

  if (document.body && document.body.dataset.aittPage === "pilot") {
    track("aitt_page_view");
  }
  if (document.body && document.body.dataset.aittPage === "news") {
    track("aitt_news_view");
  }

  applyStatusBadge();
  renderTracker();
  wireCtas();
  wireFaq();
  wireForm(
    "aittParticipantForm",
    "aitt_participant",
    "Thank you. Your expression of interest has been received. Submitting this form does not confirm acceptance or establish a therapeutic relationship."
  );
  wireForm(
    "aittProfessionalForm",
    "aitt_professional",
    "Thank you. Your partnership enquiry has been received. We will respond as soon as practicable."
  );
})();
