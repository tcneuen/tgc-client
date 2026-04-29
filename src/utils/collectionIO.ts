import { message } from "antd";
import type { Collection, ListConfig } from "../store/useCollectionStore";
import type { ListItem } from "../store/useBearStore";
import useBearStore from "../store/useBearStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExportedItem {
  id: number;
  name: string;
  description: string;
  order: number;
}

interface ExportedList extends ListConfig {
  items: ExportedItem[];
}

export interface CollectionExport {
  collection: Pick<Collection, "id" | "name" | "defaultListId">;
  lists: ExportedList[];
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportCollection(
  collection: Collection,
  allItems: ListItem[],
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
      protected: l.protected ?? false,
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

export function parseCollectionFile(
  raw: string,
  onSuccess: (collection: Collection, items: Omit<ListItem, never>[]) => void,
): void {
  try {
    const data: CollectionExport = JSON.parse(raw);

    if (!data.collection || !Array.isArray(data.lists)) {
      message.error("Invalid collection file");
      return;
    }

    const idMap: Record<string, string> = {};
    const newCollectionId = crypto.randomUUID();
    idMap[data.collection.id] = newCollectionId;

    const newLists: ListConfig[] = data.lists.map((l) => {
      const newListId = crypto.randomUUID();
      idMap[l.id] = newListId;
      return {
        id: newListId,
        name: l.name,
        protected: l.protected ?? false,
        backgroundColor: l.backgroundColor,
        startingRating: l.startingRating,
      };
    });

    const newDefaultListId =
      idMap[data.collection.defaultListId] ?? newLists[0]?.id ?? "";

    const newCollection: Collection = {
      id: newCollectionId,
      name: data.collection.name,
      lists: newLists,
      defaultListId: newDefaultListId,
    };

    let globalMaxId = 0;
    useBearStore.getState().list.forEach((i) => {
      if (i.id > globalMaxId) globalMaxId = i.id;
    });

    const newItems: ListItem[] = data.lists.flatMap((l) =>
      l.items.map((item) => ({
        id: ++globalMaxId,
        name: item.name,
        description: item.description,
        collectionId: newCollectionId,
        listId: idMap[l.id],
        order: item.order,
      })),
    );

    onSuccess(newCollection, newItems);
    message.success(`Imported "${data.collection.name}"`);
  } catch {
    message.error("Failed to parse file");
  }
}
