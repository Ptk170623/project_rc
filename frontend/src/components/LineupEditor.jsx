import { useState } from "react";
import { api } from "../api.js";

export default function LineupEditor({ album, onClose, onChanged }) {
  const [instrument, setInstrument] = useState("");
  const [performer, setPerformer] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const add = async (e) => {
    e.preventDefault();
    const inst = instrument.trim();
    const perf = performer.trim();
    if (!inst || !perf) return;
    await api.addLineupEntry(album.id, inst, perf);
    setInstrument("");
    setPerformer("");
    onChanged();
  };

  const saveEdit = async (id) => {
    const label = editingValue.trim();
    if (label) {
      await api.updateLineupEntry(id, { performer: label });
    }
    setEditingId(null);
    onChanged();
  };

  const remove = async (id) => {
    await api.deleteLineupEntry(id);
    onChanged();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{album.name} — Lineup</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="lineup-tag">Default performer per instrument for this album</p>
        <ul className="lineup-list">
          {album.lineup.map((entry) => (
            <li key={entry.id} className="lineup-row">
              <span className="lineup-instrument">{entry.instrument}</span>
              {editingId === entry.id ? (
                <>
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(entry.id)}
                  />
                  <button className="btn btn-small" onClick={() => saveEdit(entry.id)}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="lineup-performer"
                    onClick={() => {
                      setEditingId(entry.id);
                      setEditingValue(entry.performer);
                    }}
                  >
                    {entry.performer}
                  </span>
                  <button
                    type="button"
                    className="lineup-remove"
                    onClick={() => remove(entry.id)}
                    aria-label={`Remove ${entry.instrument}`}
                  >
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
          {album.lineup.length === 0 && (
            <li className="empty-hint">No instruments defined yet.</li>
          )}
        </ul>
        <form className="inline-add-form" onSubmit={add}>
          <input
            placeholder="Instrument"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          />
          <input
            placeholder="Performer"
            value={performer}
            onChange={(e) => setPerformer(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
