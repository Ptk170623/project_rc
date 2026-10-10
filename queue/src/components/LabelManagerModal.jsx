import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function LabelManagerModal({ kind, title, onClose, onChanged }) {
  const [labels, setLabels] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const load = () => api.listLabels(kind).then(setLabels);

  useEffect(() => {
    load();
  }, [kind]);

  const addLabel = async (e) => {
    e.preventDefault();
    const text = newLabel.trim();
    if (!text) return;
    await api.createLabel(kind, text);
    setNewLabel("");
    await load();
    await onChanged();
  };

  const saveEdit = async (id) => {
    const text = editingValue.trim();
    if (text) await api.updateLabel(id, text);
    setEditingId(null);
    await load();
    await onChanged();
  };

  const remove = async (id) => {
    const ok = window.confirm(
      "Remove this label? Any album currently tagged with it will just lose that tag."
    );
    if (!ok) return;
    await api.deleteLabel(id);
    await load();
    await onChanged();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-small" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="options-list">
          {labels.map((l) => (
            <li key={l.id} className="options-list-item">
              {editingId === l.id ? (
                <>
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(l.id)}
                  />
                  <button className="btn btn-small" onClick={() => saveEdit(l.id)}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span>{l.label}</span>
                  <div className="options-list-actions">
                    <button
                      className="btn btn-small btn-ghost"
                      onClick={() => {
                        setEditingId(l.id);
                        setEditingValue(l.label);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => remove(l.id)}>
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {labels.length === 0 && <li className="empty-hint">No labels yet.</li>}
        </ul>
        <form className="inline-add-form" onSubmit={addLabel}>
          <input
            placeholder="New label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
