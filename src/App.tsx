import { useState } from "react";
import { Button, Card, Col, Drawer, Empty, Form, Input, Row, Select, Space } from "antd";
import { SettingOutlined } from "@ant-design/icons";
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
import CollectionDrawer from "./components/CollectionDrawer";
import ManageCollectionDrawer from "./components/ManageCollectionDrawer";
import useBearStore from "./store/useBearStore";
import useCollectionStore from "./store/useCollectionStore";
import { seedList } from "./utils/seed";

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collectionDrawerOpen, setCollectionDrawerOpen] = useState(false);
  const [manageDrawerOpen, setManageDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [form] = Form.useForm<{ name: string; description: string; listId: string }>();

  const { list, addItem, deleteItem, reorderItemsInList, moveItemToList } =
    useBearStore();
  const { collections, activeCollectionId, selectCollection } =
    useCollectionStore();

  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const openAddDrawer = () => {
    if (activeCollection) {
      form.setFieldValue("listId", activeCollection.defaultListId);
    }
    setDrawerOpen(true);
  };

  const handleAddItem = () => {
    form.validateFields().then(({ name, description, listId }) => {
      addItem(name.trim(), description.trim(), activeCollectionId ?? "", listId);
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
    if (!over || !activeCollection) return;

    const activeItemId = Number(active.id);
    const overId = String(over.id);

    // Check if dropping on a list container (droppable)
    const isOverListContainer = activeCollection.lists.some(
      (l) => l.id === overId,
    );

    if (isOverListContainer) {
      const activeItem = list.find((i) => i.id === activeItemId);
      if (activeItem && activeItem.listId !== overId) {
        moveItemToList(activeItemId, overId);
      }
    } else {
      // Dropping on another item
      const overItemId = Number(overId);
      const activeItem = list.find((i) => i.id === activeItemId);
      const overItem = list.find((i) => i.id === overItemId);

      if (activeItem && overItem) {
        if (activeItem.listId === overItem.listId) {
          reorderItemsInList(activeItemId, overItemId);
        } else {
          moveItemToList(activeItemId, overItem.listId, overItem.order - 1);
        }
      }
    }
  };

  const collectionItems = activeCollectionId
    ? list.filter((i) => i.collectionId === activeCollectionId)
    : [];

  const colSpan = activeCollection
    ? Math.floor(24 / activeCollection.lists.length)
    : 12;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Header: action buttons left, collection controls right */}
      <Row
        align="middle"
        justify="space-between"
        style={{ padding: "16px 16px 8px" }}
      >
        <Col>
          {activeCollectionId && (
            <Space>
              <Button type="primary" onClick={openAddDrawer}>
                Add Item
              </Button>
              <Button
                onClick={() =>
                  seedList(
                    activeCollectionId,
                    activeCollection?.defaultListId ?? "",
                  )
                }
              >
                Seed 10 Random Items
              </Button>
            </Space>
          )}
        </Col>
        <Col>
          <Space>
            <Select
              placeholder="Select a collection"
              value={activeCollectionId ?? undefined}
              onChange={selectCollection}
              style={{ minWidth: 220 }}
              options={collections.map((c) => ({ value: c.id, label: c.name }))}
            />
            {activeCollectionId && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setManageDrawerOpen(true)}
              />
            )}
            <Button onClick={() => setCollectionDrawerOpen(true)}>
              New Collection
            </Button>
          </Space>
        </Col>
      </Row>

      {!activeCollectionId ? (
        <Empty
          description="Create or select a collection to start ranking"
          style={{ padding: "64px 0" }}
        />
      ) : (
        <>
          <Row>
            {activeCollection?.lists.map((listConfig) => (
              <Col span={colSpan} key={listConfig.id}>
                <DraggableList
                  items={collectionItems}
                  collectionId={activeCollectionId}
                  listId={listConfig.id}
                  title={listConfig.name}
                  droppableId={listConfig.id}
                  onDelete={deleteItem}
                />
              </Col>
            ))}
          </Row>
        </>
      )}

      <DragOverlay>
        {activeId ? (
          <Card
            size="small"
            style={{
              opacity: 0.9,
              cursor: "grabbing",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {list.find((i) => i.id === activeId)?.name ?? ""}
          </Card>
        ) : null}
      </DragOverlay>

      {/* Add Item Drawer */}
      <Drawer
        title="Add New Item"
        placement="right"
        open={drawerOpen}
        onClose={() => {
          form.resetFields();
          setDrawerOpen(false);
        }}
        footer={
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                form.resetFields();
                setDrawerOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Please enter a name",
              },
            ]}
          >
            <Input placeholder="Item name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Please enter a description",
              },
            ]}
          >
            <Input.TextArea placeholder="Item description" rows={4} />
          </Form.Item>
          <Form.Item
            name="listId"
            label="List"
            rules={[{ required: true, message: "Please select a list" }]}
          >
            <Select
              options={activeCollection?.lists.map((l) => ({
                value: l.id,
                label: l.name,
              }))}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* New Collection Drawer */}
      <CollectionDrawer
        open={collectionDrawerOpen}
        onClose={() => setCollectionDrawerOpen(false)}
      />

      {/* Manage Collection Drawer */}
      {activeCollection && (
        <ManageCollectionDrawer
          open={manageDrawerOpen}
          collection={activeCollection}
          onClose={() => setManageDrawerOpen(false)}
        />
      )}
    </DndContext>
  );
}

export default App;
