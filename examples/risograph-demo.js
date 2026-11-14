/**
 * vibe-video — risograph-ink style demo
 *
 * A working reference for skills/style-presets/risograph-ink.md.
 * Two flat ink masses on cream paper, misregistered accent line, halftone
 * shadow, seeded paper grain — no gradients anywhere.
 *
 *   node assets/templates/still.js --html examples/risograph-demo.html --times 0,3,7
 *   node assets/templates/render-playwright.js --html examples/risograph-demo.html \
 *        --out ./frames --fps 24 --duration 10
 */

const CONFIG = { width: 1080, height: 1350, duration: 10 };

const INK = '#141312';
const PAPER = '#e8e4dc';
const ACCENT = '#7a2430';
const GREY = '#6b6660';
const LGREY = '#b7b2aa';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function makeRng(seed = 20261114) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}
const rng = makeRng();

const canvas = document.getElementById('c');
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;
const ctx = canvas.getContext('2d');
const W = CONFIG.width;
const H = CONFIG.height;

// ---------- static plate: paper + halftone arch + line pillars ---------------
// Everything here never changes, so it is painted once into an offscreen canvas.

const plate = document.createElement('canvas');
plate.width = W;
plate.height = H;
(function paintPlate() {
  const p = plate.getContext('2d');

  // paper
  p.fillStyle = PAPER;
  p.fillRect(0, 0, W, H);

  // halftone arc block (the "printed" background mass)
  p.save();
  p.beginPath();
  p.arc(W * 0.5, H * 0.44, W * 0.36, Math.PI, Math.PI * 2);
  p.closePath();
  p.clip();
  for (let y = H * 0.08; y < H * 0.45; y += 7) {
    for (let x = W * 0.1; x < W * 0.9; x += 7) {
      const d = Math.min(1, Math.hypot(x - W * 0.5, y - H * 0.44) / (W * 0.36));
      if (rng() > 0.92 - 0.55 * (1 - d)) continue;
      p.beginPath();
      p.arc(x, y, 1.0 + 2.2 * (1 - d), 0, Math.PI * 2);
      p.fillStyle = INK;
      p.globalAlpha = 0.5 + 0.3 * (1 - d);
      p.fill();
    }
  }
  p.restore();
  p.globalAlpha = 1;

  // ground line + soft flat shadow band
  p.fillStyle = INK;
  p.globalAlpha = 0.08;
  p.fillRect(0, H * 0.845, W, H * 0.155);
  p.globalAlpha = 1;

  // line-only pillars (background stays linework, subject stays solid mass)
  p.strokeStyle = GREY;
  p.lineWidth = 1.6;
  for (const px of [W * 0.13, W * 0.3, W * 0.7, W * 0.87]) {
    p.beginPath();
    p.moveTo(px, H * 0.29);
    p.quadraticCurveTo(px + 1.5, H * 0.55, px, H * 0.845);
    p.stroke();
    p.beginPath();
    p.moveTo(px - 16, H * 0.29);
    p.lineTo(px + 16, H * 0.29);
    p.stroke();
  }

  // typed label, editorial feel
  p.fillStyle = LGREY;
  p.font = "400 20px 'Courier New', monospace";
  p.fillText('RISO / 2 INKS', W * 0.06, H * 0.075);
  p.textAlign = 'right';
  p.fillText('PLATE 01', W * 0.94, H * 0.075);
  p.textAlign = 'left';
})();

// ---------- the figure: one flat ink mass + one accent ----------------------
// Drawn as a single path family so it can be reused for the misregistration pass.

function figurePath(cx, footY, s) {
  ctx.beginPath();
  // cloak: shoulder -> flared hem with jagged edge
  ctx.moveTo(cx - 62 * s, footY - 300 * s);
  ctx.quadraticCurveTo(cx - 112 * s, footY - 250 * s, cx - 128 * s, footY - 60 * s);
  ctx.lineTo(cx - 96 * s, footY - 96 * s);
  ctx.lineTo(cx - 78 * s, footY - 30 * s);
  ctx.lineTo(cx - 42 * s, footY - 88 * s);
  ctx.lineTo(cx - 8 * s, footY - 22 * s);
  ctx.lineTo(cx + 26 * s, footY - 86 * s);
  ctx.lineTo(cx + 58 * s, footY - 34 * s);
  ctx.lineTo(cx + 92 * s, footY - 100 * s);
  ctx.lineTo(cx + 118 * s, footY - 66 * s);
  ctx.quadraticCurveTo(cx + 104 * s, footY - 250 * s, cx + 62 * s, footY - 300 * s);
  ctx.quadraticCurveTo(cx, footY - 322 * s, cx - 62 * s, footY - 300 * s);
  ctx.closePath();

  // hood silhouette: a pointed dome above the shoulder line
  ctx.moveTo(cx - 58 * s, footY - 296 * s);
  ctx.quadraticCurveTo(cx - 46 * s, footY - 372 * s, cx, footY - 388 * s);
  ctx.quadraticCurveTo(cx + 46 * s, footY - 372 * s, cx + 58 * s, footY - 296 * s);
  ctx.closePath();
}

function drawFigure(s, breathe, tilt) {
  const cx = W * 0.5;
  const footY = H * 0.845 + breathe * 3;

  ctx.save();
  ctx.translate(cx, footY);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.translate(-cx, -footY);

  // 1) flat ink mass — no gradient, ever
  figurePath(cx, footY, s);
  ctx.fillStyle = INK;
  ctx.fill('nonzero');

  // 2) misregistration: same path again, offset, in accent ink
  ctx.save();
  ctx.translate(-2.5, 2);
  figurePath(cx, footY, s);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2.4;
  ctx.globalAlpha = 0.42;
  ctx.stroke();
  ctx.restore();

  // 3) one accent detail only: the chest print
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(cx + 26 * s, footY - 236 * s, 7 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();

  // 4) flat ground shadow, tucked under the hem
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(cx, footY + 6, 128 * s, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- grain: the last pass, always -----------------------------------

function drawGrain() {
  const g = makeRng(777);
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = INK;
  for (let i = 0; i < 7000; i++) {
    ctx.fillRect(g() * W, g() * H, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
}

// ---------- scene ----------------------------------------------------------

function state(t) {
  // intro: figure fades up from the paper during the first 1.6s
  const intro = easeInOut(clamp(t / 1.6, 0, 1));
  return {
    t,
    s: lerp(0.94, 1.0, intro),
    breathe: Math.sin((t / 5) * Math.PI * 2),
    tilt: 0.55 * Math.sin((t / 7) * Math.PI * 2),
    intro,
    // single slow push over the whole film — 4%
    zoom: 1 + 0.04 * easeInOut(clamp(t / CONFIG.duration, 0, 1)),
  };
}

function render(st) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // Hybrid mode: --alpha true passes ?alpha=1, so the paper layer is skipped and
  // the frames come out with a transparent background ready for overlay.
  const ALPHA = /(?:\?|&)alpha=1/.test(location.search);

  // camera push
  ctx.translate(W / 2, H / 2);
  ctx.scale(st.zoom, st.zoom);
  ctx.translate(-W / 2, -H / 2);

  if (!ALPHA) ctx.drawImage(plate, 0, 0);
  ctx.globalAlpha = st.intro;
  drawFigure(st.s, st.breathe, st.tilt);
  ctx.globalAlpha = 1;

  drawGrain();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

window.seek = (t) => render(state(t));

if (!navigator.webdriver) {
  const t0 = performance.now();
  const loop = () => {
    window.seek(((performance.now() - t0) / 1000) % CONFIG.duration);
    requestAnimationFrame(loop);
  };
  loop();
}
