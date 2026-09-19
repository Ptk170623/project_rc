import { useEffect, useState } from "react";
import { api } from "../api.js";
import { DEFAULTS_BY_KIND } from "../defaultOptions.js";

export default function OptionsEditor({ kind, title, onClose }) {
  const [options, setOptions] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [resetting, setResetting] = useState(false);

  const load = () => api.listOptions(kind).then(setOptions);

  useEffect(() => {
    load();
  }, [kind]);

  const addOption = async (e) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    await api.createOption(kind, label);
    setNewLabel("");
    load();
  };

  const saveEdit = async (id) => {
    const label = editingValue.trim();
    if (label) {
      await api.updateOption(id, label);
    }
    setEditingId(null);
    load();
  };

  const remove = async (id) => {
    await api.deleteOption(id);
    load();
  };

  const resetToDefaults = async () => {
    const ok = window.confirm(
      "Reset this list to the built-in defaults? Options you added or edited here will be removed. Traits already added to songs are not affected."
    );
    if (!ok) return;
    setResetting(true);
    try {
      for (const opt of options) await api.deleteOption(opt.id);
      for (const label of DEFAULTS_BY_KIND[kind] || []) {
        await api.createOption(kind, label);
      }
      await load();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="options-list">
          {options.map((opt) => (
            <li key={opt.id} className="options-list-item">
              {editingId === opt.id ? (
                <>
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(opt.id)}
                  />
                  <button className="btn btn-small" onClick={() => saveEdit(opt.id)}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span>{opt.label}</span>
                  <div className="options-list-actions">
                    <button
                      className="btn btn-small btn-ghost"
                      onClick={() => {
                        setEditingId(opt.id);
                        setEditingValue(opt.label);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => remove(opt.id)}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {options.length === 0 && <li className="empty-hint">No options yet.</li>}
        </ul>
        <form className="inline-add-form" onSubmit={addOption}>
          <input
            placeholder="New option"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
        <button
          className="btn btn-ghost btn-small reset-defaults-link"
          onClick={resetToDefaults}
          disabled={resetting}
        >
          {resetting ? "Resetting…" : "Reset to defaults"}
        </button>
      </div>
    </div>
  );
}
