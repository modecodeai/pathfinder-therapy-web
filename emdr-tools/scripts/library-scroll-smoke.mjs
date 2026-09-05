import puppeteer from 'puppeteer';

const BASE = process.env.LIBRARY_SMOKE_URL || 'http://127.0.0.1:4173';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errors = [];

await page.goto(`${BASE}/practice/library`, { waitUntil: 'networkidle0', timeout: 60000 });

const scrollProbe = await page.evaluate(`(() => {
  const html = document.documentElement;
  const body = document.body;
  const root = document.getElementById('root');
  const shell = document.querySelector('.practice-shell');
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const bodyCs = cs(body);
  const rootCs = cs(root);
  const htmlCs = cs(html);
  const shellCs = cs(shell);

  const before = window.scrollY;
  window.scrollBy(0, 800);
  const afterWheel = window.scrollY;
  window.scrollTo(0, document.body.scrollHeight);
  const atBottom = window.scrollY;
  window.scrollTo(0, 0);

  const card = document.querySelector('.pf-library-card-main');
  let hit = null;
  if (card) {
    const r = card.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    hit = el ? (el.tagName + '.' + (el.className || '')) : null;
  }

  return {
    scrollHeight: Math.max(document.body.scrollHeight, html.scrollHeight),
    clientHeight: html.clientHeight,
    canScroll: Math.max(document.body.scrollHeight, html.scrollHeight) > html.clientHeight + 40,
    before,
    afterWheel,
    atBottom,
    scrolled: afterWheel > before || atBottom > 100,
    bodyOverflow: bodyCs.overflowY,
    bodyHeight: bodyCs.height,
    rootOverflow: rootCs.overflow,
    rootHeight: rootCs.height,
    htmlHeight: htmlCs.height,
    shellOverflow: shellCs ? shellCs.overflow : null,
    shellHeight: shellCs ? shellCs.height : null,
    hasAppShell: Boolean(document.querySelector('.app-shell')),
    hit,
    diagText: (document.querySelector('[data-testid="library-diagnostics"]') || {}).textContent || '',
  };
})()`);

console.log('scrollProbe', JSON.stringify(scrollProbe, null, 2));

if (scrollProbe.hasAppShell) errors.push('library page incorrectly has .app-shell');
if (!scrollProbe.canScroll) errors.push('page content not taller than viewport — cannot scroll');
if (!scrollProbe.scrolled) errors.push('window.scrollBy / scrollTo did not move');
if (scrollProbe.bodyOverflow === 'hidden') errors.push('body overflow-y is hidden');

for (const slug of ['floatback', 'safe-calm', 'cognitions', 'rdi']) {
  await page.goto(`${BASE}/practice/library/${slug}`, { waitUntil: 'networkidle0', timeout: 30000 });
  const detail = await page.evaluate(`(() => {
    const h1 = (document.querySelector('h1') || {}).textContent || '';
    const body = (document.querySelector('.pf-detail-block') || {}).textContent || '';
    return {
      h1,
      bodyLen: body.length,
      hasOverview: /Overview/i.test(body),
      hasScript: /Therapist Script/i.test(body),
    };
  })()`);
  console.log('detail', slug, detail);
  if (detail.bodyLen < 200) errors.push(slug + ' detail too short');
  if (!detail.hasOverview || !detail.hasScript) errors.push(slug + ' missing overview/script sections');
}

await browser.close();
if (errors.length) {
  console.error('FAILURES:\n', errors.join('\n'));
  process.exit(1);
}
console.log('OK library scroll + detail smoke passed');
