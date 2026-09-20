import { useState } from "react";
import { api } from "../api.js";
import RatingBadge from "./RatingBadge.jsx";
import QuickPicker from "./QuickPicker.jsx";

export default function SongCard({ song, bandName, albumName, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddTrait, setShowAddTrait] = useState(false);
  const [subtraitTargetId, setSubtraitTargetId] = useState(null);

  const changeRating = async (rating) => {
    await api.updateSong(song.id, rating ? { rating } : { clear_rating: true });
    onRefresh();
  };

  const addTrait = async (text) => {
    await api.addTrait(song.id, text);
    // Keep the picker open so several traits can be added in a row.
    onRefresh();
  };

  const addSubtrait = async (traitId, subText) => {
    await api.updateTrait(traitId, { sub_text: subText });
    setSubtraitTargetId(null);
    onRefresh();
  };

  const removeTrait = async (traitId, e) => {
    e.stopPropagation();
    await api.deleteTrait(traitId);
    onRefresh();
  };

  const removeSong = async () => {
    if (!window.confirm(`Delete "${song.name}"? This also deletes its traits and rating.`)) {
      return;
    }
    await api.deleteSong(song.id);
    onRefresh();
  };

  return (
    <div className="song-card">
      <div className="song-pill" onClick={() => setExpanded((v) => !v)}>
        <div className="song-pill-top">
          <div className="song-pill-traits">
            {song.traits.map((t) => (
              <span key={t.id} className="trait-chip">
                {t.sub_text && <span className="trait-chip-sub">{t.sub_text}</span>}
                <span className="trait-chip-text">{t.text}</span>
              </span>
            ))}
          </div>
          <span className="song-context">
            {bandName} · {albumName}
          </span>
        </div>
        <div className="song-pill-main">
          <span className="song-name">{song.name}</span>
          <RatingBadge rating={song.rating} onChange={changeRating} />
        </div>
      </div>

      {expanded && (
        <div className="song-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="song-dropdown-header">
            <span>Traits</span>
            <button
              className="btn btn-small btn-primary"
              onClick={() => setShowAddTrait((v) => !v)}
            >
              +
            </button>
          </div>

          {showAddTrait && (
            <QuickPicker
              kind="trait"
              title="Trait"
              onPick={addTrait}
              onClose={() => setShowAddTrait(false)}
            />
          )}

          <ul className="trait-detail-list">
            {song.traits.map((t) => (
              <li key={t.id} className="trait-detail-item">
                <div
                  className="trait-detail-main"
                  onClick={() =>
                    setSubtraitTargetId(subtraitTargetId === t.id ? null : t.id)
                  }
                >
                  <div className="trait-detail-text-wrap">
                    {t.sub_text && (
                      <span className="trait-detail-sub">{t.sub_text}</span>
                    )}
                    <span className="trait-detail-text">{t.text}</span>
                  </div>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={(e) => removeTrait(t.id, e)}
                  >
                    Remove
                  </button>
                </div>
                {subtraitTargetId === t.id && (
                  <QuickPicker
                    kind="subtrait"
                    title="Classification"
                    onPick={(text) => addSubtrait(t.id, text)}
                    onClose={() => setSubtraitTargetId(null)}
                  />
                )}
              </li>
            ))}
            {song.traits.length === 0 && (
              <li className="empty-hint">No traits yet.</li>
            )}
          </ul>

          <button className="btn btn-small btn-danger delete-song-btn" onClick={removeSong}>
            Delete song
          </button>
        </div>
      )}
    </div>
  );
}
