# Listening Queue

A personal, single-screen PWA for deciding what album to spin next — not a
music journal (see [`../pwa`](../pwa) and [`../frontend`](../frontend) for
that), just a queue of albums you mean to listen to, with a light-touch way
of nudging a few subgenres to the front when you feel like it.

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

- **One screen**: every registered album in one list. Search by name or
  band, drag the handle on the left to reorder by hand, tap **⤒** to send
  an album straight to the top, tap **✓** to mark it listened.
- **Add album**: name, band (autocomplete from existing bands), a
  **subgenre** and a **generic subgenre** (two separate label lists you
  manage yourself — e.g. subgenre "Doom Metal", generic "Heavy Metal"),
  and a cover image.
- **Marking an album listened** logs the date, sends it to the back of the
  list, and — if it matches a subgenre you've currently got an active
  "today" quantity on (see below) — drains one from that quantity.
- **Export / Import**: Export downloads one `.json` file with every album
  (cover images included, as embedded base64) and both label lists.
  Import merges it into whatever's already on the device — an existing
  album (matched by band + name) is left alone, everything else is added.
  This is the way to bulk-add albums (hand-write or script the JSON) or
  move your queue to another device.

## The segmenter rows ("subgenres of the day")

At the top, every subgenre label you've defined shows up as a chip with a
**−** / **+** stepper (first tap jumps to 2, the usual "a couple of these
today" starting point). Give a subgenre a quantity and the list reorders
immediately: it pulls that many albums tagged with that subgenre to the
very front, ranked by whatever's been waiting longest / matters most (see
below). Listening to one of them drains the quantity by one; it goes back
to the end of the chip row once it hits 0. The quantity doesn't reset on
its own — it just sits there as a running "balance" until you spend it or
change it. Chips are themselves drag-reorderable, and a newly-activated
chip queues up after whatever's already active, in the order you activated
them (specific-subgenre chips are always resolved before generic ones when
both have an active quantity, to keep the two independent and easy to
reason about).

**The ranking formula** (in `src/priority.js`) scores each candidate album
by *days since it was last listened to* (never-listened albums score as if
it's been ~100 years, so they're always near the top of their subgenre)
*plus a bonus from its current position* in the manually-arranged list —
being near the top of your own hand-arranged order carries weight into the
subgenre ranking too, not just recency. `POSITION_WEIGHT_DAYS` in that file
is the one constant to retune if the mix feels off (it reads as "being N
slots higher is worth N days of not having listened"); this was the part
of the spec that was explicitly a judgment call, so don't hesitate to
change it.

## Data model (IndexedDB, `src/db.js`)

- `albums` — name, band_name, subgenre_id / subgenre_generic_id (nullable
  FKs), image (Blob), position (the manually-arranged order), last_listened_at,
  listen_history (array of ISO dates).
- `subgenre_labels` — kind (`specific` | `generic`), label, position.
- `segmenters` — one row per label that's ever been activated: label_id,
  kind, quantity, order_rank (when it was last activated, within its kind).
