import { useState } from "react";
import { Button, Col, Input, Row } from "antd";
import { create } from "zustand";
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
}));

function App() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const {
    list,
    addList,
    updateRank,
    deleteItem,
    reorderSortedItems,
    reorderUnsortedItems,
  } = useBearStore();

  const handleAddItem = () => {
    if (name.trim() && description.trim()) {
      addList(name.trim(), description.trim());
      setName("");
      setDescription("");
    }
  };

  return (
    <>
      <Row>
        <Col span={12}>
          <DraggableList
            items={list}
            onUpdateRank={updateRank}
            onDelete={deleteItem}
            onReorder={reorderSortedItems}
            listType="sorted"
            title="Sorted"
          />
        </Col>
        <Col span={12}>
          <DraggableList
            items={list}
            onUpdateRank={updateRank}
            onDelete={deleteItem}
            onReorder={reorderUnsortedItems}
            listType="unsorted"
            title="Unsorted"
          />
        </Col>
      </Row>

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
      </Row>
    </>
  );
}

export default App;
