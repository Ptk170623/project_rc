import { useEffect, useRef, useState } from "react";

const RATINGS = ["S", "A", "B", "C"];

export default function RatingBadge({ rating, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

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
        className={`rating-badge rating-${rating || "none"}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {rating || "?"}
      </button>
      {open && (
        <div className="rating-picker">
          {RATINGS.map((r) => (
            <button
              key={r}
              type="button"
              className={`rating-option rating-${r} ${rating === r ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(r === rating ? null : r);
                setOpen(false);
              }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
