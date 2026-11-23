"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { useId, type ReactNode } from "react";
import { SortableItem } from "../form/doc-form";

/** A vertical list whose rows can be dragged (or moved with the keyboard) into a new order. */
export function SortableRows<T extends { id: string }>({ items, onReorder, render, disabled }: { items: T[]; onReorder: (next: T[]) => void; render: (item: T, handle: ReactNode) => ReactNode; disabled?: boolean }) {
  const id = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id)));
  };
  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {(handle) =>
                render(
                  item,
                  disabled ? null : (
                    <button type="button" className="ad-drag-handle ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon shrink-0" aria-label="Drag to reorder" {...handle}>
                      <GripVertical size={15} />
                    </button>
                  ),
                )
              }
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
