import { create } from "zustand";

export interface ListItem {
  id: number;
  name: string;
  description: string;
  collectionId: string;
  listId: string;
  order: number;
}

interface ListStuff {
  list: ListItem[];
  addItem: (
    name: string,
    description: string,
    collectionId: string,
    listId: string,
  ) => void;
  addBulk: (items: Omit<ListItem, "id">[]) => void;
  deleteItem: (id: number) => void;
  updateItem: (id: number, name: string, description: string) => void;
  reorderItemsInList: (activeId: number, overId: number) => void;
  moveItemToList: (
    itemId: number,
    targetListId: string,
    targetIndex?: number,
  ) => void;
  placeItemAtIndex: (
    itemId: number,
    targetListId: string,
    targetIndex: number,
  ) => void;
  moveAllItemsFromList: (
    collectionId: string,
    fromListId: string,
    toListId: string,
  ) => void;
  deleteItemsByCollection: (collectionId: string) => void;
  importItems: (items: Omit<ListItem, never>[]) => void;
}

const useBearStore = create<ListStuff>((set) => ({
  list: [],
  addItem: (name, description, collectionId, listId) =>
    set((state) => {
      const itemsInList = state.list.filter(
        (i) => i.listId === listId && i.collectionId === collectionId,
      );
      return {
        list: [
          ...state.list,
          {
            id: state.list.length + 1,
            name,
            description,
            collectionId,
            listId,
            order: itemsInList.length + 1,
          },
        ],
      };
    }),
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
  deleteItem: (id) =>
    set((state) => {
      const item = state.list.find((i) => i.id === id);
      if (!item) return state;
      const updatedList = state.list
        .filter((i) => i.id !== id)
        .map((i) => {
          if (
            i.listId === item.listId &&
            i.collectionId === item.collectionId &&
            i.order > item.order
          ) {
            return { ...i, order: i.order - 1 };
          }
          return i;
        });
      return { list: updatedList };
    }),
  updateItem: (id, name, description) =>
    set((state) => ({
      list: state.list.map((i) =>
        i.id === id ? { ...i, name, description } : i,
      ),
    })),
  reorderItemsInList: (activeId, overId) =>
    set((state) => {
      const activeItem = state.list.find((i) => i.id === activeId);
      const overItem = state.list.find((i) => i.id === overId);
      if (
        !activeItem ||
        !overItem ||
        activeItem.listId !== overItem.listId ||
        activeItem.collectionId !== overItem.collectionId
      )
        return state;

      const listItems = state.list
        .filter(
          (i) =>
            i.listId === activeItem.listId &&
            i.collectionId === activeItem.collectionId,
        )
        .sort((a, b) => a.order - b.order);

      const activeIndex = listItems.findIndex((i) => i.id === activeId);
      const overIndex = listItems.findIndex((i) => i.id === overId);

      const reordered = [...listItems];
      const [removed] = reordered.splice(activeIndex, 1);
      reordered.splice(overIndex, 0, removed);

      const updatedList = state.list.map((item) => {
        const newIndex = reordered.findIndex((r) => r.id === item.id);
        if (newIndex !== -1) return { ...item, order: newIndex + 1 };
        return item;
      });

      return { list: updatedList };
    }),
  moveItemToList: (itemId, targetListId, targetIndex) =>
    set((state) => {
      const item = state.list.find((i) => i.id === itemId);
      if (!item || item.listId === targetListId) return state;

      const targetListItems = state.list.filter(
        (i) =>
          i.listId === targetListId && i.collectionId === item.collectionId,
      );
      const newOrder =
        targetIndex !== undefined
          ? targetIndex + 1
          : targetListItems.length + 1;

      const updatedList = state.list.map((listItem) => {
        if (listItem.id === itemId) {
          return { ...listItem, listId: targetListId, order: newOrder };
        }
        // Shift items in the target list to make room
        if (
          targetIndex !== undefined &&
          listItem.listId === targetListId &&
          listItem.collectionId === item.collectionId &&
          listItem.order >= newOrder
        ) {
          return { ...listItem, order: listItem.order + 1 };
        }
        // Compact items in the source list
        if (
          listItem.listId === item.listId &&
          listItem.collectionId === item.collectionId &&
          listItem.order > item.order
        ) {
          return { ...listItem, order: listItem.order - 1 };
        }
        return listItem;
      });

      return { list: updatedList };
    }),
  placeItemAtIndex: (itemId, targetListId, targetIndex) =>
    set((state) => {
      const item = state.list.find((i) => i.id === itemId);
      if (!item) return state;

      if (item.listId === targetListId) {
        // Reorder within the same list
        const listItems = state.list
          .filter(
            (i) =>
              i.listId === item.listId && i.collectionId === item.collectionId,
          )
          .sort((a, b) => a.order - b.order);
        const currentIndex = listItems.findIndex((i) => i.id === itemId);
        const reordered = [...listItems];
        const [removed] = reordered.splice(currentIndex, 1);
        reordered.splice(targetIndex, 0, removed);
        return {
          list: state.list.map((i) => {
            const newIdx = reordered.findIndex((r) => r.id === i.id);
            if (newIdx !== -1) return { ...i, order: newIdx + 1 };
            return i;
          }),
        };
      }

      // Move to a different list
      const newOrder = targetIndex + 1;
      return {
        list: state.list.map((listItem) => {
          if (listItem.id === itemId) {
            return { ...listItem, listId: targetListId, order: newOrder };
          }
          if (
            listItem.listId === targetListId &&
            listItem.collectionId === item.collectionId &&
            listItem.order >= newOrder
          ) {
            return { ...listItem, order: listItem.order + 1 };
          }
          if (
            listItem.listId === item.listId &&
            listItem.collectionId === item.collectionId &&
            listItem.order > item.order
          ) {
            return { ...listItem, order: listItem.order - 1 };
          }
          return listItem;
        }),
      };
    }),
  moveAllItemsFromList: (collectionId, fromListId, toListId) =>
    set((state) => {
      const toListItems = state.list.filter(
        (i) => i.collectionId === collectionId && i.listId === toListId,
      );
      const toListMaxOrder = toListItems.length;
      let offset = 0;
      const updatedList = state.list.map((item) => {
        if (item.collectionId === collectionId && item.listId === fromListId) {
          offset++;
          return { ...item, listId: toListId, order: toListMaxOrder + offset };
        }
        return item;
      });
      return { list: updatedList };
    }),
  deleteItemsByCollection: (collectionId) =>
    set((state) => ({
      list: state.list.filter((i) => i.collectionId !== collectionId),
    })),
  importItems: (items) =>
    set((state) => ({
      list: [...state.list, ...items],
    })),
}));

export default useBearStore;
