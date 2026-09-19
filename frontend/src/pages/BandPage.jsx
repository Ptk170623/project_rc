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

  if (loading) return <p className="empty-hint">Carregando…</p>;
  if (!band) return <p className="empty-hint">Banda não encontrada.</p>;

  return (
    <div>
      <Link to="/" className="breadcrumb">
        ← Bandas
      </Link>
      <div className="page-header">
        <h1>{band.name}</h1>
        <InlineAddForm
          label="Adicionar álbum"
          placeholder="Nome do álbum"
          onSubmit={async (name) => {
            await api.createAlbum(band.id, name);
            load();
          }}
        />
      </div>

      {band.albums.length === 0 ? (
        <p className="empty-hint">Nenhum álbum cadastrado ainda.</p>
      ) : (
        <ul className="card-list">
          {band.albums.map((album) => (
            <li key={album.id}>
              <Link className="entity-card" to={`/albums/${album.id}`}>
                {album.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
