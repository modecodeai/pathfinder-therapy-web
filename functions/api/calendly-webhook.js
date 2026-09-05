function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function verifySignature(rawBody, signatureHeader, signingKey) {
  if (!signingKey || !signatureHeader) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const payload = `${timestamp}.${rawBody}`;
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return expected === signature;
}

function formatDateTime(value) {
  if (!value) return "Not provided";
  try {
    return new Date(value).toLocaleString("en-GB", {
      timeZone: "Europe/Lisbon",
      dateStyle: "full",
      timeStyle: "short"
    });
  } catch {
    return value;
  }
}

function extractInviteeDetails(payload) {
  const invitee = payload.payload?.invitee ?? payload.payload ?? {};
  const scheduledEvent = invitee.scheduled_event ?? payload.payload?.scheduled_event ?? {};
  const tracking = invitee.tracking ?? payload.payload?.tracking ?? {};

  return {
    name: invitee.name ?? null,
    email: invitee.email ?? null,
    timezone: invitee.timezone ?? null,
    eventName: scheduledEvent.name ?? payload.payload?.event_type?.name ?? null,
    startTime: scheduledEvent.start_time ?? payload.payload?.event?.start_time ?? null,
    endTime: scheduledEvent.end_time ?? null,
    locationType: scheduledEvent.location?.type ?? null,
    joinUrl: scheduledEvent.location?.join_url ?? scheduledEvent.location?.location ?? null,
    cancelUrl: invitee.cancel_url ?? null,
    rescheduleUrl: invitee.reschedule_url ?? null,
    tracking
  };
}

function formatTracking(tracking) {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "salesforce_uuid"];
  return keys
    .map((key) => {
      const value = typeof tracking[key] === "string" ? tracking[key].trim() : "";
      return value ? `${key}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

async function notifyBrent(env, details) {
  if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured — skipping Calendly booking email.");
    return;
  }

  const fromEmail = env.CONTACT_FROM_EMAIL || "Pathfinder Therapy <onboarding@resend.dev>";
  const toEmail = env.CONTACT_TO_EMAIL || env.CALENDLY_NOTIFY_EMAIL || "hi@pathfindertherapy.com";
  const tracking = formatTracking(details.tracking);

  const emailBody = [
    "New Calendly booking — Pathfinder Therapy",
    "",
    `Name: ${details.name || "Not provided"}`,
    `Email: ${details.email || "Not provided"}`,
    `Timezone: ${details.timezone || "Not provided"}`,
    `Event: ${details.eventName || "Initial consultation"}`,
    `Starts: ${formatDateTime(details.startTime)} (Europe/Lisbon)`,
    details.endTime ? `Ends: ${formatDateTime(details.endTime)} (Europe/Lisbon)` : "",
    details.locationType ? `Location type: ${details.locationType}` : "",
    details.joinUrl ? `Join URL: ${details.joinUrl}` : "",
    details.cancelUrl ? `Cancel URL: ${details.cancelUrl}` : "",
    details.rescheduleUrl ? `Reschedule URL: ${details.rescheduleUrl}` : "",
    "",
    tracking ? `Attribution:\n${tracking}` : "",
    "",
    "Calendly has also sent the invitee their confirmation email with Zoom details."
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: details.email || toEmail,
      subject: `Calendly booking: ${details.name || "New invitee"} — ${details.eventName || "Initial consultation"}`,
      text: emailBody
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Calendly booking email failed: ${errorText}`);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("Calendly-Webhook-Signature");

    if (env.CALENDLY_WEBHOOK_SIGNING_KEY) {
      const valid = await verifySignature(rawBody, signature, env.CALENDLY_WEBHOOK_SIGNING_KEY);
      if (!valid) {
        return jsonResponse({ ok: false, message: "Invalid webhook signature." }, 401);
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === "invitee.created") {
      const details = extractInviteeDetails(payload);

      console.log(
        JSON.stringify({
          type: "calendly_invitee_created",
          email: details.email,
          name: details.name,
          event_type: details.eventName,
          scheduled_at: details.startTime
        })
      );

      await notifyBrent(env, details);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Calendly webhook error", error);
    return jsonResponse({ ok: false, message: "Webhook processing failed." }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Calendly-Webhook-Signature"
    }
  });
}
