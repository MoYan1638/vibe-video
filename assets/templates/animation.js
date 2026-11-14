/**
 * vibe-video — animation.js scaffold
 *
 * Copy animation.js + animation.html together, edit STORYBOARD and draw*(), then:
 *   node assets/templates/render-playwright.js \
 *        --html animation.html --out ./frames --fps 30 --duration 15
 *   bash assets/templates/composite.sh ./frames output.mp4 30
 *
 * Contract with the renderer: expose window.seek(t) where t is seconds.
 * Every visual is a pure function of t -> any frame renders identically in any
 * order, so re-renders are reproducible and you can render a single still to
 * check the look before committing to the full sequence.
 */

const CONFIG = {
  width: 1080,
  height: 1920,
  duration: 15,
  caption: {
    font: "300 44px 'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', serif",
    color: 'rgba(255,255,255,0.88)',
    outline: 'rgba(0,0,0,0.35)',
    y: 0.88,
    fade: 0.35, // seconds of fade in / out
  },
};

// ---------- math helpers ---------------------------------------------------

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  linear: (t) => t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/** progress of the interval [start, end], eased, clamped to 0..1 */
function seg(t, start, end, fn = ease.inOutCubic) {
  return fn(clamp((t - start) / Math.max(end - start, 1e-6), 0, 1));
}

/** deterministic PRNG — never use Math.random() in a frame renderer */
function makeRng(seed = 1337) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

// ---------- storyboard -----------------------------------------------------
// Keep each line >= 2s, the key insight >= 3s, and hook inside the first 3s.

const STORYBOARD = [
  { text: '你的第一句钩子', start: 0, end: 3 },
  { text: '中间推进的一句', start: 3, end: 8 },
  { text: '一句要留白的话', start: 8, end: 15 },
];

// ---------- canvas ---------------------------------------------------------

const canvas = document.getElementById('c');
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;
const ctx = canvas.getContext('2d');

// Cache static layers. Repainting grain / grid every frame is the #1 reason
// this pipeline feels slow.
const bgCache = document.createElement('canvas');
bgCache.width = CONFIG.width;
bgCache.height = CONFIG.height;
(function paintStaticBackground() {
  const b = bgCache.getContext('2d');
  const g = b.createLinearGradient(0, 0, 0, CONFIG.height);
  g.addColorStop(0, '#141422');
  g.addColorStop(1, '#0d1b2a');
  b.fillStyle = g;
  b.fillRect(0, 0, CONFIG.width, CONFIG.height);

  const rnd = makeRng(1337);
  b.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 900; i++) {
    b.fillRect(rnd() * CONFIG.width, rnd() * CONFIG.height, 1.5, 1.5);
  }
})();

// ---------- scene state ----------------------------------------------------
// Everything the draw functions need, derived from t alone.

function state(t) {
  return {
    t,
    intro: seg(t, 0, 2.5),
    glow: 0.5 + 0.22 * Math.sin(t * 1.6),
    subjectY: CONFIG.height * 0.42 + 6 * Math.sin(t * 1.2),
    drift: seg(t, 2, CONFIG.duration),
  };
}

// ---------- layers ---------------------------------------------------------

function drawDecoration(s) {
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const a = i * 2.399963; // golden angle -> even, deterministic scatter
    const rad = 180 + 420 * ((i % 7) / 7) + 40 * s.drift;
    const x = CONFIG.width / 2 + Math.cos(a + s.t * 0.4) * rad;
    const y = CONFIG.height * 0.45 + Math.sin(a + s.t * 0.31) * rad * 0.7;
    ctx.globalAlpha = 0.18 + 0.25 * Math.abs(Math.sin(a + s.t));
    ctx.fillStyle = '#ffe9d6';
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSubject(s) {
  const cx = CONFIG.width / 2;
  const cy = s.subjectY;
  const r = 120 * (0.85 + 0.15 * s.intro);

  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
  g.addColorStop(0, `rgba(255,236,214,${0.95 * s.intro})`);
  g.addColorStop(0.35, `rgba(255,190,150,${0.35 * s.glow * s.intro})`);
  g.addColorStop(1, 'rgba(255,190,150,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCaption(t) {
  const active = STORYBOARD.find((c) => t >= c.start && t < c.end);
  if (!active) return;

  const local = t - active.start;
  const dur = active.end - active.start;
  let alpha = 1;
  if (local < CONFIG.caption.fade) alpha = local / CONFIG.caption.fade;
  else if (local > dur - CONFIG.caption.fade) alpha = (dur - local) / CONFIG.caption.fade;

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.font = CONFIG.caption.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const y = CONFIG.height * CONFIG.caption.y;
  ctx.strokeStyle = CONFIG.caption.outline;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.strokeText(active.text, CONFIG.width / 2, y);
  ctx.fillStyle = CONFIG.caption.color;
  ctx.fillText(active.text, CONFIG.width / 2, y);
  ctx.restore();
}

// ---------- compose --------------------------------------------------------

function render(s) {
  ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.drawImage(bgCache, 0, 0); // layer 0: static background
  drawDecoration(s);            // layer 2: decoration (behind subject)
  drawSubject(s);               // layer 1: subject
  drawCaption(s.t);             // layer 3: captions
}

// The renderer calls this. Keep the name.
window.seek = (t) => render(state(t));

// Live preview when opened in a normal browser (skipped in headless rendering).
if (!navigator.webdriver) {
  const t0 = performance.now();
  const loop = () => {
    window.seek(((performance.now() - t0) / 1000) % CONFIG.duration);
    requestAnimationFrame(loop);
  };
  loop();
}
