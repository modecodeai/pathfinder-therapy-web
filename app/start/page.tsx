import { ContactForm } from "@/components/ContactForm";
import { FunnelShell } from "@/components/FunnelShell";
import { StartLandingTracker } from "@/components/LeadFunnelClient";
import { site } from "@/data/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = {
  ...createPageMetadata(
    "/start/",
    "Begin Therapy | Pathfinder Therapy Lisbon",
    "Start your enquiry for trauma-informed psychotherapy in Lisbon or online. Secure contact form with a response within one working day."
  ),
  robots: {
    index: false,
    follow: false
  }
};

export default function StartPage() {
  return (
    <>
      <StartLandingTracker />
      <FunnelShell
        eyebrow="Private practice · Lisbon & online"
        title="Begin your enquiry."
        intro="Tell us what you are looking for and Brent will respond to non-urgent enquiries, usually within one working day."
      >
        <div className="funnel-grid">
          <section className="funnel-form-panel">
            <p className="funnel-form-kicker">Secure enquiry form</p>
            <ContactForm source="start_landing" compact redirectTo="/thank-you/" />
          </section>

          <aside className="funnel-trust-panel">
            <p className="funnel-form-kicker">Why Pathfinder</p>
            <ul className="trust-list">
              <li>Trauma-informed psychotherapy with Brent Kelly</li>
              <li>Individual, couples, EMDR, and online sessions</li>
              <li>Lisbon clinic and secure online therapy</li>
              <li>Experienced with veterans, attachment, and complex trauma</li>
            </ul>

            <div className="funnel-contact-card">
              <p className="funnel-form-kicker">Prefer direct contact</p>
              <p>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>
              <p>
                <a href={site.whatsappUrl}>WhatsApp {site.phoneDisplay}</a>
              </p>
              <p className="funnel-address">{site.addressDisplay}</p>
            </div>

            <p className="funnel-crisis-note">
              This form is for non-urgent enquiries only. If you are in immediate danger or crisis, contact local
              emergency services.
            </p>
          </aside>
        </div>
      </FunnelShell>
    </>
  );
}
