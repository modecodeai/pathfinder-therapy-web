"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { enquiryTypes, site } from "@/data/site";
import { trackFormStart, trackGenerateLead } from "@/lib/analytics";
import { attributionPayload } from "@/lib/lead-attribution";

type ContactFormProps = {
  source: string;
  compact?: boolean;
  redirectTo?: string;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm({ source, compact = false, redirectTo = "/thank-you/" }: ContactFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [formStarted, setFormStarted] = useState(false);

  function handleFormStart() {
    if (formStarted) {
      return;
    }

    setFormStarted(true);
    trackFormStart(source);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          ...attributionPayload(),
          source
        })
      });

      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "The enquiry could not be sent. Please contact us directly.");
      }

      setStatus("success");
      setMessage(result.message ?? "Thank you. Your enquiry has been sent securely to Pathfinder Therapy.");
      form.reset();
      trackGenerateLead(source);

      window.setTimeout(() => {
        router.push(redirectTo);
      }, 600);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The enquiry could not be sent. Please contact us directly.");
    }
  }

  return (
    <form
      ref={formRef}
      action="/api/contact"
      className={`contact-form${compact ? " contact-form-compact" : ""}`}
      method="post"
      onSubmit={handleSubmit}
      onFocus={handleFormStart}
    >
      <div className="contact-trap" aria-hidden="true">
        <label>
          <span>Website</span>
          <input autoComplete="off" name="website" tabIndex={-1} type="text" />
        </label>
      </div>

      <div className="contact-grid">
        <label>
          <span>Name</span>
          <input autoComplete="name" name="name" required type="text" />
        </label>

        <label>
          <span>Email</span>
          <input autoComplete="email" name="email" required type="email" />
        </label>

        <label>
          <span>Phone</span>
          <input autoComplete="tel" name="phone" type="tel" />
        </label>

        <label>
          <span>What are you looking for?</span>
          <select name="enquiryType" required defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            {enquiryTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>Message</span>
        <textarea
          name="message"
          required
          rows={compact ? 4 : 6}
          placeholder="A brief note about what you are looking for is enough."
        />
      </label>

      <p className="contact-security-note">
        This secure form is for non-urgent enquiries. Please avoid sharing detailed clinical history here.
      </p>

      <label className="contact-consent">
        <input name="nonUrgentConsent" required type="checkbox" value="on" />
        <span>I understand this form is for non-urgent enquiries only and should not be used in a crisis.</span>
      </label>

      <button className="contact-submit" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? "Sending..." : "Send an enquiry"}
      </button>

      {message ? (
        <p className={`contact-status contact-status-${status}`} role="status">
          {message}
        </p>
      ) : null}

      <p className="contact-fallback">
        If the form is unavailable, email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> or WhatsApp{" "}
        <a href={site.whatsappUrl}>{site.phoneDisplay}</a>.
      </p>
    </form>
  );
}
