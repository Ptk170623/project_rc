export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search albums or bands…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
