# Listening Queue

A personal, single-screen PWA for deciding what album to spin next — not a
music journal (see [`../pwa`](../pwa) and [`../frontend`](../frontend) for
that), just one continuously-ranked queue of albums you mean to listen to.

100% offline: React + IndexedDB, no backend, installable on your phone.
Deployed alongside the Music Journal PWA — see the repo root
[README](../README.md) for how both are published to GitHub Pages.

## Running locally

```bash
cd queue
npm install
npm run dev
```

Opens at `http://localhost:5175`.

## What it does

- **One screen, one order**: every registered album in a single list,
  continuously ranked by priority (see below) — not something you set once
  and it stays put. Search by name or band, drag the handle on the left or
  tap **⤒** to give an album a strong manual push, tap **✓** to mark it
  listened.
- **Add album**: name, band (autocomplete from existing bands), a single
  **subgenre** (a label list you manage yourself — e.g. "Doom Metal"), and
  a cover image.
- **Marking an album listened** logs the date and drops its manual-position
  bonus back to the bottom, so its score falls back to just its recency
  (plus whatever importance it still carries) instead of keeping any boost
  it had before.
- **Export / Import**: Export downloads one `.json` file with every album
  (cover images included, as embedded base64) and the label list. Import
  merges it into whatever's already on the device — an existing album
  (matched by band + name) is left alone, everything else is added. This
  is the way to bulk-add albums (hand-write or script the JSON) or move
  your queue to another device.

## The subgenre bar

Every subgenre label you've defined shows up as a chip with a count — how
many albums currently carry that tag. This is **view-only**: tapping a chip
filters the visible list down to that subgenre without touching its order
or anything else, so within the filter you see exactly where that
subgenre's next album(s) sit in the real queue. If you want to actually
pull one forward because you feel like that subgenre right now, filter to
it and tap **⤒** on the one you want — that's a manual, deliberate choice,
not something a quantity dial does for you automatically. Tap the chip
again (or **All**) to clear the filter. The ⚙ button opens the label
manager (add/rename/remove subgenres).

## The ranking formula

Unlike a plain drag-and-drop list, the queue is always live-sorted by a
priority score (`src/priority.js`), recomputed on every read — nothing
about the order is "set and left"; dragging, listening, or changing
importance just changes an input to the score, and the whole list re-ranks
from that.

The score combines: *days since the album was last listened to*
(never-listened albums score as if it's been ~100 years, so they're always
near the top) *plus a bonus from its current manual position* — the thing
drag-and-drop and "move to top" actually set, so a manual push is a strong
vote, not an absolute placement — *plus a bonus from its importance level*
(see below). `POSITION_WEIGHT_DAYS` and `IMPORTANCE_WEIGHT_DAYS` are the
constants to retune if the mix feels off (each reads as "worth N days of
not having listened"); this was always meant to be tuned by feel, so don't
hesitate to change it.

This means every boost — manual position, importance — is additive, not an
override: a long-neglected album (huge real days-since-listened) can still
outrank something you just dragged to the top or just added as "New," if
it's genuinely more overdue than the boost is worth.

## Importance

Every album also carries an **importance** level, picked from the small
badge/dropdown on its card: **New**, **Important**, **Normal**, or **Less**.
It feeds straight into the ranking formula above as a flat bonus (see
`IMPORTANCE_WEIGHT_DAYS` in `src/priority.js`) — **New** gets a head start
worth 20 "virtual days" of not having listened, **Important** gets 10,
**Normal** is neutral, **Less** is a −15 penalty.

This is a *boost*, not a guarantee: it's added on top of the real
days-since-last-listened, not multiplied into it, so a long-neglected
**Important** or **Normal** album can still outrank a **New** one. Example:
album A is **New** and you listened to it 2 days ago (score 2 + 20 = 22);
album B is **Important** and you haven't touched it in 95 days (score
95 + 10 = 105) — B wins, as it should, since it's genuinely overdue. But
against album C, **Normal** and only 10 days since its last listen (score
10 + 0 = 10), A still wins (22 > 10) — the fresh **New** boost is enough to
keep it ahead of something that isn't actually overdue yet.

A newly-added album starts at **New** automatically, and graduates to
**Normal** on its own once you've marked it listened 3 times (tune this via
`IMPORTANCE_GRADUATION_LISTENS` in `src/api.js`) — the idea being it only
needs the "listen to this a lot" push while it's genuinely new. You can
always override the level by hand at any point, on any album, and that
sticks until you change it again.

## Data model (IndexedDB, `src/db.js`)

- `albums` — name, band_name, subgenre_id (nullable FK), image (Blob),
  position (the manual-nudge baseline — not the display order; see "The
  ranking formula"), importance, last_listened_at, listen_history (array
  of ISO dates).
- `subgenre_labels` — kind, label, position. Only `kind: "specific"` is
  ever created now; the old `"generic"` second label list was retired (see
  below) but the field stays schema-flexible in case that ever changes.

Two things from earlier iterations are no longer used but weren't cleaned
out of the schema, since there was nothing to gain by forcing a migration:
`albums.subgenre_generic_id` (the generic-subgenre tag, dropped — a plain
album only carries one subgenre now) and the `segmenters` store (the old
"pin N albums of this subgenre to the front" quantity dial, replaced by
the always-on ranking above plus the view-only filter bar). Older exported
backups may still contain a `subgenre_generic` field per album; it's
ignored on import.
