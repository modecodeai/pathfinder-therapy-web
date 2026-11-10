import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const CAPACITY_MESSAGE = "We are currently at capacity. Free 30-minute discovery calls are paused.";
const AVAILABILITY_PATH = "/availability/";
const LABEL = "Currently at capacity";
const BOOKING_URL = /^(?:https:\/\/(?:booking\.)?(?:www\.)?pathfindertherapy\.com)?\/book\/?(?:[?#].*)?$/i;
const notice = `<aside class="pfCapacityNotice" aria-label="Current availability"><strong>Currently at capacity</strong><span>Free 30-minute discovery calls are paused.</span><a href="/availability/">Availability information</a></aside>`;
const style = `<style id="pf-capacity-style">.pfCapacityNotice{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:8px 18px;padding:16px 24px;background:#e9e4d8;color:#203b33;font-size:15px;line-height:1.5;text-align:center;border-bottom:1px solid #c6cfc6}.pfCapacityNotice strong{font-weight:700}.pfCapacityNotice a{color:#203b33;text-decoration:underline;text-underline-offset:3px}.pfCapacityPage{max-width:760px;margin:0 auto;padding:64px 24px 80px;color:#f6f2ea}.pfCapacityPage h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.15;margin:0 0 24px}.pfCapacityPage p{font-size:18px;line-height:1.7;margin:0 0 20px}.pfCapacityPage a{color:#dfbd80;text-decoration:underline;text-underline-offset:4px}.pfCapacityPage a:focus-visible,.pfCapacityNotice a:focus-visible{outline:3px solid #a36b22;outline-offset:4px}@media(max-width:600px){.pfCapacityNotice{align-items:flex-start;gap:4px;padding:14px 20px}.pfCapacityNotice>*{width:100%}.pfCapacityPage{padding:40px 22px 64px}}</style>`;

function updateCopy(text) {
  const value = text.trim();
  if (!value || value.includes(CAPACITY_MESSAGE)) return text;
  const copy = new Map([
    ["If you both agree it feels right, your first session can be booked in Lisbon or online.", "We will explain future availability and any waiting-list options. An enquiry does not guarantee a therapy place or start date."],
    ["psychotherapy in English — initial consultations and ongoing therapy in Lisbon or online. It is not a substitute for crisis intervention.", "psychotherapy in English in Lisbon or online. Discovery calls are currently paused. It is not a substitute for crisis intervention."],
    ["Have a conversation", "Send a written enquiry"],
    ["Talk about what brings you here and ask about the approach, practicalities, fees and current availability.", "You can ask about future availability through our secure written enquiry form."],
    ["Decide together", "Consider future options"],
    ["If it feels like a suitable fit, discuss next steps. If no suitable appointment is available, you can ask about the waiting list.", "You can ask about the face-to-face waiting list. A request does not guarantee a therapy place or start date."],
    ["Meet by Zoom", "Ask about future availability"],
    ["Use the initial conversation to briefly discuss what brings you to therapy and ask questions.", "Send a non-urgent written enquiry about future availability and possible next steps."],
    ["Meet by Zoom — use the initial conversation to briefly discuss what brings you to therapy and ask questions.", "Send a written enquiry — ask about future availability and possible next steps."],
    ["Brent will reply by email to arrange an initial conversation.", "Brent will reply by email about future availability and possible next steps. Discovery calls are currently paused."],
    ["Initial conversation", "Discovery calls paused"],
    ["A confidential initial conversation by Zoom is separate from a therapy appointment. It does not guarantee a therapy place or start date.", CAPACITY_MESSAGE],
    ["A first conversation and current availability", "Current availability"],
    ["A first conversation, without pressure.", "Currently at capacity."],
    ["You can tell us your preference. The public initial-call booking route is with Brent; to ask specifically about Tim, use the UK telephone number or email below. Availability and suitability are discussed before a practitioner is agreed.", "Discovery calls are currently paused. You can send a written enquiry about future availability or a preferred practitioner; this does not guarantee a therapy place."],
    ["Brent offers EMDR where clinically appropriate following an assessment. Online couples therapy is available with Sophie Gidley through Pathfinder. The initial consultation helps identify a suitable therapist and approach and check current availability.", "Brent offers EMDR where clinically appropriate following an assessment. Online couples therapy is offered with Sophie Gidley through Pathfinder. We are currently at capacity and discovery calls are paused."],
  ]);
  if (/^— select a convenient time through the secure booking page\.$/.test(value)) return text.replace(value, "— discovery calls are paused while we are at capacity.");
  if (copy.has(value)) return text.replace(value, copy.get(value));
  if (/^Choose a convenient time for a confidential initial conversation by Zoom/.test(value)) return text.replace(value, "Discovery calls are currently paused. You can send a non-urgent written enquiry about future availability.");
  if (/^You can arrange an initial consultation at pathfindertherapy\.com\/book/.test(value)) return text.replace(value, `${CAPACITY_MESSAGE} You can send a non-urgent written enquiry about future availability.`);
  if (value === "Arrange an initial psychotherapy consultation in Lisbon") return text.replace(value, "Pathfinder Therapy current availability");
  const shortLabels = /^(?:Arrange (?:an initial consultation|a consultation directly)|Choose (?:a consultation time|a free initial call|a time(?: →)?)|Book a free (?:call with Brent|initial call)|Initial consultation|A free initial conversation|Free(?: · 30 minutes)?|30-minute initial consultation · Free · Secure Zoom|Initial consultation · Secure Zoom)$/i;
  if (shortLabels.test(value)) return text.replace(value, LABEL);
  if (/^Is (?:the first therapy session|the initial (?:EMDR )?consultation) free\?$/.test(value) || /^How do I arrange an initial consultation\?$/.test(value)) return text.replace(value, "Are initial consultations available?");
  if (/^Does EMDR processing begin during the free call\?$/.test(value)) return text.replace(value, "Are introductory EMDR calls available?");
  if (/^(?:Fees and the free first conversation|Session fees and the free introductory call)$/.test(value)) return text.replace(value, "Session fees and current availability");
  if (/(?:free[^.!?]*(?:call|consultation|conversation)|(?:call|consultation|conversation)[^.!?]*\bfree\b)/i.test(value)) return text.replace(value, CAPACITY_MESSAGE);
  if (/^Arrange (?:an Initial Consultation|a short confidential consultation)/i.test(value)) return text.replace(value, value.includes(" | ") ? "Currently at Capacity | Pathfinder Therapy" : CAPACITY_MESSAGE);
  if (/^(?:Book an initial consultation or|We are currently at capacity for new therapy clients\.|You stay in control of whether to continue\.)/i.test(value)) return text.replace(value, `${CAPACITY_MESSAGE} You can send a non-urgent written enquiry about future availability.`);
  if (/^arrange an initial consultation directly$/i.test(value)) return text.replace(value, "check current availability");
  if (/^if you would prefer to ask a question\. Initial consultations/.test(value)) return text.replace(value, "to ask about future availability. Discovery calls are currently paused.");
  if (/^Start with a conversation\.$/.test(value)) return text.replace(value, "Currently at capacity.");
  if (/^Ask questions, meet your therapist and see whether working together feels right\.$/.test(value)) return text.replace(value, "We have paused discovery calls while the practice is at capacity. Thank you for your understanding.");
  return text;
}

function updateStructured(value) {
  if (typeof value === "string") return BOOKING_URL.test(value) ? "https://www.pathfindertherapy.com/availability/" : updateCopy(value);
  if (Array.isArray(value)) return value.map(updateStructured);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,updateStructured(v)]));
  return value;
}

