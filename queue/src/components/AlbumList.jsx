import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import AlbumCard from "./AlbumCard.jsx";

export default function AlbumList({ albums, labelsById, onEdit, onListen, onMoveTop, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = albums.findIndex((a) => a.id === active.id);
    const newIndex = albums.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(albums, oldIndex, newIndex);
    onReorder(reordered.map((a) => a.id));
  };

  if (albums.length === 0) {
    return <p className="empty-hint">No albums match — add one or clear the search.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={albums.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <ul className="album-list">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              specificLabel={labelsById.get(album.subgenre_id)?.label}
              genericLabel={labelsById.get(album.subgenre_generic_id)?.label}
              onEdit={onEdit}
              onListen={onListen}
              onMoveTop={onMoveTop}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
