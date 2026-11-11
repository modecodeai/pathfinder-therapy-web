import Link from "next/link";
import { leadFunnel } from "@/data/site";
import { therapistProfiles } from "@/data/team";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "/about/",
  "About the Team | Pathfinder Therapy Lisbon & Online",
  "Meet Brent Kelly, who leads Pathfinder Therapy in Lisbon, and Tim Felton and Sophie Gidley, who support online therapy through Pathfinder."
);

export default function Page() {
  return (
    <main className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <Link href="/" className="back-link">
          ← Home
        </Link>
        <p className="eyebrow">About Pathfinder Therapy</p>
        <h1 id="about-title">A Lisbon clinic, with a carefully held online team.</h1>
        <p className="about-hero-lead">
          Pathfinder Therapy is led in Lisbon by Brent Kelly. Face-to-face therapy is held by Brent at the
          Lisbon clinic; online provision is supported by trusted therapists including Tim Felton and
          Sophie Gidley.
        </p>
        <div className="about-hero-actions">
          <Link href={leadFunnel.defaultCtaPath} className="contact-submit">
            Arrange an initial consultation
          </Link>
          <Link href="/contact" className="back-link">
            Send an enquiry
          </Link>
        </div>
      </section>

      <section className="about-team-section" aria-labelledby="team-title">
        <div className="about-section-heading">
          <p className="eyebrow">The team</p>
          <h2 id="team-title">Who you may work with</h2>
          <p>
            The team is deliberately small. Brent remains the point of contact for the Lisbon clinic, while
            online sessions allow Pathfinder to offer appropriate support beyond the room.
          </p>
        </div>

        <div className="about-team-grid">
          {therapistProfiles.map((profile) => (
            <article className="therapist-card" key={profile.name}>
              <img src={profile.image} alt={profile.imageAlt} width="320" height="400" />
              <div className="therapist-card-copy">
                <p className="therapist-availability">{profile.availability}</p>
                <h3>{profile.name}</h3>
                <p className="therapist-role">{profile.role}</p>
                <p>{profile.summary}</p>
                <p>{profile.detail}</p>
                <ul aria-label={`${profile.name} credentials`}>
                  {profile.credentials.map((credential) => (
                    <li key={credential}>{credential}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-boundary-section" aria-labelledby="clinic-boundary-title">
        <div>
          <p className="eyebrow">Lisbon and online</p>
          <h2 id="clinic-boundary-title">Clear routes into care.</h2>
        </div>
        <p>
          If you are looking for therapy in Lisbon, Brent is the therapist you will meet face to face at the
          clinic. If online therapy is a better fit, Brent can help identify whether Tim or Sophie is the
          appropriate route, including Sophie for online couples work.
        </p>
      </section>
    </main>
  );
}
