import { RATING_TIERS } from "./ratingTiers.js";

// A trait's color rides the song's own rating tier: "strong" borrows the
// color of the tier above (this instrument outdid the song's own rating),
// "less" borrows the tier below, and no highlight just matches the song's
// tier. An unrated song has no tier to borrow from, so every trait falls
// back to the neutral default (color: null) until the song is rated.
export function tierColorFor(rating, highlight) {
  if (!rating) return null;
  const idx = RATING_TIERS.findIndex((t) => t.code === rating);
  if (idx === -1) return null;
  let targetIdx = idx;
  if (highlight === "strong") targetIdx = Math.max(0, idx - 1);
  if (highlight === "less") targetIdx = Math.min(RATING_TIERS.length - 1, idx + 1);
  return RATING_TIERS[targetIdx];
}

// A trait's own `performer` wins; otherwise fall back to the album's
// lineup default for that instrument (matched case-insensitively).
export function effectivePerformer(trait, lineup) {
  if (trait.performer) return trait.performer;
  const match = (lineup || []).find(
    (entry) => entry.instrument.trim().toLowerCase() === trait.text.trim().toLowerCase()
  );
  return match ? match.performer : null;
}
