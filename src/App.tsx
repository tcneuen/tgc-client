import { useState } from "react";
import { Button, Card, Col, Empty, Row, Select, Space } from "antd";
import { ExportOutlined, ImportOutlined, SettingOutlined } from "@ant-design/icons";
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
import AddItemDrawer from "./components/AddItemDrawer";
import DraggableList from "./components/DraggableList";
import CollectionDrawer from "./components/CollectionDrawer";
import useBearStore from "./store/useBearStore";
import useCollectionStore from "./store/useCollectionStore";
import { seedList } from "./utils/seed";
import { useImportExport } from "./hooks/useImportExport";

function App() {
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [collectionDrawerOpen, setCollectionDrawerOpen] = useState(false);
  const [manageDrawerOpen, setManageDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const { list, deleteItem, reorderItemsInList, moveItemToList } =
    useBearStore();
  const { collections, activeCollectionId, selectCollection } =
    useCollectionStore();

  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) ?? null;

  const { importInputRef, handleExport, handleImport, openImportDialog } =
    useImportExport(activeCollection);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const sortedLists = activeCollection
    ? [...activeCollection.lists].sort(
        (a, b) => (b.startingRating ?? -Infinity) - (a.startingRating ?? -Infinity),
      )
    : [];

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
              <Button type="primary" onClick={() => setAddItemOpen(true)}>
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
            {activeCollectionId && (
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                Export
              </Button>
            )}
            <>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImport}
              />
              <Button
                icon={<ImportOutlined />}
                onClick={() => openImportDialog()}
              >
                Import
              </Button>
            </>
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
            {sortedLists.map((listConfig, idx) => {
              const ceiling =
                listConfig.startingRating !== undefined
                  ? idx === 0
                    ? 10
                    : (sortedLists[idx - 1].startingRating ?? 10)
                  : undefined;
              return (
                <Col span={colSpan} key={listConfig.id}>
                  <DraggableList
                    items={collectionItems}
                    collectionId={activeCollectionId}
                    listId={listConfig.id}
                    title={listConfig.name}
                    droppableId={listConfig.id}
                    onDelete={deleteItem}
                    backgroundColor={listConfig.backgroundColor}
                    startingRating={listConfig.startingRating}
                    ratingCeiling={ceiling}
                  />
                </Col>
              );
            })}
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
      {activeCollection && (
        <AddItemDrawer
          open={addItemOpen}
          collection={activeCollection}
          onClose={() => setAddItemOpen(false)}
        />
      )}

      {/* New Collection Drawer */}
      <CollectionDrawer
        open={collectionDrawerOpen}
        onClose={() => setCollectionDrawerOpen(false)}
      />

      {/* Manage Collection Drawer */}
      {activeCollection && (
        <CollectionDrawer
          open={manageDrawerOpen}
          collection={activeCollection}
          onClose={() => setManageDrawerOpen(false)}
        />
      )}
    </DndContext>
  );
}

export default App;
