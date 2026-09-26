import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import SongCard from "../components/SongCard.jsx";
import { SORT_OPTIONS, sortSongs } from "../songSort.js";

export default function AllSongsPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);
  const [sortMode, setSortMode] = useState("rating-desc");

  const load = () =>
    api.listAllSongs().then(setSongs).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const sortedSongs = useMemo(() => sortSongs(songs, sortMode), [songs, sortMode]);

  return (
    <div>
      <Link to="/" className="breadcrumb">
        ← Sections
      </Link>
      <div className="page-header">
        <h1>All Songs</h1>
        <div className="page-header-actions">
          <select
            className="sort-select"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            aria-label="Sort songs by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`btn ${editable ? "btn-danger" : "btn-secondary"}`}
            onClick={() => setEditable((v) => !v)}
          >
            {editable ? "Editing on — tap to lock" : "Locked — tap to edit"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : sortedSongs.length === 0 ? (
        <p className="empty-hint">No songs added yet.</p>
      ) : (
        <div className="song-list">
          {sortedSongs.map((song) => (
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
