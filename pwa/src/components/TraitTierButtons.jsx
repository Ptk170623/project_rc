import { TIERS_BY_CODE } from "../ratingTiers.js";

// A trait's classification, always visible inline (no popup): five short
// buttons, each tinted in its own tier's color, filled when active. Tapping
// the active one again clears it back to just the album's own tier.
const TRAIT_TIER_CODES = ["S", "A", "G", "B", "C"];

export default function TraitTierButtons({ highlight, onChange }) {
  return (
    <div className="trait-tier-buttons">
      {TRAIT_TIER_CODES.map((code) => {
        const tier = TIERS_BY_CODE[code];
        const active = highlight === code;
        return (
          <button
            key={code}
            type="button"
            className={`trait-tier-btn ${active ? "active" : ""}`}
            style={
              active
                ? { background: tier.color, borderColor: tier.color, color: tier.text }
                : { borderColor: tier.color, color: tier.color }
            }
            onClick={(e) => {
              e.stopPropagation();
              onChange(active ? null : code);
            }}
          >
            {tier.label.slice(0, 3).toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
