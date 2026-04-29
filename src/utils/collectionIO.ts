import { message } from "antd";
import type { ApiCollection, ApiItem, ApiList } from "../types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExportedItem {
  id: number;
  name: string;
  description: string;
}

interface ExportedList extends ApiList {
  items: ExportedItem[];
}

export interface CollectionExport {
  collection: Pick<ApiCollection, "id" | "name" | "defaultListId">;
  lists: ExportedList[];
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportCollection(
  collection: ApiCollection,
  allItems: ApiItem[],
): void {
  const data: CollectionExport = {
    collection: {
      id: collection.id,
      name: collection.name,
      defaultListId: collection.defaultListId,
    },
    lists: collection.lists.map((l) => {
      // Walk linked list in order for export
      const listItems = allItems.filter(
        (i) => i.collectionId === collection.id && i.listId === l.id,
      );
      const byId = new Map(listItems.map((i) => [i.id, i]));
      let cur = listItems.find((i) => i.prevId === null);
      const ordered: ApiItem[] = [];
      const seen = new Set<number>();
      while (cur && !seen.has(cur.id)) {
        ordered.push(cur);
        seen.add(cur.id);
        cur = cur.nextId != null ? byId.get(cur.nextId) : undefined;
      }
      return {
        ...l,
        items: ordered.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
        })),
      };
    }),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${collection.name.replace(/[^a-z0-9]/gi, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ParsedImport {
  name: string;
  defaultListId: string | null;
  lists: {
    id: string;
    name: string;
    protected: boolean;
    backgroundColor?: string;
    startingRating?: number;
    items: { name: string; description: string }[];
  }[];
}

export function parseCollectionFile(
  raw: string,
  onSuccess: (parsed: ParsedImport) => void,
): void {
  try {
    const data: CollectionExport = JSON.parse(raw);

    if (!data.collection || !Array.isArray(data.lists)) {
      message.error("Invalid collection file");
      return;
    }

    const parsed: ParsedImport = {
      name: data.collection.name,
      defaultListId: data.collection.defaultListId ?? null,
      lists: data.lists.map((l) => ({
        id: l.id,
        name: l.name,
        protected: l.protected,
        backgroundColor: l.backgroundColor ?? undefined,
        startingRating: l.startingRating ?? undefined,
        items: (l.items ?? []).map((i) => ({ name: i.name, description: i.description })),
      })),
    };

    onSuccess(parsed);
  } catch {
    message.error("Failed to parse collection file");
  }
}
