import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GLOBAL_SCHEMA } from './site-schema.mjs';

export const ALCOBACA_ROUTE = '/nature-based-therapy-alcobaca/';
const SITE = 'https://www.pathfindertherapy.com';
const BOOK = 'https://booking.pathfindertherapy.com/book';
const IMAGE = '/assets/images/alcobaca-nature-practice.webp';
const TITLE = 'Nature-Based Therapy in Alcobaça | Eco-TA & EMDR | Pathfinder Therapy';
const DESCRIPTION = 'English-speaking nature-based therapy in Alcobaça with Brent Kelly. Explore Eco-TA and EMDR where appropriate, in a woodland setting. Enquire about sessions.';
const directions = 'The practice is around 10 minutes from the centre of Alcobaça. Directions and arrival details are shared when your session is arranged.';
const photo = (eager = false) => `<img src="${IMAGE}" srcset="/assets/images/alcobaca-nature-practice-720.webp 720w, /assets/images/alcobaca-nature-practice-1440.webp 1440w, ${IMAGE} 2400w" sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1240px) 55vw, 660px" width="2400" height="1800" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="Open-air timber deck with seating beneath trees at Pathfinder Therapy’s Alcobaça nature-based practice">`;
const actions = () => `<div class="natureActions"><a class="natureButton" href="${BOOK}">Arrange an initial consultation <span aria-hidden="true">↗</span></a><a class="natureLink" href="/start/?enquiryType=Nature-based%20therapy%20in%20Alcoba%C3%A7a#enquiry">Ask about Alcobaça <span aria-hidden="true">→</span></a></div><p class="natureSmall">Free 30-minute Zoom call · No obligation to continue</p>`;
const faqs = [
  ['Where is the nature-based practice?', `Our nature-based practice is in Alcobaça, Portugal. ${directions} You can ask about travel, access and the setting during an initial conversation.`],
  ['Do I need to walk or take part in outdoor activities?', 'Nature-based therapy does not have to involve a walk or an activity. We discuss how you would like to use the setting, your comfort and any mobility or sensory needs before agreeing a session.'],
  ['Can I have EMDR at the Alcobaça practice?', 'EMDR can be incorporated where clinically appropriate, following assessment and preparation. We agree the setting and way of working with you, considering privacy, comfort and readiness. An initial conversation does not commit you to EMDR.'],
  ['How do I arrange a session, and what does it cost?', 'Start with a free 30-minute Zoom consultation or send an enquiry mentioning Alcobaça. Availability, session length, fees, access and weather arrangements are agreed before you attend. The initial call is separate from paid therapy.']
];

