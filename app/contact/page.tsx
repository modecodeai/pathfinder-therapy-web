import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/data/site";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "/contact/",
  "Contact | Pathfinder Therapy",
  "Begin a secure, non-urgent enquiry for psychotherapy in Lisbon or online."
);

export default function ContactPage() {
  return (
    <div className="contact-page">
      <header className="contact-page-header">
        <Link href="/" className="back-link">
          ← Home
        </Link>
        <p className="eyebrow">Contact</p>
        <h1>Begin an enquiry.</h1>
        <p className="contact-page-intro">
          Pathfinder Therapy responds to non-urgent enquiries only. If you are in immediate danger or crisis,
          contact local emergency services or visit our{" "}
          <Link href="/crisis-support">crisis support page</Link>.
        </p>
      </header>

      <div className="contact-page-grid">
        <section aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading">Tell us what you are looking for.</h2>
          <ContactForm source="contact_page" redirectTo="/thank-you/" />
        </section>

        <aside className="contact-clinic-card">
          <p className="eyebrow">Lisbon clinic</p>
          <h2>Pathfinder Therapy Lisbon Clinic</h2>
          <p className="funnel-address">{site.addressDisplay}</p>
          <p>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
          <p>
            <a href={site.whatsappUrl}>WhatsApp {site.phoneDisplay}</a>
          </p>
        </aside>
      </div>
    </div>
  );
}
