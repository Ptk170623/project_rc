import { useEffect, useRef, useState } from "react";
import { RATING_TIERS, TIERS_BY_CODE } from "../ratingTiers.js";

export default function RatingBadge({ rating, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current = rating ? TIERS_BY_CODE[rating] : null;

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open]);

  return (
    <div className="rating-badge-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`rating-pill-badge ${current ? "" : "unrated"}`}
        style={current ? { background: current.color, color: current.text } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {current ? current.label : "Rate"}
      </button>
      {open && (
        <div className="rating-picker">
          {RATING_TIERS.map((tier) => (
            <button
              key={tier.code}
              type="button"
              className={`rating-option ${rating === tier.code ? "active" : ""}`}
              style={{ background: tier.color, color: tier.text }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(tier.code === rating ? null : tier.code);
                setOpen(false);
              }}
            >
              {tier.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
