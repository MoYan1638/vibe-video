---
name: vibe-video
description: Generate short-form vibe videos (15s-60s) using pure code — Canvas/JS rendering + ffmpeg compositing. No filming, no stock footage, no voiceover needed. Supports knowledge explainers, emotional metaphors, product promos, and social commentary.
triggers:
  - vibe video
  - code animation
  - frame-by-frame rendering
  - no-voiceover short video
  - knowledge explainer video
  - emotional metaphor video
  - canvas animation to mp4
---

# vibe-video — AI-Powered Short Video Generator (Code → MP4)

Turn any idea into a short, atmospheric video using nothing but code. The AI writes Canvas/JS animation, renders frame-by-frame, and composites into MP4 with optional BGM.

## When to Use

Use this skill when the user wants to create a short video (15s–60s) that is:
- **Knowledge explainer** — Nobel facts, science principles, psychology insights
- **Emotional metaphor** — attachment, anxiety, letting go, memory
- **Product promo** — app features, brand story, launch announcement
- **Social observation** — behavioral patterns, cultural phenomena
- **Abstract concept art** — pure visual poetry, loop animations

## Workflow (5 Steps, Do Not Skip)

### Step 1: Clarify (ask max 3 questions)

Confirm these with the user:
1. **Duration** — 15s / 30s / 45s / 60s (default 30s)
2. **Aspect ratio** — 9:16 (portrait) / 16:9 (landscape) / 1:1 (square) (default 9:16)
3. **Style** — see Style Presets in `style-presets.md`
4. **Topic & emotional arc** — what's the core message? what feeling should it leave?

### Step 2: Output Storyboard

Produce a storyboard table **before** writing any code:

```
| Time | Visual Description | Caption (≤20 chars) | Visual/audio cue |
|------|--------------------|---------------------|-------------------|
| 0-3s | ... | ... | ... |
```

Rules:
- Each caption stays ≥2s; key conclusion ≥3s
- Hook in first 3 seconds (counter-intuitive fact / emotional opener / core pain point)
- 5–8 shots total, pacing slow→fast→slow
- Visual descriptions must specify: shape, color, motion direction, camera movement

**WAIT for user confirmation** before proceeding. If user requests changes, modify only the specified shots. If >3 shots change, re-output the full storyboard.

### Step 3: Write Rendering Code

**Copy `assets/templates/animation.js` + `animation.html` as your starting point** — they implement the layer system, caption fades, a seeded-PRNG background, and the `window.seek(t)` contract, with live browser preview included. Edit `STORYBOARD` and the `draw*()` functions.

See `rendering-guide.md` for the full technical spec. Quick reference:

```javascript
// Time-driven animation — every visual is a pure function of t
// (no Math.random(), no Date.now() — use a seeded PRNG if needed,
//  so any frame re-renders identically for stills and resumed renders)
function seek(t) {
  // t = current time (seconds)
  // Return visual state for this frame
  // Use linear interpolation for position/opacity/scale
}

// Layer system
// Layer 0: Background (gradient / particles)
// Layer 1: Main subject
// Layer 2: Dynamic decoration (light threads / particles / lines)
// Layer 3: Caption overlay

// Export
// Playwright headless → screenshot each frame → ffmpeg composite
```

### Step 4: Render & Composite

**Preview stills first** — checking one frame takes ~1s, a full render takes minutes:

```bash
# look-check at t=0 / 4 / 10s (auto-uses installed Edge or Chrome)
node assets/templates/still.js --html animation.html --times 0,4,10

# render frames (12–15fps is usually enough; smooth motion benefits from 24–30)
node assets/templates/render-playwright.js --html animation.html --out ./frames --fps 30 --duration 15

# composite (set FFMPEG=/path/to/ffmpeg if not on PATH)
bash assets/templates/composite.sh ./frames output.mp4 30

# with BGM
bash assets/templates/composite.sh ./frames output.mp4 30 bgm.mp3
```

Windows gotcha: if `bash composite.sh` misbehaves (Git Bash shim / stripped PATH), spawn ffmpeg from Node with `child_process.spawn` directly — see rendering-guide.md Troubleshooting.

Legacy manual commands:

```bash
# Render frames
node render.js  # outputs frames/frame_0001.png ...

# Composite with ffmpeg
ffmpeg -framerate 30 -i frames/frame_%04d.png -c:v libx264 -pix_fmt yuv420p output.mp4

# With BGM
ffmpeg -framerate 30 -i frames/frame_%04d.png -i bgm.mp3 -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest output.mp4
```

### Step 5: Deliver

Deliver: MP4 file + storyboard + source code. File size target: <50MB for 30s.

## Files in this Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — main skill definition |
| `style-presets.md` | 6 visual style presets with color palettes and rendering tips |
| `rendering-guide.md` | Technical spec: Canvas rendering, easing, determinism rules, troubleshooting |
| `metaphor-library.md` | Visual metaphor mappings for abstract concepts |
| `caption-guide.md` | Caption typography, timing, and tone rules |
| `bgm-guide.md` | BGM selection guide by video type |
| `../assets/templates/animation.js` + `animation.html` | **Ready-to-edit scaffold** (layers, captions, seeded background, live preview) |
| `../assets/templates/render-playwright.js` | Frame renderer: browser autodetect (Edge/Chrome/chromium), paint-synced screenshots |
| `../assets/templates/still.js` | Single-frame still renderer for cheap look-checks |
| `../assets/templates/composite.sh` | ffmpeg compositor (video / video+BGM, `FFMPEG=` override) |
| `../assets/templates/render-template.js` | Node-canvas variant (no browser needed; limited CSS/fonts) |

## Example Prompts

### Knowledge Explainer
```
Make a 30s 16:9 knowledge video about why cutting onions makes you cry.
Style: tech-blueprint. Arc: phenomenon → mechanism → solution.
```

### Emotional Metaphor
```
Make a 30s 9:16 emotional video about possessiveness.
Style: soft-glow. Visual metaphor: light threads wrapping → loosening → fireflies.
```

### Product Promo
```
Make a 15s 9:16 product promo for a focus app.
Style: minimal-line. Arc: pain point → solution → result.
```

## License

MIT — see LICENSE file. Free for personal and commercial use.
