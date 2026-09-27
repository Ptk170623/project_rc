import { RATING_TIERS } from "../ratingTiers.js";

// A trait's classification, always visible inline (no popup): one short
// button per tier (same set as the song's own rating), each tinted in its
// own color, filled when active. Tapping the active one again clears it
// back to just inheriting the song's own tier. The "+" toggle is
// independent of that choice — it shows as long as there's some tier to
// highlight (the trait's own, or the song's), so a trait can be marked as
// standing out while still just inheriting the song's tier, no need to
// also give it a separate tier of its own.
export default function TraitTierButtons({ highlight, plus, effectiveTier, onChange, onTogglePlus }) {
  return (
    <div className="trait-tier-buttons">
      {RATING_TIERS.map((tier) => {
        const active = highlight === tier.code;
        return (
          <button
            key={tier.code}
            type="button"
            className={`trait-tier-btn ${active ? "active" : ""}`}
            style={
              active
                ? { background: tier.color, borderColor: tier.color, color: tier.text }
                : { borderColor: tier.color, color: tier.color }
            }
            onClick={(e) => {
              e.stopPropagation();
              onChange(active ? null : tier.code);
            }}
          >
            {tier.short}
          </button>
        );
      })}
      {effectiveTier && (
        <button
          type="button"
          className={`trait-tier-btn trait-tier-plus ${plus ? "active" : ""}`}
          style={
            plus
              ? { background: effectiveTier.color, borderColor: effectiveTier.color, color: effectiveTier.text }
              : { borderColor: effectiveTier.color, color: effectiveTier.color }
          }
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlus(!plus);
          }}
        >
          +
        </button>
      )}
    </div>
  );
}
