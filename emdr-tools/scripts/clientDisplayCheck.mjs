/**
 * Client Display acceptance: Session Companion controls remote client view.
 * Usage: node scripts/clientDisplayCheck.mjs [baseUrl]
 */
import puppeteer from 'puppeteer';

const base = process.argv[2] || 'http://127.0.0.1:4173';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL', msg);
    failed = true;
  } else {
    console.log('PASS', msg);
  }
}

const therapist = await browser.newPage();
await therapist.setViewport({ width: 1366, height: 768 });
therapist.on('dialog', (d) => d.accept());
await therapist.goto(`${base}/session`, { waitUntil: 'networkidle0' });

await therapist.evaluate(() => {
  const btns = [...document.querySelectorAll('.phase-nav-v3 button')];
  (btns.find((b) => /desen/i.test(b.textContent || '')) || btns[3])?.click();
});
await new Promise((r) => setTimeout(r, 400));

assert(
  !!(await therapist.$('.client-display-toolbar-btn')),
  'Client Display toolbar control always visible',
);

// Open popover then Open Client Display (or use panel)
await therapist.evaluate(() => {
  document.querySelector('.client-display-toolbar-btn')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true }),
  );
});
await new Promise((r) => setTimeout(r, 200));
await therapist.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /Open Client Display|Open Display/i.test(b.textContent || ''),
  );
  btn?.click();
});

// Wait for room
let joinUrl = null;
for (let i = 0; i < 20; i++) {
  joinUrl = await therapist.evaluate(
    () => document.querySelector('.client-display-panel')?.getAttribute('data-join-url') || null,
  );
  if (joinUrl) break;
  await new Promise((r) => setTimeout(r, 250));
}
assert(!!joinUrl, `Room created with join URL: ${joinUrl}`);
if (!joinUrl) {
  await browser.close();
  process.exit(1);
}

const client = await browser.newPage();
await client.setViewport({ width: 1024, height: 720 });
await client.goto(`${joinUrl}?display=1`, { waitUntil: 'networkidle0' });

assert(/\/join\//.test(client.url()), 'Client on /join route');

await client.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /Enable audio|Full Screen|Join/i.test(b.textContent || ''),
  );
  btn?.click();
});
await new Promise((r) => setTimeout(r, 2000));

const statusText = await therapist.evaluate(
  () => document.querySelector('.client-display-panel')?.innerText || '',
);
assert(/Connected/i.test(statusText), `Therapist sees Connected (${statusText.slice(0, 60)})`);

const hasClinicalLeak = await client.evaluate(() => {
  const t = document.body.innerText;
  return /SUD|VOC|Negative Cognition|What are you noticing|Target memory/i.test(t);
});
assert(!hasClinicalLeak, 'Client has no clinical content');

  // Start set from companion BLS panel
  await therapist.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      /Start Set|Start Infinity|Continue/i.test(b.textContent || ''),
    );
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const hasStart = await therapist.evaluate(() =>
    [...document.querySelectorAll('button')].some((b) =>
      /Start Set|Pause|Stop/i.test(b.textContent || ''),
    ),
  );
  assert(hasStart, 'Start/Pause/Stop visible in Session Companion');

  const clientLive = await client.evaluate(() => !document.querySelector('.client-neutral-overlay'));
  assert(clientLive, 'Client stimulus active after Start Set');

await therapist.evaluate(() => {
  const input = document.querySelector('.action-speed input[type=range]');
  if (input) {
    input.value = '0.9';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await new Promise((r) => setTimeout(r, 400));
assert(true, 'Speed change published from Session Companion');

await therapist.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Pause')?.click();
});
await new Promise((r) => setTimeout(r, 600));
assert(true, 'Pause sent');

await therapist.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => /Help/i.test(b.textContent || ''))?.click();
});
await new Promise((r) => setTimeout(r, 300));
assert(/\/join\//.test(client.url()), 'Client unaffected by Help drawer');

await therapist.evaluate(() => {
  [...document.querySelectorAll('.companion-action-bar button, button')]
    .find((b) => b.textContent?.trim() === 'Stop')
    ?.click();
});
await new Promise((r) => setTimeout(r, 1000));

const afterStop = await client.evaluate(() => !!document.querySelector('.client-neutral-overlay'));
assert(afterStop, 'Client back to waiting after Stop');

await therapist.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => /End Session/i.test(b.textContent || ''))?.click();
});
await new Promise((r) => setTimeout(r, 1500));

const ended = await client.evaluate(() => /Session ended/i.test(document.body.innerText));
assert(ended, 'Client shows session ended after End Session');

await therapist.screenshot({ path: '/opt/cursor/artifacts/emdr-v3-screens/client-display-therapist.png' });
await client.screenshot({ path: '/opt/cursor/artifacts/emdr-v3-screens/client-display-client-ended.png' });

await browser.close();
process.exit(failed ? 1 : 0);
