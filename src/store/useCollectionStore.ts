import { create } from "zustand";

export interface ListConfig {
  id: string;
  name: string;
  protected?: boolean;
  backgroundColor?: string;
  startingRating?: number;
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
  updateListColor: (collectionId: string, listId: string, color: string) => void;
  updateListRating: (collectionId: string, listId: string, rating: number | undefined) => void;
  removeList: (collectionId: string, listId: string) => void;
}

const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  activeCollectionId: null,
  createCollection: (name, lists) =>
    set((state) => {
      const id = crypto.randomUUID();
      const ungradedId = crypto.randomUUID();
      const ungraded: ListConfig = { id: ungradedId, name: "Ungraded", protected: true };
      const newCollection: Collection = {
        id,
        name,
        lists: [ungraded, ...lists],
        defaultListId: ungradedId,
      };
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
  updateListColor: (collectionId, listId, color) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              lists: c.lists.map((l) =>
                l.id === listId ? { ...l, backgroundColor: color } : l,
              ),
            }
          : c,
      ),
    })),
  updateListRating: (collectionId, listId, rating) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              lists: c.lists.map((l) =>
                l.id === listId ? { ...l, startingRating: rating } : l,
              ),
            }
          : c,
      ),
    })),
  removeList: (collectionId, listId) =>
    set((state) => ({
      collections: state.collections.map((c) => {
        if (c.id !== collectionId) return c;
        const listToRemove = c.lists.find((l) => l.id === listId);
        if (listToRemove?.protected) return c;
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
