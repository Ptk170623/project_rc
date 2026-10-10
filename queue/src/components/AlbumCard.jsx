import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function formatLastListened(iso) {
  if (!iso) return "Never listened";
  const date = new Date(iso);
  return `Last listened ${date.toLocaleDateString()}`;
}

export default function AlbumCard({ album, specificLabel, genericLabel, onEdit, onListen, onMoveTop }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: album.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`album-card ${isDragging ? "dragging" : ""}`}
    >
      <span className="drag-handle" {...attributes} {...listeners}>
        ⠿
      </span>

      {album.imageUrl ? (
        <img className="album-cover" src={album.imageUrl} alt="" />
      ) : (
        <div className="album-cover-placeholder">🎵</div>
      )}

      <div className="album-info" onClick={() => onEdit(album)}>
        <span className="album-band">{album.band_name || "Unknown band"}</span>
        <span className="album-name">{album.name}</span>
        {(specificLabel || genericLabel) && (
          <div className="album-tags">
            {specificLabel && <span className="album-tag">{specificLabel}</span>}
            {genericLabel && <span className="album-tag generic">{genericLabel}</span>}
          </div>
        )}
        <span className="album-listened">{formatLastListened(album.last_listened_at)}</span>
      </div>

      <div className="album-actions">
        <button
          type="button"
          className="icon-btn"
          title="Move to top"
          onClick={() => onMoveTop(album.id)}
        >
          ⤒
        </button>
        <button
          type="button"
          className={`icon-btn listen-btn ${album.last_listened_at ? "listened" : ""}`}
          title="Mark as listened"
          onClick={() => onListen(album.id)}
        >
          ✓
        </button>
      </div>
    </li>
  );
}
