import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const UK_EMDR_ROUTE = "/online-emdr-therapy-uk/";
const ORIGIN = "https://www.pathfindertherapy.com";
const URL = `${ORIGIN}${UK_EMDR_ROUTE}`;
const BOOKING = "https://booking.pathfindertherapy.com/book?market=uk";
const EMAIL = "mailto:hi@pathfindertherapy.com?subject=UK%20online%20EMDR%20enquiry";
const TITLE = "Online EMDR Therapy UK | £80 | Brent Kelly & Tim Felton";
const DESCRIPTION = "Online EMDR therapy across the UK with Brent Kelly and Tim Felton. £80 for 60 minutes, in English. Start with a free 30-minute Zoom consultation.";

const CSS = `<style id="pathfinder-uk-emdr">
.ukEmdr { color:var(--pf-stone,#27342d); background:var(--pf-parchment,#f6f2ea); }
.ukWrap { max-width:1120px; margin:0 auto; padding-inline:clamp(20px,5vw,64px); }
.ukHero { position:relative; overflow:hidden; color:#f6f2ea; background:#12241e; }
.ukHeroImage { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.24; }
.ukHero .ukWrap { position:relative; display:grid; grid-template-columns:minmax(0,1fr) 260px; align-items:center; gap:48px; padding-block:clamp(52px,8vw,100px); }
.ukEyebrow { margin:0 0 18px; color:#d8b779; letter-spacing:.14em; text-transform:uppercase; font-size:12px; font-weight:600; }
.ukEmdr h1,.ukEmdr h2,.ukEmdr h3 { font-family:var(--pf-font-serif,Georgia,serif); font-weight:500; line-height:1.12; text-wrap:balance; }
.ukEmdr h1 { font-size:clamp(38px,5vw,62px); margin:0 0 24px; max-width:17ch; color:#fff9ef; }
.ukEmdr h2 { font-size:clamp(27px,3vw,39px); margin:0 0 22px; }
.ukEmdr h3 { font-size:25px; margin:0 0 12px; }
.ukLead { font-size:19px; line-height:1.65; max-width:57ch; color:#e6e7df; }
.ukEmdr p,.ukEmdr li { line-height:1.75; }
.ukActions { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-top:26px; }
.ukButton { display:inline-flex; align-items:center; justify-content:center; min-height:48px; padding:12px 20px; border-radius:999px; background:#d7b779; color:#13251e; font-weight:650; text-decoration:none; text-align:center; line-height:1.4; border:1px solid #d7b779; }
.ukButton:hover { background:#e5cda0; }
.ukTextLink { min-height:44px; display:inline-flex; align-items:center; color:inherit; text-underline-offset:5px; }
.ukFee { border:1px solid #bba36d77; border-radius:18px; padding:28px; background:#10201bcb; }
.ukFee strong { font-family:var(--pf-font-serif,Georgia,serif); display:block; font-size:64px; line-height:1.15; color:#e0c48e; }
.ukFee p { margin:10px 0 0; }
.ukFee small { display:block; margin-top:18px; color:#d3dace; line-height:1.7; }
.ukJump { display:flex; gap:6px 26px; flex-wrap:wrap; border-bottom:1px solid #d6d8ca; padding-block:12px; }
.ukJump a { color:#435344; font-size:14px; text-underline-offset:4px; min-height:44px; display:inline-flex; align-items:center; }
.ukSection { padding-block:clamp(42px,6vw,72px); scroll-margin-top:100px; }
.ukSection + .ukSection { border-top:1px solid #d8dbcf; }
.ukIntro { display:grid; grid-template-columns:.7fr 1fr; gap:50px; }
.ukIntro p:first-child { margin-top:0; }
.ukPractitioners { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.ukPerson { display:grid; grid-template-columns:128px 1fr; gap:24px; background:#fffdf7; border:1px solid #d8dccc; border-radius:18px; padding:26px; align-items:start; }
.ukPerson img { width:128px; height:156px; object-fit:cover; object-position:center 25%; border-radius:10px; }
.ukPerson p { margin:10px 0 0; font-size:15px; }
.ukRole { color:#79643c; font-size:13px; letter-spacing:.04em; }
.ukSteps { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-top:30px; }
.ukStep { padding:26px; border:1px solid #d8dccc; border-radius:16px; }
.ukStepNumber { display:block; color:#8b754a; font-size:13px; margin-bottom:18px; }
.ukStep p { font-size:15px; margin-bottom:0; }
.ukPractical { display:grid; grid-template-columns:1fr 1fr; gap:48px; }
.ukFacts { display:grid; grid-template-columns:1fr 1fr; gap:0; margin:22px 0; }
.ukFacts div { border-bottom:1px solid #d8dccc; padding:15px 10px 15px 0; }
.ukFacts dt { font-size:13px; color:#64705f; }
.ukFacts dd { margin:4px 0 0; font-weight:600; }
.ukNotice { border-left:3px solid #b79959; padding-left:18px; font-size:14px; }
.ukFaq details { padding:20px 0; border-bottom:1px solid #d8dccc; }
.ukFaq summary { cursor:pointer; font-weight:600; font-size:17px; line-height:1.5; padding-right:16px; }
.ukFaq details p { max-width:78ch; margin:16px 0 4px; }
.ukContact { background:#162a22; color:#edf0e5; }
.ukContact .ukWrap { padding-block:60px; display:grid; grid-template-columns:1fr 1fr; gap:52px; }
.ukContact h2 { color:#fff9ef; }
.ukContact a:not(.ukButton) { color:#e6cb91; text-underline-offset:4px; }
.ukContact address { font-style:normal; line-height:1.8; }
.ukContact small { font-size:13px; line-height:1.75; display:block; color:#ced6c9; }
.ukEmdr a:focus-visible,.ukEmdr summary:focus-visible { outline:3px solid #af8842; outline-offset:5px; }
@media(max-width:850px) { .ukHero .ukWrap { grid-template-columns:1fr; gap:28px; } .ukFee { max-width:420px; } .ukFee strong { font-size:50px; } .ukIntro,.ukPractical,.ukContact .ukWrap { grid-template-columns:1fr; gap:24px; } .ukPractitioners,.ukSteps { grid-template-columns:1fr; } }
@media(max-width:450px) { .ukPerson { grid-template-columns:88px 1fr; gap:16px; padding:20px; } .ukPerson img { width:88px; height:116px; } .ukEmdr h3 { font-size:23px; } .ukActions .ukButton { width:100%; } }
</style>`;

