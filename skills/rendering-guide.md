# Rendering Guide — Canvas/JS → MP4 Pipeline

Technical specification for the vibe-video rendering pipeline.

---

## Architecture Overview

```
Storyboard → Canvas Animation Code → Headless Browser Screenshots → ffmpeg Composite → MP4
```

---

## Step 1: Time-Driven Animation

Every visual element's state is a function of time `t` (seconds). This enables frame-accurate rendering at any framerate.

```javascript
// Easing functions
const ease = {
  linear: t => t,
  easeInOutCubic: t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2,
  easeOutBack: t => { const c1=1.70158, c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); },
  easeOutElastic: t => { const c4=2*Math.PI/3; return t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-0.75)*c4)+1; }
};

// Time utilities
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Scene state at time t
function seek(t) {
  return {
    particleOpacity: ease.easeInOutCubic(clamp(t / 5, 0, 1)),
    particleX: lerp(100, 500, ease.easeInOutCubic(clamp((t - 2) / 8, 0, 1))),
    glowRadius: 50 + 30 * Math.sin(t * 2), // breathing
  };
}
```

---

## Step 2: Layer System

Organize rendering into 4 layers for clean composition:

```javascript
function render(t) {
  const state = seek(t);
  ctx.clearRect(0, 0, width, height);

  drawBackground(state);   // Layer 0
  drawSubject(state);      // Layer 1
  drawDecoration(state);    // Layer 2
  drawCaption(state);       // Layer 3
}
```

---

## Step 3: Particle System

Reusable particle engine for all styles:

```javascript
class ParticleSystem {
  constructor(count) {
    this.particles = Array.from({length: count}, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: Math.random(),
      size: Math.random() * 3 + 1,
    }));
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt * 0.1;

      // Wrap around
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Recycle
      if (p.life <= 0) {
        p.life = 1;
        p.x = Math.random() * width;
        p.y = Math.random() * height;
      }
    }
  }

  draw(ctx, color) {
    ctx.fillStyle = color;
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
```

---

## Step 4: Export Pipeline

> **TL;DR — use the bundled tools, they are battle-tested:**
>
> ```bash
> # 1. check the look with a single still (~1s) before rendering 450 frames (~3min)
> node assets/templates/still.js --html animation.html --times 0,4,10
>
> # 2. render frames (auto-falls back msedge -> chrome -> bundled chromium)
> node assets/templates/render-playwright.js --html animation.html --out ./frames --fps 30 --duration 15
>
> # 3. composite
> bash assets/templates/composite.sh ./frames output.mp4 30
> ```
>
> Requires: any playwright flavor (`playwright`, `playwright-core`, or `@playwright/test`)
> + a Chrome/Edge on the machine + ffmpeg on PATH (or `FFMPEG=/path/to/ffmpeg`).

### Option A: Playwright (Recommended)

`assets/templates/render-playwright.js` implements all of the below, plus:

- **Browser autodetect** — tries `msedge`, then `chrome`, then the bundled chromium, so no `npx playwright install` is needed on most Windows machines.
- **Paint sync** — waits one `requestAnimationFrame` after each `seek()` before screenshotting. Without this, screenshots can race the canvas and you get torn/stale frames.
- **`still.js`** — renders single frames at chosen timestamps for cheap visual iteration.

Manual version, if you want to roll your own:

```javascript
// render.js
const { chromium } = require('playwright');
const path = require('path');

async function render(outputDir, fps = 30, totalFrames) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

  await page.goto(`file://${path.resolve('animation.html')}`);

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((time) => window.seek(time), t);
    await page.screenshot({
      path: path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`),
      omitBackground: false,
    });
  }

  await browser.close();
}

render('./frames', 30, 900); // 30s @ 30fps
```

### Option B: Direct Canvas (Node.js + canvas package)

```javascript
const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(1080, 1920);
const ctx = canvas.getContext('2d');
const fps = 30;
const duration = 30;
const totalFrames = fps * duration;

for (let i = 0; i < totalFrames; i++) {
  const t = i / fps;
  render(ctx, t, 1080, 1920);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./frames/frame_${String(i).padStart(4,'0')}.png`, buffer);
}
```

---

## Step 5: ffmpeg Composition

```bash
# Video only
ffmpeg -framerate 30 -i frames/frame_%04d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 23 \
  output.mp4

