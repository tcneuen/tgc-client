import { create } from "zustand";

export interface ListConfig {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
  lists: ListConfig[];
  defaultListId: string;
}

interface CollectionState {
  collections: Collection[];
  activeCollectionId: string | null;
  createCollection: (
    name: string,
    lists: ListConfig[],
    defaultListId: string,
  ) => void;
  selectCollection: (id: string) => void;
}

const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  activeCollectionId: null,
  createCollection: (name, lists, defaultListId) =>
    set((state) => {
      const id = crypto.randomUUID();
      const newCollection: Collection = { id, name, lists, defaultListId };
      return {
        collections: [...state.collections, newCollection],
        activeCollectionId: id,
      };
    }),
  selectCollection: (id) => set({ activeCollectionId: id }),
}));

export default useCollectionStore;