function body() {
  return `<article class="ukEmdr">
<header class="ukHero">
  <img class="ukHeroImage" src="/assets/images/hero-01.webp" width="1440" height="640" alt="" fetchpriority="high" decoding="async">
  <div class="ukWrap"><div>
    <p class="ukEyebrow">Pathfinder Therapy · United Kingdom · Online only</p>
    <h1 id="online-emdr-therapy-uk">Online EMDR therapy across the UK</h1>
    <p class="ukLead">Work with <strong>Brent Kelly or Tim Felton</strong>, from a private space that works for you. A thoughtful approach to distressing memories, with assessment, preparation and a pace agreed together.</p>
    <div class="ukActions"><a class="ukButton" href="${BOOKING}">Book a free initial call</a><a class="ukTextLink" href="#uk-contact">Enquire about EMDR</a></div>
    <p style="font-size:14px;color:#d3dace">The free 30-minute Zoom call is with Brent. No obligation to continue.</p>
  </div><aside class="ukFee" aria-label="UK EMDR session fee"><span>UK EMDR sessions</span><strong>£80</strong><p>60 minutes · Online only</p><small>The same fixed UK fee applies to Brent Kelly and Tim Felton. Sessions are arranged following assessment and agreement with your practitioner.</small></aside></div>
</header>
<div class="ukWrap">
  <nav class="ukJump" aria-label="On this page"><a href="#uk-practitioners">Your practitioners</a><a href="#uk-process">What to expect</a><a href="#uk-fees">Fees &amp; online sessions</a><a href="#uk-faq">Questions</a><a href="#uk-contact">UK contact details</a></nav>
  <section class="ukSection ukIntro" aria-labelledby="uk-emdr-about"><div><p class="ukEyebrow" style="color:#79643c">Understanding the approach</p><h2 id="uk-emdr-about">What is EMDR therapy?</h2></div><div>
    <p>EMDR stands for Eye Movement Desensitisation and Reprocessing. It is a structured psychotherapy approach that can help people work through distress associated with traumatic experiences. Processing may involve guided eye movements or other forms of alternating stimulation while attending to parts of an experience.</p>
    <p>At Pathfinder, the work starts with understanding your circumstances and whether EMDR is appropriate. Preparation, the therapeutic relationship and your ability to pause are part of the process. You do not need to know in advance whether EMDR is the right approach for you.</p>
    <p>EMDR is included in <a href="https://www.nice.org.uk/guidance/ng116/chapter/recommendations">NICE guidance for PTSD</a> in specified circumstances. Suitability is assessed individually; the guidance does not mean it is the right treatment for everyone.</p>
    <p><a href="/knowledge-library/how-does-emdr-work/">Read more about how EMDR works</a></p>
  </div></section>
  <section class="ukSection" id="uk-practitioners" aria-labelledby="uk-practitioners-title"><h2 id="uk-practitioners-title">Meet your EMDR therapists</h2><p>Brent Kelly and Tim Felton offer online EMDR through Pathfinder Therapy for clients in the UK. Let us know if you have a practitioner preference when you enquire.</p>
    <div class="ukPractitioners">
      <article class="ukPerson"><img src="/assets/images/team/brent-kelly.jpeg" alt="Brent Kelly" width="128" height="156" loading="lazy"><div><h3>Brent Kelly</h3><span class="ukRole">EMDR Therapist · Pathfinder founder</span><p>Brent offers EMDR within trauma-informed psychotherapy. He holds the free initial Zoom conversation, providing space to ask about his approach and discuss a suitable next step.</p><p><a href="${BOOKING}">Arrange an initial call with Brent</a></p></div></article>
      <article class="ukPerson"><img src="/assets/images/team/tim-felton.jpeg" alt="Tim Felton" width="128" height="156" loading="lazy"><div><h3>Tim Felton</h3><span class="ukRole">EMDR Therapist · Online therapy</span><p>Tim offers online EMDR through Pathfinder Therapy. Contact the team to discuss working with Tim, his availability and whether the approach is appropriate for your needs.</p><p><a href="${EMAIL}">Enquire about working with Tim</a></p></div></article>
    </div><p><a href="/about/">More about the Pathfinder team</a></p>
  </section>
  <section class="ukSection" id="uk-process" aria-labelledby="uk-process-title"><h2 id="uk-process-title">What happens before EMDR processing?</h2><p>The first step is a conversation. Treatment is planned together, with time to understand what you need before deciding how to proceed.</p>
    <div class="ukSteps"><article class="ukStep"><span class="ukStepNumber">01 · Initial conversation</span><h3>Ask questions</h3><p>Use the free 30-minute Zoom call with Brent to talk briefly about what brings you here. You can also enquire directly about working with Tim.</p></article><article class="ukStep"><span class="ukStepNumber">02 · Assessment &amp; preparation</span><h3>Build a workable plan</h3><p>Your practitioner discusses suitability, your current support and ways to manage distress. Processing does not have to begin in the first therapy session.</p></article><article class="ukStep"><span class="ukStepNumber">03 · Agreed treatment</span><h3>Work at an agreed pace</h3><p>If EMDR is appropriate, you agree the approach and how to pause. Progress, comfort with online work and support between appointments are reviewed together.</p></article></div>
  </section>
  <section class="ukSection ukPractical" id="uk-fees" aria-labelledby="uk-fees-title"><div><h2 id="uk-fees-title">Clear UK pricing</h2><dl class="ukFacts"><div><dt>EMDR session</dt><dd>£80 GBP</dd></div><div><dt>Length</dt><dd>60 minutes</dd></div><div><dt>Practitioners</dt><dd>Brent Kelly or Tim Felton</dd></div><div><dt>Delivery</dt><dd>Online only</dd></div><div><dt>Initial call with Brent</dt><dd>Free · 30 minutes</dd></div><div><dt>Language</dt><dd>English</dd></div></dl></div><div><h2>Joining from the UK</h2><p>Online EMDR is available to clients across England, Scotland, Wales and Northern Ireland, subject to individual assessment. You will need a private space, a suitable device and a reliable internet connection.</p><p>Before starting, your practitioner discusses your location, privacy, what to do if the connection drops and any support arrangements relevant to your care.</p><p class="ukNotice">All UK EMDR appointments are online. Our registered office in Burnley is an administrative address, not a walk-in clinic or a venue for these sessions.</p></div></section>
  <section class="ukSection ukFaq" id="uk-faq" aria-labelledby="uk-faq-title"><h2 id="uk-faq-title">Questions about online EMDR</h2>
    <details><summary>Can I have EMDR online in the UK?</summary><p>Yes. Brent Kelly and Tim Felton offer online EMDR through Pathfinder Therapy to clients in the UK where assessment indicates it is appropriate. The initial conversation helps clarify suitability and practical arrangements.</p></details>
    <details><summary>How much does a UK EMDR session cost?</summary><p>A 60-minute online EMDR session with Brent Kelly or Tim Felton costs £80. The initial 30-minute Zoom conversation with Brent is free and separate from a paid therapy session.</p></details>
    <details><summary>Can I choose Brent or Tim?</summary><p>You can tell us your preference. The public initial-call booking route is with Brent; to ask specifically about Tim, use the UK telephone number or email below. Availability and suitability are discussed before a practitioner is agreed.</p></details>
    <details><summary>Do you offer EMDR in person in the UK?</summary><p>No. This UK service is online only. Pathfinder also offers in-person EMDR with Brent in Lisbon, Portugal, under its separate Portugal service and pricing.</p><p><a href="/emdr-therapy-lisbon/">Explore EMDR in Lisbon</a></p></details>
    <details><summary>How many sessions will I need?</summary><p>There is no fixed number that is appropriate for everyone. Assessment, preparation and the difficulties you want to work on shape the plan. Your practitioner reviews the work and next steps with you.</p></details>
    <details><summary>What if online EMDR is not suitable for me?</summary><p>Your practitioner will discuss that with you. The initial conversation does not commit you to EMDR processing, and another approach or more preparation may be suggested.</p></details>
  </section>
</div>
<section class="ukContact" id="uk-contact" aria-labelledby="uk-contact-title"><div class="ukWrap"><div><p class="ukEyebrow">Take the first step</p><h2 id="uk-contact-title">Contact Pathfinder in the UK</h2><p>Ask about online EMDR with Brent or Tim, session availability or practical arrangements.</p><p><strong>UK telephone / Skype number</strong><br><a href="tel:+441282964788">01282 964788</a><br><small>From outside the UK: +44 1282 964788</small></p><p><a href="${EMAIL}">hi@pathfindertherapy.com</a></p><div class="ukActions"><a class="ukButton" href="${BOOKING}">Book a free call with Brent</a></div></div><div><h3>UK registered office</h3><address>Pathfinder Therapy CIC<br>Ribble Court<br>1 Mead Way<br>Padiham<br>Burnley<br>BB12 7NG<br>United Kingdom</address><p>Registered in England and Wales · Company number 17248842</p><small>Administrative address only. UK EMDR sessions take place online, not at this address. Telephone and email are for non-urgent enquiries.</small></div></div></section>
</article>`;
}