# Video + BGM
ffmpeg -framerate 30 -i frames/frame_%04d.png -i bgm.mp3 \
  -c:v libx264 -c:a aac -pix_fmt yuv420p -crf 23 \
  -af "apad=pad_dur=0.5" -shortest \
  output.mp4

# Video + silent audio track (for platforms that require audio)
ffmpeg -framerate 30 -i frames/frame_%04d.png \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest \
  output.mp4
```

---

---

## Mixing with AI-generated footage (H3 / any video model)

Canvas is deterministic; AI video is not. When you want both, keep the division
strict: **AI supplies atmosphere and motion, Canvas supplies identity and text.**

- Use the AI clip as a background plate and key the Canvas frames over it with
  ffmpeg `colorkey` on your paper color (see `hybrid-h3.md`, Pattern A).
- Never ask a video model to render on-screen text - burn type in the Canvas pass.
- Never ask a video model to hold a detailed character design across a shot if the
  audience must recognise it; that is what this pipeline is for.
- Match your Canvas camera easing to the plate motion so cuts do not feel dead.

> Full workflow, three integration patterns, credit budget math, and a
> "which engine is at fault" failure table: [`hybrid-h3.md`](./hybrid-h3.md)

## Resolution Reference

| Aspect | Resolution | Use case |
|--------|-----------|----------|
| 9:16 | 1080×1920 | TikTok, Reels, Shorts, 视频号 |
| 16:9 | 1920×1080 | YouTube, B站, 官网 |
| 1:1 | 1080×1080 | Instagram, 小红书 |

---

## Performance Tips

- **Particle count**: Keep under 200 particles for 1080×1920 at 30fps
- **Shadow blur**: Expensive — use sparingly, cache glow effects on offscreen canvas
- **Gradients**: Pre-compute radial/linear gradients, don't recreate each frame
- **Offscreen canvas**: Cache static elements (background grid, logos) on separate canvas, `drawImage` each frame
- **Frame skipping**: Render at 15fps, let ffmpeg interpolate to 30fps for static scenes

---

## Determinism Rules (frames must be reproducible)

The renderer may seek to any time in any order (stills, re-renders, partial
re-runs after a crash). That breaks the moment randomness or wall-clock time
sneaks in:

| ❌ Never | ✅ Instead |
|---|---|
| `Math.random()` | Seeded PRNG, e.g. `s = (s*1664525+1013904223) % 2**32` |
| `Date.now()` / `performance.now()` inside scene code | Pure functions of `t` |
| `requestAnimationFrame`-driven state accumulation | State derived from `t` only (`seek(t)`) |
| Unstable sort / object key order for particle lists | Fixed index-based generation (golden angle, primes) |
| External assets without awaiting load | Await `document.fonts.ready` + image `onload` before first seek |

Why: the frame at `t=4.2` must be byte-identical whether it is rendered as
frame #126 in a batch or alone via `still.js`. If it is not, you cannot
preview stills, cannot resume an interrupted render, and cannot reproduce a
bug a viewer reports at a given second.

---

## Troubleshooting (field-tested)

| Symptom | Cause | Fix |
|---|---|---|
| Screenshots show stale/torn frames | `seek()` → `screenshot()` races the paint | rAF-wait between seek and shot (render-playwright.js does this) |
| Chinese captions render as tofu (□□□) | Headless browser lacks CJK fonts | Font stack includes `'Microsoft YaHei'`/`'PingFang SC'`; on Linux install `fonts-noto-cjk` |
| Every frame identical in output MP4 | Animation driven by rAF loop instead of `seek(t)` | Move all state into `state(t)`; kill the preview loop under `navigator.webdriver` |
| Windows: `bash composite.sh` errors oddly | Git Bash shim routes to wsl.exe or PATH is stripped | Spawn ffmpeg from Node (`child_process.spawn`) instead of shelling through bash |
| Render gets slower every frame | Growing offscreen canvases / shadowBlur per particle | Cache statics once; cap particle count; reuse gradient objects |
