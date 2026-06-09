# danaquinleyprojects

My personal site, plus a home for random projects.

Live at **(your-domain).com** — deployed on Cloudflare Pages.

## Structure

```
.
├── index.html         # homepage (project grid)
├── cancun-2026/       # static trip hub for Cancún 2026
├── cocktail-bar/      # React + Vite app (TheCocktailDB + IBA classics)
├── public/            # files copied to the site root at build time
│   └── _redirects     # SPA fallback for cocktail-bar routes
├── build.js           # assembles dist/ for Cloudflare Pages
└── package.json
```

## Local development

The homepage and `cancun-2026/` are pure static files — open them in a browser.

The cocktail bar runs as a Vite dev server:

```bash
cd cocktail-bar
npm install
npm run dev
```

## Production build

To assemble the full site into `dist/`:

```bash
npm install            # one-time, from the repo root
npm run build
```

`build.js` does the orchestration: copies the homepage and the trip hub
in as-is, installs the cocktail-bar deps if needed, and builds it with the
`/cocktail-bar/` base path so all assets and routes resolve correctly.

## Deploying to Cloudflare Pages

Cloudflare Pages is configured to:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/`

That's all it needs. Push to `main`, Cloudflare picks it up, runs the
build, and serves `dist/`.

## Adding a new project

1. Create a new folder at the repo root (e.g. `my-thing/`).
2. If it's static HTML, add a copy step in `build.js`.
3. If it's a Vite app, follow the cocktail-bar pattern — set `base` in
   its `vite.config.js`, pass `basename` to React Router, and add a
   `cpSync` block in `build.js`.
4. Add a card to `index.html`.
