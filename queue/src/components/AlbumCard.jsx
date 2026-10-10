import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const IMPORTANCE_OPTIONS = [
  { value: "novo", label: "New" },
  { value: "importante", label: "Important" },
  { value: "normal", label: "Normal" },
  { value: "menos", label: "Less" },
];

function formatLastListened(iso) {
  if (!iso) return "Never listened";
  const date = new Date(iso);
  return `Last listened ${date.toLocaleDateString()}`;
}

export default function AlbumCard({
  album,
  specificLabel,
  onEdit,
  onListen,
  onMoveTop,
  onImportanceChange,
}) {
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
        {specificLabel && (
          <div className="album-tags">
            <span className="album-tag">{specificLabel}</span>
          </div>
        )}
        <div className="album-meta-row">
          <span className="album-listened">{formatLastListened(album.last_listened_at)}</span>
          <select
            className={`importance-badge importance-${album.importance || "normal"}`}
            value={album.importance || "normal"}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onImportanceChange(album.id, e.target.value)}
            title="Importance"
          >
            {IMPORTANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
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
