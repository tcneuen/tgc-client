import { useState } from "react";
import { Button, Col, Input, Row } from "antd";
import { create } from "zustand";
import SortedList from "./components/SortedList";
import UnsortedList from "./components/UnsortedList";

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
}));

function App() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { list, addList, updateRank, deleteItem } = useBearStore();

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
          <SortedList
            items={list}
            onUpdateRank={updateRank}
            onDelete={deleteItem}
          />
        </Col>
        <Col span={12}>
          <UnsortedList
            items={list}
            onUpdateRank={updateRank}
            onDelete={deleteItem}
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
