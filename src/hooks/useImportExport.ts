import { useRef } from "react";
import { message } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { exportCollection, parseCollectionFile } from "../utils/collectionIO";
import type { ApiCollection, ApiItem } from "../types/api";
import { apiFetch } from "../utils/api";
import { COLLECTIONS_KEY } from "./useCollections";
import { itemsKey } from "./useItems";

export function useImportExport(
  activeCollection: ApiCollection | null,
  items: ApiItem[],
  navigateToCollection: (id: string) => void,
) {
  const qc = useQueryClient();
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
          // Single request: create collection with lists and items embedded
          const colRes = await apiFetch("/collections", {
            method: "POST",
            body: JSON.stringify({
              name: parsed.name,
              defaultListId: parsed.defaultListId,
              lists: parsed.lists,
            }),
          });
          if (!colRes.ok) throw new Error("Failed to import collection");
          const col = await colRes.json();

          await qc.invalidateQueries({ queryKey: COLLECTIONS_KEY });
          await qc.invalidateQueries({ queryKey: itemsKey(col.id) });
          navigateToCollection(col.id);
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

