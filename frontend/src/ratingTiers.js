// This app isn't for grading music, just a quick note of how a song (or a
// trait within it) landed while listening — best to worst: Like So Much,
// Like, Meh. `code` is the single-letter value stored on the song/trait;
// `label`/`short`/`color`/`text` only affect how it's displayed. A separate
// "+" toggle covers wanting to say a bit more without turning this back
// into a rating scale.
export const RATING_TIERS = [
  { code: "M", label: "Like So Much", short: "LSM", color: "#ec6f9b", text: "#ffffff" },
  { code: "L", label: "Like", short: "LIKE", color: "#f2a6c4", text: "#14161b" },
  { code: "C", label: "Meh", short: "MEH", color: "#9aa0a6", text: "#14161b" },
];

export const TIERS_BY_CODE = Object.fromEntries(
  RATING_TIERS.map((tier) => [tier.code, tier])
);
