# Style Presets

Six built-in visual styles. Each defines color palette, rendering technique, and mood.

---

## 1. soft-glow (柔光治愈)

**Mood**: Warm, dreamy, emotional, safe

| Property | Value |
|----------|-------|
| Primary | Warm white / blush pink / cream yellow |
| Accent | Light gray / lavender |
| Dark | Deep gray-purple |
| Texture | Gaussian blur + bloom glow |
| Best for | Emotional metaphors, love, nostalgia, comfort |

**Canvas tips**:
```javascript
// Bloom effect
ctx.shadowBlur = 20;
ctx.shadowColor = 'rgba(255, 200, 150, 0.5)';
// Radial gradient for light sources
const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
grad.addColorStop(0, 'rgba(255, 240, 220, 1)');
grad.addColorStop(1, 'rgba(255, 240, 220, 0)');
```

---

## 2. minimal-line (极简线稿)

**Mood**: Clean, intellectual, witty, editorial

| Property | Value |
|----------|-------|
| Primary | Pure black / dark gray |
| Accent | Single accent color (red/coral/blue) |
| Dark | White |
| Texture | 1–2px stroke lines, no fill |
| Best for | Product promos, social commentary, witty observations |

**Canvas tips**:
```javascript
// Single line aesthetic
ctx.strokeStyle = 'rgba(30, 30, 30, 0.9)';
ctx.lineWidth = 1.5;
ctx.lineCap = 'round';
// Animate by drawing partial paths
ctx.setLineDash([totalLength]);
ctx.lineDashOffset = totalLength * (1 - progress);
```

---

## 3. cyber-neon (赛博霓虹)

**Mood**: Futuristic, energetic, edgy, digital

| Property | Value |
|----------|-------|
| Primary | Cyan / magenta / purple |
| Accent | Neon yellow / electric green |
| Dark | Deep blue-black |
| Texture | Glow stroke + scanlines + chromatic aberration |
| Best for | Tech products, crypto, gaming, music videos |

**Canvas tips**:
```javascript
// Neon glow
ctx.shadowBlur = 15;
ctx.shadowColor = '#00ffff';
ctx.strokeStyle = '#00ffff';
// Scanlines overlay
for (let y = 0; y < height; y += 4) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, y, width, 1);
}
```

---

## 4. pixel-retro (像素复古)

**Mood**: Nostalgic, playful, game-like, lo-fi

| Property | Value |
|----------|-------|
| Primary | 8-bit palette (limited to 16 colors) |
| Accent | High-contrast complementary |
| Dark | Dark gray (#1a1a2e) |
| Texture | Hard edges, no anti-aliasing, dithering |
| Best for | Gaming content, retro aesthetics, memes |

**Canvas tips**:
```javascript
// Disable smoothing
ctx.imageSmoothingEnabled = false;
// Draw at low res, scale up
const scale = 4;
// Render at 270x480, display at 1080x1920
```

---

## 5. tech-blueprint (科技蓝图)

**Mood**: Precise, analytical, scientific, trustworthy

| Property | Value |
|----------|-------|
| Primary | Deep blue background + white lines |
| Accent | Cyan annotations |
| Dark | Navy (#0a1628) |
| Texture | Grid lines + annotation marks + dashed paths |
| Best for | Science explainers, data visualization, tutorials |

**Canvas tips**:
```javascript
// Grid background
ctx.strokeStyle = 'rgba(100, 180, 255, 0.1)';
ctx.lineWidth = 0.5;
for (let x = 0; x < width; x += 40) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
}
// Animated dashed path
ctx.setLineDash([8, 4]);
ctx.lineDashOffset = -time * 30;
```

---

## 6. hand-drawn (手绘蜡笔)

**Mood**: Childlike, warm, artistic, storybook

| Property | Value |
|----------|-------|
| Primary | Crayon color blocks |
| Accent | Pencil hatching |
| Dark | Kraft paper (#f5e6d0) |
| Texture | Rough edges + paper grain + crayon strokes |
| Best for | Children's content, storybooks, brand animation |

**Canvas tips**:
```javascript
// Crayon texture simulation
ctx.filter = 'url(#roughEdge)'; // SVG filter for rough edges
// Pencil hatching
for (let i = 0; i < density; i++) {
  ctx.beginPath();
  ctx.moveTo(x + random(-2, 2), y + random(-2, 2));
  ctx.lineTo(x + dx + random(-2, 2), y + dy + random(-2, 2));
  ctx.stroke();
}
```

---

## Custom Style

Users can define their own style by providing:
1. **3-5 color hex values** (primary, accent, dark)
2. **Texture description** (glow / flat / grainy / gradient)
3. **Reference image or mood board**

The AI will infer the rendering approach from these parameters.
