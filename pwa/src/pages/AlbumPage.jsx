import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import InlineAddForm from "../components/InlineAddForm.jsx";
import SongCard from "../components/SongCard.jsx";
import LineupEditor from "../components/LineupEditor.jsx";
import RatingBadge from "../components/RatingBadge.jsx";
import { downloadImportTemplate } from "../importTemplate.js";
import { downloadJSON, safeFileSlug } from "../downloadFile.js";

export default function AlbumPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showLineup, setShowLineup] = useState(false);
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
      const result = file.name.toLowerCase().endsWith(".json")
        ? await api.importData(file)
        : await api.importSongs(file, Number(albumId));
      if (result.album_id == null) {
        navigate(`/bands/${result.band_id}`);
      } else if (String(result.album_id) !== albumId) {
        navigate(`/albums/${result.album_id}`);
      } else {
        load();
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const exportAlbum = async () => {
    const data = await api.exportAlbum(album.id);
    downloadJSON(`album-${safeFileSlug(album.band_name)}-${safeFileSlug(album.name)}.json`, data);
  };

  const changeAlbumRating = async (rating) => {
    await api.updateAlbum(albumId, rating ? { rating } : { clear_rating: true });
    load();
  };

  if (loading) return <p className="empty-hint">Loading…</p>;
  if (!album) return <p className="empty-hint">Album not found.</p>;

  return (
    <div>
      <Link to={`/bands/${album.band_id}`} className="breadcrumb">
        ← {album.band_name}
      </Link>
      <div className="page-header">
        <div className="page-header-title">
          <h1>{album.name}</h1>
          <RatingBadge rating={album.rating} onChange={changeAlbumRating} />
        </div>
        <div className="page-header-actions">
          <InlineAddForm
            label="Add song"
            placeholder="Song name"
            onSubmit={async (name) => {
              await api.createSong(albumId, name);
              load();
            }}
          />
          <button className="btn btn-secondary" onClick={() => setShowLineup(true)}>
            Lineup
          </button>
          <button className="btn btn-secondary" onClick={exportAlbum}>
            Export album
          </button>
          <button
            className="btn btn-secondary"
            disabled={bulkBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {bulkBusy ? "Importing…" : "Import (.txt/.json)"}
          </button>
          <button className="btn btn-ghost" onClick={downloadImportTemplate}>
            Download template
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json"
            hidden
            onChange={handleBulkFile}
          />
        </div>
      </div>

      {album.songs.length === 0 ? (
        <p className="empty-hint">No songs added yet.</p>
      ) : (
        <div className="song-list">
          {album.songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              bandName={album.band_name}
              albumName={album.name}
              albumRating={album.rating}
              lineup={album.lineup}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {showLineup && (
        <LineupEditor
          album={album}
          onClose={() => setShowLineup(false)}
          onChanged={load}
        />
      )}
    </div>
  );
}
