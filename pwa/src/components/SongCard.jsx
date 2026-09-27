import { useState } from "react";
import { api } from "../api.js";
import RatingBadge from "./RatingBadge.jsx";
import QuickPicker from "./QuickPicker.jsx";
import TraitEditor from "./TraitEditor.jsx";
import TraitTierButtons from "./TraitTierButtons.jsx";
import { effectivePerformer, effectiveTier, tierColorFor } from "../traitColor.js";

// Each song carries its own rating (plus an optional "+" boost). A trait
// can optionally carry its own tier, picked inline in its row via
// always-visible buttons (no popup needed); left alone, it just shows the
// song's own rating. A trait's "+" is independent of that — it can be
// toggled either way, whether the trait has a tier of its own or is just
// inheriting the song's.
export default function SongCard({ song, bandName, albumName, lineup, onRefresh, editable = true }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddTrait, setShowAddTrait] = useState(false);
  const [editingTraitId, setEditingTraitId] = useState(null);

  const saveSong = async (patch) => {
    await api.updateSong(song.id, patch);
    onRefresh();
  };

  const changeSongRating = (rating) => saveSong(rating ? { rating } : { clear_rating: true });
  const toggleSongPlus = (plus) => saveSong({ plus });

  const addTrait = async (text) => {
    await api.addTrait(song.id, text);
    // Keep the picker open so several traits can be added in a row.
    onRefresh();
  };

  const saveTrait = async (traitId, patch) => {
    await api.updateTrait(traitId, patch);
    onRefresh();
  };

  const setTraitTier = (traitId, rating) => {
    saveTrait(traitId, rating ? { highlight: rating } : { clear_highlight: true });
  };

  const toggleTraitPlus = (traitId, plus) => saveTrait(traitId, { plus });

  const removeTrait = async (traitId, e) => {
    e.stopPropagation();
    await api.deleteTrait(traitId);
    onRefresh();
  };

  const removeSong = async () => {
    if (!window.confirm(`Delete "${song.name}"? This also deletes its traits.`)) {
      return;
    }
    await api.deleteSong(song.id);
    onRefresh();
  };

  const renderChip = (t) => {
    const tier = tierColorFor(song.rating, t.highlight, t.plus);
    const performer = effectivePerformer(t, lineup);
    const style = tier ? { "--trait-color": tier.color } : undefined;
    return (
      <span
        key={t.id}
        className={`trait-chip ${t.highlight ? "rated" : ""}`}
        style={style}
      >
        {performer && <span className="trait-chip-person">{performer}</span>}
        <span className="trait-chip-text">
          {t.text}
          {tier?.plus && <span className="trait-chip-plus">+</span>}
        </span>
      </span>
    );
  };

  return (
    <div className="song-card">
      <div className="song-pill" onClick={() => setExpanded((v) => !v)}>
        <div className="song-pill-top">
          <div className="song-pill-traits">{song.traits.map(renderChip)}</div>
          <span className="song-context">
            {bandName} · {albumName}
          </span>
        </div>
        <div className="song-pill-main">
          <span className="song-name">{song.name}</span>
          <RatingBadge
            rating={song.rating}
            plus={song.plus}
            onChange={changeSongRating}
            onTogglePlus={toggleSongPlus}
            editable={editable}
          />
        </div>
      </div>

      {expanded && (
        <div className="song-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="song-dropdown-header">
            <span>Traits</span>
            {editable && (
              <button
                className="btn btn-small btn-primary"
                onClick={() => setShowAddTrait((v) => !v)}
              >
                +
              </button>
            )}
          </div>

          {editable && showAddTrait && (
            <QuickPicker
              kind="trait"
              title="Trait"
              onPick={addTrait}
              onClose={() => setShowAddTrait(false)}
            />
          )}

          <ul className="trait-detail-list">
            {[...song.traits].reverse().map((t) => {
              const defaultPerformer = effectivePerformer({ ...t, performer: null }, lineup);
              return (
                <li key={t.id} className="trait-detail-item">
                  <div
                    className="trait-detail-main"
                    onClick={() =>
                      editable &&
                      setEditingTraitId(editingTraitId === t.id ? null : t.id)
                    }
                  >
                    {renderChip(t)}
                    {editable && (
                      <div className="trait-detail-controls">
                        <TraitTierButtons
                          highlight={t.highlight}
                          plus={t.plus}
                          effectiveTier={effectiveTier(song.rating, t.highlight)}
                          onChange={(rating) => setTraitTier(t.id, rating)}
                          onTogglePlus={(plus) => toggleTraitPlus(t.id, plus)}
                        />
                        <button
                          className="btn btn-small btn-danger"
                          onClick={(e) => removeTrait(t.id, e)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {editable && editingTraitId === t.id && (
                    <TraitEditor
                      trait={t}
                      defaultPerformer={defaultPerformer}
                      onSave={(patch) => saveTrait(t.id, patch)}
                      onClose={() => setEditingTraitId(null)}
                    />
                  )}
                </li>
              );
            })}
            {song.traits.length === 0 && (
              <li className="empty-hint">No traits yet.</li>
            )}
          </ul>

          {editable && (
            <button className="btn btn-small btn-danger delete-song-btn" onClick={removeSong}>
              Delete song
            </button>
          )}
        </div>
      )}
    </div>
  );
}
