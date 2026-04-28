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
  updateCollection: (
    id: string,
    name: string,
    defaultListId: string,
  ) => void;
  deleteCollection: (id: string) => void;
  addListToCollection: (collectionId: string, list: ListConfig) => void;
  renameList: (collectionId: string, listId: string, name: string) => void;
  removeList: (collectionId: string, listId: string) => void;
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
  updateCollection: (id, name, defaultListId) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, name, defaultListId } : c,
      ),
    })),
  deleteCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
      activeCollectionId:
        state.activeCollectionId === id ? null : state.activeCollectionId,
    })),
  addListToCollection: (collectionId, list) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId ? { ...c, lists: [...c.lists, list] } : c,
      ),
    })),
  renameList: (collectionId, listId, name) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              lists: c.lists.map((l) =>
                l.id === listId ? { ...l, name } : l,
              ),
            }
          : c,
      ),
    })),
  removeList: (collectionId, listId) =>
    set((state) => ({
      collections: state.collections.map((c) => {
        if (c.id !== collectionId) return c;
        const remaining = c.lists.filter((l) => l.id !== listId);
        return {
          ...c,
          lists: remaining,
          defaultListId:
            c.defaultListId === listId
              ? (remaining[0]?.id ?? "")
              : c.defaultListId,
        };
      }),
    })),
}));

export default useCollectionStore;
