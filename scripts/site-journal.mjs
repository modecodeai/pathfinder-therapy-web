const SITE = "https://www.pathfindertherapy.com";
const escapeHtml = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const JOURNAL_STYLES = `<style id="pathfinder-organic-journal">
.organicJournal { width: min(100%, 74rem); margin: 0 auto; }
.organicJournal > section { box-sizing: border-box; min-width: 0; padding: clamp(32px, 5vw, 64px) clamp(20px, 4vw, 56px); border-bottom: var(--border-bronze-faint); }
.organicJournal .journalHero, .organicJournal .journalFeatured, .organicJournal .journalPhilosophy { display: block; min-height: 0; }
.organicJournal .journalHeroCopy, .organicJournal .journalFeaturedCopy, .organicJournal .journalPhilosophyCopy { max-width: 48rem; }
.organicJournal .journalHeroTitle { max-width: 18ch; font-size: clamp(2.25rem, 5vw, 4rem); line-height: 1.08; }
.organicJournal .journalHeroText { max-width: 42rem; }
.organicJournal .journalSectionTitle { max-width: 30ch; font-size: clamp(1.75rem, 3.5vw, 2.75rem); line-height: 1.15; }
.organicJournal .journalFeatured .journalBody, .organicJournal .journalTopics > p:last-child { max-width: 44rem; margin: 20px 0; font-size: 1.0625rem; line-height: 1.75; color: var(--color-linen); }
.organicJournal .journalPhilosophy .lpSecondaryCta { margin-top: 24px; }
.organicJournal .knowledgeArticleList { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; list-style: none; margin: 28px 0 0; padding: 0; }
.organicJournal .knowledgeArticleItem { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; min-width: 0; padding: 24px; border: var(--border-bronze-faint); }
.organicJournal .knowledgeArticleItem h3 { font-size: clamp(1.35rem, 2.5vw, 1.75rem); line-height: 1.25; overflow-wrap: break-word; }
.organicJournal .knowledgeArticleItem small { margin-top: auto; padding-top: 4px; }
.organicJournal .knowledgeInlineLinks { display: flex; flex-wrap: wrap; gap: 16px 28px; margin-top: 24px; }
.organicJournal .knowledgeInlineLinks a { min-height: 44px; display: inline-flex; align-items: center; }
.organicJournal a:focus-visible { outline: 3px solid #c89a58; outline-offset: 5px; }
.organicJournal .lpEndCta { margin-top: 0; }
@media (max-width: 700px) {
  .organicJournal .knowledgeArticleList { grid-template-columns: 1fr; }
  .organicJournal .knowledgeArticleItem { padding: 20px; }
  .organicJournal .knowledgeInlineLinks { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>`;

export function buildJournalPage(shellHtml, articles, buildInteriorPage) {
  const bySlug = new Map(articles.map(article => [article.slug, article]));
  const featured = bySlug.get("how-does-emdr-work");
  const selected = ["feelings-are-intelligent", "the-body-remembers", "what-is-trauma-therapy", "what-happens-in-a-first-therapy-session", "online-therapy", "transactional-analysis-and-physis"]
    .map(slug => bySlug.get(slug));
  if (!featured || selected.some(article => !article)) throw new Error("Journal links must resolve to published library articles.");
  const cards = selected.map(article => `<li class="knowledgeArticleItem"><p class="journalEssayCategory">${escapeHtml(article.category)}</p><h3><a href="${article.route}">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.description)}</p><small>${escapeHtml(article.readTime)} read</small></li>`).join("");
  const breadcrumb = {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${SITE}/`},{"@type":"ListItem",position:2,name:"Journal",item:`${SITE}/journal/`}]};
  return buildInteriorPage(shellHtml, {
    title: "Therapy Journal: EMDR, Trauma and Emotional Life | Pathfinder",
    description: "Read Pathfinder essays on EMDR, trauma, emotions and starting therapy. Explore practical explanations and related therapy options in Lisbon and online.",
    canonical: `${SITE}/journal/`,
    ogImage: `${SITE}/assets/images/journal.webp`,
    schema: JOURNAL_STYLES,
    mainInner: `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script><article class="journalPage organicJournal">
      <section class="journalHero" aria-labelledby="journal-title"><div class="journalHeroCopy"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><span aria-current="page">Journal</span></li></ol></nav><p class="sectionKicker">The Pathfinder Journal</p><h1 class="journalHeroTitle" id="journal-title">Ideas that help us understand ourselves.</h1><p class="journalHeroText">Thoughtful essays exploring trauma, relationships, emotion, identity, the body and the psychology of being human.</p></div></section>
      <section class="journalFeatured" aria-labelledby="featured-essay"><div class="journalFeaturedCopy"><p class="sectionKicker">Featured explanation</p><h2 class="journalSectionTitle" id="featured-essay"><a href="${featured.route}">${escapeHtml(featured.title)}</a></h2><p class="journalBody">What EMDR involves, why preparation matters, and how focused work can fit alongside longer-term therapy.</p><a class="lpPrimaryCta" href="${featured.route}">Read the EMDR explanation</a></div></section>
      <section class="journalLatest" aria-labelledby="latest-essays"><div class="journalSectionHead"><p class="sectionKicker">Published essays</p><h2 class="journalSectionTitle" id="latest-essays">Writing from the path.</h2></div><ol class="knowledgeArticleList">${cards}</ol></section>
      <section class="journalPhilosophy" aria-labelledby="journal-why"><div class="journalPhilosophyCopy"><p class="sectionKicker">People make sense</p><h2 class="journalSectionTitle" id="journal-why">Every pattern has a history.</h2><div class="journalBody"><p>What looks like self-sabotage today may once have been an intelligent way to survive.</p><p>Therapy is one way of walking alongside people. Writing is another. Some people arrive ready to begin therapy. Others arrive simply looking for a sentence that helps them understand themselves differently. Both matter.</p></div><a class="lpSecondaryCta" href="/knowledge-library/">Explore the full Knowledge Library</a></div></section>
      <section class="journalTopics" aria-labelledby="journal-options"><p class="sectionKicker">When you want to explore therapy</p><h2 class="journalSectionTitle" id="journal-options">Find practical information.</h2><div class="knowledgeInlineLinks"><a href="/emdr-therapy-lisbon/">EMDR sessions in Lisbon and online</a><a href="/english-speaking-therapist-lisbon/">English-speaking therapy</a><a href="/fees/">Fees and the free first conversation</a></div><p>Availability is discussed individually. A first conversation helps us explore fit and next steps; it does not guarantee a therapy place.</p></section>
    </article>`
  });
}
