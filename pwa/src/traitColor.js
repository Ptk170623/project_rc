import { TIERS_BY_CODE } from "./ratingTiers.js";

// A trait can carry its own rating tier (same codes as the song), which
// wins outright when set; otherwise it just matches the song's tier.
// Neither having a tier of its own means no color at all (neutral outline).
export function effectiveTier(songRating, traitRating) {
  const code = traitRating || songRating;
  return code ? TIERS_BY_CODE[code] || null : null;
}

// A trait's own `plus` is independent of where its tier color came from —
// you can highlight a trait while it still just shows the song's own tier,
// no need to also give it a separate tier to do that.
export function tierColorFor(songRating, traitRating, traitPlus) {
  const tier = effectiveTier(songRating, traitRating);
  return tier ? { ...tier, plus: !!traitPlus } : null;
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
