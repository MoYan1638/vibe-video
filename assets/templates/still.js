/**
 * vibe-video — single-frame still renderer
 *
 * Checking the look of one frame takes ~1s; rendering 450 frames takes ~3min.
 * Always preview stills before committing to a full render.
 *
 * Usage:
 *   node assets/templates/still.js --html animation.html --t 4.5 --out preview.png
 *   node assets/templates/still.js --html animation.html --times 0,4,8 --outdir sheet
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) out[argv[i].replace(/^--/, '')] = argv[i + 1];
  return out;
}

function loadChromium() {
  for (const mod of ['playwright', 'playwright-core', '@playwright/test']) {
    try {
      return require(mod).chromium;
    } catch (e) {
      /* keep looking */
    }
  }
  throw new Error('No playwright found (playwright / playwright-core / @playwright/test).');
}

async function launch(channel) {
  const chromium = loadChromium();
  const attempts = channel ? [{ channel }] : [{ channel: 'msedge' }, { channel: 'chrome' }, {}];
  let lastErr;
  for (const opts of attempts) {
    try {
      return await chromium.launch({ headless: true, ...opts });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const html = path.resolve(args.html || 'animation.html');
  const width = parseInt(args.width || '1080', 10);
  const height = parseInt(args.height || '1920', 10);
  const times = (args.times || args.t || '0').split(',').map(Number);
  const outDir = path.resolve(args.outdir || '.');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await launch(args.channel);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto('file:///' + html.replace(/\\/g, '/'));
  await page.waitForFunction(() => typeof window.seek === 'function', null, { timeout: 10000 });

  for (const t of times) {
    await page.evaluate((time) => window.seek(time), t);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    const file = args.out && times.length === 1
      ? path.resolve(args.out)
      : path.join(outDir, `still_${String(t).replace('.', '_')}.png`);
    await page.screenshot({ path: file });
    console.log(`t=${t}s -> ${file}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
