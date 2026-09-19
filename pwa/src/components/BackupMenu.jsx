import { useRef, useState } from "react";
import { api } from "../api.js";

export default function BackupMenu() {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    const data = await api.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `diario-musical-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ok = window.confirm(
      "Importar este arquivo vai substituir todos os dados salvos neste dispositivo. Continuar?"
    );
    if (!ok) return;

    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.importAll(data);
      window.location.href = "/";
    } catch (err) {
      window.alert("Não foi possível importar o arquivo: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="backup-menu">
      <button className="btn btn-small btn-ghost" onClick={exportData} disabled={busy}>
        Exportar backup
      </button>
      <button
        className="btn btn-small btn-ghost"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
      >
        {busy ? "Importando…" : "Importar backup"}
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
