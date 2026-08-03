/**
 * Pathfinder Therapy CIC contact / AITT enquiry API (Cloudflare Pages Function).
 * Supports general contact, participant interest, and professional partnership forms.
 * Does not accept detailed trauma, medical or amputation histories.
 */

const GENERAL_ENQUIRY_TYPES = new Set([
  "I’m seeking support for myself",
  "I’m referring someone else",
  "I’m a professional making an enquiry",
  "Partnership / funding enquiry",
  "General enquiry",
  "AITT participant interest",
  "AITT professional partnership"
]);

const FORM_TYPES = new Set(["general", "aitt_participant", "aitt_professional"]);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const rateBucket = new Map();

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function clean(value, max = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isChecked(value) {
  return value === "on" || value === true || value === "true";
}

function clientKey(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  );
}

function allowRequest(key) {
  const now = Date.now();
  const entry = rateBucket.get(key) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  rateBucket.set(key, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

async function verifyTurnstile(token, secret, ip) {
  if (!secret) return false;
  if (!token) return false;
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  return Boolean(data.success);
}

function buildEmail(formType, body) {
  const lines = [
    `New ${formType} enquiry — Pathfinder Therapy CIC`,
    "",
    `Form type: ${formType}`,
    `Page source: ${clean(body.pageSource, 200) || "not provided"}`,
    `Name: ${clean(body.name, 120)}`,
    `Email: ${clean(body.email, 160)}`,
    `Telephone: ${clean(body.phone || body.telephone, 60) || "Not provided"}`,
    `Country: ${clean(body.country, 80) || "Not provided"}`,
    `Preferred contact: ${clean(body.preferredContact, 80) || "Not provided"}`
  ];

  if (formType === "aitt_participant") {
    lines.push(
      `Enquiring for: ${clean(body.enquiringFor, 80) || "Not provided"}`,
      `Veteran / serving / civilian: ${clean(body.serviceStatus, 80) || "Not provided"}`,
      `Interest areas: ${clean(body.interestAreas, 240) || "Not provided"}`,
      `Delivery interest: ${clean(body.deliveryInterest, 80) || "Not provided"}`,
      `Current location: ${clean(body.currentLocation, 120) || "Not provided"}`,
      `Currently receiving therapy: ${clean(body.currentlyReceivingTherapy, 40) || "Not provided"}`,
      `Supported by rehab/pain service: ${clean(body.rehabSupport, 40) || "Not provided"}`,
      `Previous VR experience: ${clean(body.previousVrExperience, 40) || "Not provided"}`,
      `Accessibility requirements (brief): ${clean(body.accessibilityRequirements, 400) || "Not provided"}`,
      "",
      "Broad reason for interest:",
      clean(body.message || body.reason, 1200) || "Not provided"
    );
  } else if (formType === "aitt_professional") {
    lines.push(
      `Professional role: ${clean(body.professionalRole, 120) || "Not provided"}`,
      `Organisation: ${clean(body.organisation, 160) || "Not provided"}`,
      `Service type: ${clean(body.serviceType, 120) || "Not provided"}`,
      `Area of interest: ${clean(body.areaOfInterest, 200) || "Not provided"}`,
      "",
      "Proposed collaboration:",
      clean(body.message || body.proposedCollaboration, 1200) || "Not provided"
    );
  } else {
    lines.push(
      `Enquiry type: ${clean(body.enquiryType, 120) || "Not provided"}`,
      "",
      "Message:",
      clean(body.message, 1600) || "Not provided"
    );
  }

  lines.push("", "Consent logged: yes", `Received (UTC): ${new Date().toISOString()}`);
  return lines.join("\n");
}

export async function onRequestPost(context) {
  const { request, env = {} } = context;

  try {
    const ip = clientKey(request);
    if (!allowRequest(ip)) {
      return jsonResponse({ ok: false, message: "Too many requests. Please try again shortly." }, 429);
    }

    const body = await request.json();

    if (body.website) {
      return jsonResponse({ ok: true, message: "Thank you. Your enquiry has been received." });
    }

    const turnstileSecret = env.TURNSTILE_SECRET_KEY || env.CF_TURNSTILE_SECRET_KEY;
    if (!turnstileSecret || !env.RESEND_API_KEY) {
      return jsonResponse(
        {
          ok: false,
          message: "The enquiry could not be sent. Please email hello@pathfindertherapy.org.uk."
        },
        503
      );
    }

    const formType = clean(body.formType || "general", 40) || "general";
    if (!FORM_TYPES.has(formType)) {
      return jsonResponse({ ok: false, message: "Invalid form type." }, 400);
    }

    const name = clean(body.name, 120);
    const email = clean(body.email, 160);
    const message = clean(body.message || body.reason || body.proposedCollaboration, 1600);

    if (!name || name.length < 2) {
      return jsonResponse({ ok: false, message: "Please enter your name." }, 400);
    }
    if (!email || !isValidEmail(email)) {
      return jsonResponse({ ok: false, message: "Please enter a valid email address." }, 400);
    }
    if (!message || message.length < 10) {
      return jsonResponse({ ok: false, message: "Please include a brief message." }, 400);
    }

    if (!isChecked(body.consent)) {
      return jsonResponse({ ok: false, message: "Please confirm consent to be contacted." }, 400);
    }

    if (formType === "general") {
      const enquiryType = clean(body.enquiryType, 120);
      if (!enquiryType || !GENERAL_ENQUIRY_TYPES.has(enquiryType)) {
        return jsonResponse({ ok: false, message: "Please choose an enquiry type." }, 400);
      }
      if (!isChecked(body.crisisAcknowledgement)) {
        return jsonResponse(
          { ok: false, message: "Please complete the required acknowledgement." },
          400
        );
      }
    } else if (!isChecked(body.privacyAck)) {
      return jsonResponse(
        { ok: false, message: "Please complete the required acknowledgement." },
        400
      );
    }

    if (formType === "aitt_professional") {
      if (!clean(body.organisation, 160) || !clean(body.professionalRole, 120)) {
        return jsonResponse({ ok: false, message: "Please include your role and organisation." }, 400);
      }
    }

    const turnstileOk = await verifyTurnstile(
      body.turnstileToken,
      turnstileSecret,
      ip
    );
    if (!turnstileOk) {
      return jsonResponse({ ok: false, message: "Please complete the verification check." }, 400);
    }

    const emailBody = buildEmail(formType, body);
    const subjectPrefix =
      formType === "aitt_participant"
        ? "AITT participant interest"
        : formType === "aitt_professional"
          ? "AITT professional partnership"
          : "Website enquiry";

    const fromEmail =
      env.CONTACT_FROM_EMAIL || "Pathfinder Therapy CIC <hello@pathfindertherapy.org.uk>";
    const toEmail = env.CONTACT_TO_EMAIL || "hello@pathfindertherapy.org.uk";

    const notifyResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `${subjectPrefix}: ${name}`,
        text: emailBody
      })
    });

    if (!notifyResponse.ok) {
      throw new Error("Email delivery failed");
    }

    return jsonResponse({
      ok: true,
      message: "Thank you. Your enquiry has been received."
    });
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: "The enquiry could not be sent. Please email hello@pathfindertherapy.org.uk."
      },
      500
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
