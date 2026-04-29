import { useRef } from "react";
import useBearStore from "../store/useBearStore";
import useCollectionStore from "../store/useCollectionStore";
import { exportCollection, parseCollectionFile } from "../utils/collectionIO";
import type { Collection } from "../store/useCollectionStore";

export function useImportExport(activeCollection: Collection | null) {
  const { list, importItems } = useBearStore();
  const { importCollection } = useCollectionStore();
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!activeCollection) return;
    exportCollection(activeCollection, list);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      parseCollectionFile(ev.target?.result as string, (collection, items) => {
        importCollection(collection);
        importItems(items);
      });
      if (importInputRef.current) importInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const openImportDialog = () => importInputRef.current?.click();

  return { importInputRef, handleExport, handleImport, openImportDialog };
}
