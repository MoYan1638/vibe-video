# Pre-Flight: Turn the Storyboard into an H3 Prompt (before any pixel is drawn)

Step 4.5 of the vibe-video workflow. Insert it **between the confirmed storyboard
and the first line of rendering code**.

The point: storyboards are written for humans. H3 needs a different grammar —
a fixed six-section rewrite, second-accurate cut marks, camera amplitude in
words, and a hard separation between what AI may invent and what it may not.
Doing this translation *up front* catches three classes of bugs that are
otherwise only discovered after burning credits: shots that ask an AI to hold a
design it cannot hold, timelines that exceed the model's window, and prompts
that quietly request on-screen text.

---

## When you run this step

| Situation | Run it? | Use |
|---|---|---|
| Film is 100% Canvas | ✅ still yes | the **storyboard lint** at the bottom — it finds dead cuts and timeline errors for free |
| Hybrid: H3 plate under Canvas (Pattern A) | ✅ yes | `T2VA` blocks, one per plate |
| Hybrid: H3 shot with a style anchor (Pattern B) | ✅ yes | `I2VA` / `Ref2VA` blocks |
| Hybrid: H3 as motion reference only (Pattern C) | ✅ yes | same block, but you never ship the clip |
| User just wants the MP4 today | ⚠️ lint only | skip the prompt blocks, keep the lint |

Cost of skipping: the most expensive mistake in this pipeline is discovering at
render review that H3 redrew your character's costume. That is not fixable in
post. It is fixable in the prompt.

---

## Step 4.5a — Split the timeline for the model, not for the edit

H3 generates **4–15 seconds per call**. A storyboard row is a *narrative* unit
and is usually longer than that. So the first job is a second-pass cut:

```
storyboard rows (5–8, narrative)
      ↓  split any row > 15s at a natural beat (gesture completes / light changes)
H3 shots (4–15s each, 12s is the sweet spot)
      ↓  each shot gets its own prompt + its own credit line
```

Rules:
- 12s is the default. Under 6s is hard to prompt; over 12s the model starts
  inventing new beats to fill time.
- A cut may only fall where nothing is mid-motion. If it does, both sides look
  broken and you will blame the model.
- Every shot needs a **static** opening beat (~0.5s) so the first frame is
  clean — that frame is your Canvas overlay anchor.
- Record the running clock. `[Shot N] At MM:SS.mmm` must be the *global* time in
  the final film, not the shot-local offset.

### Credit math (do this before generating anything)

```
shots × seconds × ~8 credits/sec = H3 spend
```

56s fully in H3 ≈ 460 credits. The same 56s with three 12s plates ≈ 290, and
with Pattern A on a 20–25% screen-time budget ≈ 110–180. Write the number down
next to the shot list; it is the argument for hybrid.

---

## Step 4.5b — Choose the mode per shot

| Shot content | Mode | Why |
|---|---|---|
| Empty set: sky, fog, water, crowd, architecture, light | `T2VA` | nothing to keep on-model |
| One Canvas still sets the style (grain, ink, palette) | `I2VA` with that still | style transfers well, identity does not |
| Several stills of the same style / several plates in a series | `Ref2VA` | keeps `<Picture N>` labels stable across a batch |
| The figure must be recognisable | **Canvas, not H3** | stop here, this shot does not belong in H3 |

Label discipline in `Ref2VA`: never attach two images of two *different*
characters to one shot. Attach the style plate only, and declare the figure
`partially_preserved` — otherwise the model tries to reproduce a design and
degrades both.

---

## Step 4.5c — Emit the prompt block

Write **one block per shot**. Six sections, this order, these exact field names.
Body in English; keep only dialogue and on-screen text in their original
language (and prefer zero on-screen text — H3 cannot draw Chinese).

