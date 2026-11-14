/**
 * vibe-video — Canvas Rendering Template
 * 
 * Boilerplate code for vibe-video Skill. Customize the seek() and draw*() functions
 * for your specific storyboard. Run with Node.js (requires 'canvas' package).
 * 
 * Usage:
 *   node render-template.js --output ./frames --fps 30 --duration 30
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  duration: 30,        // seconds
  outputDir: './frames',
  caption: {
    font: "300 42px 'Noto Serif SC', serif",
    color: 'rgba(255, 255, 255, 0.85)',
    strokeColor: 'rgba(0, 0, 0, 0.4)',
    y: 0.88,           // 88% from top
    fadeIn: 0.3,
    fadeOut: 0.3,
  },
};

// ─── Easing ──────────────────────────────────────────────────────────────────

const ease = {
  linear: t => t,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  easeOutElastic: t => { const c4 = 2 * Math.PI / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; },
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ─── Storyboard Data ─────────────────────────────────────────────────────────
// Customize this for your video. Each caption has: text, start, duration.

const STORYBOARD = [
  { text: '你的第一行字幕', start: 0, duration: 3 },
  { text: '第二行字幕',     start: 3, duration: 5 },
  { text: '第三行字幕',     start: 8, duration: 7 },
  // ... add more
];

// ─── Scene State ─────────────────────────────────────────────────────────────
// Define your animation state as a function of time.

function seek(t) {
  return {
    // Example: a pulsing glow
    glowRadius: 50 + 30 * Math.sin(t * 2),
    glowOpacity: 0.5 + 0.3 * Math.sin(t * 1.5),

    // Example: a moving particle
    particleX: lerp(100, CONFIG.width - 100, ease.easeInOutCubic(clamp(t / 10, 0, 1))),
    particleY: CONFIG.height * 0.4 + 50 * Math.sin(t * 3),

    // Progress through storyboard
    progress: clamp(t / CONFIG.duration, 0, 1),
  };
}

// ─── Drawing Functions ────────────────────────────────────────────────────────

function drawBackground(ctx, state) {
  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(1, '#16213e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
}

function drawSubject(ctx, state) {
  // Example: glowing orb
  const cx = CONFIG.width / 2;
  const cy = CONFIG.height * 0.4;

  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = 'rgba(255, 200, 150, 0.6)';

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, state.glowRadius);
  grad.addColorStop(0, `rgba(255, 240, 220, ${state.glowOpacity})`);
  grad.addColorStop(0.5, `rgba(255, 200, 150, ${state.glowOpacity * 0.5})`);
  grad.addColorStop(1, 'rgba(255, 200, 150, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, state.glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDecoration(ctx, state) {
  // Example: floating particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 50; i++) {
    const x = (Math.sin(i * 12.3 + state.progress * Math.PI * 2) * 0.5 + 0.5) * CONFIG.width;
    const y = (Math.cos(i * 7.7 + state.progress * Math.PI * 2) * 0.5 + 0.5) * CONFIG.height;
    const size = 2 + Math.sin(i + state.progress * 10) * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, Math.abs(size), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCaption(ctx, t) {
  // Find active caption
  const active = STORYBOARD.find(
    c => t >= c.start && t < c.start + c.duration
  );
  if (!active) return;

  const localT = t - active.start;
  let alpha = 1;

  if (localT < CONFIG.caption.fadeIn) {
    alpha = localT / CONFIG.caption.fadeIn;
  } else if (localT > active.duration - CONFIG.caption.fadeOut) {
    alpha = (active.duration - localT) / CONFIG.caption.fadeOut;
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  // Stroke (outline for contrast)
  ctx.font = CONFIG.caption.font;
  ctx.strokeStyle = CONFIG.caption.strokeColor;
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(active.text, CONFIG.width / 2, CONFIG.height * CONFIG.caption.y);

  // Fill
  ctx.fillStyle = CONFIG.caption.color;
  ctx.fillText(active.text, CONFIG.width / 2, CONFIG.height * CONFIG.caption.y);
  ctx.restore();
}

// ─── Main Render Loop ────────────────────────────────────────────────────────

function render(ctx, t) {
  const state = seek(t);
  ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);

  drawBackground(ctx, state);
  drawDecoration(ctx, state);
  drawSubject(ctx, state);
  drawCaption(ctx, t);
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const outputDir = args.includes('--output') ? args[args.indexOf('--output') + 1] : CONFIG.outputDir;
  const fps = args.includes('--fps') ? parseInt(args[args.indexOf('--fps') + 1]) : CONFIG.fps;
  const duration = args.includes('--duration') ? parseInt(args[args.indexOf('--duration') + 1]) : CONFIG.duration;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const canvas = createCanvas(CONFIG.width, CONFIG.height);
  const ctx = canvas.getContext('2d');
  const totalFrames = fps * duration;

  console.log(`Rendering ${totalFrames} frames at ${fps}fps (${duration}s)...`);

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    render(ctx, t);

    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    fs.writeFileSync(filename, buffer);

    if (i % (fps * 2) === 0) {
      console.log(`  Frame ${i}/${totalFrames} (${(i / totalFrames * 100).toFixed(0)}%)`);
    }
  }

  console.log(`✅ Done! Frames saved to ${outputDir}`);
  console.log(`\nNext step: composite with ffmpeg:`);
  console.log(`  ffmpeg -framerate ${fps} -i ${outputDir}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 output.mp4`);
}

main().catch(console.error);
