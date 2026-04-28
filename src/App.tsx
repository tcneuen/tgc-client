import { useState } from "react";
import { Button, Card, Col, Input, Row } from "antd";
import { faker } from "@faker-js/faker";
import { create } from "zustand";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import DraggableList from "./components/DraggableList";

interface ListStuff {
  list: {
    id: number;
    name: string;
    description: string;
    rank: number;
  }[];
  addList: (name: string, description: string) => void;
  updateRank: (id: number, rank: number) => void;
  deleteItem: (id: number) => void;
  reorderSortedItems: (activeId: number, overId: number) => void;
  reorderUnsortedItems: (activeId: number, overId: number) => void;
  moveToSorted: (itemId: number, targetIndex?: number) => void;
  moveToUnsorted: (itemId: number, targetIndex?: number) => void;
  seedList: () => void;
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

      // Create new array with reordered items
      const reorderedItems = [...sortedItems];
      const [removed] = reorderedItems.splice(activeIndex, 1);
      reorderedItems.splice(overIndex, 0, removed);

      // Update ranks based on new order
      const updatedList = state.list.map((item) => {
        if (item.rank === 0) return item; // Keep unsorted items unchanged

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

      // Reorder unsorted items
      const reorderedUnsorted = [...unsortedItems];
      const [removed] = reorderedUnsorted.splice(activeIndex, 1);
      reorderedUnsorted.splice(overIndex, 0, removed);

      return { list: [...reorderedUnsorted, ...sortedItems] };
    }),
  moveToSorted: (itemId, targetIndex) =>
    set((state) => {
      const item = state.list.find((item) => item.id === itemId);
      if (!item || item.rank !== 0) return state; // Only move unsorted items

      const sortedItems = state.list
        .filter((item) => item.rank !== 0)
        .sort((a, b) => a.rank - b.rank);

      // Determine the new rank
      let newRank: number;
      if (targetIndex !== undefined && targetIndex < sortedItems.length) {
        // Insert at specific position
        newRank = targetIndex + 1;
        // Update ranks of items that need to be shifted
        const updatedList = state.list.map((listItem) => {
          if (listItem.id === itemId) {
            return { ...listItem, rank: newRank };
          }
          if (listItem.rank !== 0 && listItem.rank >= newRank) {
            return { ...listItem, rank: listItem.rank + 1 };
          }
          return listItem;
        });
        return { list: updatedList };
      } else {
        // Add to end of sorted list
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
      if (!item || item.rank === 0) return state; // Only move ranked items

      // Set rank to 0 and adjust other ranks
      const updatedList = state.list.map((listItem) => {
        if (listItem.id === itemId) {
          return { ...listItem, rank: 0 };
        }
        if (listItem.rank > item.rank) {
          return { ...listItem, rank: listItem.rank - 1 };
        }
        return listItem;
      });

      return { list: updatedList };
    }),
  seedList: () =>
    set((state) => {
      const newItems = Array.from({ length: 10 }, (_, i) => ({
        id: state.list.length + i + 1,
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        rank: 0,
      }));
      return { list: [...state.list, ...newItems] };
    }),
}));

function App() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const {
    list,
    addList,
    updateRank,
    deleteItem,
    reorderSortedItems,
    reorderUnsortedItems,
    moveToSorted,
    moveToUnsorted,
    seedList,
  } = useBearStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddItem = () => {
    if (name.trim() && description.trim()) {
      addList(name.trim(), description.trim());
      setName("");
      setDescription("");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;


    const activeId = Number(active.id);
    const overId = over.id;

    // Check if dropping on a droppable area (list container)
    if (overId === "sorted-list") {
      // Moving to sorted list
      const activeItem = list.find((item) => item.id === activeId);
      if (activeItem && activeItem.rank === 0) {
        moveToSorted(activeId);
      }
    } else if (overId === "unsorted-list") {
      // Moving to unsorted list
      const activeItem = list.find((item) => item.id === activeId);
      if (activeItem && activeItem.rank !== 0) {
        moveToUnsorted(activeId);
      }
    } else {
      // Dropping on another item (reordering within same list)
      const overItemId = Number(overId);
      const activeItem = list.find((item) => item.id === activeId);
      const overItem = list.find((item) => item.id === overItemId);

      if (activeItem && overItem) {
        // Same list reordering
        if ((activeItem.rank === 0) === (overItem.rank === 0)) {
          if (activeItem.rank === 0) {
            reorderUnsortedItems(activeId, overItemId);
          } else {
            reorderSortedItems(activeId, overItemId);
          }
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Row>
        <Col span={12}>
          <DraggableList
            items={list}
            onUpdateRank={updateRank}
            onDelete={deleteItem}
            listType="sorted"
            title="Sorted"
            droppableId="sorted-list"
          />
        </Col>
        <Col span={12}>
          <DraggableList
            items={list}
            onUpdateRank={updateRank}
            onDelete={deleteItem}
            listType="unsorted"
            title="Unsorted"
            droppableId="unsorted-list"
          />
        </Col>
      </Row>

      <DragOverlay>
        {activeId ? (
          <Card
            size="small"
            style={{ opacity: 0.9, cursor: "grabbing", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
          >
            {list.find((i) => i.id === activeId)?.name ?? ""}
          </Card>
        ) : null}
      </DragOverlay>

      <Row gutter={16} style={{ padding: "16px" }}>
        <Col span={8}>
          <Input
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleAddItem}
          />
        </Col>
        <Col span={8}>
          <Input
            placeholder="Item description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPressEnter={handleAddItem}
          />
        </Col>
        <Col span={8}>
          <Button
            type="primary"
            onClick={handleAddItem}
            disabled={!name.trim() || !description.trim()}
          >
            Add Item
          </Button>
        </Col>
        <Col span={24} style={{ marginTop: "8px" }}>
          <Button onClick={seedList}>Seed 10 Random Items</Button>
        </Col>
      </Row>
    </DndContext>
  );
}

export default App;
