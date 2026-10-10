// How a subgenre segmenter picks which albums to pin to the front of the
// list: within the albums matching that segmenter's tag, rank by a score
// combining (a) how long it's been since the album was last listened to —
// an album you've never listened to ranks like it's been NEVER_LISTENED_DAYS
// since, so it's always near the top — (b) a bonus from the album's current
// manual position in the list (the drag-and-drop order), so something
// you've already nudged toward the front carries that forward into the
// subgenre ranking too, instead of only recency mattering — and (c) a bonus
// from the album's own importance level, a direct "listen to this more/less
// often" dial independent of recency or manual position.
//
// POSITION_WEIGHT_DAYS and IMPORTANCE_WEIGHT_DAYS are the constants to
// retune if the balance doesn't feel right — both read as "worth N days of
// not having listened." Position: raise it to let manual ordering dominate
// more; lower it (towards 0) to let recency dominate instead. Importance is
// a BOOST, not an override: "novo" gives a new album a meaningful head
// start (worth NOVO_WEIGHT days of "virtual" waiting) so it comfortably
// beats anything with a similar or shorter real gap, but a "normal" or
// "importante" album that's genuinely been neglected for longer than that
// still wins on raw days-since-listened — the boost gets added to, not
// multiplied into, the real wait. "menos" is negative, so it still surfaces
// eventually but only once everything else in its subgenre has had a turn.
export const NEVER_LISTENED_DAYS = 36500; // ~100 years: always ranks first
export const POSITION_WEIGHT_DAYS = 1;

export const IMPORTANCE_LEVELS = ["novo", "importante", "normal", "menos"];
export const DEFAULT_IMPORTANCE = "novo";

export const IMPORTANCE_WEIGHT_DAYS = {
  novo: 40,
  importante: 10,
  normal: 0,
  menos: -15,
};

export function daysSince(isoDate, now = new Date()) {
  if (!isoDate) return NEVER_LISTENED_DAYS;
  const then = new Date(isoDate);
  const ms = now.getTime() - then.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

// `index` is the album's position in the current base (manual) order;
// `total` is how many albums are in that order.
export function positionBonus(index, total) {
  return Math.max(0, total - 1 - index) * POSITION_WEIGHT_DAYS;
}

export function importanceBonus(importance) {
  return IMPORTANCE_WEIGHT_DAYS[importance] ?? IMPORTANCE_WEIGHT_DAYS.normal;
}

// Never-listened albums all tie on daysSince (NEVER_LISTENED_DAYS), so the
// position bonus — which can swing by the size of the whole list — would
// swamp the much smaller importance gaps and become the real tiebreaker
// instead of importance. So it only counts once there's an actual listen
// to measure it against; among never-listened albums, importance alone
// decides, and manual position still breaks ties within the same level.
export function priorityScore(album, index, total, now = new Date()) {
  return (
    daysSince(album.last_listened_at, now) +
    (album.last_listened_at ? positionBonus(index, total) : 0) +
    importanceBonus(album.importance)
  );
}
