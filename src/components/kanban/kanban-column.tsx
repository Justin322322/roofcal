"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>{item.meta}</CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}


