/**
 * EMDR Therapy Lisbon authority page builder.
 * Canonical: https://www.pathfindertherapy.com/emdr-therapy-lisbon/
 */
import { BOOKING_LABEL, BOOKING_PATH, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";
import { buildBreadcrumbSchema } from "./site-schema.mjs";
import { getClinicDirectionsUrl } from "./site-location.mjs";
import { BRENT_TITLE, CREDENTIAL_BODY } from "./site-credentials.mjs";

export const EMDR_LISBON_ROUTE = "/emdr-therapy-lisbon/";
export const EMDR_LEGACY_ROUTES = ["/therapy/emdr/", "/therapy/emdr"];

const SITE = "https://www.pathfindertherapy.com";
const CANONICAL = `${SITE}${EMDR_LISBON_ROUTE}`;
const DIRECTIONS_URL = getClinicDirectionsUrl();
const HERO_IMAGE = "/assets/images/hero-01.webp";
const BRENT_IMAGE = "/assets/images/about-brent.webp";

export const EMDR_LISBON_META = {
  title: "EMDR Therapy Lisbon | English-Speaking Trauma Therapy",
  description:
    "English-speaking EMDR therapy in central Lisbon and online. Careful, trauma-informed support for PTSD, anxiety, medical trauma and difficult life experiences.",
  canonical: CANONICAL,
  ogTitle: "EMDR Therapy in Lisbon",
  ogDescription:
    "English-speaking, trauma-informed EMDR therapy in central Lisbon and online.",
  ogImage: `${SITE}${HERO_IMAGE}`
};

const HELP_TOPICS = [
  {
    title: "PTSD and traumatic events",
    copy: "Intrusive memories, nightmares, avoidance, heightened alertness or distress following an overwhelming event."
  },
  {
    title: "Complex and developmental trauma",
    copy: "Repeated experiences of neglect, threat, instability, shame or emotional disconnection that continue to shape relationships and self-belief."
  },
  {
    title: "Anxiety, panic and triggers",
    copy: "Present-day reactions that feel disproportionate, automatic or linked to earlier frightening experiences."
  },
  {
    title: "Medical trauma",
    copy: "Distress connected to illness, surgery, intensive care, medical procedures, medical negligence, disability or significant changes to the body."
  },
  {
    title: "Military and veteran experiences",
    copy: "Combat-related experiences, injury, loss, moral conflict, transition from service, hypervigilance and events that may be difficult to discuss outside military culture."
  },
  {
    title: "Bereavement and traumatic loss",
    copy: "Losses that remain associated with disturbing images, guilt, helplessness or unresolved traumatic circumstances."
  },
  {
    title: "Attachment and relationship wounds",
    copy: "Experiences of abandonment, rejection, betrayal, inconsistent care or relational threat that remain active in present relationships."
  },
  {
    title: "Phobias and specific fears",
    copy: "Fears that may be associated with a disturbing event or learned threat response."
  }
];

const PRINCIPLES = [
  {
    title: "Assessment before processing",
    copy: "We explore your current symptoms, history, goals, safety, resources and whether EMDR is the most appropriate approach."
  },
  {
    title: "Preparation and stabilisation",
    copy: "Grounding, emotional regulation and resourcing may be developed before approaching difficult memories."
  },
  {
    title: "Collaborative pacing",
    copy: "You retain choice throughout the process. Therapy can slow down, pause or return to preparation when needed."
  },
  {
    title: "Integration after processing",
    copy: "EMDR is connected back to your relationships, identity, present-day choices and wider therapeutic goals."
  }
];

const PROCESS_STEPS = [
  {
    title: "History and treatment planning",
    copy: "We begin by understanding what brings you to therapy, how the difficulty affects you now and what you hope will change."
  },
  {
    title: "Preparation",
    copy: "We discuss the EMDR process and develop ways to remain oriented, grounded and emotionally regulated during and between sessions."
  },
  {
    title: "Assessment of a target",
    copy: "Together, we identify the image, belief, emotion and body sensations connected with a particular memory or present trigger."
  },
  {
    title: "Reprocessing",
    copy: "While briefly noticing elements of the experience, you follow sets of bilateral stimulation and report what you notice. There is no requirement to force an insight or produce a particular response."
  },
  {
    title: "Strengthening adaptive meaning",
    copy: "As disturbance reduces, the work may support a more helpful and credible understanding of yourself in relation to the experience."
  },
  {
    title: "Body awareness",
    copy: "We notice whether any residual physical disturbance remains connected to the target."
  },
  {
    title: "Closure",
    copy: "Each session ends with attention to stability and orientation. A memory does not have to be fully processed within one appointment."
  },
  {
    title: "Re-evaluation",
    copy: "At the next session, we review what has changed, what remains active and what the next clinical step should be."
  }
];

const START_STEPS = [
  {
    title: "Arrange an initial consultation",
    copy: "Choose a short confidential conversation to discuss what you are looking for and ask initial questions."
  },
  {
    title: "Complete an assessment",
    copy: "If you decide to proceed, the first sessions focus on your history, current needs, goals, safety and whether EMDR is appropriate."
  },
  {
    title: "Agree a treatment plan",
    copy: "You and your therapist decide whether to begin EMDR preparation, continue with broader psychotherapy or consider another approach."
  }
];

const FAQS = [
  {
    q: "What does EMDR stand for?",
    a: "EMDR stands for Eye Movement Desensitisation and Reprocessing. It is a structured psychotherapy approach used to help process distressing experiences and reduce the degree to which they continue to feel active in the present."
  },
  {
    q: "Is EMDR available in English in Lisbon?",
    a: "Yes. Pathfinder Therapy provides EMDR therapy in English at its central Lisbon clinic. Secure online sessions may also be available where clinically and professionally appropriate."
  },
  {
    q: "Is EMDR only for PTSD?",
    a: "EMDR is best known for its use in treating PTSD. It may also be considered when anxiety, panic, shame, grief, relationship difficulties or other symptoms appear connected to distressing experiences. Assessment is needed because EMDR is not automatically appropriate for every difficulty."
  },
  {
    q: "Do I need a PTSD diagnosis?",
    a: "No. You do not need to arrive with a diagnosis. Therapy begins by understanding what is happening now, what may have contributed to it and what you would like to change."
  },
  {
    q: "Will I have to describe the trauma in detail?",
    a: "Not necessarily. Some information is needed for assessment and safe treatment planning, but EMDR does not require a detailed verbal retelling of every part of an experience. You remain in control of what you share."
  },
  {
    q: "What happens during bilateral stimulation?",
    a: "You may follow guided eye movements, listen to alternating sounds or use alternating taps while briefly noticing aspects of a memory and what emerges. Bilateral stimulation is one part of a wider structured therapeutic process."
  },
  {
    q: "Will EMDR make me forget what happened?",
    a: "No. EMDR is not intended to erase memory. The aim is for the experience to become less disturbing and less likely to feel as though it is happening again in the present."
  },
  {
    q: "Can EMDR make things feel worse?",
    a: "Difficult emotions, memories, dreams or body sensations can sometimes become more noticeable during trauma therapy. Preparation, pacing, monitoring and closure are therefore important. You should tell your therapist when the work feels unmanageable so the approach can be adjusted."
  },
  {
    q: "How many EMDR sessions will I need?",
    a: "There is no reliable universal number. Treatment length depends on the nature of the difficulty, whether there is one main event or a longer history of trauma, current stability, treatment goals and how the work develops. This is reviewed collaboratively."
  },
  {
    q: "Can EMDR be completed in one session?",
    a: "Some people may notice a change in one session, but EMDR treatment usually involves assessment, preparation, processing and re-evaluation across multiple appointments. No outcome should be promised in advance."
  },
  {
    q: "Can EMDR help with childhood trauma?",
    a: "EMDR may be used when childhood experiences continue to affect present-day emotions, beliefs, relationships or body responses. Developmental trauma often requires careful preparation and may involve broader relational psychotherapy alongside EMDR."
  },
  {
    q: "Can EMDR help with anxiety and panic?",
    a: "It may help when anxiety or panic is connected to distressing experiences, memories, triggers or learned threat responses. Anxiety also has other possible causes, so assessment remains important."
  },
  {
    q: "Can EMDR help with medical trauma?",
    a: "EMDR may be considered for distress connected with surgery, intensive care, injury, frightening procedures, medical negligence or changes to the body. Psychological therapy should complement appropriate medical care rather than replace it."
  },
  {
    q: "Can veterans have EMDR for military trauma?",
    a: "EMDR is commonly used in trauma treatment and may be considered for service-related events, injury, loss and other military experiences. The work should be adapted to the individual rather than assuming every veteran has the same needs."
  },
  {
    q: "Does EMDR work online?",
    a: "EMDR can be delivered online for some clients. Suitability depends on privacy, technology, stability, location, support and the nature of the work. In-person therapy may be recommended in some circumstances."
  },
  {
    q: "Can I stop during an EMDR session?",
    a: "Yes. You can ask to pause or stop at any time. Collaborative control and clear communication are important parts of safe trauma therapy."
  },
  {
    q: "What if I cannot remember everything clearly?",
    a: "Complete chronological recall is not always necessary. EMDR may work with an image, body sensation, belief, emotion or fragment of an experience. Memory uncertainty should be approached without pressure or suggestion."
  },
  {
    q: "Is EMDR hypnosis?",
    a: "No. EMDR is not hypnosis. You remain awake, aware of the room and able to communicate and stop throughout the session."
  },
  {
    q: "Is immersive EMDR the same as ordinary EMDR?",
    a: "No. Standard EMDR does not require virtual reality. Pathfinder’s immersive EMDR pilot is a separate developing service in which virtual environments may be considered as an adjunct for selected clients."
  },
  {
    q: "How do I know whether EMDR is right for me?",
    a: "You do not need to decide alone. An initial consultation and subsequent assessment can explore your goals, current circumstances, treatment history and whether EMDR, broader psychotherapy or another approach is most appropriate."
  }
];

export const EMDR_AUTHORITY_CSS = `<style id="pathfinder-emdr-lisbon">
.emdrAuth { width: 100%; }
.emdrAuth .breadcrumbs { margin: 0 0 12px; font-family: var(--pf-font-sans, system-ui, sans-serif); font-size: 13px; }
.emdrAuth .breadcrumbs ol { display: flex; flex-wrap: wrap; gap: 6px 10px; margin: 0; padding: 0; list-style: none; color: rgba(246,242,234,.62); }
.emdrAuth .breadcrumbs li { display: inline-flex; align-items: center; gap: 10px; }
.emdrAuth .breadcrumbs li:not(:last-child)::after { content: "›"; color: rgba(246,242,234,.4); }
.emdrAuth .breadcrumbs a { color: #d9b777; text-decoration: none; }
.emdrAuth .breadcrumbs a:hover { text-decoration: underline; }
.emdrAuth .breadcrumbs [aria-current="page"] { color: rgba(246,242,234,.84); }
.emdrHero { display: grid; gap: 18px; padding: clamp(28px, 4vw, 48px) clamp(16px, 3vw, 40px) clamp(32px, 5vw, 48px); border-bottom: 1px solid rgba(246,242,234,.08); max-width: 1180px; margin: 0 auto; }
.emdrHeroActions { display: flex; flex-wrap: wrap; gap: 12px; }
.emdrHeroActions .lpPrimaryCta, .emdrHeroActions .lpSecondaryCta { min-height: 48px; }
.emdrTrustLine { margin: 0; font-family: var(--pf-font-sans, system-ui, sans-serif); font-size: 13px; letter-spacing: .04em; color: rgba(246,242,234,.62); }
.emdrReassure { margin: 0; max-width: 40rem; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.68); }
.emdrSection { padding: clamp(32px, 5vw, 56px) clamp(16px, 3vw, 40px); border-bottom: 1px solid rgba(246,242,234,.06); }
.emdrSectionInner { max-width: 42rem; margin: 0 auto; display: grid; gap: 14px; }
.emdrSectionInner.emdrWide { max-width: 1180px; }
.emdrSection .lpKicker { margin: 0; }
.emdrSection .lpSectionTitle { margin: 0; }
.emdrBody p { margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: rgba(246,242,234,.76); }
.emdrBody p:last-child { margin-bottom: 0; }
.emdrBody a { color: #d9b777; text-decoration: none; }
.emdrBody a:hover { text-decoration: underline; }
.emdrCallout { margin: 8px 0 0; padding: 16px 18px; border-left: 2px solid rgba(200,154,88,.55); background: rgba(200,154,88,.08); border-radius: 0 12px 12px 0; }
.emdrCallout p { margin: 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.8); }
.emdrTopicGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 8px 0 0; padding: 0; list-style: none; }
.emdrTopicCard { padding: 18px; border: 1px solid rgba(200,154,88,.22); border-radius: 14px; background: rgba(200,154,88,.06); display: grid; gap: 8px; }
.emdrTopicCard h3 { margin: 0; font-family: var(--pf-font-serif, Georgia, serif); font-size: 1.05rem; color: #f6f2ea; font-weight: 600; }
.emdrTopicCard p { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.68); }
.emdrDisclaimer { margin: 16px 0 0; font-size: 13px; line-height: 1.65; color: rgba(246,242,234,.58); max-width: 42rem; }
.emdrPrincipleGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 8px 0 0; padding: 0; list-style: none; }
.emdrPrincipleCard { padding: 18px; border: 1px solid rgba(246,242,234,.1); border-radius: 14px; background: rgba(8,16,15,.35); display: grid; gap: 8px; }
.emdrPrincipleCard h3 { margin: 0; font-family: var(--pf-font-serif, Georgia, serif); font-size: 1.05rem; color: #f6f2ea; }
.emdrPrincipleCard p { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.68); }
.emdrProcess { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 14px; counter-reset: emdr-step; }
.emdrProcess li { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 14px; align-items: start; counter-increment: emdr-step; }
.emdrProcessNum { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; border: 1px solid rgba(200,154,88,.45); color: #d9b777; font-size: 13px; font-weight: 700; font-family: var(--pf-font-sans, system-ui, sans-serif); }
.emdrProcessNum::before { content: counter(emdr-step); }
.emdrProcess h3 { margin: 0 0 6px; font-family: var(--pf-font-serif, Georgia, serif); font-size: 1.05rem; color: #f6f2ea; }
.emdrProcess p { margin: 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.emdrSplit { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 8px; }
.emdrSplitCard { padding: 20px; border: 1px solid rgba(246,242,234,.1); border-radius: 14px; background: rgba(8,16,15,.35); display: grid; gap: 10px; }
.emdrSplitCard h3 { margin: 0; font-family: var(--pf-font-serif, Georgia, serif); font-size: 1.15rem; color: #f6f2ea; }
.emdrSplitCard p, .emdrSplitCard address { margin: 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); font-style: normal; }
.emdrTherapist { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 20px; align-items: start; margin-top: 8px; }
.emdrTherapist img { width: 140px; height: 175px; object-fit: cover; border-radius: 14px; border: 1px solid rgba(246,242,234,.12); }
.emdrTherapistCopy { display: grid; gap: 12px; }
.emdrStartSteps { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 14px; counter-reset: emdr-start; }
.emdrStartSteps li { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 14px; counter-increment: emdr-start; }
.emdrStartSteps .emdrProcessNum::before { content: counter(emdr-start); }
.emdrFaqList { display: grid; gap: 12px; margin: 8px 0 0; padding: 0; list-style: none; }
.emdrFaqList details { border: 1px solid rgba(246,242,234,.1); border-radius: 12px; padding: 14px 16px; background: rgba(8,16,15,.35); }
.emdrFaqList summary { cursor: pointer; list-style: none; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-height: 44px; }
.emdrFaqList summary::-webkit-details-marker { display: none; }
.emdrFaqList summary:focus-visible { outline: 2px solid #d9b777; outline-offset: 3px; border-radius: 6px; }
.emdrFaqList summary h3 { margin: 0; font-family: var(--pf-font-sans, system-ui, sans-serif); font-size: 15px; font-weight: 600; line-height: 1.45; color: #f6f2ea; }
.emdrFaqChevron { flex-shrink: 0; width: 20px; height: 20px; margin-top: 2px; color: #d9b777; transition: transform .2s ease; }
.emdrFaqList details[open] .emdrFaqChevron { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) {
  .emdrFaqChevron { transition: none; }
}
.emdrFaqList .emdrFaqAnswer { margin: 12px 0 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.emdrReview { margin: 16px 0 0; font-size: 13px; line-height: 1.6; color: rgba(246,242,234,.55); }
.emdrRelated ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 8px; }
.emdrRelated a { color: #d9b777; text-decoration: none; }
.emdrRelated a:hover { text-decoration: underline; }
.emdrFinal { text-align: center; }
.emdrFinal .emdrSectionInner { max-width: 40rem; justify-items: center; }
.emdrFinal .emdrBody { text-align: center; }
.emdrFinal .emdrHeroActions { justify-content: center; }
.emdrFinalNote { margin: 0; font-size: 13px; line-height: 1.65; color: rgba(246,242,234,.58); }
.emdrCrisisLink { margin: 0; font-size: 13px; line-height: 1.65; color: rgba(246,242,234,.62); }
.emdrCrisisLink a { color: #d9b777; }
@media (max-width: 900px) {
  .emdrTopicGrid, .emdrPrincipleGrid, .emdrSplit { grid-template-columns: 1fr; }
  .emdrTherapist { grid-template-columns: 1fr; justify-items: start; }
  .emdrHeroActions .lpPrimaryCta, .emdrHeroActions .lpSecondaryCta { width: 100%; }
}
@media (max-width: 375px) {
  .emdrHero .lpTitle { font-size: clamp(1.75rem, 8vw, 2.4rem); }
}
</style>`;

const EMDR_ANALYTICS_SCRIPT = `<script id="pathfinder-emdr-analytics">
(function () {
  function track(eventName, label) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, {
      event_category: "emdr_lisbon",
      event_label: label || "emdr_therapy_lisbon",
      page_path: window.location.pathname
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-emdr-track]").forEach(function (el) {
      el.addEventListener("click", function () {
        track(el.getAttribute("data-emdr-track"), el.getAttribute("data-emdr-label") || "");
      });
    });

    document.querySelectorAll(".emdrFaqList details").forEach(function (details) {
      details.addEventListener("toggle", function () {
        if (!details.open) return;
        var heading = details.querySelector("h3");
        track("emdr_faq_expand", heading ? heading.textContent.trim() : "faq");
        var btn = details.querySelector("summary");
        if (btn) btn.setAttribute("aria-expanded", "true");
      });
      var summary = details.querySelector("summary");
      if (summary) {
        summary.setAttribute("aria-expanded", details.open ? "true" : "false");
        details.addEventListener("toggle", function () {
          summary.setAttribute("aria-expanded", details.open ? "true" : "false");
        });
      }
    });
  });
})();
</script>`;

function section(id, title, bodyHtml, { kicker = "", wide = false } = {}) {
  return `<section class="emdrSection" aria-labelledby="${id}">
  <div class="emdrSectionInner${wide ? " emdrWide" : ""}">
    ${kicker ? `<p class="lpKicker">${kicker}</p>` : ""}
    <h2 class="lpSectionTitle" id="${id}">${title}</h2>
    <div class="emdrBody">${bodyHtml}</div>
  </div>
</section>`;
}

function buildBreadcrumbsNav() {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/therapy/">Therapy</a></li>
    <li><span aria-current="page">EMDR Therapy Lisbon</span></li>
  </ol>
</nav>`;
}

function buildHero() {
  return `<header class="emdrHero" aria-labelledby="emdr-lisbon-title">
  ${buildBreadcrumbsNav()}
  <p class="lpKicker">EMDR therapy · Lisbon and online</p>
  <h1 class="lpTitle" id="emdr-lisbon-title">EMDR Therapy in Lisbon</h1>
  <p class="lpLead">Carefully paced, trauma-informed EMDR therapy for adults living with the effects of trauma, anxiety and difficult life experiences — in English, at our central Lisbon clinic or securely online where appropriate.</p>
  <div class="emdrHeroActions">
    <a class="lpPrimaryCta" href="${BOOKING_PATH}" data-emdr-track="emdr_consultation_click" data-emdr-label="hero">${BOOKING_LABEL}</a>
    <a class="lpSecondaryCta" href="${ENQUIRY_PATH}" data-emdr-track="emdr_enquiry_click" data-emdr-label="hero">Ask a question</a>
  </div>
  <p class="emdrTrustLine">Central Lisbon · English-speaking · In person and online · Clinical supervision</p>
  <p class="emdrReassure">You do not need to know whether EMDR is right for you before getting in touch. Suitability can be explored together.</p>
</header>`;
}

function buildHelpTopics() {
  const cards = HELP_TOPICS.map(
    (topic) => `<li class="emdrTopicCard"><h3>${topic.title}</h3><p>${topic.copy}</p></li>`
  ).join("");
  return `<ul class="emdrTopicGrid">${cards}</ul>
<p class="emdrDisclaimer">This list does not establish that EMDR will be appropriate for every person or every difficulty. Assessment, readiness, current stability, risk, medical factors and personal preference all inform treatment planning.</p>`;
}

function buildPrinciples() {
  const cards = PRINCIPLES.map(
    (item) => `<li class="emdrPrincipleCard"><h3>${item.title}</h3><p>${item.copy}</p></li>`
  ).join("");
  return `<ul class="emdrPrincipleGrid">${cards}</ul>`;
}

function buildProcess() {
  const steps = PROCESS_STEPS.map(
    (step) => `<li>
  <span class="emdrProcessNum" aria-hidden="true"></span>
  <div>
    <h3>${step.title}</h3>
    <p>${step.copy}</p>
  </div>
</li>`
  ).join("");
  return `<ol class="emdrProcess">${steps}</ol>
<p>EMDR treatment is not always linear. Preparation, assessment and processing may be revisited as therapy develops.</p>`;
}

function buildLocationSplit() {
  return `<div class="emdrSplit">
  <article class="emdrSplitCard" aria-labelledby="emdr-inperson">
    <h3 id="emdr-inperson">In-person EMDR in Lisbon</h3>
    <p>Sessions take place at Pathfinder Therapy’s central Lisbon clinic:</p>
    <address>
      R. Rodrigues Sampaio 76, 1º Andar<br>
      1150-281 Lisboa, Portugal
    </address>
    <p>The location is suitable for clients living or working in Lisbon and for those travelling from surrounding areas.</p>
    <p><a class="lpLocationMapLink" href="${DIRECTIONS_URL}" target="_blank" rel="noopener noreferrer" data-emdr-track="emdr_directions_click" data-emdr-label="location">Get directions<span class="visually-hidden"> (opens in a new tab)</span></a></p>
  </article>
  <article class="emdrSplitCard" aria-labelledby="emdr-online">
    <h3 id="emdr-online">Online EMDR</h3>
    <p>EMDR can sometimes be delivered through secure video sessions. Online suitability depends on privacy, internet reliability, current stability, available support, the nature of the target material and the therapist’s professional ability to work in your location.</p>
    <p>Online EMDR is not automatically suitable for every client or every stage of treatment. This will be discussed during assessment.</p>
  </article>
</div>`;
}

function buildFaqs() {
  const items = FAQS.map((faq, index) => {
    const panelId = `emdr-faq-panel-${index + 1}`;
    return `<li>
  <details>
    <summary aria-controls="${panelId}">
      <h3>${faq.q}</h3>
      <svg class="emdrFaqChevron" aria-hidden="true" viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </summary>
    <p class="emdrFaqAnswer" id="${panelId}">${faq.a}</p>
  </details>
</li>`;
  }).join("");
  return `<ul class="emdrFaqList">${items}</ul>`;
}

function buildStartSteps() {
  const steps = START_STEPS.map(
    (step) => `<li>
  <span class="emdrProcessNum" aria-hidden="true"></span>
  <div>
    <h3>${step.title}</h3>
    <p>${step.copy}</p>
  </div>
</li>`
  ).join("");
  return `<ol class="emdrStartSteps">${steps}</ol>
<p>Booking a consultation does not commit you to trauma processing.</p>
<div class="emdrHeroActions">
  <a class="lpPrimaryCta" href="${BOOKING_PATH}" data-emdr-track="emdr_consultation_click" data-emdr-label="starting">${BOOKING_LABEL}</a>
  <a class="lpSecondaryCta" href="${ENQUIRY_PATH}" data-emdr-track="emdr_enquiry_click" data-emdr-label="starting">${ENQUIRY_LABEL}</a>
</div>`;
}

function buildTherapistSection() {
  return `<div class="emdrTherapist">
  <img src="${BRENT_IMAGE}" width="140" height="175" alt="Brent Kelly, therapist at Pathfinder Therapy in Lisbon" loading="lazy" decoding="async" />
  <div class="emdrTherapistCopy emdrBody">
    <p>Pathfinder Therapy is an established trauma-informed psychotherapy practice working with adults and couples in Lisbon and online. The practice supports people experiencing trauma, anxiety, attachment difficulties, emotional disconnection, relationship patterns and significant life transitions.</p>
    <p>Brent Kelly is a clinically trained ${BRENT_TITLE.toLowerCase()} working primarily through Transactional Analysis and trauma-informed relational therapy. His approach brings structured trauma work into a wider understanding of attachment, nervous-system responses, protective adaptations and the therapeutic relationship.</p>
    <p>Brent has particular familiarity with military culture, medical trauma, limb loss, major life transition and the experience of rebuilding identity after events that change how a person understands themselves.</p>
    <p><strong>${CREDENTIAL_BODY}</strong> · trauma-informed psychotherapy · EMDR within integrative trauma-informed practice · clinical supervision.</p>
    <p><a href="/about/" data-emdr-track="emdr_about_click" data-emdr-label="therapist">Meet Brent</a> · <a href="/fees/">Fees</a> · <a href="/approach/">Approach</a></p>
  </div>
</div>
<p class="emdrReview">Written and clinically reviewed by Brent Kelly · ${BRENT_TITLE} · ${CREDENTIAL_BODY}</p>`;
}

function buildRelatedReading() {
  return `<ul>
  <li><a href="/therapy/">Therapy overview</a></li>
  <li><a href="/trauma-therapy-lisbon/">Trauma therapy in Lisbon</a></li>
  <li><a href="/therapy/individual/">Individual therapy</a></li>
  <li><a href="/approach/">Therapeutic approach</a></li>
  <li><a href="/knowledge-library/how-does-emdr-work/">How does EMDR work?</a></li>
  <li><a href="/knowledge-library/what-is-trauma-therapy/">What is trauma therapy?</a></li>
  <li><a href="/knowledge-library/veterans-and-trauma/">Veterans and trauma</a></li>
  <li><a href="/knowledge-library/online-therapy/">Online therapy</a></li>
  <li><a href="/contact/">Clinic contact details</a></li>
  <li><a href="/crisis-support/">Crisis-support information</a></li>
</ul>`;
}

function buildFinalCta() {
  return `<section class="emdrSection emdrFinal" aria-labelledby="emdr-final-cta">
  <div class="emdrSectionInner">
    <p class="lpKicker">Begin with a conversation</p>
    <h2 class="lpSectionTitle" id="emdr-final-cta">You do not have to decide about EMDR before getting in touch</h2>
    <div class="emdrBody">
      <p>An initial consultation is a chance to briefly discuss what brings you to therapy, ask questions and consider whether Pathfinder feels like an appropriate place to begin. There is no obligation to proceed with EMDR or any other treatment.</p>
    </div>
    <div class="emdrHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}" data-emdr-track="emdr_consultation_click" data-emdr-label="final">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}" data-emdr-track="emdr_enquiry_click" data-emdr-label="final">${ENQUIRY_LABEL}</a>
    </div>
    <p class="emdrFinalNote">In person in central Lisbon · Secure online sessions where appropriate · Non-urgent enquiries only</p>
    <p class="emdrCrisisLink">Pathfinder Therapy is not an emergency service. <a href="/crisis-support/">View crisis-support information</a>.</p>
  </div>
</section>`;
}

export function buildEmdrLisbonBody() {
  return `<article class="emdrAuth">
${buildHero()}
${section(
  "emdr-orientation",
  "When the past still feels present",
  `<p>Trauma does not always remain in the past simply because an event is over. Memories, body sensations, emotions and protective responses can continue to be activated by present-day situations, even when another part of you knows that you are now safe.</p>
<p>EMDR — Eye Movement Desensitisation and Reprocessing — is a structured form of psychotherapy designed to help people process distressing experiences that may not have been fully integrated. At Pathfinder Therapy, EMDR is offered within an established trauma-informed psychotherapy practice rather than as a stand-alone technique.</p>
<p>The work begins with understanding what is happening for you, assessing whether EMDR is appropriate, and developing enough safety and stability to approach difficult material without rushing the process.</p>
<div class="emdrCallout"><p>EMDR does not require you to describe every detail of an experience aloud. You remain actively involved in deciding what is approached, when it is approached, and how the work is paced.</p></div>`
)}
${section(
  "emdr-what",
  "What is EMDR therapy?",
  `<p>EMDR stands for Eye Movement Desensitisation and Reprocessing. It uses a structured therapeutic process together with forms of bilateral stimulation, such as guided eye movements, alternating sounds or alternating taps.</p>
<p>During EMDR, a person may briefly bring aspects of a distressing memory to mind while noticing thoughts, emotions, body sensations and whatever begins to emerge. The aim is not to erase memory. It is to support the brain and nervous system in processing the experience so that it can be remembered without producing the same level of present-day disturbance.</p>
<p>EMDR is most widely associated with post-traumatic stress disorder. It may also be considered as part of treatment for other difficulties when unprocessed experiences appear to be contributing to current symptoms. Read more in <a href="/knowledge-library/how-does-emdr-work/">how EMDR therapy works</a>.</p>`
)}
${section(
  "emdr-helps",
  "What can EMDR be used for?",
  `<p>EMDR may be considered when current distress appears connected to experiences that remain emotionally or physically activating.</p>
${buildHelpTopics()}`,
  { wide: true }
)}
${section(
  "emdr-approach",
  "EMDR within a wider trauma-informed relationship",
  `<p>At Pathfinder Therapy, EMDR is integrated within relational, trauma-informed psychotherapy. We do not treat the protocol as more important than the person receiving it.</p>
<p>Before trauma processing begins, we take time to understand your history, present circumstances, existing strengths, support network, coping strategies and what you would like to change. Some people are ready to begin focused EMDR work relatively quickly. Others benefit from a longer period of preparation, stabilisation or relational therapy first.</p>
<p>The aim is not to push through distress. It is to work collaboratively, monitor what is happening in your nervous system, and keep the process within a manageable therapeutic range. Learn more about our <a href="/approach/">therapeutic approach</a> and <a href="/trauma-therapy-lisbon/">trauma therapy in Lisbon</a>.</p>
${buildPrinciples()}`,
  { wide: true }
)}
${section(
  "emdr-process",
  "What happens during EMDR therapy?",
  buildProcess()
)}
${section(
  "emdr-story",
  "Do I have to talk about everything that happened?",
  `<p>No. EMDR is not dependent on giving a detailed verbal account of every part of an experience. Some contextual information is needed for safe assessment and treatment planning, but you do not have to describe every detail aloud.</p>
<p>You will usually be asked to notice aspects of the memory and what is happening internally, while sharing enough information for the therapist to follow the process safely. You can also ask to pause at any point.</p>
<p>For some people, the reduced emphasis on repeatedly recounting events makes EMDR feel more approachable. However, trust, communication and a clear therapeutic relationship remain essential.</p>`
)}
${section(
  "emdr-military",
  "EMDR for military and veteran experiences",
  `<p>Military trauma can involve more than a single frightening event. It may include cumulative exposure, injury, loss, moral conflict, helplessness, hypervigilance, disrupted identity and the difficulty of moving between military and civilian worlds.</p>
<p>Pathfinder Therapy brings clinical trauma training together with lived understanding of military culture. This can reduce the need to explain the basic context of service before therapeutic work can begin.</p>
<p>EMDR may be considered for specific service-related memories, injury, traumatic loss, medical events or present triggers. Treatment remains individual: not every military experience needs to be processed, and not every veteran requires the same protocol or pace.</p>
<div class="emdrCallout"><p>Military experience is understood as context, not assumed to be pathology.</p></div>
<p>Further reading: <a href="/knowledge-library/veterans-and-trauma/">veterans and trauma</a>.</p>`
)}
${section(
  "emdr-medical",
  "EMDR for medical trauma, injury and changes to the body",
  `<p>Medical experiences can become traumatic when they involve threat, pain, loss of control, frightening procedures, intensive care, unexpected outcomes or a sense of not being heard or protected.</p>
<p>Current distress may be connected not only to what happened, but also to ongoing appointments, bodily sensations, disability, uncertainty, anger, grief or changes in identity.</p>
<p>EMDR may be considered as part of therapy for distressing medical memories and associated triggers. Where pain, neurological symptoms, medication, active medical treatment or complex physical-health factors are present, psychotherapy should complement rather than replace appropriate medical assessment and care.</p>
<p>For some people living with limb loss, trauma therapy may also need to consider the circumstances of the injury or amputation, ongoing body-based responses and the psychological impact of adaptation. Any work involving phantom limb pain or other pain presentations requires careful assessment, realistic expectations and appropriate coordination with medical or rehabilitation care.</p>`
)}
${section(
  "emdr-english",
  "English-speaking EMDR therapy in Lisbon",
  `<p>Living outside your country of origin can add practical and emotional complexity to seeking therapy. You may be managing relocation, isolation, cultural adjustment, relationship change, work pressure or the absence of familiar support.</p>
<p>Pathfinder Therapy provides therapy in English for adults living in Lisbon and across Portugal. The clinic is accustomed to working with international lives, cross-cultural relationships and experiences that span more than one country.</p>
<p>In-person appointments are available at our central Lisbon clinic. Secure online EMDR may also be considered when clinically appropriate and permitted within the relevant professional and jurisdictional framework — online across Portugal and internationally where professionally appropriate.</p>
<p><a href="/english-speaking-therapist-lisbon/">English-speaking therapist in Lisbon</a> · <a href="/knowledge-library/online-therapy/">Online therapy</a></p>`
)}
${section(
  "emdr-location",
  "EMDR in Lisbon or online",
  buildLocationSplit(),
  { wide: true }
)}
${section(
  "emdr-immersive",
  "How is this different from immersive EMDR?",
  `<p>Standard EMDR therapy does not require virtual reality. It uses an established therapeutic protocol and bilateral stimulation within an ordinary in-person or online psychotherapy session.</p>
<p>Pathfinder Therapy is separately preparing an immersive EMDR pilot that may use carefully selected virtual environments as an adjunct to trauma-informed treatment. The pilot is a developing clinical service and will only be considered following individual assessment, informed consent and evaluation of suitability.</p>
<p>Clients seeking EMDR do not need to take part in the immersive pilot. Immersive EMDR is not presented as superior to standard EMDR therapy.</p>
<p><span class="emdrTrustLine">Clinical pilot · Developing service · Individual assessment required</span></p>`
)}
${section(
  "emdr-wait",
  "When might EMDR need to wait?",
  `<p>Sometimes the most clinically responsible decision is not to begin memory processing immediately.</p>
<p>EMDR may need to be postponed or adapted when someone is experiencing significant current instability, immediate risk, severe dissociation, active substance dependence, insufficient privacy, an unsafe living situation, unmanaged medical concerns or limited capacity to remain regulated between appointments.</p>
<p>This does not necessarily mean that EMDR will never be appropriate. Therapy may begin with stabilisation, practical safety, emotional regulation, relationship-building or another form of support — including broader <a href="/therapy/individual/">individual therapy</a>.</p>
<p>Suitability decisions are made individually and reviewed as circumstances change.</p>`
)}
${section(
  "emdr-practice",
  "EMDR at Pathfinder Therapy",
  buildTherapistSection()
)}
${section(
  "emdr-starting",
  "Starting EMDR therapy",
  buildStartSteps()
)}
${section(
  "emdr-faq",
  "Frequently asked questions about EMDR",
  buildFaqs(),
  { wide: true }
)}
${section(
  "emdr-related",
  "Further reading and related pages",
  `<div class="emdrRelated">${buildRelatedReading()}</div>`
)}
${buildFinalCta()}
</article>`;
}

function buildWebPageSchema() {
  const dateModified = new Date().toISOString().slice(0, 10);
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${CANONICAL}#webpage`,
    url: CANONICAL,
    name: EMDR_LISBON_META.ogTitle,
    description: EMDR_LISBON_META.description,
    inLanguage: "en-GB",
    dateModified,
    isPartOf: { "@id": `${SITE}/#website` },
    about: { "@id": `${CANONICAL}#service` },
    breadcrumb: { "@id": `${CANONICAL}#breadcrumb` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: EMDR_LISBON_META.ogImage
    },
    author: { "@id": `${SITE}/about/#brent-kelly` }
  })}</script>`;
}

function buildEmdrServiceSchema() {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${CANONICAL}#service`,
    name: "EMDR Therapy in Lisbon",
    description: EMDR_LISBON_META.description,
    serviceType: "EMDR therapy",
    url: CANONICAL,
    provider: { "@id": `${SITE}/#medical-business` },
    areaServed: [
      { "@type": "City", name: "Lisboa" },
      { "@type": "Country", name: "Portugal" }
    ],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${SITE}/book/`,
      servicePhone: "+351914775365"
    }
  })}</script>`;
}

