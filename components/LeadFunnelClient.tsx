"use client";

import { useEffect } from "react";
import Link from "next/link";
import { site } from "@/data/site";
import { fireConversionOnce, trackLandingView } from "@/lib/analytics";

export function ThankYouContent() {
  useEffect(() => {
    fireConversionOnce("thank_you_page");
  }, []);

  return (
    <div className="funnel-shell">
      <header className="funnel-header">
        <Link href="/" className="brand-mark" aria-label="Pathfinder Therapy home">
          <span className="brand-symbol">P</span>
          <span className="brand-name">Pathfinder</span>
        </Link>
      </header>

      <main className="funnel-main funnel-main-centered">
        <section className="thank-you-panel">
          <p className="eyebrow">Enquiry received</p>
          <h1>Thank you.</h1>
          <p className="funnel-lead">
            Brent will respond to non-urgent enquiries as soon as possible, usually within one working day.
          </p>
          <ul className="trust-list">
            <li>Trauma-informed psychotherapy in Lisbon and online</li>
            <li>Individual, couples, EMDR, and online sessions</li>
            <li>Therapist with veterans and complex trauma experience</li>
          </ul>
          <p className="contact-fallback">
            Need to reach us directly? Email <a href={`mailto:${site.email}`}>{site.email}</a> or WhatsApp{" "}
            <a href={site.whatsappUrl}>{site.phoneDisplay}</a>.
          </p>
          <Link className="contact-submit thank-you-home" href="/">
            Return to homepage
          </Link>
        </section>
      </main>
    </div>
  );
}

export function StartLandingTracker() {
  useEffect(() => {
    trackLandingView("start");
  }, []);

  return null;
}
