# Music Journal

A personal app for actively listening to and keeping track of music,
organized into sections:

- **Ratings** — bands → albums → songs, with a rating (Like / Like So Much
  / Meh / Good / Great / Amazing / Legendary) and "traits" (quick notes,
  e.g. instruments) that can each be marked Strong/Less and tagged with
  who performed it, with a per-album default lineup you can override per
  song.
- **Weekly Rotation** — up to 6 bands per weekday whose discography you're
  currently working through, plus an Others catch-all for anything not
  tied to a specific day.

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
restore *everything* to a `.json` file — note that **Import backup**
replaces all data currently on that device, it doesn't merge. Worth
exporting every once in a while.

To move just one band or album instead — to another device, or to share
with someone else — use **Export band** / **Export album** and the
matching **Import** buttons on the band/album pages (see **Ratings**
below). Unlike the full backup, these merge into whatever's already
there instead of replacing it.

If you already installed the app before its default trait options
changed, those defaults won't retroactively update on your device — code
updates apply automatically, but seed data only gets written once, into
an empty store. Open **Edit options list** on the trait picker → **Reset
to defaults** to replace your current list with the built-in one (this
doesn't touch traits already added to songs, only the quick-pick list).

## Features

### Sections

The home screen is a picker between the two sections below.

### Ratings

- Add a band → inside the band, add an album → inside the album, add a
  song. Bands, albums, and songs can each be deleted (cascades to
  whatever they contain).
- Each song shows up as a "banner" (a rectangle with rounded ends)
  displaying: the band and album in a small font at the top; the song name
  in a large font below it; and a colored pill with the rating (click to
  choose) on the right. From best to worst: Legendary, Amazing, Great,
  Good, Meh — and below those, **Like**/**Like So Much**, which aren't a
  lower quality judgment, they're for a song you haven't listened to
  enough times yet to give a real rating, just a first impression.
- Clicking a song expands a panel to manage its "traits" (instruments or
  other things worth noting about that song):
  - The **+** button opens a quick list of options (editable) or lets you
    type free text. It stays open after each pick, so you can add several
    traits in a row without reopening it.
  - Added traits show up at the top of the banner as pill-shaped outlines,
    tinted with the song's own rating color.
  - Clicking a trait opens an editor where you can:
    - Mark it **Strong** or **Less** — the outline (and a soft glow behind
      it) shifts to the color of the rating tier just above or below the
      song's own, so a "strong" trait on a Great song glows Amazing-purple
      and a "less" one glows Good-blue. Toggling it off returns to the
      song's own tier color.
    - Set who played/performed it. If the album has a **Lineup** (see
      below) with a matching instrument, that name shows automatically;
      typing a name here overrides it just for this song, and **Reset to
      album default** clears the override.
- **Lineup** (button on the album page) lets you define the default
  performer for each instrument across the whole album (e.g. "Guitar →
  Jonny Greenwood") — add, rename, or remove entries. Any song's trait
  matching that instrument name shows this performer unless overridden.
- **Import (.txt/.json)** on the album page bulk-adds songs. A `.txt` file
  is the simplest form (just one song name per line), optionally with
  `Band:`/`Album:`/`Lineup:` sections and per-song performer overrides —
  see **Download template** for the exact syntax. A `.json` file is an
  album exported from this app or another device (see below).
- The quick trait-option list has its own editor to add, rename, or
  remove items — plus a **Reset to defaults** button to restore the
  built-in list.
- **Export band** / **Export album** (band page / album page) download a
  `.json` snapshot of just that band or album. **Import band (.json)** on
  the band page, or the same `.json` file dropped onto **Import
  (.txt/.json)** on the album page, merges it back in: an existing
  band/album with the same name is reused rather than duplicated, songs
  already present (matched by name) are left untouched, and lineup entries
  are updated in place. This is the way to move a single band or album
  between devices, or hand one off to someone else, without touching
  anything else already on the target device.

### Weekly Rotation

- Monday through Saturday, each with up to 6 band slots: tap the dashed
  **+** tile to add one (typing an existing band's name reuses it, a new
  name creates it — shared with the Ratings section's band list), tap the
  **×** on a tile to remove it.
- The first slot is the featured pick for that day, shown with a bright
  ring and a "2×" badge, meaning it's the discography getting roughly
  double the listens that month. With only 1–2 bands in a day, there's no
  "background" pick to contrast against, so all of them are featured.
- **Others**, at the bottom, is the same kind of list but not tied to a
  day and never features anyone — for anything else you're sampling.
