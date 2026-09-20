// Ordered from best to worst. `code` is the single-letter value stored on
// the song; `label`/`color`/`text` only affect how it's displayed.
export const RATING_TIERS = [
  { code: "S", label: "Legendary", color: "#f2b705", text: "#14161b" },
  { code: "A", label: "Amazing", color: "#9333ea", text: "#ffffff" },
  { code: "G", label: "Great", color: "#6366f1", text: "#ffffff" },
  { code: "B", label: "Good", color: "#4a90d9", text: "#ffffff" },
  { code: "C", label: "Meh", color: "#9aa0a6", text: "#14161b" },
];

export const TIERS_BY_CODE = Object.fromEntries(
  RATING_TIERS.map((tier) => [tier.code, tier])
);
