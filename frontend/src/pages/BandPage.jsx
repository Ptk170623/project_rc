import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import InlineAddForm from "../components/InlineAddForm.jsx";
import { downloadJSON, safeFileSlug } from "../downloadFile.js";

export default function BandPage() {
  const { bandId } = useParams();
  const navigate = useNavigate();
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = useRef(null);

  const load = () =>
    api.getBand(bandId).then(setBand).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [bandId]);

  const removeAlbum = async (e, id, name) => {
    e.preventDefault();
    if (!window.confirm(`Delete "${name}"? This also deletes its songs and ratings.`)) {
      return;
    }
    await api.deleteAlbum(id);
    load();
  };

  const exportBand = async () => {
    const data = await api.exportBand(band.id);
    downloadJSON(`band-${safeFileSlug(band.name)}.json`, data);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportBusy(true);
    try {
      const result = await api.importData(file);
      if (String(result.band_id) !== bandId) {
        navigate(`/bands/${result.band_id}`);
      } else {
        load();
      }
    } finally {
      setImportBusy(false);
    }
  };

  if (loading) return <p className="empty-hint">Loading…</p>;
  if (!band) return <p className="empty-hint">Band not found.</p>;

  return (
    <div>
      <Link to="/ratings" className="breadcrumb">
        ← Bands
      </Link>
      <div className="page-header">
        <h1>{band.name}</h1>
        <div className="page-header-actions">
          <InlineAddForm
            label="Add album"
            placeholder="Album name"
            onSubmit={async (name) => {
              await api.createAlbum(band.id, name);
              load();
            }}
          />
          <button className="btn btn-secondary" onClick={exportBand}>
            Export band
          </button>
          <button
            className="btn btn-secondary"
            disabled={importBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {importBusy ? "Importing…" : "Import band (.json)"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            hidden
            onChange={handleImportFile}
          />
        </div>
      </div>

      {band.albums.length === 0 ? (
        <p className="empty-hint">No albums added yet.</p>
      ) : (
        <ul className="card-list">
          {band.albums.map((album) => (
            <li key={album.id}>
              <Link className="entity-card" to={`/albums/${album.id}`}>
                {album.name}
              </Link>
              <button
                type="button"
                className="btn btn-small btn-danger entity-delete"
                onClick={(e) => removeAlbum(e, album.id, album.name)}
                aria-label={`Delete ${album.name}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
