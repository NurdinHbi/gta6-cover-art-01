# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/NurdinHbi/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/NurdinHbi/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice City Nights — a GTA 6-style cover art maker: drop in your own photos, arrange them in multi-panel poster layouts, grade them sunset or neon, add a bold caption, and export a share-ready PNG in 1080×1080, 1080×1350 or 1920×1080. Runs fully offline from static files.

## What it does

- **Any photo** — upload photos from your machine (read locally, never uploaded), or start with the two bundled sample scenes. Click a photo to place it in the selected panel; "Fill all panels" spreads one photo across the whole poster.
- **Multi-panel layouts** — Hero + strip, Three panels, Four grid, and Single shot, each recomputed for the export aspect.
- **Crop and position** — click a panel to select it, drag on the preview to pan the photo inside it, use the zoom slider or Fit / Fill frame.
- **Colour grades** — Sunset warm, Neon nights, Noir, and Pastel dawn, drawn as canvas overlays with a vignette.
- **Bold caption** — editable kicker, title and subtitle in a condensed system-font stack with outlined poster lettering over a dark scrim.
- **Export sizes** — 1080×1080, 1080×1350 and 1920×1080 PNG, downloaded straight from the browser.

All art, lettering and design are original: no Rockstar Games logo, wordmark, artwork, character or font is used. The two sample photos are procedural illustrations generated for this app.

## Run it

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network requests: every script, style and image loads from under `app/`.

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor chrome
- `app/src/main.js` — editor wiring (tray, choices, drag-pan, export)
- `app/src/cover.js` — cover renderer (layouts, grades, caption, export canvas)
- `app/samples/` — two bundled procedural sample photos
- `main.ts` — entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — 4 screenshots of the app and its exported covers

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
