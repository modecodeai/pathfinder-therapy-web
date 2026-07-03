const VALID_ENQUIRY_TYPES = new Set([
  "Individual therapy",
  "Couples therapy",
  "EMDR",
  "Online therapy",
  "Clinical enquiry",
  "Other"
]);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatAttribution(body) {
  const keys = [
    "source",
    "landing_page",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid"
  ];

  return keys
    .map((key) => {
      const value = typeof body[key] === "string" ? body[key].trim() : "";
      return value ? `${key}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    if (body.website) {
      return jsonResponse({
        ok: true,
        message: "Thank you. Your enquiry has been sent securely."
      });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const enquiryType = typeof body.enquiryType === "string" ? body.enquiryType.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const consent = body.nonUrgentConsent;

    if (!name || name.length < 2) {
      return jsonResponse({ ok: false, message: "Please enter your name." }, 400);
    }

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ ok: false, message: "Please enter a valid email address." }, 400);
    }

    if (!enquiryType || !VALID_ENQUIRY_TYPES.has(enquiryType)) {
      return jsonResponse({ ok: false, message: "Please choose an enquiry type." }, 400);
    }

    if (!message || message.length < 10) {
      return jsonResponse({ ok: false, message: "Please include a brief message." }, 400);
    }

    if (consent !== "on" && consent !== true) {
      return jsonResponse({ ok: false, message: "Please confirm the non-urgent enquiry consent." }, 400);
    }

    const attribution = formatAttribution(body);
    const emailBody = [
      "New enquiry from Pathfinder Therapy website",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Enquiry type: ${enquiryType}`,
      "",
      "Message:",
      message,
      "",
      attribution ? `Attribution:\n${attribution}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    if (env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env.CONTACT_FROM_EMAIL || "Pathfinder Therapy <onboarding@resend.dev>",
          to: [env.CONTACT_TO_EMAIL || "hi@pathfindertherapy.com"],
          reply_to: email,
          subject: `Website enquiry: ${enquiryType} — ${name}`,
          text: emailBody
        })
      });

      if (!response.ok) {
        throw new Error("Email delivery failed");
      }
    }

    return jsonResponse({
      ok: true,
      message: "Thank you. Your enquiry has been sent securely to Pathfinder Therapy."
    });
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: "The enquiry could not be sent. Please contact us directly."
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
