"use client";

import React from "react";
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";

export interface BoardItem {
  id: string;
  status: string;
  position: number;
  title: string;
  meta?: React.ReactNode;
}

export function KanbanBoard({
  columns,
  itemsByColumn,
  onMove,
}: {
  columns: string[];
  itemsByColumn: Record<string, BoardItem[]>;
  onMove: (id: string, toStatus: string, toIndex: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const [toStatus, toIndexStr] = (over.id as string).split(":");
    const toIndex = Number(toIndexStr);
    if (!Number.isFinite(toIndex)) return;
    onMove(active.id as string, toStatus, toIndex);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <SortableContext key={col} items={(itemsByColumn[col] || []).map((i, idx) => `${col}:${idx}`)} strategy={verticalListSortingStrategy}>
            <KanbanColumn title={col} items={itemsByColumn[col] || []} columnId={col} />
          </SortableContext>
        ))}
      </div>
    </DndContext>
  );
}