```text
subject_definitions:
<Subject 1> is the environment in <Picture 1>: a rain-slick stone courtyard, low
arched wall on the right, wet flagstones, no people, risograph two-ink palette.
<Picture 1> is a style anchor for [Shot 1]: it defines ink density, paper grain,
and the two-colour palette, not a composition to match.

summary:
[reference generation] An empty courtyard atmosphere plate for [Shot 1].

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the arch, flagstones, and
wet-ground reflections are retained.
<Picture 1> (style anchor for [Shot 1]): weak_reference - ink density, grain
size, and the two-ink palette are followed; framing is free.

detailed_description:
The target video is a printed two-ink risograph plate come alive, coarse paper
grain, no gradients inside any ink area.
[Shot 1] An empty stone courtyard at night, no characters in frame, the arch on
the right catching a single cold rim light. Faint halftone fog drifts left to
right across the lower third at a slow constant speed while the grain shimmers
in place. Camera: very slow push in, small amplitude, constant speed. No text
anywhere in frame.

overall_soundscape: Low night ambience, faint paper rustle, one distant water
drip repeating about every four seconds.

non_diegetic_music: none.
```

Checklist before you send it:
- [ ] duration matches the shot length; last timestamp < duration
- [ ] every `<Label>` used in `detailed_description` is defined above it
- [ ] `retention_analysis` marker matches the *role*: style = `weak_reference`,
      figure you need kept = `partially_preserved` (never `fully_preserved`
      on a character you did not render yourself)
- [ ] `overall_soundscape` / `non_diegetic_music` carry no dialogue
- [ ] the phrase `No text anywhere in frame` is present
- [ ] "no characters" is present in every plate prompt

---

## Step 4.5d — Feed the prompt's own numbers back into the code

The prompt is not a side document — it is the spec for the Canvas layer. Three
values must be copied from it into `seek(t)`, or the composite will drift:

| From the prompt | Into the code |
|---|---|
| camera move + amplitude + speed | the same easing/amount applied to the Canvas subject, or an explicitly static subject (contrast is fine, drift is not) |
| cut marks `At MM:SS.mmm` | `STORYBOARD` row boundaries in `animation.js` |
| drift direction of the plate (e.g. fog left→right) | decoration layer direction, so the two layers agree |

If the plate pushes in and the Canvas layer also pushes in at a different rate,
the result reads as a mistake. Pick one: either both move in lockstep, or the
plate moves and the Canvas layer is pinned. Document which in the shot header.

---

## Storyboard lint (run on every storyboard, Canvas-only included)

Cheap to run, and it catches the things that cost a full re-render.

| Check | Fail looks like | Fix |
|---|---|---|
| Every caption ≥ 2s, key line ≥ 3s | 1.2s caption flashes by | merge with the neighbour or extend the shot |
| Hook inside first 3s | setup shot first | move the strongest image to 0s |
| Shot length inside 4–15s (for H3) | 20s single shot | split at a beat |
| No cut mid-motion | cut during a gesture | move the cut ±0.3s to a still beat |
| Each shot names camera, amplitude, direction | "character stands there" | add push/static/track + small/medium |
| Not more than 8 shots per 30s | cut every 2s | fewer, longer shots |
| Subject identity assigned to exactly one engine | H3 shot with a recognisable face | move to Canvas |
| On-screen text assigned to Canvas only | prompt asks for Chinese type | burn in post |
| Palette ≤ 3 ink colours (print styles) | 5-colour "risograph" | pick 2 + paper |

Output format — keep it short, one line per issue:

```text
LINT  shot 3: 20.0s exceeds H3 window (4-15s) -> split at 08.4s
LINT  shot 5: cut lands inside the cloak sweep -> shift to 41.6s
WARN  total 56s with 6 H3 shots ≈ 430 credits -> consider 3 plates
OK    captions: 5/5 ≥ 2s
```

Then, and only then, write rendering code.

---

## Minimal working order for a hybrid film

```bash
# 1. storyboard confirmed -> step 4.5 lint, fix, re-lint
# 2. one still per planned style -> gives you the I2VA / Ref2VA anchor
node assets/templates/still.js --html animation.html --times 0 --outdir _chk

# 3. generate plates in H3 (one shot at a time; review before the next)
#    -> atmosphere_01.mp4 ... atmosphere_03.mp4

# 4. render the Canvas layer on transparency
node assets/templates/render-playwright.js --html animation.html \
  --out ./frames --fps 30 --duration 56 --alpha true

# 5. overlay, no keying needed
bash assets/templates/composite.sh --overlay atmosphere_01.mp4 ./frames out.mp4 30
```

See `hybrid-h3.md` for the three integration patterns, the engine-blame table,
and why colorkey loses to `--alpha true`.
