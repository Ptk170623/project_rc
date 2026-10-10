import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SegmenterChip({ segmenter, onQuantityChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: segmenter.label_id,
  });
  const active = segmenter.quantity > 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`segmenter-chip ${active ? "active" : ""}`}>
      <span className="segmenter-chip-label" {...attributes} {...listeners}>
        {segmenter.label}
      </span>
      <span className="segmenter-chip-qty">
        <button
          type="button"
          onClick={() => onQuantityChange(segmenter.label_id, Math.max(0, segmenter.quantity - 1))}
        >
          −
        </button>
        <span className="segmenter-chip-qty-value">{segmenter.quantity}</span>
        <button
          type="button"
          onClick={() =>
            // First activation jumps straight to 2 (the usual "a couple of
            // albums today" starting point) rather than 1.
            onQuantityChange(segmenter.label_id, segmenter.quantity === 0 ? 2 : segmenter.quantity + 1)
          }
        >
          +
        </button>
      </span>
    </div>
  );
}
