import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import InlineAddForm from "../components/InlineAddForm.jsx";
import SongCard from "../components/SongCard.jsx";

export default function AlbumPage() {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);
  const fileInputRef = useRef(null);

  const load = () =>
    api.getAlbum(albumId).then(setAlbum).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [albumId]);

  const handleBulkFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBulkBusy(true);
    try {
      await api.bulkCreateSongs(albumId, file);
      load();
    } finally {
      setBulkBusy(false);
    }
  };

  if (loading) return <p className="empty-hint">Carregando…</p>;
  if (!album) return <p className="empty-hint">Álbum não encontrado.</p>;

  return (
    <div>
      <Link to={`/bands/${album.band_id}`} className="breadcrumb">
        ← {album.band_name}
      </Link>
      <div className="page-header">
        <h1>{album.name}</h1>
        <div className="page-header-actions">
          <InlineAddForm
            label="Adicionar música"
            placeholder="Nome da música"
            onSubmit={async (name) => {
              await api.createSong(albumId, name);
              load();
            }}
          />
          <button
            className="btn btn-secondary"
            disabled={bulkBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {bulkBusy ? "Importando…" : "Importar lista (.txt)"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            hidden
            onChange={handleBulkFile}
          />
        </div>
      </div>

      {album.songs.length === 0 ? (
        <p className="empty-hint">Nenhuma música cadastrada ainda.</p>
      ) : (
        <div className="song-list">
          {album.songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              bandName={album.band_name}
              albumName={album.name}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
