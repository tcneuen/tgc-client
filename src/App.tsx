import { useState } from "react";
import { Button, Card, Col, Drawer, Form, Input, Row } from "antd";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [form] = Form.useForm<{ name: string; description: string }>();
  const {
    list,
    addList,
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
    form.validateFields().then(({ name, description }) => {
      addList(name.trim(), description.trim());
      form.resetFields();
      setDrawerOpen(false);
    });
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
      <Row gutter={8} style={{ padding: "16px" }}>
        <Col>
          <Button type="primary" onClick={() => setDrawerOpen(true)}>
            Add Item
          </Button>
        </Col>
        <Col>
          <Button onClick={seedList}>Seed 10 Random Items</Button>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <DraggableList
            items={list}
            onDelete={deleteItem}
            listType="sorted"
            title="Sorted"
            droppableId="sorted-list"
          />
        </Col>
        <Col span={12}>
          <DraggableList
            items={list}
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

      <Drawer
        title="Add New Item"
        placement="right"
        open={drawerOpen}
        onClose={() => { form.resetFields(); setDrawerOpen(false); }}
        footer={
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <Button onClick={() => { form.resetFields(); setDrawerOpen(false); }}>Cancel</Button>
            <Button type="primary" onClick={handleAddItem}>Add Item</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, whitespace: true, message: "Please enter a name" }]}
          >
            <Input placeholder="Item name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, whitespace: true, message: "Please enter a description" }]}
          >
            <Input.TextArea placeholder="Item description" rows={4} />
          </Form.Item>
        </Form>
      </Drawer>
    </DndContext>
  );
}

export default App;
