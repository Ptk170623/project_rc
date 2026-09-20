# Music Journal

A personal app for logging impressions on songs while actively listening:
bands → albums → songs, with a rating (Meh / Good / Great / Amazing /
Legendary) and "traits" (quick notes) that can each carry their own
classification.

There are two versions in this repository:

- **`backend/` + `frontend/`** — "client-server" version: FastAPI + SQLite
  running on your computer, also reachable from your phone on the same
  Wi-Fi network. Documented below.
- **`pwa/`** — 100% offline version: React + IndexedDB, no backend at all,
  installable as an app on your phone. Documented in [Offline PWA
  version](#offline-pwa-version-pwa-folder).

## Running locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn app.main:app --reload --port 8000
```

The API comes up at `http://localhost:8000` (interactive docs at `/docs`)
and automatically creates `backend/music.db` (SQLite) on first run, already
seeded with a default list of quick traits/classifications.

### 2. Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173` and already points at the API on
`http://localhost:8000` (configurable via `VITE_API_BASE`).

## Using it from your phone (same Wi-Fi network)

Your phone needs to be on the **same Wi-Fi network** as the computer
running the app (this doesn't work over the internet, only on the local
network).

1. Find your computer's local IP:
   - Linux/Mac: `hostname -I` or `ifconfig` (something like `192.168.0.x`)
   - Windows: `ipconfig` ("IPv4 Address" field)
2. Run the backend listening on all network interfaces, not just
   `localhost`:
   ```bash
   ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. Run the frontend normally (`npm run dev`) — it already listens on
   `0.0.0.0` by default (configured in `vite.config.js`).
4. On your phone's browser, go to `http://<COMPUTER-IP>:5173`
   (e.g. `http://192.168.0.15:5173`). The frontend figures out the API's
   address on its own from the URL used to open the page, so there's
   nothing else to configure.
5. If it doesn't connect, check your computer's firewall — you may need to
   allow ports `5173` and `8000` for connections from the local network.

Tip: in your phone's browser (Chrome/Safari), use "Add to Home Screen" to
open the app like a shortcut, without the address bar.

## Offline PWA version (`pwa/` folder)

This version uses no backend and no SQLite: all data is saved directly in
the browser (IndexedDB), and the app works installed as an app, with no
need for the computer to be on or for an internet connection once
installed.

### Running/testing locally

```bash
cd pwa
npm install
npm run dev
```

Opens at `http://localhost:5174`. In dev mode the app already works and
saves data in the browser, but "install app" and fully offline behavior
only kick in with a production build (`npm run build` + `npm run
preview`), which is when the service worker actually takes effect.

### Getting it on your phone for real (no computer needed) — already set up

This version is just static files (HTML/JS/CSS), nothing running on a
server, so it's published automatically to **GitHub Pages** — for free,
with HTTPS, and with no need for the computer to be on afterwards.

There's already a workflow (`.github/workflows/deploy-pwa.yml`) that
builds and publishes `pwa/` whenever something changes in that folder (or
it can be triggered manually from the repository's **Actions** tab with
"Run workflow").

Already configured (public repository + `Settings → Pages → Source:
GitHub Actions`). Every push touching `pwa/` publishes on its own to:

```
https://ptk170623.github.io/project_rc/
```

Once published, open that URL on your phone and use "Add to Home Screen"
(or the **Install app** button that shows up at the top, on Chrome
Android) — from then on the app becomes its own icon, works offline, and
data is saved in your phone's storage.

Prefer another host (Cloudflare Pages, Netlify, Vercel)? It works the same
way: build with `npm run build` inside `pwa/` and publish the `pwa/dist/`
folder — just adjust `VITE_BASE_PATH` in `vite.config.js` if the app isn't
served from the domain root.

Important: since the service worker and "install app" require a secure
connection (HTTPS), opening the app directly via a local IP
(`http://192.168...`) works for using it, but the browser may not offer
the full install experience in that mode — hence the recommendation to
publish to an HTTPS host for real phone use.

### Backing up your data

Since data lives only in that device's browser (clearing the site's data,
uninstalling the app, or switching phones wipes it), the app has
**Export backup** / **Import backup** buttons at the top, which save/
restore everything to a `.json` file. Worth exporting every once in a
while.

If you already installed the app before its default trait/classification
options changed, those defaults won't retroactively update on your
device — code updates apply automatically, but seed data only gets
written once, into an empty store. Open **Edit options list** on either
picker → **Reset to defaults** to replace your current list with the
built-in one (this doesn't touch traits already added to songs, only the
quick-pick list).

## Features

- Add a band → inside the band, add an album → inside the album, add a
  song.
- Bulk-import songs from a `.txt` file (one song per line).
- Each song shows up as a "banner" (a rectangle with rounded ends)
  displaying: the band and album in a small font at the top; the song name
  in a large font below it; and a colored pill with the rating (Meh, Good,
  Great, Amazing, or Legendary — click to choose) on the right.
- Clicking a song expands a panel to manage its "traits":
  - The **+** button opens a quick list of options (editable) or lets you
    type free text. It stays open after each pick, so you can add several
    traits in a row without reopening it.
  - Added traits show up at the top of the banner, side by side.
  - Clicking a trait lets you add a "classification" to it (also free
    text or an editable quick list), shown above the trait, same font
    size, different color.
- The quick-option lists (traits and classifications) have their own
  editor to add, rename, or remove items — plus a **Reset to defaults**
  button to restore the built-in list.
