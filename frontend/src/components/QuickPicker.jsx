import { useEffect, useState } from "react";
import { api } from "../api.js";
import OptionsEditor from "./OptionsEditor.jsx";

const EDITOR_TITLE = {
  trait: "Trait options",
  subtrait: "Classification options",
};

export default function QuickPicker({ kind, title, onPick, onClose }) {
  const [options, setOptions] = useState([]);
  const [customValue, setCustomValue] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const load = () => api.listOptions(kind).then(setOptions);

  useEffect(() => {
    load();
  }, [kind]);

  const pick = (label) => {
    onPick(label);
  };

  const submitCustom = (e) => {
    e.preventDefault();
    const trimmed = customValue.trim();
    if (!trimmed) return;
    onPick(trimmed);
    setCustomValue("");
  };

  return (
    <div className="quick-picker">
      <div className="quick-picker-header">
        <span>{title}</span>
        <button className="btn btn-small btn-ghost" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="quick-picker-options">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="chip-option"
            onClick={() => pick(opt.label)}
          >
            {opt.label}
          </button>
        ))}
        {options.length === 0 && (
          <span className="empty-hint">No quick options yet.</span>
        )}
      </div>
      <form className="inline-add-form" onSubmit={submitCustom}>
        <input
          placeholder="Write something new…"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
        />
        <button className="btn btn-primary btn-small" type="submit">
          Add
        </button>
      </form>
      <button
        className="btn btn-ghost btn-small edit-options-link"
        onClick={() => setShowEditor(true)}
      >
        Edit options list
      </button>
      {showEditor && (
        <OptionsEditor
          kind={kind}
          title={EDITOR_TITLE[kind]}
          onClose={() => {
            setShowEditor(false);
            load();
          }}
        />
      )}
    </div>
  );
}