function schema() {
  const organisation = { "@type":"Organization", "@id":`${ORIGIN}/#organisation`, name:"Pathfinder Therapy", legalName:"Pathfinder Therapy CIC", url:ORIGIN, telephone:"+441282964788", email:"hi@pathfindertherapy.com", address:{"@type":"PostalAddress",streetAddress:"Ribble Court, 1 Mead Way",addressLocality:"Padiham, Burnley",postalCode:"BB12 7NG",addressCountry:"GB"} };
  return { "@context":"https://schema.org", "@graph":[
    organisation,
    {"@type":"Person","@id":`${URL}#brent-kelly`,name:"Brent Kelly",jobTitle:"EMDR Therapist",worksFor:{"@id":organisation["@id"]},url:`${URL}#uk-practitioners`},
    {"@type":"Person","@id":`${URL}#tim-felton`,name:"Tim Felton",jobTitle:"EMDR Therapist",worksFor:{"@id":organisation["@id"]},url:`${URL}#uk-practitioners`},
    {"@type":"Service","@id":`${URL}#service`,name:"Online EMDR therapy in the UK",serviceType:"Online EMDR therapy",description:"Online-only EMDR therapy in English with Brent Kelly or Tim Felton, £80 for a 60-minute session following assessment.",provider:{"@id":organisation["@id"]},areaServed:{"@type":"Country",name:"United Kingdom"},availableChannel:{"@type":"ServiceChannel",serviceUrl:URL},offers:{"@type":"Offer",price:"80.00",priceCurrency:"GBP",url:`${URL}#uk-fees`}},
    {"@type":"WebPage","@id":`${URL}#webpage`,url:URL,name:TITLE,description:DESCRIPTION,inLanguage:"en-GB",mainEntity:{"@id":`${URL}#service`}},
    {"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:ORIGIN+"/"},{"@type":"ListItem",position:2,name:"Online EMDR therapy UK",item:URL}]}
  ]};
}

export async function applyUkEmdrLanding(outDir) {
  const template = await readFile(path.join(outDir,"therapy/emdr/index.html"),"utf8");
  if ((template.match(/<main\b/g)||[]).length !== 1) throw new Error("Expected one EMDR main region.");
  let html = template.replace(/<main\b[^>]*>[\s\S]*?<\/main>/, `<main id="main-content" tabindex="-1">${body()}</main>`);
  html = html.replace(/<title>[\s\S]*?<\/title>/,`<title>${TITLE}</title>`)
    .replace(/<meta\b[^>]*(?:name="description"|property="og:(?:title|description|url)"|name="twitter:(?:title|description)")[^>]*>/g,"")
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/g,"")
    .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,"")
    .replace(/<html\b([^>]*)lang="[^"]*"/, '<html$1lang="en-GB"')
    .replace("</head>",`<meta name="description" content="${DESCRIPTION}"><link rel="canonical" href="${URL}"><meta property="og:title" content="${TITLE}"><meta property="og:description" content="${DESCRIPTION}"><meta property="og:url" content="${URL}"><meta name="twitter:title" content="${TITLE}"><meta name="twitter:description" content="${DESCRIPTION}"><script type="application/ld+json">${JSON.stringify(schema())}</script>${CSS}</head>`)
    .replaceAll("tel:+351914775365","tel:+441282964788")
    .replaceAll("+351 914 775 365","01282 964788");
  // Localise only this page's surrounding navigation and contact footer.
  const footerStart = html.indexOf('<footer');
  if (footerStart < 0) throw new Error("Expected shared site footer.");
  let footer = html.slice(footerStart)
    .replace(/R\. Rodrigues Sampaio 76(?:,? 1º Andar)?(?:<br\s*\/?>|\s)*1150-281 Lisboa,? Portugal/g,"UK registered office: Ribble Court<br>1 Mead Way, Padiham, Burnley, BB12 7NG")
    .replace(/<p>\s*<a href="https:\/\/www\.google\.com\/maps\/dir[^>]*>[\s\S]*?<\/a>\s*<\/p>/g,"")
    .replaceAll("· Brent Kelly, Lisboa ·","· Online EMDR in the UK ·")
    .replaceAll("Trauma-informed psychotherapy led by Brent Kelly in Lisbon, with online therapy support through Pathfinder where appropriate.","Online EMDR therapy across the UK with Brent Kelly or Tim Felton. Thoughtful support, clear fees and a pace agreed together.");
  html = html.slice(0,footerStart)+footer;
  html = html.replaceAll('href="https://booking.pathfindertherapy.com/book"',`href="${BOOKING}"`);
  html = html.replace(/<a\b[^>]*\bhref="\/(fees|contact)\/"/g, (anchor, section) =>
    anchor.replace(`href="/${section}/"`, `href="#uk-${section === "fees" ? "fees" : "contact"}"`));
  await mkdir(path.join(outDir,UK_EMDR_ROUTE),{recursive:true});
  await writeFile(path.join(outDir,UK_EMDR_ROUTE,"index.html"),html,"utf8");
  for(const relative of ["therapy/emdr/index.html","therapy/online/index.html"]) {
    const file=path.join(outDir,relative); let source=await readFile(file,"utf8");
    if (!(source.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "").includes(`href="${UK_EMDR_ROUTE}"`)) {
      source=source.replace("</main>",`<aside class="ukEmdrRelated" style="padding:28px clamp(20px,5vw,64px);background:#eef0e5;color:#283c2f"><p style="max-width:1040px;margin:0 auto;line-height:1.7">Joining from the UK? <a href="${UK_EMDR_ROUTE}">Explore online EMDR with Brent Kelly or Tim Felton</a> — £80 for 60 minutes, online only.</p></aside></main>`);
      await writeFile(file,source,"utf8");
    }
  }
  const sitemapPath=path.join(outDir,"sitemap.xml"); let sitemap=await readFile(sitemapPath,"utf8");
  if(!sitemap.includes(`<loc>${URL}</loc>`)) sitemap=sitemap.replace("</urlset>",`  <url><loc>${URL}</loc><lastmod>2026-09-13</lastmod></url>\n</urlset>`);
  await writeFile(sitemapPath,sitemap,"utf8");
}
