/**
 * Acceptance: at 1366×768, Session / Studio / Client must not page-scroll.
 * Usage: node scripts/layoutViewportCheck.mjs [baseUrl]
 */
import puppeteer from 'puppeteer';

const base = process.argv[2] || 'http://127.0.0.1:4173';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });

let failed = false;

async function check(path, name, { minStageH = 80 } = {}) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 400));
  const m = await page.evaluate(() => {
    const stage = document.querySelector('.bls-stage');
    const r = stage?.getBoundingClientRect();
    return {
      delta: document.documentElement.scrollHeight - window.innerHeight,
      stageH: r ? Math.round(r.height) : 0,
      stageW: r ? Math.round(r.width) : 0,
    };
  });
  const ok = m.delta <= 2 && m.stageH >= minStageH;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`, m);
  if (!ok) failed = true;
}

await check('/tools', 'studio');
await check('/session', 'session');
await check('/tools?clientView=1', 'client');

await browser.close();
process.exit(failed ? 1 : 0);
