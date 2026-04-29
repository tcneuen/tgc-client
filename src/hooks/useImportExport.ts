import { useRef } from "react";
import { message } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { exportCollection, parseCollectionFile } from "../utils/collectionIO";
import type { ApiCollection, ApiItem } from "../types/api";
import { apiFetch } from "../utils/api";
import { COLLECTIONS_KEY } from "./useCollections";
import { itemsKey } from "./useItems";
import useCollectionStore from "../store/useCollectionStore";

export function useImportExport(
  activeCollection: ApiCollection | null,
  items: ApiItem[],
) {
  const qc = useQueryClient();
  const { selectCollection } = useCollectionStore();
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!activeCollection) return;
    exportCollection(activeCollection, items);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      parseCollectionFile(ev.target?.result as string, async (parsed) => {
        try {
          // 1. Create collection
          const colRes = await apiFetch("/collections", {
            method: "POST",
            body: JSON.stringify({ name: parsed.name }),
          });
          if (!colRes.ok) throw new Error("Failed to create collection");
          const col = await colRes.json();

          // 2. Create lists and build id mapping (listIndex → new listId)
          const listIds: string[] = [];
          for (const l of parsed.lists) {
            const lRes = await apiFetch(`/collections/${col.id}/lists`, {
              method: "POST",
              body: JSON.stringify(l),
            });
            if (!lRes.ok) throw new Error("Failed to create list");
            const newList = await lRes.json();
            listIds.push(newList.id);
          }

          // 3. Set defaultListId to the protected (Unrated) list if present
          const protectedIdx = parsed.lists.findIndex((l) => l.protected);
          if (protectedIdx !== -1) {
            await apiFetch(`/collections/${col.id}`, {
              method: "PATCH",
              body: JSON.stringify({ defaultListId: listIds[protectedIdx] }),
            });
          }

          // 4. Create items
          for (const item of parsed.items) {
            await apiFetch(`/collections/${col.id}/items`, {
              method: "POST",
              body: JSON.stringify({
                name: item.name,
                description: item.description,
                listId: listIds[item.listIndex],
                order: item.order,
              }),
            });
          }

          await qc.invalidateQueries({ queryKey: COLLECTIONS_KEY });
          await qc.invalidateQueries({ queryKey: itemsKey(col.id) });
          selectCollection(col.id);
          message.success(`Imported "${parsed.name}"`);
        } catch (err) {
          message.error("Import failed");
          console.error(err);
        }
      });
      if (importInputRef.current) importInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const openImportDialog = () => importInputRef.current?.click();

  return { importInputRef, handleExport, handleImport, openImportDialog };
}

