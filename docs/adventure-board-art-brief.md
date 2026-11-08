# Adventure Board — Art Brief

How to get a **production-usable** board, instead of a pretty-but-broken AI raster.

## The one rule

**Generate scenery only. Draw the game in code.**

AI image models cannot count or lay out a sequential numbered path — so never let
them try. The image is a *backdrop plate*: a landscape with **no numbers, no tiles,
no path markers, no text**. The 80-step path, tile numbers, player token, highlights
and animations are rendered by the game on top of it (the `PATH` coordinate array in
`AdventureGame.jsx`).

Three layers:

1. **Backdrop plate** — painterly landscape, no text/tiles. (AI raster is fine here.)
2. **Path data** — array of `{ x, y, type }` placed to follow the art's features.
3. **Render layer** — tiles, numbers, token, FX drawn in code: crisp, themeable, animatable.

## Two settings that fix the Gemini flaws

- **Flat top-down (orthographic) view.** The Gemini board is drawn in 3/4 perspective,
  so tiles shrink toward the back — a uniform coordinate overlay can't line up. Ask for
  "directly from above, flat top-down map, no perspective." Then tile coordinates map linearly.
- **Forbid text/numbers/tiles.** This is what stops `55 56 57 55`, `14 14`, duplicate
  "1–20" runs, etc. The model can't draw a wrong path if it draws no path.

## Master prompt (animals / forest)

```
Illustrated top-down board-game background, landscape 16:9, flat overhead
map view (no 3D perspective, no horizon). Pure terrain art only — NO text,
NO numbers, NO path markings, NO tiles, NO arrows. Leave the ground open
and uncluttered where a winding trail will pass.

Layout, left-to-right and bottom-to-top:
- Bottom-left: bright green meadow with wildflowers, a cute deer and
  squirrel, a small compass rose in the corner.
- Left side going up: a wide gentle blue river with a friendly stone arch
  bridge, a few smiling fish, soft reeds and cattails on the banks.
- Center-bottom: a light mossy wetland, calm green water, lily pads, a
  friendly cartoon crocodile peeking out, soft tree roots, a few glowing
  fireflies.
- Center: a cheerful mixed forest, rounded oaks and pines, a cute owl on a
  branch, a happy fox and badger below.
- Center-right: an open sunny clearing with a friendly bear and wolf, little
  paw prints on the ground.
- Right side: soft rounded grey mountains with snow caps, a mountain goat, an
  eagle gliding, a welcoming cave entrance.
- Bottom-right: a sunlit finish meadow with a golden trophy, flowers, a happy
  deer, a celebration feeling.

STYLE: soft friendly cartoon storybook — rounded chunky shapes, smooth
cel-shading, bright cheerful colors, a light airy palette, gentle soft
shadows, simple and uncluttered, cute and welcoming for young children
(ages 4-8). Calm and inviting, not busy, not dark, not scary. Even bright
daylight. Keep ~8% empty margin around the edges, no painted border frame.
```

Each terrain zone above doubles as a game feature: the **river + bridge** is the
crossing (jump it or fall in), the **wetland/crocodile** and **mountain/cave** are
natural homes for the snake-style slip-backs, and the **bottom-right trophy meadow**
is the finish. So locking these zones means the code path can be routed through them.

**Negative prompt / avoid list:**

```
no text, no numbers, no letters, no words, no labels, no game tiles,
no circles, no path markers, no spaces, no dice, no UI, no painted frame,
no 3D perspective, no tilt, no horizon, no watermark, no logo, no people
```

## Why "feature zones" matter

The terrain is *functional*: the river is steps 20–22, the vine is 36→47, the snake/
slope is 54→45. So the painted river/vine/mountain must sit in **predictable zones** that
the code path can be routed through. Locking the composition (river = middle, vine =
upper-middle, mountains = top-right, start meadow = lower-left) means the same `PATH`
coordinates keep working even when you regenerate the art.

You have two options for the trail itself:

- **A) No painted trail (recommended).** Art is pure scenery; code draws the whole track
  and tiles. Most robust — the path is always correct and fully ours; we just align the
  water tiles to the painted river band.
- **B) Faint empty trail painted in.** Reads more like a classic board; but the trail
  shape is whatever the model draws, so we adapt the path to it after generating.

## Generator settings

- **Aspect:** 16:9 (matches the in-app board area). Generate at the highest resolution
  available (≥1536 px wide), then downscale.
- **Variations:** make 3–4, pick the one with the most open ground and features in the
  right zones.
- **Safe margins:** keep important features ~8% in from every edge — the game adds its
  own wooden frame and a vignette, which will crop the outer rim.
- **No baked-in UI frame** — the app draws the frame, so a painted one would double up.

## Reusable per-theme template

Keep the structure; swap only the biome block. Same composition → same path coords.

```
Children's storybook board-game background, hand-painted soft cel-shaded
illustration, seen DIRECTLY FROM ABOVE in a flat top-down map view
(orthographic, no perspective). Composition: a {START BIOME} in the
lower-left; a {BARRIER} across the MIDDLE; a {CLIMB FEATURE} in the
upper-middle; a {HAZARD/LANDMARK} in the top-right corner; {FILLER SCENERY}
elsewhere. Open uncluttered ground where a trail winds through. Even
lighting, vibrant friendly colors. 16:9.
[+ same negative list]
```

| Theme | START BIOME | BARRIER (river-equiv) | CLIMB (vine-equiv) | HAZARD (snake-equiv) |
|-------|-------------|------------------------|--------------------|----------------------|
| Animals | meadow clearing | blue river | vine-covered tree | rocky cave / steep slope |
| Space | launch pad | asteroid gap / nebula | rocket booster lift | black-hole / wormhole |
| Sea | sandy shallows | deep trench current | kelp / bubble updraft | whirlpool |
| Dinosaurs | fern clearing | lava river | tall cliff vines | tar pit |
| Robots | charging dock | power gap | conveyor lift | magnet / glitch zone |

## Validation checklist (before using a plate)

- [ ] Zoom in: **no text or numbers anywhere** (corners too).
- [ ] **Flat top-down** — objects the same scale across the whole image, no horizon.
- [ ] River is one **clear continuous band across the middle**.
- [ ] Vine tree + mountain/cave are readable and in the expected zones.
- [ ] Ground where the path runs is **open** (not blocked by big objects).
- [ ] Features sit inside the ~8% safe margin (not jammed against edges).
- [ ] Even lighting — no dark corners that would hide light tiles.

## Iteration tips

- If stray text/numbers appear, **erase/inpaint** them or regenerate — never ship them.
- Generate the river/vine/mountain in the **same zones** each time so one path fits all regens.
- Save the chosen plate as `src/games/Adventure/board-animals.png` (or .webp) and the game
  will use it as the backdrop under the code-drawn track.
