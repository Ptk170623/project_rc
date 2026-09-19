import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function OptionsEditor({ kind, title, onClose }) {
  const [options, setOptions] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            Fechar
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
                    Salvar
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
                      Editar
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => remove(opt.id)}
                    >
                      Remover
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {options.length === 0 && <li className="empty-hint">Nenhuma opção ainda.</li>}
        </ul>
        <form className="inline-add-form" onSubmit={addOption}>
          <input
            placeholder="Nova opção"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
