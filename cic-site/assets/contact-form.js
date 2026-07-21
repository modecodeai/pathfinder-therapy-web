(function () {
  const form = document.getElementById("pathfinderContactForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  const pageSource = form.querySelector('input[name="pageSource"]');
  const button = form.querySelector('button[type="submit"]');

  function updatePageSource() {
    if (pageSource) pageSource.value = window.location.pathname || "/";
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.className = `form-status ${type || ""}`.trim();
  }

  updatePageSource();

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    setStatus("", "");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    if (payload.website) {
      setStatus("Thank you. Your enquiry has been received.", "success");
      form.reset();
      updatePageSource();
      return;
    }

    payload.turnstileToken = data.get("cf-turnstile-response");
    delete payload["cf-turnstile-response"];

    if (!payload.turnstileToken) {
      setStatus("Please complete the verification check before sending.", "error");
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
        throw new Error("The form could not be sent.");
      }

      setStatus(
        "Thank you. Your enquiry has been sent to Pathfinder. We will respond as soon as practicable.",
        "success"
      );
      form.reset();
      updatePageSource();
      if (window.turnstile) window.turnstile.reset();
    } catch {
      setStatus(
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
})();
