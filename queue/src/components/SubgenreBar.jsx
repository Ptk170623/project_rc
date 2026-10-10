// Replaces the old segmenter chips: no quantity/pin-to-front here anymore,
// just a row of subgenre chips showing how many albums carry each tag.
// Clicking one filters the main list down to that subgenre (view-only —
// it narrows what's shown, it never touches the album order); clicking the
// active one again (or "All") clears the filter.
export default function SubgenreBar({ labels, value, onChange, onManageLabels }) {
  return (
    <div className="subgenre-bar">
      <button
        type="button"
        className={`subgenre-chip ${value == null ? "active" : ""}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {labels.map((l) => (
        <button
          type="button"
          key={l.id}
          className={`subgenre-chip ${value === l.id ? "active" : ""}`}
          onClick={() => onChange(value === l.id ? null : l.id)}
        >
          {l.label}
          <span className="subgenre-chip-count">{l.count}</span>
        </button>
      ))}
      <button
        type="button"
        className="segmenter-manage-btn"
        title="Manage subgenres"
        onClick={onManageLabels}
      >
        ⚙
      </button>
    </div>
  );
}
