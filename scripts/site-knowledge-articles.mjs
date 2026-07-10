import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://www.pathfindertherapy.com";
const CONTENT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "content", "knowledge-library");
const ARTICLE_IMAGE = `${SITE}/assets/images/hero-01.webp`;
const OG_IMAGE = `${SITE}/assets/images/journal.webp`;
const KNOWLEDGE_LIBRARY_ROUTE = "/knowledge-library/";

const RELATED_PAGES = `<aside class="relatedPages" aria-labelledby="related-pages-title"><p class="sectionKicker" id="related-pages-title">Related pages</p><div class="relatedPagesGrid"><a class="relatedPage" href="/therapy/"><span>Therapy</span><small>Individual therapy with Brent online or in Lisbon.</small></a><a class="relatedPage" href="/about/"><span>About Brent</span><small>Learn about Brent&#x27;s background and clinical approach.</small></a><a class="relatedPage" href="/knowledge-library/"><span>Knowledge Library</span><small>Clear writing on trauma, emotion, relationships and growth.</small></a><a class="relatedPage" href="/contact/"><span>Contact</span><small>Make a non-urgent enquiry with Pathfinder Therapy.</small></a></div></aside>`;

export const KNOWLEDGE_ARTICLE_META = [
  {
    slug: "what-is-trauma-therapy",
    sourceFile: "what-is-trauma-therapy.md",
    faqs: [
      "What is trauma therapy?",
      "Do I need to talk about everything that happened?",
      "Can trauma therapy be gentle?"
    ],
    related: [
      { href: "/knowledge-library/can-therapy-help-anxiety/", label: "Can therapy help anxiety?" },
      { href: "/knowledge-library/the-body-remembers/", label: "The body remembers." }
    ]
  },
  {
    slug: "how-does-emdr-work",
    sourceFile: "how-does-emdr-work.md",
    faqs: ["How does EMDR work?", "Is EMDR only for trauma?", "Will I stay in control during EMDR?"],
    related: [{ href: "/knowledge-library/what-is-trauma-therapy/", label: "What is trauma therapy?" }]
  },
  {
    slug: "can-therapy-help-anxiety",
    sourceFile: "can-therapy-help-anxiety.md",
    faqs: [
      "Can therapy help anxiety?",
      "Why do I feel anxious when nothing is wrong?",
      "What does anxiety try to protect?"
    ],
    related: [{ href: "/knowledge-library/feelings-are-intelligent/", label: "Feelings are intelligent." }]
  },
  {
    slug: "do-i-need-a-diagnosis-for-therapy",
    sourceFile: "do-i-need-a-diagnosis-for-therapy.md",
    faqs: [
      "Do I need a diagnosis to begin therapy?",
      "Can I start if I do not know what is wrong?",
      "What if I only feel stuck?"
    ],
    related: [
      {
        href: "/knowledge-library/what-happens-in-a-first-therapy-session/",
        label: "What happens in a first therapy session?"
      }
    ]
  },
  {
    slug: "what-happens-in-a-first-therapy-session",
    sourceFile: "what-happens-in-a-first-therapy-session.md",
    faqs: [
      "What happens in a first therapy session?",
      "Will I need to tell my whole story?",
      "How do I know if therapy is right for me?"
    ],
    related: [
      {
        href: "/knowledge-library/do-i-need-a-diagnosis-for-therapy/",
        label: "Do I need a diagnosis to begin therapy?"
      }
    ]
  },
  {
    slug: "online-therapy",
    sourceFile: "online-therapy.md",
    faqs: [
      "Can I attend therapy online?",
      "Is online therapy effective?",
      "Can trauma therapy happen online?"
    ],
    related: [
      {
        href: "/knowledge-library/what-happens-in-a-first-therapy-session/",
        label: "What happens in a first therapy session?"
      }
    ]
  },
  {
    slug: "feelings-are-intelligent",
    sourceFile: "feelings-are-intelligent.md",
    faqs: [
      "Why do feelings matter?",
      "What can anger, anxiety or shame tell us?",
      "Should therapy help me control feelings?"
    ],
    related: [{ href: "/knowledge-library/can-therapy-help-anxiety/", label: "Can therapy help anxiety?" }]
  },
  {
    slug: "the-body-remembers",
    sourceFile: "the-body-remembers.md",
    faqs: [
      "How does the body remember trauma?",
      "Why can I feel unsafe when nothing is happening?",
      "What is nervous system regulation?"
    ],
    related: [{ href: "/knowledge-library/what-is-trauma-therapy/", label: "What is trauma therapy?" }]
  },
  {
    slug: "veterans-and-trauma",
    sourceFile: "veterans-and-trauma.md",
    faqs: [
      "Can therapy help veterans?",
      "Why can transition from military life feel difficult?",
      "Does trauma always look dramatic?"
    ],
    related: [{ href: "/knowledge-library/what-is-trauma-therapy/", label: "What is trauma therapy?" }]
  },
  {
    slug: "transactional-analysis-and-physis",
    sourceFile: "transactional-analysis-and-physis.md",
    faqs: [
      "What is Transactional Analysis?",
      "What does physis mean?",
      "How can TA help therapy?"
    ],
    related: [{ href: "/knowledge-library/feelings-are-intelligent/", label: "Feelings are intelligent." }]
  }
];

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionId(slug, heading) {
  return `${slug}-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-`;
}

