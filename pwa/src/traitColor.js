import { TIERS_BY_CODE } from "./ratingTiers.js";

// A trait can carry its own rating tier (same codes as the song), which
// wins outright when set — its own `plus` then applies, independent of the
// song's. Otherwise the trait just matches the song's tier *and* its plus,
// as a unit. Neither having a tier of its own means no color at all
// (neutral outline).
export function tierColorFor(songRating, songPlus, traitRating, traitPlus) {
  const code = traitRating || songRating;
  if (!code) return null;
  const tier = TIERS_BY_CODE[code];
  if (!tier) return null;
  const plus = traitRating ? traitPlus : songPlus;
  return { ...tier, plus };
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
