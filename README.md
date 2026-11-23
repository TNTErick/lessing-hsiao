# Lessing's Mongolian-English Dictionary — Web App

An interactive web interface for **Lessing's Mongolian-English Dictionary** (1960), supporting romanised, Cyrillic, and traditional Mongolian script.

Live at: **https://lessing.chunkil.im/**

---

## Features

- **Search** by romanisation, Cyrillic, or explanation text
- **Alphabet filter** for quick browsing by initial letter
- **Romanisation scheme switcher** (multiple schemes supported)
- **Traditional Mongolian script** displayed vertically alongside each entry
- **Detail modal** with the original scanned dictionary page, zoom and pan controls
- Romanisation rendered in Noto Sans for correct display of characters like γ

---

## Development

**Prerequisites:** Node.js, Yarn

```bash
yarn install
yarn dev        # start dev server at http://localhost:5173
yarn build      # type-check + production build
yarn preview    # preview production build locally
```

---

## Deployment

The app deploys to GitHub Pages under the [`gh-pages` branch](https://github.com/TNTErick/lessing-hsiao/tree/gh-pages).

```bash
yarn deploy
```

This runs `yarn build` then publishes the `dist/` folder to the `gh-pages` branch via the `gh-pages` package.

> Make sure you have push access to the repository and that GitHub Pages is configured to serve from the `gh-pages` branch in the repository settings.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| rolldown-vite | Build tool |
| Tailwind CSS v4 | Styling |
| react-window | Virtualised list for large entry count |
| Noto Sans (Google Fonts) | Romanisation display font |
| gh-pages | GitHub Pages deployment |

---

## Fonts

- **Romanised text** — Noto Sans (loaded from Google Fonts)
- **Traditional Mongolian script** — `Mongolian Baiti` / `Cmdashitseden` (bundled in `/public`)
