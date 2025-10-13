"use client";

import React from "react";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@/components/ui/shadcn-io/kanban";
import { Badge } from "@/components/ui/badge";

export interface BoardItem {
  id: string;
  status: string;
  position: number;
  title: string;
  meta?: React.ReactNode;
}

interface KanbanDataItem extends Record<string, unknown> {
  id: string;
  name: string;
  column: string;
  position: number;
  meta?: React.ReactNode;
}

interface KanbanBoardProps {
  columns: string[];
  itemsByColumn: Record<string, BoardItem[]>;
  onMove: (id: string, toStatus: string, toIndex: number) => void;
}

export function KanbanBoardComponent({
  columns,
  itemsByColumn,
  onMove,
}: KanbanBoardProps) {
  // Transform data to match Shadcn kanban format
  const kanbanColumns = columns.map((col) => ({
    id: col,
    name: col,
  }));

  const kanbanData: KanbanDataItem[] = Object.entries(itemsByColumn).flatMap(([column, items]) =>
    items.map((item) => ({
      id: item.id,
      name: item.title,
      column: column,
      position: item.position,
      meta: item.meta,
    }))
  );

  const handleDataChange = (newData: KanbanDataItem[]) => {
    // Find the item that moved and call onMove
    const movedItem = newData.find((item) => {
      const originalItem = kanbanData.find((orig) => orig.id === item.id);
      return originalItem && originalItem.column !== item.column;
    });

    if (movedItem) {
      const newColumn = movedItem.column;
      const newIndex = newData
        .filter((item) => item.column === newColumn)
        .findIndex((item) => item.id === movedItem.id);
      
      onMove(movedItem.id, newColumn, newIndex);
    }
  };

  return (
    <KanbanProvider
      columns={kanbanColumns}
      data={kanbanData}
      onDataChange={handleDataChange}
      className="min-h-[600px]"
    >
      {(column) => (
        <KanbanBoard id={column.id} className="bg-background">
          <KanbanHeader className="flex items-center justify-between">
            <span className="text-sm font-medium">{column.name}</span>
            <Badge variant="outline" className="ml-2">
              {itemsByColumn[column.id]?.length || 0}
            </Badge>
          </KanbanHeader>
          <KanbanCards id={column.id}>
            {(item) => (
              <KanbanCard
                key={item.id}
                id={item.id}
                name={item.name}
                column={item.column}
                className="hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-medium leading-none">
                    {item.name}
                  </h4>
                  {(item as KanbanDataItem).meta && (
                    <div className="text-xs text-muted-foreground">
                      {(item as KanbanDataItem).meta}
                    </div>
                  )}
                </div>
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
}