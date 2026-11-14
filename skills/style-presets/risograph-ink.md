# Style Preset: Risograph Ink (双色丝网／Riso 印刷)

**Mood**: Hand-printed, tactile, slightly off-register, editorial, zine-like
**Best for**: 叙事短片、情绪独白、品牌手作感、游戏同人海报动画
**Derived from**: 一个真实项目 —— 用 Canvas 逐帧重绘"版画感"双角色短片（1600×1200，56s，字幕烧入）。摸出来的可复用规则都在下面。

---

## Palette

Riso is **2–3 spot inks on paper**, never a full-color photo. Pick an ink pair with a value gap.

| Slot | Example | Role |
|------|---------|------|
| Paper | `#e8e4dc` (warm cream) | background, never pure white |
| Ink 1 | `#141312` (near-black) | line work, silhouettes, 90% of the drawing |
| Ink 2 | `#7a2430` (deep red) | accent: rim light, glow, one detail per figure |
| Ink 3 | `#1d3a52` (deep navy) | optional second story line / background block |
| Grey | `#6b6660` / `#b7b2aa` | thinning, texture, secondary strokes |

Rules:
- **Never more than 3 inks.** The moment you add a 4th, it stops reading as print.
- Paper is the light source. Do not paint "white" — leave paper.
- Keep one ink for structure (black) and let colors be *accents only* (<20% of pixel area).

---

## The 6 Rendering Rules

1. **Ink layer, then misregistration.** Draw the shape once; draw it again offset by 1.5–3px in the accent ink at 30–50% alpha. That offset *is* the print feel — it's the single highest-value trick.
2. **No gradients on ink.** Riso inks are flat. Depth comes from stroke weight, hatching density, and paper showing through — never from `createLinearGradient` on a body.
3. **Halftone instead of shading.** For a shadow area, fill it with dots whose radius/spacing varies (`for` loop + deterministic jitter), not a darker flat色.
4. **Paper grain on top.** Final pass, `globalAlpha≈0.05`, thousands of 1–2px specks from a **seeded PRNG**. This is what makes digital output read as physical.
5. **Slightly wobbly edges.** Straight lines are the tell of vector art. Push every `lineTo` through a 0.5–1px noise offset, or use `quadraticCurveTo` with a tiny bow.
6. **One accent per character.** Each figure gets exactly one glowing thing (chest light, eye line, mask) in the accent ink. Two competing highlights destroy the hierarchy.

---

## Composition

- Big flat graphic masses (paper block / ink block) with **hard diagonal or arch cuts** between them — not soft gradients.
- Background elements are **line-only** (pillars, arcs, architecture in 1–2px grey strokes). This keeps the subject as the only solid mass.
- Vignette by *edge darkening with ink*, not by black radial gradient.
- Ground shadow: flat ellipse at 30–35% ink alpha, always tucked slightly under the figure.

## Motion (safe by construction)

Detail-heavy Canvas characters break the moment you animate limbs. Instead:

| Do | Why |
|---|---|
| Whole-figure breathing: ±3px vertical, 4–6s period, phase-offset between figures | Reads as alive, can't distort |
| Whole-figure micro-tilt: ±0.6° | Posture shift without redrawing anatomy |
| Accent glow pulse: alpha 0.4 → 0.55 | Directs attention, zero geometry risk |
| Camera: single slow push, 4% over the whole film | Adds life without re-framing |
| Direction flip: **only on a hard cut**, never mid-motion | Prevents melting during the turn |

If you need a bigger gesture (an arm reaching, a cape spreading), animate it as a **parameter that redraws the same path**, not as a separate skeleton — one path family per pose, interpolated.

## Text / Subtitles

- Burn subtitles **after** generation, never inside the "AI generated" pass — generated text turns to mush.
- Font weight 300, `#c9c4ba`-ish on ink backgrounds, 0.82 alpha, 0.8s fade in.
- One line at a time, ≤20 chars. The picture carries the emotion; the line only anchors it.

---

## Implementation sketch

```javascript
// 1) ink pass
ctx.fillStyle = INK;
drawFigure(ctx, pose);            // flat fill, no gradient

// 2) misregistration pass — the print feel
ctx.globalAlpha = 0.4;
ctx.translate(-2, 1.5);
ctx.strokeStyle = ACCENT;         // or fill for a color block
ctx.lineWidth = 2.2;
drawFigureOutline(ctx, pose);
ctx.setTransform(1, 0, 0, 1, 0, 0);

// 3) halftone shadow
for (let y = y0; y < y1; y += 6) {
  for (let x = x0; x < x1; x += 6) {
    const d = distanceToShapeEdge(x, y);      // 0 at edge -> 1 deep inside
    if (rng() > d) continue;                  // density falls off
    ctx.beginPath();
    ctx.arc(x, y, 1.6 * (1 - d) + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 4) paper grain, always last
ctx.globalAlpha = 0.05;
for (let i = 0; i < 8000; i++) {
  ctx.fillRect(rng() * W, rng() * H, 1.4, 1.4);
}
ctx.globalAlpha = 1;
```

Note `rng()` — a seeded PRNG, never `Math.random()` (see rendering-guide.md → Determinism Rules).

---

## Failure modes seen in the field

| Symptom | Cause | Fix |
|---|---|---|
| Looks like a vector illustration, not a print | No misregistration, no grain | Add offset pass + grain pass |
| Muddy / heavy | More than 3 inks or accent >20% of area | Cut back to one accent per figure |
| Flat and lifeless despite being "correct" | Only flat fills, no halftone, no wobble | Add halftone shadow + edge noise |
| Characters drift / melt across frames | Limb-level skeletal animation on a detail-heavy figure | Switch to whole-figure rigid motion (see Motion table) |
| Captions look pasted on | Pure white text, no fade, no tracking | Use paper-tinted color, 0.82 alpha, 0.8s fade |