function pageBody() {
  return `<div class="naturePage">
<div class="natureWrap natureBreadcrumb"><a href="/">Home</a><span aria-hidden="true"> / </span><a href="/therapy/">Therapy</a><span aria-hidden="true"> / </span><span>Alcobaça</span></div>
<section class="natureHero natureWrap" aria-labelledby="nature-title"><div><p class="natureEyebrow">ALCOBAÇA · NATURE-BASED PRACTICE</p><h1 id="nature-title">Nature-based<br>therapy in<br><em>Alcobaça.</em></h1><p class="natureLead">Nature-based therapy in Alcobaça, incorporating Eco-TA and EMDR where appropriate.</p><p class="natureIntro">English-speaking psychotherapy with Brent Kelly in a setting among trees, around 10 minutes from the centre of Alcobaça. Alongside our Lisbon clinic and online sessions, this offers another way to meet, reflect and explore what matters to you.</p>${actions()}</div><figure class="naturePhoto">${photo(true)}<figcaption>The nature-based practice at Alcobaça, Portugal.</figcaption></figure></section>
<div class="natureWrap"><div class="natureFacts"><div><span>THE SETTING</span><strong>Alcobaça, Portugal</strong><p>Around 10 minutes from the centre</p></div><div><span>THE APPROACH</span><strong>Eco-TA &amp; EMDR</strong><p>Shaped around your needs</p></div><div><span>YOUR FIRST STEP</span><strong>A conversation with Brent</strong><p>Free 30-minute Zoom call</p></div></div></div>
<section class="natureSection natureWrap natureSplit" aria-labelledby="nature-ecota"><div><p class="natureEyebrow">ECOLOGICAL TRANSACTIONAL ANALYSIS</p><h2 id="nature-ecota">You, your relationships,<br>and the natural world.</h2></div><div class="natureCopy"><p>Eco-TA (Ecological Transactional Analysis) understands our experience in relationship with other people and the wider natural world. It brings an ecological perspective to Transactional Analysis, with attention to how nature and place are part of our lives.</p><p>In therapy, this can open a conversation about belonging, connection, familiar patterns and your relationship with your surroundings. We can attend to what you notice in the setting, alongside your feelings, thoughts and experiences. There is no expectation to feel a particular way in nature.</p><p>The therapeutic relationship remains central. We agree together how, and whether, the natural environment becomes part of your work.</p><a class="natureLink" href="https://ecota.dev/" target="_blank" rel="noopener noreferrer">Read about Ecological TA <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span></a></div></section>
<section class="natureBand" aria-labelledby="nature-emdr"><div class="natureWrap natureSplit"><div><p class="natureEyebrow">TRAUMA-INFORMED CARE</p><h2 id="nature-emdr">EMDR, with time<br>to prepare.</h2></div><div class="natureCopy"><p>EMDR may be incorporated into therapy at Alcobaça where clinically appropriate. It sits within an ongoing therapeutic relationship, following assessment and preparation.</p><p>We consider your needs and readiness, as well as the privacy and suitability of the setting. There is time to build trust and ways to stay grounded before deciding whether to work with distressing memories. You can discuss concerns and preferences throughout.</p><p>The nature-based setting does not determine which therapy you need. Eco-TA and EMDR can inform the work without every session needing to include both.</p><a class="natureLink" href="/therapy/emdr/">More about EMDR at Pathfinder →</a></div></div></section>
<section class="natureSection natureWrap" aria-labelledby="nature-practical"><div class="natureSplit"><div><p class="natureEyebrow">BEFORE YOU VISIT</p><h2 id="nature-practical">Make room for<br>the practical details.</h2></div><div class="natureCopy"><p>The photographed space has a timber deck and seating among trees. We discuss the setting with you before arranging a session, including privacy, weather, comfort and any mobility or sensory needs.</p><p>${directions} Please mention Alcobaça when you enquire so we can discuss availability, travel, session length and fees, and agree what happens if outdoor conditions are unsuitable.</p><p>You can also explore sessions at our <a href="/contact/">Lisbon clinic</a> or <a href="/therapy/online/">online therapy</a>. The initial conversation helps us decide together which setting and approach feel suitable.</p></div></div></section>
<section class="natureQuestions natureWrap natureSplit" aria-labelledby="nature-questions"><div><p class="natureEyebrow">A FEW QUESTIONS</p><h2 id="nature-questions">Before you begin.</h2></div><div class="natureFaq">${faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section>
<section class="natureEnd" aria-labelledby="nature-start"><div class="natureWrap"><p class="natureEyebrow">WHEN YOU FEEL READY</p><h2 id="nature-start">Start with a conversation.</h2><p>Ask about the Alcobaça practice, meet Brent and explore whether working together feels right.</p>${actions()}</div></section>
</div>`;
}

function feature(home = false) {
  return `<section class="pfNatureFeature${home ? ' pfNatureFeatureHome' : ''}" aria-labelledby="alcobaca-feature-title"><div class="natureWrap natureFeatureGrid"><figure class="naturePhoto">${photo()}<figcaption>Our nature-based practice in Alcobaça.</figcaption></figure><div><p class="natureEyebrow">ALSO IN ALCOBAÇA</p><h2 id="alcobaca-feature-title">Therapy, with<br>nature around you.</h2><p>Our Alcobaça practice offers English-speaking nature-based psychotherapy with Brent Kelly, incorporating Eco-TA and EMDR where clinically appropriate.</p><p>Around 10 minutes from the centre of Alcobaça, a space among trees to explore your experience and your relationship with the natural world, at a pace agreed together.</p><a class="natureLink" href="${ALCOBACA_ROUTE}">Explore the Alcobaça practice <span aria-hidden="true">→</span></a></div></div></section>`;
}

