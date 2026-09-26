import { TIERS_BY_CODE } from "./ratingTiers.js";

// A trait can carry its own rating tier (same codes as the album), which
// wins outright when set; otherwise it just matches the album's tier.
// Neither having a tier of its own means no color at all (neutral outline).
export function tierColorFor(albumRating, traitRating) {
  const code = traitRating || albumRating;
  return code ? TIERS_BY_CODE[code] || null : null;
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
