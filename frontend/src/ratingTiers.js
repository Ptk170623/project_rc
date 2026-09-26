// Ordered from best to worst. `code` is the single-letter value stored on
// the song/trait; `label`/`short`/`color`/`text` only affect how it's
// displayed. Amazing is the top tier on purpose — Legendary/Extraordinary
// were dropped as too fussy to tell apart; a song (or trait) that's the
// strong end of its own tier can still stand out via a separate "+" toggle
// instead of a whole tier above it.
//
// "Like So Much" and "Like" sit below Meh on purpose: they're not a lower
// quality judgment, they're a placeholder first impression for a song you
// haven't listened to enough times yet to give a real rating.
export const RATING_TIERS = [
  { code: "A", label: "Amazing", short: "AMA", color: "#9333ea", text: "#ffffff" },
  { code: "G", label: "Great", short: "GRE", color: "#6366f1", text: "#ffffff" },
  { code: "B", label: "Good", short: "GOO", color: "#4a90d9", text: "#ffffff" },
  { code: "C", label: "Meh", short: "MEH", color: "#9aa0a6", text: "#14161b" },
  { code: "M", label: "Like So Much", short: "LSM", color: "#ec6f9b", text: "#ffffff" },
  { code: "L", label: "Like", short: "LIKE", color: "#f2a6c4", text: "#14161b" },
];

export const TIERS_BY_CODE = Object.fromEntries(
  RATING_TIERS.map((tier) => [tier.code, tier])
);