export const ALCOBACA_CSS = `
.naturePage,.pfNatureFeature{background:#f7f4ed;color:#173f38;font-family:var(--pf-font-sans)}.naturePage *,.pfNatureFeature *{box-sizing:border-box}.natureMain{padding:0!important;margin:0!important;max-width:none!important}.natureWrap{max-width:1240px;margin-inline:auto;padding-inline:32px}.naturePage p,.pfNatureFeature p{line-height:1.75}.naturePage h1,.naturePage h2,.pfNatureFeature h2{font-family:var(--pf-font-serif);font-weight:500;letter-spacing:-.035em;color:#173f38;margin:0;line-height:1.08}.naturePage h2,.pfNatureFeature h2{font-size:clamp(34px,4vw,50px)}.natureEyebrow{font-size:11px;letter-spacing:.14em;font-weight:700;color:#5d6d5c;margin:0 0 22px!important}.natureBreadcrumb{padding-top:25px;font-size:12px;color:#59625b}.natureBreadcrumb a{color:#173f38;text-underline-offset:4px}.natureHero{display:grid;grid-template-columns:.9fr 1.2fr;gap:45px;align-items:center;padding-block:42px 54px}.natureHero h1{font-size:clamp(44px,5vw,64px);line-height:1.04;margin-bottom:24px}.natureHero h1 em{color:#64846b;font-weight:400}.natureLead{font-size:20px;margin:0 0 16px}.natureIntro{font-size:15px;color:#59625b;margin:0 0 24px;max-width:31rem}.naturePhoto{margin:0;min-width:0}.naturePhoto img{display:block;width:100%;height:auto;aspect-ratio:4/3;border-radius:5px;object-fit:contain;background:#e8eddf}.naturePhoto figcaption{font-size:12px;line-height:1.5;color:#59625b;margin-top:12px}.natureActions{display:flex;gap:16px;flex-wrap:wrap;align-items:center}.natureButton{display:inline-flex;align-items:center;justify-content:space-between;gap:20px;min-height:52px;padding:13px 20px;background:#173f38;border-radius:5px;color:#fff!important;text-decoration:none;font-size:14px;font-weight:600;line-height:1.5}.natureButton:hover{background:#28584e}.natureLink{display:inline-flex;align-items:center;gap:10px;min-height:44px;color:#173f38!important;font-size:14px;text-underline-offset:5px}.natureSmall{font-size:12px;color:#59625b;margin:12px 0 0!important}.natureFacts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-block:1px solid #dcded3;padding:25px 0}.natureFacts>div{padding-inline:28px;border-right:1px solid #dcded3;display:grid;gap:8px}.natureFacts>div:first-child{padding-left:0}.natureFacts>div:last-child{border:0}.natureFacts span{font-size:10px;font-weight:600;letter-spacing:.12em;color:#59625b}.natureFacts strong{font-size:17px;font-weight:500}.natureFacts p{font-size:12px;color:#59625b;margin:0}.natureSplit{display:grid;grid-template-columns:1fr 1.15fr;gap:75px}.natureSection{padding-block:78px}.natureCopy{font-size:16px;color:#59625b}.natureCopy p{margin:0 0 18px}.natureCopy p:last-child{margin-bottom:0}.natureCopy a{color:#173f38;text-underline-offset:4px}.natureBand{padding-block:68px;background:#e8eddf}.natureQuestions{padding-bottom:78px}.natureFaq details{border-bottom:1px solid #dcded3}.natureFaq details:first-child{border-top:1px solid #dcded3}.natureFaq summary{padding:23px 24px 23px 0;font-size:15px;line-height:1.55;font-weight:500;cursor:pointer;min-height:48px}.natureFaq p{font-size:14px;color:#59625b;margin:0 0 24px}.natureEnd{background:#e3e9da;text-align:center;padding-block:66px}.natureEnd>div>p:not(.natureEyebrow){max-width:34rem;margin:18px auto 24px;color:#59625b}.natureEnd .natureActions{justify-content:center}.pfNatureFeature{padding-block:60px;margin:0}.natureFeatureGrid{display:grid;grid-template-columns:1.15fr 1fr;gap:60px;align-items:center}.natureFeatureGrid>div>p:not(.natureEyebrow){font-size:15px;color:#59625b;max-width:29rem}.pfNatureFeatureHome{background:#eeeee5}.naturePage :focus-visible,.pfNatureFeature :focus-visible{outline:3px solid #906437;outline-offset:4px}
@media(max-width:760px){.natureWrap{padding-inline:20px}.natureHero,.natureSplit,.natureFeatureGrid{grid-template-columns:1fr;gap:28px}.natureHero{padding-block:30px 38px}.natureHero h1{font-size:46px}.natureLead{font-size:18px}.naturePhoto{width:100%}.natureFacts{grid-template-columns:1fr;padding:10px 0}.natureFacts>div{padding:16px 0;border-right:0;border-bottom:1px solid #dcded3}.natureFacts>div:last-child{border-bottom:0}.natureSection{padding-block:48px}.natureBand{padding-block:48px}.natureQuestions{padding-bottom:48px}.natureEnd,.pfNatureFeature{padding-block:48px}.natureEnd .natureActions{flex-direction:column}.natureHero .natureActions{align-items:start;flex-direction:column}.natureButton{max-width:100%;width:100%}.natureFeatureGrid .naturePhoto{order:1}.natureFeatureGrid>div{order:0}.natureSmall{font-size:11px}}
`;

