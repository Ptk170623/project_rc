import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import SongCard from "../components/SongCard.jsx";

export default function AllSongsPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);

  const load = () =>
    api.listAllSongs().then(setSongs).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <Link to="/" className="breadcrumb">
        ← Sections
      </Link>
      <div className="page-header">
        <h1>All Songs</h1>
        <button
          type="button"
          className={`btn ${editable ? "btn-danger" : "btn-secondary"}`}
          onClick={() => setEditable((v) => !v)}
        >
          {editable ? "Editing on — tap to lock" : "Locked — tap to edit"}
        </button>
      </div>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : songs.length === 0 ? (
        <p className="empty-hint">No songs added yet.</p>
      ) : (
        <div className="song-list">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              bandName={song.band_name}
              albumName={song.album_name}
              lineup={song.lineup}
              onRefresh={load}
              editable={editable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
