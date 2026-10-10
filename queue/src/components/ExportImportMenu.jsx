import { useRef, useState } from "react";
import { api } from "../api.js";

export default function ExportImportMenu({ onImported }) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    const data = await api.exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `listening-queue-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await api.importAll(data);
      await onImported();
      window.alert(`Imported ${result.created} album(s); ${result.skipped} already existed.`);
    } catch (err) {
      window.alert("Couldn't import the file: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="top-bar-actions">
      <button className="btn btn-small btn-ghost" onClick={exportData} disabled={busy}>
        Export
      </button>
      <button
        className="btn btn-small btn-ghost"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
      >
        {busy ? "Importing…" : "Import"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={importData}
      />
    </div>
  );
}
