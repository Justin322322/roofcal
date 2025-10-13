"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export function KanbanColumn({
  title,
  columnId,
  items,
}: {
  title: string;
  columnId: string;
  items: { id: string; title: string; status: string; position: number; meta?: React.ReactNode }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="outline">{items.length}</Badge>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${columnId}:${index}`} id={`${columnId}:${index}`} className="cursor-grab">
            <div className="rounded-md border bg-card p-3 shadow-sm">
              <h4 className="text-sm font-medium">{item.title}</h4>
              {item.meta && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {item.meta}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}