import { avatarColor, initialsFor } from "../avatarStyle.js";
import AddBandTile from "./AddBandTile.jsx";

const MAX_SLOTS = 6;

export default function RotationDayCard({
  dayKey,
  label,
  hint,
  slots,
  bands,
  onAdd,
  onRemove,
  neverFeatured,
  className,
}) {
  const n = slots.length;

  return (
    <div className={`day-card ${className || ""}`}>
      <h4>
        {label}
        {hint && <span className="hint">{hint}</span>}
      </h4>
      {n === 0 && <p className="empty-note">Nothing picked yet.</p>}
      <div className="band-row">
        {slots.map((slot, i) => {
          const featured = !neverFeatured && (n <= 2 || i === 0);
          const name = slot.band.name;
          return (
            <div key={slot.id} className={`band-slot ${featured ? "featured" : ""}`}>
              <span className="name">{name}</span>
              <div className="avatar" style={{ background: avatarColor(name) }}>
                {initialsFor(name)}
                {featured && <span className="featured-badge">2×</span>}
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => onRemove(slot.id)}
                  aria-label={`Remove ${name}`}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
        {(neverFeatured || n < MAX_SLOTS) && (
          <AddBandTile bands={bands} onAdd={onAdd} datalistId={`known-bands-${dayKey}`} />
        )}
      </div>
    </div>
  );
}
