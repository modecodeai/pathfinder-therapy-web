const CONTACT_EMAIL = "hello@pathfindertherapy.org.uk";

const ENQUIRY_TYPES = new Set([
  "I’m seeking support for myself",
  "I’m referring someone else",
  "I’m a professional making an enquiry",
  "Partnership / funding enquiry",
  "General enquiry"
]);

const CONTACT_METHODS = new Set([
  "Email",
  "Telephone",
  "Either email or telephone"
]);

const FORM_PAGES = new Set([
  "/contact",
  "/contact.html",
  "/get-support",
  "/get-support.html"
]);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function singleLine(value, maxLength) {
  return stringValue(value)
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, maxLength)
    .trim();
}

function messageValue(value) {
  return stringValue(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .slice(0, 1600)
    .trim();
}

function isChecked(value) {
  return value === "on" || value === true;
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function verifyTurnstile(token, request, secret) {
  try {
    const body = new URLSearchParams({
      secret,
      response: token
    });
    const remoteIp = request.headers.get("CF-Connecting-IP");
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body
      }
    );

    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid form request." }, 400);
  }

  if (stringValue(body.website)) {
    return jsonResponse({ ok: true });
  }

  const name = singleLine(body.name, 120);
  const email = singleLine(body.email, 254).toLowerCase();
  const phone = singleLine(body.phone, 40);
  const enquiryType = singleLine(body.enquiryType, 80);
  const preferredContact = singleLine(body.preferredContact, 40);
  const message = messageValue(body.message);
  const pageSource = FORM_PAGES.has(stringValue(body.pageSource))
    ? stringValue(body.pageSource)
    : "Unknown form page";
  const turnstileToken = stringValue(body.turnstileToken);

  if (
    name.length < 2 ||
    !isValidEmail(email) ||
    !ENQUIRY_TYPES.has(enquiryType) ||
    !CONTACT_METHODS.has(preferredContact) ||
    !message ||
    !isChecked(body.consent) ||
    !isChecked(body.crisisAcknowledgement)
  ) {
    return jsonResponse(
      { ok: false, message: "Please complete all required form fields." },
      400
    );
  }

  const turnstileSecret =
    env.TURNSTILE_SECRET_KEY || env.CF_TURNSTILE_SECRET_KEY;
  if (!turnstileSecret || !env.RESEND_API_KEY) {
    return jsonResponse(
      { ok: false, message: "The enquiry service is not configured." },
      503
    );
  }

  if (
    !turnstileToken ||
    !(await verifyTurnstile(turnstileToken, request, turnstileSecret))
  ) {
    return jsonResponse(
      { ok: false, message: "The verification check was not accepted." },
      403
    );
  }

  const emailText = [
    "New enquiry from the Pathfinder Therapy CIC website",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Telephone: ${phone || "Not provided"}`,
    `Enquiry type: ${enquiryType}`,
    `Preferred contact: ${preferredContact}`,
    `Form page: ${pageSource}`,
    "",
    "Message:",
    message
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from:
          env.CONTACT_FROM_EMAIL ||
          "Pathfinder Therapy CIC <onboarding@resend.dev>",
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject: `CIC website enquiry: ${enquiryType}`,
        text: emailText
      })
    });

    if (!response.ok) {
      return jsonResponse(
        { ok: false, message: "The enquiry could not be delivered." },
        502
      );
    }
  } catch {
    return jsonResponse(
      { ok: false, message: "The enquiry could not be delivered." },
      502
    );
  }

  return jsonResponse({
    ok: true,
    message: "Thank you. Your enquiry has been sent to Pathfinder."
  });
}
