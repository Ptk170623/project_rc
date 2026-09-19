import { useState } from "react";

export default function InlineAddForm({ label, placeholder, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + {label}
      </button>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onSubmit(trimmed);
      setValue("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="inline-add-form" onSubmit={submit}>
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <button className="btn btn-primary" type="submit" disabled={busy}>
        Adicionar
      </button>
      <button
        className="btn btn-ghost"
        type="button"
        onClick={() => {
          setOpen(false);
          setValue("");
        }}
      >
        Cancelar
      </button>
    </form>
  );
}