function meta(html, key, value, property = false) {
  const attr = property ? 'property' : 'name';
  const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  const tag = `<meta ${attr}="${key}" content="${escaped}">`;
  const pattern = new RegExp(`<meta\\b(?=[^>]*${attr}="${key}")[^>]*>`, 'g');
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `${tag}</head>`);
}

function newPage(home) {
  let html = home.replace(/<main\b[\s\S]*?<\/main>/, `<main class="natureMain" id="main-content" tabindex="-1">${pageBody()}</main>`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${TITLE.replaceAll('&', '&amp;')}</title>`)
    .replace(/<link\b(?=[^>]*rel="canonical")[^>]*>/g, `<link rel="canonical" href="${SITE}${ALCOBACA_ROUTE}">`)
    .replace(/<link\b(?=[^>]*rel="preload")(?=[^>]*as="image")[^>]*>/g, '')
    .replace(/<script\b(?=[^>]*type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/(<a\b[^>]*?) aria-current="page"/g, '$1');
  for (const [key,value,property] of [['description',DESCRIPTION,false],['og:title',TITLE,true],['og:description',DESCRIPTION,true],['og:url',SITE+ALCOBACA_ROUTE,true],['og:image',SITE+IMAGE,true],['og:image:alt','The Alcobaça nature-based therapy practice among trees',true],['twitter:title',TITLE,false],['twitter:description',DESCRIPTION,false],['twitter:image',SITE+IMAGE,false]]) html = meta(html,key,value,property);
  const schema = [...GLOBAL_SCHEMA,
    {'@context':'https://schema.org','@type':'WebPage','@id':SITE+ALCOBACA_ROUTE+'#webpage',url:SITE+ALCOBACA_ROUTE,name:TITLE,description:DESCRIPTION,inLanguage:'en-GB',isPartOf:{'@id':SITE+'/#website'},primaryImageOfPage:{'@type':'ImageObject',url:SITE+IMAGE}},
    {'@context':'https://schema.org','@type':'Service','@id':SITE+ALCOBACA_ROUTE+'#service',name:'Nature-based therapy in Alcobaça',serviceType:'Nature-based psychotherapy incorporating Eco-TA and EMDR where clinically appropriate',url:SITE+ALCOBACA_ROUTE,description:DESCRIPTION,provider:{'@id':SITE+'/about/#brent-kelly'},areaServed:{'@type':'City',name:'Alcobaça'},availableChannel:{'@type':'ServiceChannel',serviceLocation:{'@type':'Place',name:'Pathfinder Therapy Alcobaça nature-based practice',address:{'@type':'PostalAddress',addressLocality:'Alcobaça',addressCountry:'PT'}}}},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE+'/'},{'@type':'ListItem',position:2,name:'Therapy',item:SITE+'/therapy/'},{'@type':'ListItem',position:3,name:'Nature-based therapy in Alcobaça',item:SITE+ALCOBACA_ROUTE}]},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ];
  return html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script></head>`);
}

