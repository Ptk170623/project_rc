const RATINGS = ["S", "A", "B", "C"];

export default function RatingBadge({ rating, onChange }) {
  return (
    <div className="rating-badge-wrap">
      <div className={`rating-badge rating-${rating || "none"}`}>
        {rating || "?"}
      </div>
      <div className="rating-picker">
        {RATINGS.map((r) => (
          <button
            key={r}
            type="button"
            className={`rating-option rating-${r} ${rating === r ? "active" : ""}`}
            onClick={() => onChange(r === rating ? null : r)}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
