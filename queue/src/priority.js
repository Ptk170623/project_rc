// How a subgenre segmenter picks which albums to pin to the front of the
// list: within the albums matching that segmenter's tag, rank by a score
// combining (a) how long it's been since the album was last listened to —
// an album you've never listened to ranks like it's been NEVER_LISTENED_DAYS
// since, so it's always near the top — and (b) a bonus from the album's
// current manual position in the list (the drag-and-drop order), so
// something you've already nudged toward the front carries that forward
// into the subgenre ranking too, instead of only recency mattering.
//
// POSITION_WEIGHT_DAYS is the one constant to retune if this doesn't feel
// right: it says "being N slots higher in the manual order is worth N days
// of not having listened." Raise it to let manual ordering dominate more;
// lower it (towards 0) to let recency dominate instead.
export const NEVER_LISTENED_DAYS = 36500; // ~100 years: always ranks first
export const POSITION_WEIGHT_DAYS = 1;

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

export function priorityScore(album, index, total, now = new Date()) {
  return daysSince(album.last_listened_at, now) + positionBonus(index, total);
}
