import { useState } from "react";
import { Button, Card, Col, Input, Row } from "antd";
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
import useBearStore from "./store/useBearStore";
import { seedList } from "./utils/seed";

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
