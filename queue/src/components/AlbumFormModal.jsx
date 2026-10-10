import { useState } from "react";
import { api } from "../api.js";
import LabelSelect from "./LabelSelect.jsx";

export default function AlbumFormModal({
  album,
  specificLabels,
  bandNames,
  onClose,
  onSaved,
  onLabelsChanged,
}) {
  const isEditing = !!album;
  const [name, setName] = useState(album?.name || "");
  const [bandName, setBandName] = useState(album?.band_name || "");
  const [subgenreId, setSubgenreId] = useState(album?.subgenre_id ?? null);
  const [imageFile, setImageFile] = useState(undefined); // undefined = untouched
  const [imagePreview, setImagePreview] = useState(album?.imageUrl || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(undefined);
    setRemoveImage(true);
    setImagePreview(null);
  };

  const save = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const fields = {
        name: trimmed,
        band_name: bandName.trim(),
        subgenre_id: subgenreId,
      };
      if (imageFile) fields.image = imageFile;
      else if (removeImage) fields.image = null;

      if (isEditing) {
        await api.updateAlbum(album.id, fields);
      } else {
        await api.createAlbum(fields);
      }
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${album.name}"?`)) return;
    await api.deleteAlbum(album.id);
    await onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? "Edit album" : "Add album"}</h3>
          <button className="btn btn-ghost btn-small" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={save}>
          <div className="form-field">
            <label htmlFor="album-name">Album name</label>
            <input
              id="album-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="album-band">Band</label>
            <input
              id="album-band"
              list="band-names"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
            />
            <datalist id="band-names">
              {bandNames.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div className="form-field">
            <label htmlFor="album-subgenre">Subgenre</label>
            <LabelSelect
              id="album-subgenre"
              kind="specific"
              label="subgenre"
              labels={specificLabels}
              value={subgenreId}
              onChange={setSubgenreId}
              onLabelsChanged={onLabelsChanged}
            />
          </div>

          <div className="form-field">
            <label>Cover image</label>
            <div className="image-picker">
              {imagePreview ? (
                <img className="image-picker-preview" src={imagePreview} alt="" />
              ) : (
                <div className="image-picker-preview-empty">🎵</div>
              )}
              <input type="file" accept="image/*" onChange={pickImage} />
              {imagePreview && (
                <button type="button" className="btn btn-small btn-ghost" onClick={clearImage}>
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="modal-actions">
            {isEditing && (
              <button type="button" className="btn btn-danger" onClick={remove}>
                Delete
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
