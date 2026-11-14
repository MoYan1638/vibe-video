/**
 * vibe-video — Playwright frame renderer (works with playwright OR playwright-core)
 *
 * Why this exists: the original guide only showed the pipeline in prose, and the
 * template assumed the npm `canvas` package. In practice most machines already
 * have a Chromium/Edge installed, so screenshotting a real browser is the fastest
 * zero-install path (and gives full CSS + CJK font support for free).
 *
 * Usage:
 *   node assets/templates/render-playwright.js --html animation.html --out ./frames \
 *        --width 1080 --height 1920 --fps 30 --duration 15 [--channel msedge]
 *
 * The HTML must expose a global `window.seek(t)` where t is seconds.
 * Frames are written as frame_0000.png ... so composite.sh works unchanged.
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i].replace(/^--/, '');
    out[k] = argv[i + 1];
  }
  return out;
}

function loadChromium() {
  // playwright-core is enough — we only ever reuse an installed browser.
  for (const mod of ['playwright', 'playwright-core', '@playwright/test']) {
    try {
      return require(mod).chromium;
    } catch (e) {
      /* keep looking */
    }
  }
  throw new Error(
    'No playwright found. Install one of: playwright, playwright-core, @playwright/test'
  );
}

async function launch(channel) {
  const chromium = loadChromium();
  const attempts = channel
    ? [{ channel }]
    : [{ channel: 'msedge' }, { channel: 'chrome' }, {}];

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
  const outDir = path.resolve(args.out || './frames');
  const width = parseInt(args.width || '1080', 10);
  const height = parseInt(args.height || '1920', 10);
  const fps = parseInt(args.fps || '30', 10);
  const duration = parseFloat(args.duration || '15');

  if (!fs.existsSync(html)) throw new Error(`HTML not found: ${html}`);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const total = Math.round(fps * duration);
  console.log(`Rendering ${total} frames @ ${fps}fps (${duration}s) ${width}x${height}`);

  const browser = await launch(args.channel);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto('file:///' + html.replace(/\\/g, '/'));
  await page.waitForFunction(() => typeof window.seek === 'function', null, { timeout: 10000 });

  // Hybrid mode: transparent frames so they can be overlaid on an AI plate
  // without chroma-keying (keying eats anti-aliased edges and low-alpha grain).
  const alpha = args.alpha === 'true' || args.alpha === '1';
  if (alpha) {
    // ?alpha=1 is the skill-wide convention: your animation.js checks
    // location.search for it and skips painting the paper/background layer.
    await page.goto('file:///' + html.replace(/\\/g, '/') + '?alpha=1');
    await page.waitForFunction(() => typeof window.seek === 'function', null, { timeout: 10000 });
    await page.evaluate(() => {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      const c = document.getElementById('c');
      if (c) c.style.background = 'transparent';
    });
    console.log('Alpha mode: background layer skipped, frames will be RGBA.');
  }

  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = i / fps;
    await page.evaluate((time) => window.seek(time), t);
    // Let the browser paint the new state before screenshotting.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    await page.screenshot({
      path: path.join(outDir, `frame_${String(i).padStart(4, '0')}.png`),
      omitBackground: alpha,
    });
    if (i % fps === 0) {
      const pct = ((i / total) * 100).toFixed(0);
      console.log(`  ${pct}%  (${i}/${total})`);
    }
  }

  await browser.close();
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${outDir}`);
  console.log(`Next: bash assets/templates/composite.sh ${outDir} output.mp4 ${fps}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
