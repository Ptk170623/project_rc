import { useEffect, useRef, useState } from "react";

export default function AddBandTile({ bands, onAdd, datalistId }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    const name = value.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await onAdd(name);
      setValue("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="band-slot add-slot-wrap" ref={wrapRef}>
      <button type="button" className="add-slot" onClick={() => setOpen((v) => !v)}>
        <span className="name">Add</span>
        <div className="avatar add-avatar">+</div>
      </button>
      {open && (
        <form className="add-slot-popover" onSubmit={submit}>
          <input
            autoFocus
            list={datalistId}
            placeholder="Band name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          />
          <datalist id={datalistId}>
            {bands.map((b) => (
              <option key={b.id} value={b.name} />
            ))}
          </datalist>
          <div className="add-slot-actions">
            <button className="btn btn-small btn-primary" type="submit" disabled={busy}>
              Add
            </button>
            <button
              className="btn btn-small btn-ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