function paragraphsToHtml(paragraphs) {
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

export function parseKnowledgeArticleMarkdown(markdown) {
  const trimmed = markdown.trim();
  const titleMatch = trimmed.match(/^#\s+(.+)$/m);
  const metaMatch = trimmed.match(/\*\*Category:\*\*\s*(.+?)\s*·\s*\*\*Read time:\*\*\s*(.+)$/m);
  const descriptionMatch = trimmed.match(/^\*(.+)\*$/m);
  const bodyStart = trimmed.indexOf("\n---\n");
  const body = bodyStart === -1 ? "" : trimmed.slice(bodyStart + 5).trim();

  const title = titleMatch?.[1]?.trim() ?? "Knowledge Library article";
  const category = metaMatch?.[1]?.trim() ?? "Knowledge Library";
  const readTime = metaMatch?.[2]?.trim() ?? "";
  const description = descriptionMatch?.[1]?.trim() ?? "";

  const sectionParts = body.split(/\n(?=## )/);
  const introText = sectionParts[0]?.startsWith("## ") ? "" : sectionParts.shift() ?? "";
  const intro = splitParagraphs(introText);

  const sections = sectionParts.map((part) => {
    const lines = part.trim().split("\n");
    const heading = lines[0].replace(/^##\s+/, "").trim();
    const content = lines.slice(1).join("\n").trim();
    return { heading, paragraphs: splitParagraphs(content) };
  });

  return { title, category, readTime, description, intro, sections };
}

function buildEssaySection(slug, { heading, paragraphs, kicker = "Understanding", labelledBy }) {
  const id = labelledBy ?? sectionId(slug, heading);
  return `<section class="approachEssay" aria-labelledby="${id}"><div class="approachEssayInner"><p class="sectionKicker">${escapeHtml(kicker)}</p><h2 class="approachSectionTitle" id="${id}">${escapeHtml(heading)}</h2><div class="approachBody">${paragraphsToHtml(paragraphs)}</div></div></section>`;
}

function buildIntroSection(paragraphs) {
  if (!paragraphs.length) {
    return "";
  }

  return `<section class="approachEssay" aria-label="Introduction"><div class="approachEssayInner"><div class="approachBody">${paragraphsToHtml(paragraphs)}</div></div></section>`;
}

function buildFaqSection(faqs) {
  const items = faqs.map((question) => `<li>${escapeHtml(question)}</li>`).join("");
  return `<section class="approachLifeForce" aria-labelledby="questions"><div class="approachLifeForceInner"><p class="sectionKicker">Common Questions</p><h2 class="approachSectionTitle" id="questions">Questions this article helps answer.</h2><ul class="authorityList">${items}</ul></div></section>`;
}

function buildRelatedSection(related) {
  const links = related
    .map((item) => `<a href="${item.href}">${escapeHtml(item.label)}</a>`)
    .join("");
  return `<section class="approachEssay" aria-labelledby="related-articles"><div class="approachEssayInner"><p class="sectionKicker">Related Articles</p><h2 class="approachSectionTitle" id="related-articles">Continue the thread.</h2><div class="knowledgeInlineLinks">${links}</div></div></section>`;
}

export function buildKnowledgeArticleSchema(article) {
  const canonical = `${SITE}/knowledge-library/${article.slug}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Knowledge Library", item: `${SITE}/knowledge-library` },
      { "@type": "ListItem", position: 3, name: article.title, item: canonical }
    ]
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    articleSection: article.category,
    author: { "@id": `${SITE}/about/#brent-kelly` },
    publisher: { "@id": `${SITE}/#organization` },
    mainEntityOfPage: canonical,
    image: ARTICLE_IMAGE
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((question) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: article.description
      }
    }))
  };

  return `<script id="knowledge-article-schema" type="application/ld+json">${JSON.stringify([breadcrumb, articleSchema, faqSchema])}</script>`;
}

const LIBRARY_TOPICS = `<section class="journalTopics" aria-labelledby="library-topics"><p class="sectionKicker">Browse by Topic</p><h2 class="journalSectionTitle" id="library-topics">The library is built around subject depth, not keywords.</h2><div class="knowledgeCategoryGrid"><a class="knowledgeCategory" href="/knowledge-library/?topic=trauma"><span>Trauma</span><small>Understanding survival, adaptation and recovery.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=relationships"><span>Relationships</span><small>How attachment, safety and repeated patterns shape us.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=emotions"><span>Emotions</span><small>Feelings as information, not interruptions.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=attachment"><span>Attachment</span><small>The psychology of connection, distance and belonging.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=neuroscience"><span>Neuroscience</span><small>Plain-language ideas about the brain and nervous system.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=veterans"><span>Veterans</span><small>Military experience, transition, identity and trauma.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=transactional-analysis"><span>Transactional Analysis</span><small>Readable introductions to TA ideas and language.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=polyvagal-theory"><span>Polyvagal Theory</span><small>Nervous system states, safety and regulation.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=self-development"><span>Self Development</span><small>Growth, authenticity and the movement towards freedom.</small></a><a class="knowledgeCategory" href="/knowledge-library/?topic=therapy-explained"><span>Therapy Explained</span><small>Clear answers to common questions about therapy.</small></a></div></section>`;

const LIBRARY_PHILOSOPHY = `<section class="journalPhilosophy" aria-labelledby="library-why"><div class="journalPhilosophyCopy"><p class="sectionKicker">Why This Exists</p><h2 class="journalSectionTitle" id="library-why">Understanding should not begin only when therapy starts.</h2><div class="journalBody"><p>Sometimes one sentence gives a person enough language to stop blaming themselves.</p><p>Sometimes one idea helps someone recognise that a pattern was once protection.</p><p>The Knowledge Library is built for those moments: careful, readable psychological writing that points back towards lived experience.</p></div></div></section>`;

function buildLibraryArticleListItem(article) {
  const readTimeLabel = article.readTime ? `${article.readTime} read` : "";
  return `<li class="knowledgeArticleItem"><p class="journalEssayCategory">${escapeHtml(article.category)}</p><h3><a href="/knowledge-library/${article.slug}/">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.description)}</p>${readTimeLabel ? `<small>${escapeHtml(readTimeLabel)}</small>` : ""}</li>`;
}

export function buildKnowledgeLibraryIndexBody(articles) {
  const articleList = articles.map(buildLibraryArticleListItem).join("");
  const breadcrumbSchema = `<script id="knowledge-library-breadcrumb-schema" type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${SITE}/"},{"@type":"ListItem","position":2,"name":"Knowledge Library","item":"${SITE}/knowledge-library"}]}</script>`;

  return `${breadcrumbSchema}<article class="journalPage"><section class="journalHero" aria-labelledby="library-title"><div class="journalHeroCopy"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><span aria-current="page">Knowledge Library</span></li></ol></nav><p class="sectionKicker">Knowledge Library</p><h1 class="journalHeroTitle" id="library-title">Clear ideas for difficult human things.</h1><p class="journalHeroText">A growing library of trauma-informed writing on emotion, relationships, attachment, the body, veterans, therapy and the psychology of being human.</p></div></section><section class="journalLatest" aria-labelledby="library-articles"><div class="journalSectionIntro"><p class="sectionKicker">Articles</p><h2 class="journalSectionTitle" id="library-articles">Start with the questions people ask most often.</h2></div><ol class="knowledgeArticleList">${articleList}</ol></section>${LIBRARY_TOPICS}${LIBRARY_PHILOSOPHY}${RELATED_PAGES}</article>`;
}

export function buildKnowledgeLibraryIndexPage(shellHtml, articles, buildInteriorPageV2) {
  return buildInteriorPageV2(shellHtml, {
    title: "Knowledge Library | Pathfinder Therapy",
    description:
      "A Pathfinder Therapy knowledge library on trauma, emotions, attachment, neuroscience, veterans, relationships and therapy.",
    canonical: `${SITE}${KNOWLEDGE_LIBRARY_ROUTE}`,
    mainInner: buildKnowledgeLibraryIndexBody(articles),
    ogImage: OG_IMAGE
  });
}

export function buildKnowledgeArticleBody(article) {
  const readTimeLabel = article.readTime ? `${article.readTime} read` : "";
  const hero = `<section class="approachHero" aria-labelledby="article-title"><div class="approachHeroCopy"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/knowledge-library/">Knowledge Library</a></li><li><span aria-current="page">${escapeHtml(article.title)}</span></li></ol></nav><p class="sectionKicker">${escapeHtml(article.category)}</p><h1 class="approachHeroTitle" id="article-title">${escapeHtml(article.title)}</h1><div class="approachHeroText"><p>${escapeHtml(article.description)}</p>${readTimeLabel ? `<p>${escapeHtml(readTimeLabel)}</p>` : ""}</div></div></section>`;
  const contentSections = article.sections
    .map((section) => buildEssaySection(article.slug, section))
    .join("");

  return `<article class="approachPage">${hero}${buildIntroSection(article.intro)}${contentSections}${buildFaqSection(article.faqs)}${buildRelatedSection(article.related)}${RELATED_PAGES}</article>`;
}

export async function loadKnowledgeArticles() {
  return Promise.all(
    KNOWLEDGE_ARTICLE_META.map(async (meta) => {
      const markdown = await readFile(path.join(CONTENT_DIR, meta.sourceFile), "utf8");
      const parsed = parseKnowledgeArticleMarkdown(markdown);
      return {
        ...meta,
        ...parsed,
        route: `/knowledge-library/${meta.slug}/`
      };
    })
  );
}

export function buildKnowledgeArticlePage(shellHtml, article, buildInteriorPageV2) {
  const canonical = `${SITE}/knowledge-library/${article.slug}/`;
  const mainInner = `${buildKnowledgeArticleSchema(article)}${buildKnowledgeArticleBody(article)}`;

  return buildInteriorPageV2(shellHtml, {
    title: `${article.title} | Pathfinder Therapy`,
    description: article.description,
    canonical,
    mainInner,
    ogImage: OG_IMAGE
  });
}

export function getKnowledgeArticleRoutes() {
  return KNOWLEDGE_ARTICLE_META.map((article) => `/knowledge-library/${article.slug}/`);
}

export function getKnowledgeLibraryBuiltRoutes() {
  return [KNOWLEDGE_LIBRARY_ROUTE, ...getKnowledgeArticleRoutes()];
}
