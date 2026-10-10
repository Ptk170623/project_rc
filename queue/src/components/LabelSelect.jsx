import { useState } from "react";
import { api } from "../api.js";

const NEW_VALUE = "__new__";

export default function LabelSelect({ id, kind, label, labels, value, onChange, onLabelsChanged }) {
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const handleSelect = (e) => {
    const v = e.target.value;
    if (v === NEW_VALUE) {
      setCreating(true);
      return;
    }
    onChange(v ? Number(v) : null);
  };

  const confirmCreate = async (e) => {
    e.preventDefault();
    const text = newLabel.trim();
    if (!text) return;
    const record = await api.createLabel(kind, text);
    setNewLabel("");
    setCreating(false);
    await onLabelsChanged();
    onChange(record.id);
  };

  if (creating) {
    return (
      <form className="inline-add-form" onSubmit={confirmCreate}>
        <input
          autoFocus
          placeholder={`New ${label.toLowerCase()}`}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button type="submit" className="btn btn-small btn-primary">
          Add
        </button>
        <button
          type="button"
          className="btn btn-small btn-ghost"
          onClick={() => setCreating(false)}
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <select id={id} value={value ?? ""} onChange={handleSelect}>
      <option value="">None</option>
      {labels.map((l) => (
        <option key={l.id} value={l.id}>
          {l.label}
        </option>
      ))}
      <option value={NEW_VALUE}>+ New {label.toLowerCase()}…</option>
    </select>
  );
}
