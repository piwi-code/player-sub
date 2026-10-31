# Player Sub

A Progressive Web App for tracking players and substitutions in junior cricket.
It runs entirely in the browser, works offline once loaded, and can be installed
to a phone's home screen. All data stays on the device, in IndexedDB.

## Stack

| Concern        | Choice                                                            |
| -------------- | ----------------------------------------------------------------- |
| Language       | TypeScript (strict)                                               |
| UI             | [React](https://react.dev)                                        |
| Build/dev      | [Vite](https://vite.dev)                                          |
| PWA            | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (Workbox SW + manifest) |
| Local storage  | [Dexie](https://dexie.org) over IndexedDB, with `useLiveQuery` for reactive reads |
| Tests          | [Vitest](https://vitest.dev) + `fake-indexeddb`                   |
| Hosting        | GitHub Pages, deployed by GitHub Actions                          |

## Getting started

```bash
nvm use          # Node 22 (see .nvmrc)
npm install
npm run dev      # http://localhost:5173/player-sub/
```

Other scripts:

```bash
npm test         # unit tests
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build (service worker enabled)
```

The service worker is only active in the production build, so use
`npm run build && npm run preview` to test offline/install behaviour.

## Project layout

```
src/
  domain/          Pure, framework-free logic (types, match/substitution rules) + tests
  db.ts            Dexie database schema and data-access helpers
  components/      React UI (Match screen, Players roster, update prompt)
  App.tsx          Shell with bottom tab navigation
public/            Icons and static assets copied as-is
.github/workflows/ CI and GitHub Pages deployment
```

Keep business rules in `src/domain` as pure functions (`Match -> Match`) so they
are easy to test; components call them and save the result with `saveMatch`.

### Changing the database schema

Dexie schemas are versioned. Add a new `this.version(2).stores({...})` block in
`src/db.ts` (with `.upgrade()` if existing data needs migrating) rather than
editing version 1, so data on users' devices is preserved.

## Deployment

Two workflows live in `.github/workflows`:

- **`ci.yml`** – on pull requests and non-`main` pushes: install, test, build.
- **`deploy.yml`** – on pushes to `main` (or manually via *Run workflow*): test,
  build and publish `dist/` to GitHub Pages.

### One-time setup

1. In the repository go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Merge to `main`. The site is published at
   `https://<owner>.github.io/player-sub/`.

The base path is supplied automatically by `actions/configure-pages`, so it
also works if the repo is renamed or a custom domain is configured.

### Updates

The app uses a "prompt" update strategy: when a new version is deployed, users
see a *"A new version is available"* banner and can tap **Reload** — useful so
an update never interrupts a match in progress.

## Current features (skeleton)

- **Players** – add, rename, remove players; saved on the device.
- **Match** – pick who is available, choose starters, start the match, then tap a
  fielder followed by a bench player to substitute. Time on field is tracked per
  player and lists are sorted least-time-first so it's easy to keep things fair.
  Match state is saved continuously, so closing the app mid-match is safe.
