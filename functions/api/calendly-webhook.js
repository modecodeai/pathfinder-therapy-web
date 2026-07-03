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
    const invitee = payload.payload?.invitee ?? payload.payload?.resource ?? {};

    if (event === "invitee.created") {
      console.log(
        JSON.stringify({
          type: "calendly_invitee_created",
          email: invitee.email ?? null,
          name: invitee.name ?? null,
          event_type: payload.payload?.event_type?.name ?? null,
          scheduled_at: payload.payload?.event?.start_time ?? null
        })
      );
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
