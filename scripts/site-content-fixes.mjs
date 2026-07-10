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

export function fixApproachPageContent(mainInner) {
  let next = mainInner;

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
