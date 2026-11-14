# 🎬 vibe-video

> **AI-Powered Short Video Generator** — Turn any idea into a beautiful short video using pure code. No filming, no stock footage, no voiceover required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Skills](https://img.shields.io/badge/Skills-8-blue)](./skills)
[![Styles](https://img.shields.io/badge/Styles-7-green)](./skills/style-presets.md)

---

## ✨ What is this?

`vibe-video` is an open-source **Skill** for AI coding assistants (WorkBuddy, Claude, Codex, etc.) that generates atmospheric short-form videos from a text prompt.

You describe what you want — a knowledge explainer, an emotional metaphor, a product promo — and the AI:
1. Creates a storyboard
2. Writes Canvas/JS animation code
3. Renders frame-by-frame
4. Composites everything into an MP4

All without cameras, actors, stock footage, or manual video editing.

---

## 🎯 Use Cases

| Type | Example Topics |
|------|---------------|
| 🧪 Knowledge | Nobel facts, science principles, psychology insights |
| 💔 Emotional | Attachment, anxiety, letting go, memory |
| 📱 Product | App features, brand story, launch announcements |
| 🌍 Social | Behavioral patterns, cultural phenomena |
| 🎨 Abstract | Pure visual poetry, loop animations |

---

## 🎨 Built-in Styles

| Style | Mood | Best For |
|-------|------|----------|
| **soft-glow** | Warm, dreamy, emotional | Love, nostalgia, comfort |
| **minimal-line** | Clean, intellectual, witty | Product promos, commentary |
| **cyber-neon** | Futuristic, energetic, edgy | Tech, gaming, crypto |
| **pixel-retro** | Nostalgic, playful, lo-fi | Gaming, memes, retro |
| **tech-blueprint** | Precise, analytical, scientific | Science explainers, tutorials |
| **hand-drawn** | Childlike, warm, storybook | Children's content, brands |
| **risograph-ink** | Printed, grainy, limited-ink | Editorial, moody narrative, poster-like |

---

## 🚀 Quick Start

### 1. Install in your AI assistant

Copy the `skills/` directory into your assistant's skill folder, or import via Skill Hub (if supported).

### 2. Give it a prompt

```
Make a 30s 9:16 emotional video about possessiveness.
Style: soft-glow.
Visual metaphor: light threads wrapping → loosening → fireflies.
```

### 3. Confirm the storyboard

The AI will output a shot-by-shot storyboard. Review and confirm, or request changes.

### 4. Get your video

The AI writes the code, renders the frames, and composites into MP4. Done.

---

## 📁 Project Structure

```
vibe-video/
├── README.md                 # This file
├── LICENSE                   # MIT License
├── skills/
│   ├── SKILL.md             # Main skill definition & workflow
│   ├── storyboard-to-h3.md  # Pre-flight: storyboard lint + H3 prompt blocks
│   ├── hybrid-h3.md         # Mixing Canvas layers with AI-generated atmosphere plates
│   ├── style-presets.md     # 6 visual style presets (+ risograph-ink in style-presets/)
│   ├── rendering-guide.md   # Canvas/JS → ffmpeg pipeline + determinism rules + troubleshooting
│   ├── metaphor-library.md  # Abstract concept → visual mappings
│   ├── caption-guide.md     # Typography, timing, tone rules
│   └── bgm-guide.md         # Music selection & timing
├── examples/
│   ├── knowledge-onion.md   # Example: why onions make you cry
│   ├── emotion-possessive.md # Example: possessiveness metaphor
│   ├── product-focus-app.md  # Example: focus app promo
│   ├── risograph-demo.js/.html  # Runnable risograph-ink demo
│   └── storyboard-sample.txt    # Lint-clean 56s hybrid storyboard
├── assets/
│   └── templates/
│       ├── animation.js / animation.html  # Ready-to-edit scaffold (layers, captions, seeded PRNG, live preview)
│       ├── render-playwright.js           # Frame renderer (browser autodetect, paint-synced, --alpha true)
│       ├── still.js                       # Single-frame still renderer for look-checks
│       ├── lint-storyboard.js             # Storyboard linter (timeline, H3 window, credits)
│       ├── composite.sh                   # ffmpeg compositing script (video / BGM / --overlay)
│       └── render-template.js             # Node-canvas variant (no browser)
└── docs/
    └── CONTRIBUTING.md      # How to contribute new styles/metaphors
```

---

## 📝 Example Prompts

### Knowledge Explainer
```
用 vibe-video 做一个 30 秒 16:9 知识科普视频。
主题：为什么切洋葱会流泪。
风格：tech-blueprint。
情绪主线：现象→原理→解决方案。
```

### Emotional Metaphor
```
用 vibe-video 做一个 30 秒 9:16 情感隐喻视频。
主题：占有欲。
风格：soft-glow。
视觉隐喻：光丝缠绕→松开→化萤火。
```

### Product Promo
```
用 vibe-video 做一个 15 秒 9:16 产品宣传视频。
产品：一款专注 App。
风格：minimal-line。
情绪主线：痛点→方案→效果。
```

---

## ⚙️ Technical Requirements

- **Node.js** ≥ 18
- **ffmpeg** (for compositing) — anywhere on PATH, or pass `FFMPEG=/path/to/ffmpeg`
- **Any one of:** `playwright` / `playwright-core` / `@playwright/test` **plus a Chrome or Edge already on the machine** (no browser downloads needed; the renderer auto-detects msedge → chrome → bundled chromium)

```bash
npm install playwright-core   # or playwright / @playwright/test

# ffmpeg:
# macOS:   brew install ffmpeg
# Ubuntu:  sudo apt install ffmpeg
# Windows: winget install Gyan.FFmpeg   (or use ffmpeg-static via npm)
```

## 🚀 The 30-Second Pipeline

```bash
# 0. copy the scaffold and edit STORYBOARD + draw*() to your storyboard
cp assets/templates/animation.js assets/templates/animation.html myvideo/

# 0.5 lint the storyboard before writing code (free, catches timeline + engine mistakes)
node assets/templates/lint-storyboard.js examples/storyboard-sample.txt

# 1. LOOK-CHECK with stills first (~1s each) — never discover a broken look after a 3-minute render
node assets/templates/still.js --html myvideo/animation.html --times 0,4,10

# 2. render frames (paint-synced, browser auto-detected)
node assets/templates/render-playwright.js --html myvideo/animation.html --out ./frames --fps 30 --duration 15

# 3. composite
bash assets/templates/composite.sh ./frames output.mp4 30
```

Key contract: your animation exposes `window.seek(t)` and derives **all** state from `t` (use the seeded PRNG in the scaffold, never `Math.random()`). That makes stills, re-renders, and interrupted-batch resumes all byte-reproducible. See `skills/rendering-guide.md` → Determinism Rules & Troubleshooting.

---

## 🧩 Hybrid with AI video (optional)

Code keeps identity and text exact; AI video supplies light, weather and camera feel. The skill ships a contract for both directions:

- **`skills/storyboard-to-h3.md`** — pre-flight translation: split the timeline into 4–15s AI shots, emit a six-section prompt block per shot, then copy the prompt's camera numbers back into the animation. Plus the storyboard lint table.
- **`skills/hybrid-h3.md`** — three integration patterns (atmosphere plate / style anchor / motion reference), credit budget math, and a "which engine is at fault" table.
- **`assets/templates/lint-storyboard.js`** — run before you generate anything: checks timeline gaps, the 4–15s AI window, engine assignment, and estimates credits.

```bash
node assets/templates/lint-storyboard.js examples/storyboard-sample.txt
# render the Canvas layer with transparency, then overlay it on the AI plate
node assets/templates/render-playwright.js --html animation.html --out ./frames --duration 56 --alpha true
bash assets/templates/composite.sh --overlay plate.mp4 ./frames output.mp4 30
```

Rule of thumb: never let an AI video model draw a character the audience must recognise, and never let it draw text.

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

Ideas for contributions:
- New style presets (e.g., `anime-cell`, `claymation`, `risograph`)
- New metaphor mappings
- New example storyboards
- Rendering optimizations

---

## 📄 License

MIT License — free for personal and commercial use. See [LICENSE](./LICENSE) for details.

---

## 🙏 Credits

Inspired by the "Vibe 视频" trend — using AI to create atmospheric short videos with code, not cameras.

Made with ❤️ for the open-source community.
