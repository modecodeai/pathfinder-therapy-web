import { buildBreadcrumbSchema } from "./site-schema.mjs";

const SITE = "https://www.pathfindertherapy.com";

export function buildCrisisPageBody() {
  return `<article class="approachPage">
<section class="approachHero" aria-labelledby="crisis-title">
  <div class="approachHeroCopy">
    <p class="sectionKicker">Urgent support</p>
    <h1 class="approachHeroTitle" id="crisis-title">Crisis support in Portugal</h1>
    <p class="approachHeroText"><strong>Pathfinder Therapy is not a crisis or emergency service.</strong> If you or someone else is in immediate danger, call emergency services now. The contacts below are for urgent mental health support in Portugal.</p>
  </div>
</section>
<section class="approachEssay" aria-labelledby="crisis-emergency">
  <div class="approachEssayInner">
    <p class="sectionKicker">Immediate danger</p>
    <h2 class="approachSectionTitle" id="crisis-emergency">Emergency services</h2>
    <div class="approachBody">
      <ul>
        <li><strong>112</strong> — European emergency number (police, fire, ambulance). Available in English.</li>
        <li><strong>808 24 24 24</strong> — SNS 24 (Portuguese health line). Clinical guidance and direction to appropriate care.</li>
      </ul>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="crisis-helplines">
  <div class="approachEssayInner">
    <p class="sectionKicker">Emotional support</p>
    <h2 class="approachSectionTitle" id="crisis-helplines">Helplines in Portugal</h2>
    <div class="approachBody">
      <ul>
        <li><strong>SOS Voz Amiga</strong> — <a href="tel:+351225461007">225 461 007</a> / <a href="tel:+351213544040">213 544 040</a> (confidential emotional support, Portuguese/English where available).</li>
        <li><strong>SOS Estudante</strong> — <a href="tel:+351808200204">808 200 204</a> (support for students).</li>
        <li><strong>Linha Saúde 24</strong> — <a href="tel:+351808242424">808 24 24 24</a> (health information and triage).</li>
      </ul>
      <p>Helplines can change. If a number is unavailable, call <strong>112</strong> or SNS 24 for current guidance.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="crisis-expats">
  <div class="approachEssayInner">
    <p class="sectionKicker">English-speaking support</p>
    <h2 class="approachSectionTitle" id="crisis-expats">If you are an expat in Lisbon</h2>
    <div class="approachBody">
      <p>English-speaking crisis support may be limited outside clinical services. In an emergency, <strong>112</strong> operates in English. Your embassy or local hospital emergency department can also advise on urgent care options.</p>
      <p>Pathfinder offers <strong>non-urgent</strong> psychotherapy in English — initial consultations and ongoing therapy in Lisbon or online. It is not a substitute for crisis intervention.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="crisis-pathfinder">
  <div class="approachEssayInner">
    <p class="sectionKicker">Pathfinder Therapy</p>
    <h2 class="approachSectionTitle" id="crisis-pathfinder">When to contact Pathfinder</h2>
    <div class="approachBody">
      <p>Contact Pathfinder for <strong>non-urgent</strong> enquiries about starting therapy — anxiety, trauma, relationships, life transitions, and similar concerns that do not require immediate emergency response.</p>
      <p><a href="/start/">Send a brief enquiry</a> · <a href="/book/">Book an initial Zoom call</a> · <a href="tel:+351914775365">+351 914 775 365</a></p>
      <p>Brent responds within one working day. If you are in crisis, please use the emergency contacts above first.</p>
    </div>
  </div>
</section>
</article>`;
}

export function buildCrisisPage(shellHtml, buildInteriorPageV2) {
  const schema = `${buildBreadcrumbSchema([
    { name: "Home", url: `${SITE}/` },
    { name: "Crisis support", url: `${SITE}/crisis-support/` }
  ])}`;

  return buildInteriorPageV2(shellHtml, {
    title: "Crisis Support Portugal | Pathfinder Therapy",
    description:
      "Pathfinder Therapy is not a crisis service. Emergency numbers and mental health helplines in Portugal for urgent support. Non-urgent therapy enquiries welcome.",
    canonical: `${SITE}/crisis-support/`,
    mainInner: buildCrisisPageBody(),
    schema
  });
}