function buildEmdrBreadcrumbSchema() {
  return buildBreadcrumbSchema([
    { name: "Home", url: `${SITE}/` },
    { name: "Therapy", url: `${SITE}/therapy/` },
    { name: "EMDR Therapy Lisbon", url: CANONICAL }
  ]).replace(
    '"@type":"BreadcrumbList"',
    `"@type":"BreadcrumbList","@id":"${CANONICAL}#breadcrumb"`
  );
}

export function buildEmdrLisbonSchema() {
  return `${buildWebPageSchema()}
${buildEmdrServiceSchema()}
${buildEmdrBreadcrumbSchema()}`;
}

/**
 * @param {string} shellHtml
 * @param {(shellHtml: string, opts: object) => string} buildInteriorPageV2
 */
export function buildEmdrLisbonPage(shellHtml, buildInteriorPageV2) {
  const preload = `<link rel="preload" as="image" href="${HERO_IMAGE}">`;
  let html = buildInteriorPageV2(shellHtml, {
    title: EMDR_LISBON_META.title,
    description: EMDR_LISBON_META.description,
    canonical: EMDR_LISBON_META.canonical,
    mainInner: buildEmdrLisbonBody(),
    schema: buildEmdrLisbonSchema(),
    ogImage: EMDR_LISBON_META.ogImage
  });

  if (!html.includes("pathfinder-emdr-lisbon")) {
    html = html.replace("</head>", `${preload}\n${EMDR_AUTHORITY_CSS}\n</head>`);
  }
  if (!html.includes("pathfinder-emdr-analytics")) {
    html = html.replace("</body>", `${EMDR_ANALYTICS_SCRIPT}\n</body>`);
  }

  // Ensure Open Graph / Twitter match the authority page brief.
  // Preview shell may emit self-closing or duplicate meta tags — strip then inject once.
  const stripMeta = (attr, name) => {
    html = html.replace(new RegExp(`<meta ${attr}="${name}" content="[^"]*"\\s*/?>\\n?`, "gi"), "");
  };

  [
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:type"],
    ["property", "og:image"],
    ["property", "og:locale"],
    ["property", "og:site_name"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"]
  ].forEach(([attr, name]) => stripMeta(attr, name));

  // Also remove dimension/alt variants that can disagree with the chosen image.
  html = html.replace(/<meta property="og:image:(?:width|height|alt)" content="[^"]*"\s*\/?>\n?/gi, "");

  const socialMeta = [
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="Pathfinder Therapy"/>`,
    `<meta property="og:locale" content="en_GB"/>`,
    `<meta property="og:title" content="${EMDR_LISBON_META.ogTitle}"/>`,
    `<meta property="og:description" content="${EMDR_LISBON_META.ogDescription}"/>`,
    `<meta property="og:url" content="${CANONICAL}"/>`,
    `<meta property="og:image" content="${EMDR_LISBON_META.ogImage}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${EMDR_LISBON_META.ogTitle}"/>`,
    `<meta name="twitter:description" content="${EMDR_LISBON_META.ogDescription}"/>`,
    `<meta name="twitter:image" content="${EMDR_LISBON_META.ogImage}"/>`
  ].join("\n");

  html = html.replace("</head>", `${socialMeta}\n</head>`);

  return html;
}

/** Related-service card used by other therapy service pages. */
export const EMDR_RELATED_CARD = {
  route: EMDR_LISBON_ROUTE,
  h1: "EMDR therapy in Lisbon",
  image: HERO_IMAGE
};
