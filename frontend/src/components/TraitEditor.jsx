import { useEffect, useRef, useState } from "react";

export default function TraitEditor({ trait, defaultPerformer, onSave, onClose }) {
  const [performer, setPerformer] = useState(trait.performer || defaultPerformer || "");
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [onClose]);

  const savePerformer = (e) => {
    e.preventDefault();
    const trimmed = performer.trim();
    if (trimmed) {
      onSave({ performer: trimmed });
    } else {
      onSave({ clear_performer: true });
    }
  };

  const resetToDefault = () => {
    setPerformer(defaultPerformer || "");
    onSave({ clear_performer: true });
  };

  return (
    <form className="trait-editor" ref={wrapRef} onSubmit={savePerformer}>
      <div className="trait-editor-label">Performer</div>
      <input
        autoFocus
        value={performer}
        placeholder={defaultPerformer || "Who played this"}
        onChange={(e) => setPerformer(e.target.value)}
      />
      {trait.performer && defaultPerformer && (
        <button type="button" className="trait-editor-reset" onClick={resetToDefault}>
          Reset to album default ({defaultPerformer})
        </button>
      )}
      <div className="trait-editor-actions">
        <button type="submit" className="btn btn-small btn-primary">
          Save
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </form>
  );
}
