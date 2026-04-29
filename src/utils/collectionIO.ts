import { message } from "antd";
import type { ApiCollection, ApiItem, ApiList } from "../types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExportedItem {
  id: number;
  name: string;
  description: string;
  order: number;
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
  const collectionItems = allItems.filter(
    (i) => i.collectionId === collection.id,
  );

  const data: CollectionExport = {
    collection: {
      id: collection.id,
      name: collection.name,
      defaultListId: collection.defaultListId,
    },
    lists: collection.lists.map((l) => ({
      ...l,
      items: collectionItems
        .filter((i) => i.listId === l.id)
        .sort((a, b) => a.order - b.order)
        .map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          order: i.order,
        })),
    })),
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
  lists: { name: string; protected: boolean; backgroundColor?: string; startingRating?: number }[];
  items: { name: string; description: string; listIndex: number; order: number }[];
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
      lists: data.lists.map((l) => ({
        name: l.name,
        protected: l.protected,
        backgroundColor: l.backgroundColor ?? undefined,
        startingRating: l.startingRating ?? undefined,
      })),
      items: data.lists.flatMap((l, listIndex) =>
        (l.items ?? []).map((i) => ({
          name: i.name,
          description: i.description,
          listIndex,
          order: i.order,
        })),
      ),
    };

    onSuccess(parsed);
  } catch {
    message.error("Failed to parse collection file");
  }
}
