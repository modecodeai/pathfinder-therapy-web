import { BOOKING_LABEL, BOOKING_PATH, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";

/** Remove legacy preview chrome that must not appear in public HTML. */
export function stripLegacyMarkup(html) {
  let next = html;

  const legacyBlocks = [
    /<aside class="siteSidebar"[\s\S]*?<\/aside>/gi,
    /<aside class="siteRail"[\s\S]*?<\/aside>/gi,
    /<aside class="mobileSidebar"[\s\S]*?<\/aside>/gi,
    /<div class="mobileSidebarPanel"[\s\S]*?<\/div>/gi,
    /<div class="collapsibleRail"[\s\S]*?<\/div>/gi,
    /<div class="siteShell"[^>]*>[\s\S]*?<\/div>\s*(?=<main)/gi,
    /<footer class="siteFooter"[\s\S]*?<\/footer>/gi,
    /<div class="pfStickyBook"[\s\S]*?<\/div>/gi,
    /<section class="approachEssay pfPageCta"[\s\S]*?<\/section>/gi
  ];

  for (const pattern of legacyBlocks) {
    next = next.replace(pattern, "");
  }

  next = next.replaceAll("A space to understand.", "");
  next = next.replaceAll("International Psychotherapy Clinic", "");
  next = next.replaceAll("All Rights Reserved © 2026", "");
  next = next.replaceAll("All Rights Reserved", "");
  next = next.replaceAll("Book a consultation", BOOKING_LABEL);
  next = next.replaceAll("Make an enquiry", ENQUIRY_LABEL);
  next = next.replaceAll("Make an Enquiry", ENQUIRY_LABEL);

  return next;
}

function removeDuplicateSectionKickers(html) {
  return html.replace(
    /<p class="sectionKicker">([^<]*)<\/p>\s*(<h2 class="aboutSectionTitle"[^>]*>)\1(<\/h2>)/gi,
    "$2$3"
  );
}

function normalizeKickerHeadingPairs(html) {
  const pairs = [
    ["Who I Am", "Therapist, veteran, and relational practitioner"],
    ["How I Work", "Evidence-informed, trauma-aware psychotherapy"],
    ["My Journey", "From military service to therapeutic practice"],
    ["The Pathfinder Philosophy", "Understanding before change"],
    ["Professional Grounding", "Registration, supervision, and standards"],
    ["Questions people often ask", "Practical questions about working together"]
  ];

  let next = html;
  for (const [kicker, heading] of pairs) {
    const escaped = kicker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(
      new RegExp(
        `<p class="sectionKicker">${escaped}<\\/p>([\\s\\S]{0,500}?)<h2 class="aboutSectionTitle"([^>]*)>${escaped}<\\/h2>`,
        "g"
      ),
      `<p class="sectionKicker">${kicker}</p>$1<h2 class="aboutSectionTitle"$2>${heading}</h2>`
    );
  }
  return next;
}

const ABOUT_FINAL_CTA = `<section class="lpEndCta" aria-label="Arrange a consultation">
  <div class="lpEndCtaInner">
    <h2 class="lpSectionTitle">${BOOKING_LABEL}</h2>
    <p class="lpSectionLead">Choose a convenient time for a confidential initial conversation by Zoom — or send an enquiry first if you would prefer to ask a question.</p>
    <div class="lpHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
    </div>
  </div>
</section>`;

const THERAPY_PROCESS_SECTION = `<section class="approachEssay" aria-labelledby="therapy-process">
  <div class="approachEssayInner">
    <p class="sectionKicker">Getting started</p>
    <h2 class="approachSectionTitle" id="therapy-process">What happens next</h2>
    <ul class="lpSteps" aria-label="How to begin">
      <li><span class="lpStepNum" aria-hidden="true">1</span><span><strong>Choose a consultation time</strong> — select a convenient time through the secure booking page.</span></li>
      <li><span class="lpStepNum" aria-hidden="true">2</span><span><strong>Meet Brent by Zoom</strong> — use the initial conversation to briefly discuss what brings you to therapy and ask questions.</span></li>
      <li><span class="lpStepNum" aria-hidden="true">3</span><span><strong>Decide on the next step</strong> — there is no obligation to continue unless the working relationship feels appropriate.</span></li>
    </ul>
    <p class="lpTherapyEnquiryNote">Not ready to book? <a href="${ENQUIRY_PATH}">You can send an enquiry first.</a></p>
  </div>
</section>`;

const THERAPY_FINAL_CTA = `<section class="lpEndCta" aria-labelledby="therapy-next-step">
  <div class="lpEndCtaInner">
    <h2 class="lpSectionTitle" id="therapy-next-step">Take the next step</h2>
    <p class="lpSectionLead">Arrange a short confidential consultation by Zoom to discuss what brings you to therapy and whether working together may feel appropriate.</p>
    <div class="lpHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
    </div>
    <p class="lpTertiaryLink"><a href="https://wa.me/351914775365">Prefer WhatsApp? Message Pathfinder Therapy.</a></p>
  </div>
</section>`;

export function fixTherapyPageContent(mainInner) {
  let next = mainInner;

  next = next.replace(/<ol class="lpSteps"/g, '<ul class="lpSteps"');
  next = next.replace(/<\/ol>(\s*<p class="lpTherapyEnquiryNote")/g, "</ul>$1");

  next = next.replace(/<section class="approachFinalCta"[\s\S]*?<\/section>/g, "");
  next = next.replace(/<aside class="lpInlineCta"[\s\S]*?<\/aside>/g, "");

  if (!next.includes('id="therapy-process"')) {
    if (next.includes('id="therapy-questions"')) {
      next = next.replace(
        /<section class="approachEssay" aria-labelledby="therapy-questions">/,
        `${THERAPY_PROCESS_SECTION}<section class="approachEssay" aria-labelledby="therapy-questions">`
      );
    } else if (next.includes("</article>")) {
      next = next.replace("</article>", `${THERAPY_PROCESS_SECTION}</article>`);
    }
  }

  if (!next.includes('id="therapy-next-step"')) {
    if (next.includes('class="relatedPages"')) {
      next = next.replace('<aside class="relatedPages"', `${THERAPY_FINAL_CTA}<aside class="relatedPages"`);
    } else if (next.includes("</article>")) {
      next = next.replace("</article>", `${THERAPY_FINAL_CTA}</article>`);
    } else {
      next = `${next}${THERAPY_FINAL_CTA}`;
    }
  }

  return next;
}

export function fixAboutPageContent(mainInner) {
  let next = mainInner;

  next = next.replace(
    "Every path is different.<span>But nobody should have to walk theirs alone.</span>",
    "Every path is different. <span>But nobody should have to walk theirs alone.</span>"
  );

  next = normalizeKickerHeadingPairs(next);
  next = removeDuplicateSectionKickers(next);

  next = next.replace(/<section class="aboutFinalCta"[\s\S]*?<\/section>/g, "");
  next = next.replace(/<a class="button" href="\/start\/"><span>Arrange an initial consultation<\/span>[\s\S]*?<\/a>/g, "");

  if (!next.includes("lpEndCta")) {
    next = next.replace("</article>", `${ABOUT_FINAL_CTA}</article>`);
  }

  return next;
}

const APPROACH_FINAL_CTA = `<section class="lpEndCta" aria-label="Arrange a consultation">
  <div class="lpEndCtaInner">
    <h2 class="lpSectionTitle">${BOOKING_LABEL}</h2>
    <p class="lpSectionLead">Choose a convenient time for a confidential initial conversation by Zoom — or send an enquiry first if you would prefer to ask a question.</p>
    <div class="lpHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
    </div>
  </div>
</section>`;

export function fixApproachPageContent(mainInner) {
  let next = mainInner;

  next = next.replace(/<section class="approachFinalCta"[\s\S]*?<\/section>/g, "");

  const replacements = [
    ["for a reason.<span>Therapy begins", "for a reason. <span>Therapy begins"],
    ["People are not broken.<span>They adapted.", "People are not broken. <span>They adapted."],
    [
      "“What’s wrong with me?”<span>and begin asking,</span><span>“What happened?”</span>",
      "“What’s wrong with me?” <span>and begin asking,</span> <span>“What happened?”</span>"
    ],
    [
      "\"What's wrong with me?\"<span>and begin asking,</span><span>\"What happened?\"</span>",
      "\"What's wrong with me?\" <span>and begin asking,</span> <span>\"What happened?\"</span>"
    ],
    ["reason.Therapy", "reason. Therapy"],
    ["broken.They", "broken. They"],
    ["me?”and", "me?” and"],
    ["me?\"and", "me?\" and"]
  ];

  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }

  if (!next.includes("lpEndCta")) {
    next = next.replace("</article>", `${APPROACH_FINAL_CTA}</article>`);
  }

  return next;
}

export function applyContentFixes(mainInner, route) {
  let next = stripLegacyMarkup(mainInner);

  if (route === "/about/") {
    next = fixAboutPageContent(next);
  }

  if (route === "/approach/") {
    next = fixApproachPageContent(next);
  }

  if (route === "/therapy/") {
    next = fixTherapyPageContent(next);
  }

  if (route === "/therapy/" || route === "/contact/") {
    next = stripLegacyMarkup(next);
  }

  return next;
}

export function applyContentFixesToPage(html, route) {
  const mainMatch = html.match(
    /(<main class="lpMain[^"]*" id="main-content" tabindex="-1">\s*<div class="lpInteriorBody">)([\s\S]*)(<\/div>\s*<\/main>)/
  );

  if (!mainMatch) {
    return stripLegacyMarkup(html);
  }

  const fixedMain = applyContentFixes(mainMatch[2], route);
  return `${stripLegacyMarkup(html.slice(0, mainMatch.index))}${mainMatch[1]}${fixedMain}${mainMatch[3]}${stripLegacyMarkup(html.slice(mainMatch.index + mainMatch[0].length))}`;
}
