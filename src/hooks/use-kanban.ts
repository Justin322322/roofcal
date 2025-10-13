"use client";

import { useCallback, useMemo, useState } from "react";

export interface KanbanItem {
  id: string;
  title: string;
  status: string;
  position: number;
  meta?: React.ReactNode;
}

export interface UseKanbanOptions {
  columns: string[];
  onReorder: (items: { id: string; status: string; position: number }[]) => Promise<void>;
  canMove?: (item: KanbanItem, toStatus: string, toIndex: number) => boolean;
}

export function useKanban(items: KanbanItem[], options: UseKanbanOptions) {
  const [localItems, setLocalItems] = useState<KanbanItem[]>(items);
  const [isSaving, setIsSaving] = useState(false);

  const columns = options.columns;

  const grouped = useMemo(() => {
    const map: Record<string, KanbanItem[]> = {};
    for (const col of columns) map[col] = [];
    for (const item of localItems) {
      if (!map[item.status]) map[item.status] = [];
      map[item.status].push(item);
    }
    for (const col of columns) {
      map[col].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [localItems, columns]);

  const moveItem = useCallback(
    async (id: string, toStatus: string, toIndex: number) => {
      if (!columns.includes(toStatus)) return;
      const sourceItem = localItems.find((i) => i.id === id);
      if (!sourceItem) return;
      if (options.canMove && !options.canMove(sourceItem, toStatus, toIndex)) {
        return; // disallowed by guard
      }
      setLocalItems((prev) => {
        const next = [...prev];
        const idx = next.findIndex((i) => i.id === id);
        if (idx === -1) return prev;
        const item = { ...next[idx] };
        next.splice(idx, 1);

        // Insert into target column at target index
        const targetColumnItems = next
          .filter((i) => i.status === toStatus)
          .sort((a, b) => a.position - b.position);

        // Reconstruct list with the moved item
        const before = targetColumnItems.slice(0, toIndex);
        const after = targetColumnItems.slice(toIndex);
        const recomposed: KanbanItem[] = [];

        // Keep other columns items
        for (const i of next) {
          if (i.status !== toStatus) {
            recomposed.push(i);
          }
        }

        // Add target column with new order and new status
        const targetWithMoved = [...before, { ...item, status: toStatus }, ...after];
        targetWithMoved.forEach((it, position) => {
          it.position = position;
        });

        return [...recomposed, ...targetWithMoved];
      });

      // Persist
      try {
        setIsSaving(true);
        const payload = localItems
          .filter((i) => i.status === toStatus || i.id === id)
          .map((i) => ({ id: i.id, status: i.status, position: i.position }));
        await options.onReorder(payload);
      } finally {
        setIsSaving(false);
      }
    },
    [columns, localItems, options]
  );

  return { itemsByColumn: grouped, moveItem, isSaving, setLocalItems };
}


