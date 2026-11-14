# Caption Guide

Rules for typography, timing, and tone of on-screen captions.

---

## Typography

| Parameter | Value |
|-----------|-------|
| Position | Bottom-center, 10–12% from bottom edge |
| Font family | Serif (emotional) / Sans-serif (knowledge) / Monospace (tech) |
| Font size | 3–4% of short edge (≈38–76px on 1080-wide) |
| Color | Semi-transparent white `rgba(255,255,255,0.85)` |
| Weight | Light (300) for emotional, Regular (400) for knowledge |
| Stroke | Optional 1px dark outline for contrast on bright backgrounds |

---

## Timing

| Caption type | Min duration | Notes |
|--------------|-------------|-------|
| Opening hook | 2.5–3s | First impression, let it land |
| Transition | 2s | Move the narrative forward |
| Key insight | 3–4s | The "aha" moment, give it space |
| Closing line | 3s | Leave a lasting impression |

---

## Tone

### Knowledge / Explainer
- Direct, factual, surprising
- "切洋葱流泪，是它在释放催泪气体"
- "这东西飘到眼睛里，和水反应生成微量硫酸"

### Emotional / Metaphorical
- Poetic, evocative, open-ended
- "我不是想困住你"
- "占有欲最安静的样子，是把手松开"

### Product / Promo
- Benefit-driven, punchy
- "手机每亮一次，注意力就碎一次"
- "专注，不是不联系，是选择什么时候联系"

### Social Commentary
- Witty, observational, relatable
- "成年人的崩溃，都是静音的"
- "你不是拖延，你是害怕做得不够好"

---

## Anti-Patterns (Don't do these)

| ❌ Bad | ✅ Good |
|--------|---------|
| "This video explains the concept of procrastination" | "你不是懒，你是怕" |
| "In conclusion, we can see that..." | "所以冷藏10分钟再切" |
| Wall of text (超过30字) | Short punchy line (≤20字) |
| Corporate buzzwords | Everyday language |
| Robotic / AI-sounding | Conversational / poetic |

---

## Canvas Implementation

```javascript
function drawCaption(ctx, text, t, duration, width, height) {
  const fadeIn = 0.3;  // seconds
  const fadeOut = 0.3;
  let alpha = 1;

  if (t < fadeIn) alpha = t / fadeIn;
  else if (t > duration - fadeOut) alpha = (duration - t) / fadeOut;

  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  ctx.font = "300 42px 'Noto Serif SC', serif";
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Optional outline for contrast
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeText(text, width / 2, height * 0.88);
  ctx.fillText(text, width / 2, height * 0.88);
  ctx.restore();
}
```
