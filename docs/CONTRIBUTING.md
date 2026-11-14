# Contributing to vibe-video

Thank you for considering contributing! Here's how you can help.

---

## Ways to Contribute

### 🎨 New Style Presets

Add a new visual style to `skills/style-presets.md`. Include:
- Style name and mood description
- Color palette (primary, accent, dark)
- Texture/rendering technique
- Best use cases
- Canvas code snippets

**Example to add:**
```markdown
## 7. anime-cell (赛璐璐动画)

**Mood**: Bold, graphic, expressive

| Property | Value |
|----------|-------|
| Primary | Flat saturated colors |
| Accent | High-contrast shadow color |
| Dark | Deep navy |
| Texture | Hard cel shading, no gradients |
| Best for | Anime-style content, expressive shorts |
```

### 💡 New Metaphor Mappings

Add abstract concepts to `skills/metaphor-library.md`:

```markdown
| **Curiosity** | Question marks floating as particles | Marks orbit a figure, growing brighter |
```

### 📖 New Examples

Add a storyboard example to `examples/`. Follow the format of existing examples.

### ⚡ Rendering Optimizations

Improve the code in `assets/templates/render-template.js` or `skills/rendering-guide.md`.

### 🐛 Bug Reports

Open an issue with:
- Description of the problem
- Your prompt / storyboard
- Expected vs. actual behavior
- Environment (OS, Node version, browser)

---

## Development Setup

```bash
git clone https://github.com/yourusername/vibe-video.git
cd vibe-video
npm install
```

---

## Pull Request Process

1. Fork the repo
2. Create a feature branch: `git checkout -b my-new-style`
3. Make your changes
4. Test with a real prompt in your AI assistant
5. Commit: `git commit -m "Add: anime-cell style preset"`
6. Push: `git push origin my-new-style`
7. Open a Pull Request

---

## Code Style

- Use clear, descriptive variable names
- Comment complex animation logic
- Keep Canvas code framework-agnostic (pure JS)
- Match the tone of existing documentation

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
