// A view-only filter: narrows which albums are shown, same as the search
// box, but by subgenre tag instead of text. Doesn't touch segmenters,
// quantities, or the album order — purely for browsing.
export default function SubgenreFilter({ specificLabels, genericLabels, value, onChange }) {
  return (
    <select
      className="subgenre-filter"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? e.target.value : null)}
      aria-label="Filter by subgenre"
    >
      <option value="">All subgenres</option>
      {specificLabels.length > 0 && (
        <optgroup label="Subgenre">
          {specificLabels.map((l) => (
            <option key={`specific-${l.id}`} value={`specific-${l.id}`}>
              {l.label}
            </option>
          ))}
        </optgroup>
      )}
      {genericLabels.length > 0 && (
        <optgroup label="Generic subgenre">
          {genericLabels.map((l) => (
            <option key={`generic-${l.id}`} value={`generic-${l.id}`}>
              {l.label}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
