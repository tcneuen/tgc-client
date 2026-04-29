import { create } from "zustand";

interface CollectionState {
  activeCollectionId: string | null;
  selectCollection: (id: string) => void;
  clearSelection: () => void;
}

const useCollectionStore = create<CollectionState>((set) => ({
  activeCollectionId: null,
  selectCollection: (id) => set({ activeCollectionId: id }),
  clearSelection: () => set({ activeCollectionId: null }),
}));

export default useCollectionStore;
