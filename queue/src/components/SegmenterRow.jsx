import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SegmenterChip from "./SegmenterChip.jsx";

export default function SegmenterRow({ kind, title, segmenters, onQuantityChange, onReorder, onManageLabels }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = segmenters.findIndex((s) => s.label_id === active.id);
    const newIndex = segmenters.findIndex((s) => s.label_id === over.id);
    const reordered = arrayMove(segmenters, oldIndex, newIndex);
    onReorder(kind, reordered.map((s) => s.label_id));
  };

  return (
    <div>
      <div className="segmenter-tabs">
        <span className="segmenter-tab active">{title}</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={segmenters.map((s) => s.label_id)} strategy={horizontalListSortingStrategy}>
          <div className="segmenter-row">
            {segmenters.map((s) => (
              <SegmenterChip
                key={s.label_id}
                segmenter={s}
                onQuantityChange={(labelId, qty) => onQuantityChange(labelId, kind, qty)}
              />
            ))}
            <button type="button" className="segmenter-manage-btn" title={`Manage ${title.toLowerCase()}`} onClick={() => onManageLabels(kind)}>
              ⚙
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
