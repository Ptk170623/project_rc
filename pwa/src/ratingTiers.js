// Ordered from best to worst. `code` is the single-letter value stored on
// the song; `label`/`color`/`text` only affect how it's displayed.
//
// "Like So Much" and "Like" sit below Meh on purpose: they're not a lower
// quality judgment, they're a placeholder first impression for a song you
// haven't listened to enough times yet to give a real rating.
export const RATING_TIERS = [
  { code: "S", label: "Legendary", color: "#f2b705", text: "#14161b" },
  { code: "E", label: "Extraordinary", color: "#d946ef", text: "#ffffff" },
  { code: "A", label: "Amazing", color: "#9333ea", text: "#ffffff" },
  { code: "G", label: "Great", color: "#6366f1", text: "#ffffff" },
  { code: "B", label: "Good", color: "#4a90d9", text: "#ffffff" },
  { code: "C", label: "Meh", color: "#9aa0a6", text: "#14161b" },
  { code: "M", label: "Like So Much", color: "#ec6f9b", text: "#ffffff" },
  { code: "L", label: "Like", color: "#f2a6c4", text: "#14161b" },
];

export const TIERS_BY_CODE = Object.fromEntries(
  RATING_TIERS.map((tier) => [tier.code, tier])
);
