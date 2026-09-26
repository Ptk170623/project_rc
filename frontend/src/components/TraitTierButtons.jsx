import { RATING_TIERS, TIERS_BY_CODE } from "../ratingTiers.js";

// A trait's classification, always visible inline (no popup): one short
// button per tier (same set as the song's own rating), each tinted in its
// own color, filled when active. Tapping the active one again clears it
// back to just inheriting the song's own tier. A separate "+" toggle only
// shows once the trait has its own tier, mirroring the song's own boost.
export default function TraitTierButtons({ highlight, plus, onChange, onTogglePlus }) {
  const activeTier = highlight ? TIERS_BY_CODE[highlight] : null;

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
      {activeTier && (
        <button
          type="button"
          className={`trait-tier-btn trait-tier-plus ${plus ? "active" : ""}`}
          style={
            plus
              ? { background: activeTier.color, borderColor: activeTier.color, color: activeTier.text }
              : { borderColor: activeTier.color, color: activeTier.color }
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
