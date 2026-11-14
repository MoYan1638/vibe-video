# Hybrid Workflow: vibe-video + H3 (MiniMax)

Two engines, one pipeline. **H3 generates the atmosphere; vibe-video owns the
things that must stay exact.**

---

## Why hybrid at all

| Problem | H3 (AI video) | vibe-video (Canvas → frames) |
|---|---|---|
| Photoreal / painterly motion, real lighting | ✅ excellent | ❌ not its job |
| Exact character identity, game-accurate model | ❌ drifts, models get redrawn | ✅ deterministic |
| Legible text on screen | ❌ turns to mush | ✅ crisp vector type |
| Iterate without credits | ❌ ~8 credits/sec | ✅ free, re-render anytime |
| Long continuous performance | ✅ cheap in edit time | ❌ every frame costs CPU |
| Camera language (push/arc/handheld) | ✅ native | ⚠️ simulated |

So: **never make H3 draw your character or your text.** Make it draw light,
weather, particle beds, crowd silhouettes, plate transitions — the atmosphere
layer — then composite your deterministic plates on top.

---

## Three integration patterns

### Pattern A — Atmosphere plate (most reusable)

Use H3 as a moving background; Canvas draws the subject and all text.

```
H3 prompt  →  atmosphere.mp4   (no characters, no text)
                        ↓
Canvas render →  frames/frame_%04d.png   (subject + captions, transparent or
                                          keyed against the plate's paper color)
                        ↓
ffmpeg overlay →  final.mp4
```

ffmpeg:

```bash
# background scaled to frame size, canvas frames keyed on the paper color
ffmpeg -y -i atmosphere.mp4 -framerate 30 -i frames/frame_%04d.png \
  -filter_complex "[1:v]colorkey=0xe8e4dc:0.08:0.02[fg];[0:v][fg]overlay=shortest=1" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 out.mp4
```

Rule of thumb: the H3 plate supplies **motion and light**, the Canvas plate
supplies **identity and type**. If H3's shot has a subject that resembles your
character, it will fight you — ask for empty sets.

**Better than colorkey: render the Canvas layer on transparency.** Colorkey on
the paper色 works but eats anti-aliased edges and any low-alpha grain you drew
over the paper (validated in testing — the figure comes out muddy). The clean
way is transparent frames:

```javascript
// in your render script: hide the paper, screenshot with alpha
ctx.clearRect(0, 0, W, H);            // skip drawImage(plate) for hybrid mode
await page.screenshot({ omitBackground: true, ... });
```

Then `overlay` needs no key at all: `[0:v][1:v]overlay=shortest=1`. Keep the
keyed path in `composite.sh` as the fallback for frames you already rendered
flat, and set `KEY` to your exact paper色.

### Pattern B — Style anchor (reference image, not video)

Render one Canvas still in your style and feed it to H3 as `<Picture 1>`
(mode `I2VA`) so a generated shot inherits the look. Keep the generated shot for
shots where the character is small, distant, or off-camera.

```
Canvas still (risograph-ink) ──► H3 I2VA  ──► wide establishing shot
```
Use only for shots where nobody needs to recognise the character face-on.
`retention_analysis` should read `weak_reference` on style, not `fully_preserved`
on the figure — otherwise H3 tries to reproduce a design it cannot hold.

### Pattern C — Motion reference (Canvas learns from H3, not the reverse)

Generate one H3 clip of a *generic* figure doing the gesture you want, study its
timing, then hand-key those timings into `state(t)`. Nothing is composited; the
result is 100% Canvas.

This is the cheapest way to get "feels filmic" motion without paying per second,
and it is the only pattern where the AI output is a reference rather than a layer.

---

## Non-negotiables (learned the hard way)

1. **Text is Canvas-only.** Any prompt that asks H3 to render Chinese characters
   produces mush. Generate clean plates, burn text in post.
2. **Two different characters = two separate H3 shots + hard cuts.** Do not ask
   one shot for an interaction between two characters whose designs must stay on
   model; the second one always degrades.
3. **Do not animate detailed characters with AI at all if the audience must
   recognise them.** Atmosphere, crowds, weather, light: yes. Faces and costumes:
   no.
4. **Keep durations inside H3's window (4–15s per shot)** and match the prompt's
   timeline to that duration, then assemble the film in the edit, not in the model.
5. **Budget guard**: check the credit balance before a batch; a 56s film made
   entirely in H3 is ~460 credits. A hybrid film uses H3 for maybe 15–25% of the
   screen time.

---

## Prompt shape for an atmosphere plate

Follow `h3-prompt-writing`'s T2VA / I2VA structure, but keep the ask narrow:

```text
integrated_multimodal_description:
[Shot 1] Empty courtyard at night, printed two-ink risograph look. No characters.
Slow drifting paper grain, faint halftone fog rolling left to right across the
lower third, a single cold rim light grazing the arch on the right. Camera: very
slow push in, amplitude small, speed constant.
overall_soundscape: low night ambience, faint paper texture rustle.
non_diegetic_music: none.
```

Note what is deliberately absent: no people, no text, no plot. That is the whole
trick — the narrower the ask, the more usable the plate.

---

## Failure signature → which engine to blame

| What you see | Cause | Fix |
|---|---|---|
| Background morphs randomly | H3 plate has ambiguous geometry | Give it architecture/landscape, not abstract space |
| Character's face/costume changes mid-shot | H3 was asked to hold a detailed design | Move character to Canvas layer |
| Text is unreadable | Text generated inside H3 | Burn text in post |
| Cut feels dead between shots | Plate and Canvas motion drift apart | Match camera easing in `state(t)` to the plate's drift |
| Everything looks slightly soft | H3 upscale + Canvas overlay at different sharpness | Render Canvas at the output size, overlay without scaling |
