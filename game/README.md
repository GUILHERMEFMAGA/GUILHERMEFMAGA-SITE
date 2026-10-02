# The Ashen Way

A small, dependency-free browser game framework for a dark-fantasy, first-person pixel-art world. The first scene is a winding cobblestone road through a foggy deadwood forest toward the Black Keep; the knight's gauntlet and ember-lit broadsword are rendered as a viewmodel in the lower-right foreground. The selected visual-direction reference is [the generated landscape](../images/dark-fantasy-pixel-landscape.png); the runtime scene itself is rendered procedurally.

**Play online:** [Open The Ashen Way](https://html-preview.github.io/?url=https://github.com/GUILHERMEFMAGA/GUILHERMEFMAGA-SITE/blob/8b97b4215a02af652f887ed083cd2b7e50f60206/game/preview.html).

The online preview uses `preview.html`, a standalone bundle with inline CSS and classic JavaScript so HTML-preview services can execute it. Rebuild it after changing the game source with:

```bash
npm --prefix game run build:preview
```

## Run it

From the repository root, start any static HTTP server. For example:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Open <http://localhost:8000/game/>. The renderer uses WebGL 2 and does not need a build step, package install, or network-hosted game assets; its interface uses local system-font fallbacks.

Run the world-state tests with Node.js 18 or newer:

```bash
npm --prefix game test
```

## Controls

- **W / S** — walk forward / backward.
- **A / D** — step left / right; **Shift** — run.
- **Mouse** — look. Choose **Click to look** for pointer lock; press **Escape** to release and pause. Drag the view if pointer lock is unavailable.
- **Touch** — on a touch screen, use the on-screen directional pad and Run button; drag the scene to look.
- **↺** — restart from the first bend.

## Framework notes

- `src/renderer.js` owns the WebGL 2 render loop, low-resolution render target and shader lifecycle.
- `src/shaders.js` is the procedural scene renderer: signed-distance 3D geometry, pixel-grid stonework, sunset lighting, fog, soft ray-marched shadows, deterministic forest placement, and the first-person armor / blade.
- `src/world.js` keeps player movement, route progress, view bob, and the castle-detail ramp in one small simulation layer.
- `src/input.js` handles keyboard, pointer lock / drag-look, and touch controls.

The world is rendered continuously from a stable seed (`1907`), not assembled from unrelated generated screenshots. Road, trees, masonry, and lighting are functions of fixed world coordinates; moving forward moves the camera through the same scene. The keep's masonry, windows, and battlements ease in with distance-to-player, while the underlying silhouette and layout remain fixed. That gives each frame spatial continuity and makes this scaffold ready for future chunks, authored assets, combat, and save-state work.

## Current scope

This is a renderer-and-movement foundation, not a complete game: it includes a traversable opening route, seeded procedural geometry and shading, a knight viewmodel, responsive HUD, keyboard/mouse/touch input, pause/restart, and state tests. There are no external runtime libraries, server APIs, audio files, or generated image dependencies.
