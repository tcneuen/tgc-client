import { create } from "zustand";

export interface ListItem {
  id: number;
  name: string;
  description: string;
  rank: number;
}

interface ListStuff {
  list: ListItem[];
  addList: (name: string, description: string) => void;
  addBulk: (items: Omit<ListItem, "id">[]) => void;
  updateRank: (id: number, rank: number) => void;
  deleteItem: (id: number) => void;
  reorderSortedItems: (activeId: number, overId: number) => void;
  reorderUnsortedItems: (activeId: number, overId: number) => void;
  moveToSorted: (itemId: number, targetIndex?: number) => void;
  moveToUnsorted: (itemId: number) => void;
}

const useBearStore = create<ListStuff>((set) => ({
  list: [],
  addList: (name, description) =>
    set((state) => ({
      list: [
        ...state.list,
        {
          id: state.list.length + 1,
          name,
          description,
          rank: 0,
        },
      ],
    })),
  addBulk: (items) =>
    set((state) => ({
      list: [
        ...state.list,
        ...items.map((item, i) => ({
          ...item,
          id: state.list.length + i + 1,
        })),
      ],
    })),
  updateRank: (id, rank) =>
    set((state) => ({
      list: state.list.map((item) =>
        item.id === id ? { ...item, rank } : item,
      ),
    })),
  deleteItem: (id) =>
    set((state) => ({
      list: state.list.filter((item) => item.id !== id),
    })),
  reorderSortedItems: (activeId, overId) =>
    set((state) => {
      const sortedItems = state.list
        .filter((item) => item.rank !== 0)
        .sort((a, b) => a.rank - b.rank);

      const activeIndex = sortedItems.findIndex((item) => item.id === activeId);
      const overIndex = sortedItems.findIndex((item) => item.id === overId);

      if (activeIndex === -1 || overIndex === -1) return state;

      const reorderedItems = [...sortedItems];
      const [removed] = reorderedItems.splice(activeIndex, 1);
      reorderedItems.splice(overIndex, 0, removed);

      const updatedList = state.list.map((item) => {
        if (item.rank === 0) return item;
        const newIndex = reorderedItems.findIndex(
          (reordered) => reordered.id === item.id,
        );
        return newIndex !== -1 ? { ...item, rank: newIndex + 1 } : item;
      });

      return { list: updatedList };
    }),
  reorderUnsortedItems: (activeId, overId) =>
    set((state) => {
      const unsortedItems = state.list.filter((item) => item.rank === 0);
      const sortedItems = state.list.filter((item) => item.rank !== 0);

      const activeIndex = unsortedItems.findIndex(
        (item) => item.id === activeId,
      );
      const overIndex = unsortedItems.findIndex((item) => item.id === overId);

      if (activeIndex === -1 || overIndex === -1) return state;

      const reorderedUnsorted = [...unsortedItems];
      const [removed] = reorderedUnsorted.splice(activeIndex, 1);
      reorderedUnsorted.splice(overIndex, 0, removed);

      return { list: [...reorderedUnsorted, ...sortedItems] };
    }),
  moveToSorted: (itemId, targetIndex) =>
    set((state) => {
      const item = state.list.find((item) => item.id === itemId);
      if (!item || item.rank !== 0) return state;

      const sortedItems = state.list
        .filter((item) => item.rank !== 0)
        .sort((a, b) => a.rank - b.rank);

      let newRank: number;
      if (targetIndex !== undefined && targetIndex < sortedItems.length) {
        newRank = targetIndex + 1;
        const updatedList = state.list.map((listItem) => {
          if (listItem.id === itemId) return { ...listItem, rank: newRank };
          if (listItem.rank !== 0 && listItem.rank >= newRank)
            return { ...listItem, rank: listItem.rank + 1 };
          return listItem;
        });
        return { list: updatedList };
      } else {
        newRank = sortedItems.length + 1;
        return {
          list: state.list.map((listItem) =>
            listItem.id === itemId ? { ...listItem, rank: newRank } : listItem,
          ),
        };
      }
    }),
  moveToUnsorted: (itemId) =>
    set((state) => {
      const item = state.list.find((item) => item.id === itemId);
      if (!item || item.rank === 0) return state;

      const updatedList = state.list.map((listItem) => {
        if (listItem.id === itemId) return { ...listItem, rank: 0 };
        if (listItem.rank > item.rank)
          return { ...listItem, rank: listItem.rank - 1 };
        return listItem;
      });

      return { list: updatedList };
    }),
}));

export default useBearStore;