export async function applyAlcobacaPractice(root) {
  const assetDir = path.join(root, 'assets/images');
  for (const name of ['alcobaca-nature-practice.webp','alcobaca-nature-practice-720.webp','alcobaca-nature-practice-1440.webp']) {
    await cp(path.join(root, '../public/assets/images', name), path.join(assetDir, name));
  }
  await writeFile(path.join(root, 'assets/alcobaca-design.css'), ALCOBACA_CSS);
  const all = async dir => (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?all(path.join(dir,e.name)):path.join(dir,e.name)))).flat();
  const linkedRoutes = new Set(['/therapy/','/approach/','/therapy/individual/','/therapy/emdr/']);
  for (const file of (await all(root)).filter(f=>f.endsWith('index.html'))) {
    const route = '/' + path.relative(root,file).replaceAll(path.sep,'/').replace(/index\.html$/,'');
    let html = await readFile(file,'utf8');
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/alcobaca-design.css"></head>');
    if (route === '/') {
      html = html.replace('<section class="lisbonVisit">', feature(true)+'<section class="lisbonVisit">')
        .replace('PATHFINDER THERAPY · LISBON & ONLINE','PATHFINDER THERAPY · LISBON, ALCOBAÇA & ONLINE')
        .replace('In person in Lisbon or securely online across Portugal, with EMDR offered where clinically appropriate.','In person in Lisbon, in nature at our Alcobaça practice, or securely online across Portugal. EMDR is offered where clinically appropriate.')
        .replace('<strong>Central Lisbon & online</strong>','<strong>Lisbon, Alcobaça &amp; online</strong>')
        .replace(/<a\b[^>]*>Find the practice ↗<\/a>/,'<a href="/contact/">Explore our locations →</a>');
      html = meta(html,'description','English-speaking psychotherapy and EMDR with Brent Kelly in Lisbon, nature-based therapy with Eco-TA in Alcobaça, and secure online sessions across Portugal.');
      html = meta(html,'og:description','English-speaking psychotherapy in Lisbon, nature-based therapy with Eco-TA in Alcobaça, and online sessions across Portugal.',true);
      html = meta(html,'twitter:description','English-speaking psychotherapy in Lisbon, nature-based therapy with Eco-TA in Alcobaça, and online sessions across Portugal.');
    } else if (linkedRoutes.has(route)) {
      html = html.replace('</main>',feature()+'</main>');
    }
    await writeFile(file,html);
  }
  const pageDir = path.join(root, ALCOBACA_ROUTE);
  await mkdir(pageDir,{recursive:true});
  await writeFile(path.join(pageDir,'index.html'),newPage(await readFile(path.join(root,'index.html'),'utf8')));
  let sitemap = await readFile(path.join(root,'sitemap.xml'),'utf8');
  if (!sitemap.includes(SITE+ALCOBACA_ROUTE)) sitemap = sitemap.replace('</urlset>',`  <url><loc>${SITE}${ALCOBACA_ROUTE}</loc><lastmod>2026-10-05</lastmod><priority>0.85</priority></url>\n</urlset>`);
  const updated = new Set(['/','/contact/',...linkedRoutes,ALCOBACA_ROUTE]);
  sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, entry => {
    const location = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!location || !updated.has(new URL(location).pathname)) return entry;
    return /<lastmod>/.test(entry) ? entry.replace(/<lastmod>[^<]*<\/lastmod>/,'<lastmod>2026-10-05</lastmod>') : entry.replace('</loc>','</loc><lastmod>2026-10-05</lastmod>');
  });
  await writeFile(path.join(root,'sitemap.xml'),sitemap);
  console.log(`Added ${ALCOBACA_ROUTE} and nature-practice links`);
}