export function pauseDiscoveryHtml(original) {
  let html = original.replace(/<script\b[^>]*id="pathfinder-native-booking-inline"[^>]*>[\s\S]*?<\/script>/g, "");
  html = html.replace(/<p\b([^>]*)>You can <a[^>]*>arrange an initial consultation directly<\/a>[\s\S]*?<\/p>/g, `<p$1>${CAPACITY_MESSAGE} You can <a href="/start/#enquiry">send a written enquiry</a> about future availability.</p>`);
  html = html.replace(/<tr><th scope="row"><a href="#fees-consultation">Initial Zoom call with Brent<\/a><\/th>[\s\S]*?<\/tr>/g, '<tr><th scope="row"><a href="#fees-consultation">Discovery calls</a></th><td>Paused</td><td>At capacity</td></tr>');
  html = html.replace(/<a\b([^>]*?)href="([^"]+)"([^>]*)>[\s\S]*?<\/a>/gi, (all,before,href,after) => BOOKING_URL.test(href) ? `<a${before}href="${AVAILABILITY_PATH}"${after}>${LABEL}</a>` : all);
  html = html.replace(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<[^>]+>|[^<]+)/g, (part) => {
    if (part.startsWith("<script")) {
      if (/type="application\/ld\+json"/.test(part)) return part.replace(/(>)([\s\S]*)(<\/script>)/, (_,a,json,b) => `${a}${JSON.stringify(updateStructured(JSON.parse(json)))}${b}`);
      return part;
    }
    if (part.startsWith("<style")) return part;
    if (part.startsWith("<")) return part.replace(/\b(content|aria-label)="([^"]*)"/g, (_,attr,value) => `${attr}="${updateCopy(value)}"`);
    return updateCopy(part);
  });
  html = html.replace(/(<main\b[^>]*>)/, `$1${notice}`);
  return html.replace("</head>", `${style}</head>`);
}

