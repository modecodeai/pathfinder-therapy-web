import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const OUT = '/opt/cursor/artifacts/emdr-v3-screens';
const BASE = 'https://emdr.pathfindertherapy.com';
mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log('wrote', name);
}

async function clickByText(page, includes) {
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const t = await page.evaluate((el) => (el.textContent || '').trim(), b);
    if (includes.some((s) => t.includes(s))) {
      await b.click();
      return true;
    }
  }
  return false;
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome-stable',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
});

try {
  const page = await browser.newPage();
  await page.goto(`${BASE}/session`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.phase-nav-v3');

  const phases = await page.$$('.phase-nav-v3 button');
  await phases[2].click();
  await new Promise((r) => setTimeout(r, 900));
  await shot(page, '05-session-phase3.png');

  await phases[3].click();
  await new Promise((r) => setTimeout(r, 500));
  await clickByText(page, ['Use suggested']);
  await new Promise((r) => setTimeout(r, 600));
  await shot(page, '06-session-phase4.png');

  await clickByText(page, ['BLS Settings']);
  await new Promise((r) => setTimeout(r, 800));
  await shot(page, '07-bls-settings-expanded.png');

  const phaseBtns = await page.$$('.phase-nav-v3 button');
  await phaseBtns[6].click();
  await new Promise((r) => setTimeout(r, 400));
  await clickByText(page, ['Use suggested']);
  await new Promise((r) => setTimeout(r, 400));
  await clickByText(page, ['Incomplete']);
  await new Promise((r) => setTimeout(r, 300));
  await clickByText(page, ['Infinity']);
  await new Promise((r) => setTimeout(r, 900));
  await shot(page, '08-infinity-closure.png');

  await clickByText(page, ['Help & Scripts']);
  await new Promise((r) => setTimeout(r, 800));
  await shot(page, '08b-help-drawer.png');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
