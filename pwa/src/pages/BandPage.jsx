import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import InlineAddForm from "../components/InlineAddForm.jsx";

export default function BandPage() {
  const { bandId } = useParams();
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="empty-hint">Loading…</p>;
  if (!band) return <p className="empty-hint">Band not found.</p>;

  return (
    <div>
      <Link to="/ratings" className="breadcrumb">
        ← Bands
      </Link>
      <div className="page-header">
        <h1>{band.name}</h1>
        <InlineAddForm
          label="Add album"
          placeholder="Album name"
          onSubmit={async (name) => {
            await api.createAlbum(band.id, name);
            load();
          }}
        />
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