export async function applyDiscoveryPause(root) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if(entry.isDirectory()) await walk(file);
      else if(entry.name.endsWith('.html')) files.push(file);
    }
  }
  await walk(root);
  for(const file of files) await writeFile(file,pauseDiscoveryHtml(await readFile(file,'utf8')));
  let shell=await readFile(path.join(root,'contact/index.html'),'utf8');
  const main=`<main id="main-content" class="lpMain" tabindex="-1">${notice}<section class="pfCapacityPage"><h1>We are currently at capacity</h1><p>Thank you for your interest in Pathfinder Therapy. We have paused free 30-minute discovery calls while we are at capacity and are not accepting new discovery-call bookings.</p><p>If you would like to ask about future availability, you can <a href="https://booking.pathfindertherapy.com/book/enquiry">send a non-urgent written enquiry</a>. You can also <a href="https://booking.pathfindertherapy.com/book/enquiry?waiting=1">ask to join the face-to-face waiting list</a>. An enquiry or waiting-list request does not guarantee a therapy place or start date.</p><p>Existing clients can continue to use <a href="https://my.pathfindertherapy.org.uk/my/login">My Pathfinder</a> or contact us through their usual route.</p><p>Thank you for your understanding.</p></section></main>`;
  shell=shell.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,main).replace(/<title>[\s\S]*?<\/title>/,'<title>Currently at Capacity | Pathfinder Therapy</title>').replace(/(<link\b[^>]*rel="canonical"[^>]*href=")[^"]+/, '$1https://www.pathfindertherapy.com/availability/').replace(/<meta\b[^>]*(?:name="description"|property="og:(?:title|description|url)")[^>]*>/g,'');
  shell=shell.replace('</head>',`<meta name="description" content="Pathfinder Therapy is currently at capacity. Free 30-minute discovery calls are paused. Find information about future availability and existing-client access."/></head>`);
  await mkdir(path.join(root,'availability'),{recursive:true});
  await writeFile(path.join(root,'availability/index.html'),shell);
  await writeFile(path.join(root,'book/index.html'),shell.replace('https://www.pathfindertherapy.com/availability/','https://www.pathfindertherapy.com/book/'));
  const summaryPath=path.join(root,'ai-summary.json');
  const summary=updateStructured(JSON.parse(await readFile(summaryPath,'utf8')));
  summary.booking={...summary.booking,status:'paused_at_capacity',consultation_url:'https://www.pathfindertherapy.com/availability/',consultation_description:CAPACITY_MESSAGE};
  await writeFile(summaryPath,JSON.stringify(summary,null,2));
  const llmsPath=path.join(root,'llms.txt');
  let llms=await readFile(llmsPath,'utf8');
  llms=llms.replace(/^- Arrange a free 30-minute initial consultation by Zoom:.*$/m,`- ${CAPACITY_MESSAGE} https://www.pathfindertherapy.com/availability/`).replace('The initial 30-minute Zoom consultation with Brent is free and is separate from a paid therapy session.',CAPACITY_MESSAGE);
  await writeFile(llmsPath,llms);
  const sitemapPath=path.join(root,'sitemap.xml');
  let sitemap=await readFile(sitemapPath,'utf8');
  if(!sitemap.includes('/availability/')) sitemap=sitemap.replace('</urlset>','<url><loc>https://www.pathfindertherapy.com/availability/</loc><lastmod>2026-11-10</lastmod></url></urlset>');
  await writeFile(sitemapPath,sitemap);
  console.log(`Paused discovery calls across ${files.length+1} public HTML pages`);
}
