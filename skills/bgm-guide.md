# BGM Guide

Music selection and timing guide for vibe videos.

---

## Music by Video Type

| Type | Genre | BPM | Vibe | Examples |
|------|-------|-----|------|----------|
| Knowledge Explainer | Light electronic / Ambient piano | 90–100 | Curious, flowing | Lo-fi beats, ambient pads |
| Emotional Metaphor | Harp + Strings | 60–80 | Tender, building | Cinematic strings, solo piano |
| Product Promo | Pop / Upbeat electronic | 120–130 | Energetic, punchy | Synth-pop, indie electronic |
| Social Commentary | Lo-fi / Minimal | 70–85 | Contemplative | Lo-fi hip hop, ambient |
| Abstract Art | Ambient / Drone | 0–60 | Atmospheric, timeless | Drone, field recordings |

---

## Timing the Drop

Align musical peaks with visual/emotional peaks:

| Video type | When the music hits |
|------------|-------------------|
| Knowledge | At the "reveal" — when the key insight lands |
| Emotional | At maximum tension — just before the "letting go" moment |
| Product | At the feature showcase — when the benefit is shown |
| Commentary | Subtle; let the message carry, music stays under |

---

## Royalty-Free Sources

- **Pixabay Music** — pixabay.com/music (CC0, no attribution required)
- **Incompetech** — incompetech.com (Creative Commons, attribution required)
- **Free Music Archive** — freemusicarchive.org (varies by track)
- **YouTube Audio Library** — studio.youtube.com (free with account)
- **Mixkit** — mixkit.co (free, no attribution)

---

## No BGM Option

For platforms where licensing is a concern, deliver a silent version:

```bash
ffmpeg -framerate 30 -i frames/frame_%04d.png \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest \
  output_silent.mp4
```

User can add their own music in post-production.

---

## Volume Levels

| Element | Level |
|---------|-------|
| BGM | -18 to -14 LUFS |
| Caption reading pace | Match sentence length, not beat count |

Keep BGM at moderate volume so captions remain the focus. The visuals carry the emotion; music supports.
