import { useState } from "react";
import { Button, Card, Col, Empty, Row, Select, Space, Spin } from "antd";
import { LogoutOutlined, OrderedListOutlined, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import useAuthStore from "./store/useAuthStore";
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
import RankingsModal from "./components/RankingsModal";
import useCollectionStore from "./store/useCollectionStore";
import { seedList } from "./utils/seed";
import { useImportExport } from "./hooks/useImportExport";
import { useCollections } from "./hooks/useCollections";
import { useItems, useDeleteItem, useMoveItem, itemsKey } from "./hooks/useItems";
import { useQueryClient } from "@tanstack/react-query";

function App() {
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [collectionDrawerOpen, setCollectionDrawerOpen] = useState(false);
  const [manageDrawerOpen, setManageDrawerOpen] = useState(false);
  const [rankingsOpen, setRankingsOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const { activeCollectionId, selectCollection } = useCollectionStore();
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();

  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const { data: items = [], isFetching: itemsFetching } = useItems(activeCollectionId);
  const deleteItem = useDeleteItem();
  const moveItem = useMoveItem();

  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) ?? null;

  const { importInputRef, handleExport, handleImport, openImportDialog } =
    useImportExport(activeCollection, items);

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
    if (!over || !activeCollection || !activeCollectionId) return;

    const activeItemId = Number(active.id);
    const overId = String(over.id);
    const activeItem = items.find((i) => i.id === activeItemId);
    if (!activeItem) return;

    // Helper: get items in a list in linked-list order (handles orphan items)
    const listItemsOrdered = (listId: string) => {
      const listItems = items.filter((i) => i.listId === listId);
      const byId = new Map(listItems.map((i) => [i.id, i]));
      const visited = new Set<number>();
      const result: typeof listItems = [];
      const heads = listItems.filter(
        (i) => i.prevId === null || !byId.has(i.prevId),
      );
      for (const head of heads) {
        let cur: typeof listItems[0] | undefined = head;
        while (cur && !visited.has(cur.id)) {
          result.push(cur);
          visited.add(cur.id);
          cur = cur.nextId != null ? byId.get(cur.nextId) : undefined;
        }
      }
      for (const i of listItems) {
        if (!visited.has(i.id)) result.push(i);
      }
      return result;
    };

    // Dropping on a list container (droppable)
    const isOverListContainer = activeCollection.lists.some(
      (l) => l.id === overId,
    );

    if (isOverListContainer) {
      if (activeItem.listId !== overId) {
        // Move to tail of the target list
        const targetItems = listItemsOrdered(overId).filter(
          (i) => i.id !== activeItemId,
        );
        const afterId =
          targetItems.length > 0
            ? targetItems[targetItems.length - 1].id
            : null;
        moveItem.mutate({
          collectionId: activeCollectionId,
          itemId: activeItemId,
          listId: overId,
          afterId,
        });
      }
    } else {
      const overItemId = Number(overId);
      const overItem = items.find((i) => i.id === overItemId);
      if (!overItem || activeItem.id === overItem.id) return;

      if (activeItem.listId === overItem.listId) {
        // Reorder within same list — place immediately before overItem
        const listItems = listItemsOrdered(activeItem.listId).filter(
          (i) => i.id !== activeItemId,
        );
        const toIdx = listItems.findIndex((i) => i.id === overItemId);
        // Place before overItem means afterId = item before it (or null if head)
        const afterId = toIdx > 0 ? listItems[toIdx - 1].id : null;
        moveItem.mutate({
          collectionId: activeCollectionId,
          itemId: activeItemId,
          listId: activeItem.listId,
          afterId,
        });
      } else {
        // Move to different list, place before the over item
        const listItems = listItemsOrdered(overItem.listId).filter(
          (i) => i.id !== activeItemId,
        );
        const toIdx = listItems.findIndex((i) => i.id === overItemId);
        const afterId = toIdx > 0 ? listItems[toIdx - 1].id : null;
        moveItem.mutate({
          collectionId: activeCollectionId,
          itemId: activeItemId,
          listId: overItem.listId,
          afterId,
        });
      }
    }
  };

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
                  ).then(() => {
                    void qc.invalidateQueries({ queryKey: itemsKey(activeCollectionId) });
                  })
                }
              >
                Seed 10 Random Items
              </Button>
              <Button
                icon={<OrderedListOutlined />}
                onClick={() => setRankingsOpen(true)}
              >
                Rankings
              </Button>
              <Button
                icon={<ReloadOutlined spin={itemsFetching} />}
                onClick={() => {
                  if (activeCollectionId) {
                    void qc.invalidateQueries({ queryKey: itemsKey(activeCollectionId) });
                  }
                }}
                title="Refresh items"
              />
            </Space>
          )}
        </Col>
        <Col>
          <Space>
            {collectionsLoading ? (
              <Spin size="small" />
            ) : (
              <Select
                placeholder="Select a collection"
                value={activeCollectionId ?? undefined}
                onChange={selectCollection}
                style={{ minWidth: 220 }}
                options={collections.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
            {activeCollectionId && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setManageDrawerOpen(true)}
              />
            )}
            <Button onClick={() => setCollectionDrawerOpen(true)}>
              New Collection
            </Button>
            <Button icon={<LogoutOutlined />} onClick={logout} title="Sign out" />
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
            {sortedLists.map((listConfig) => {
              return (
                <Col span={colSpan} key={listConfig.id}>
                  <DraggableList
                    items={items}
                    collectionId={activeCollectionId}
                    listId={listConfig.id}
                    title={listConfig.name}
                    droppableId={listConfig.id}
                    isLoading={itemsFetching}
                    onDelete={(id) =>
                      deleteItem.mutate({
                        collectionId: activeCollectionId,
                        itemId: id,
                      })
                    }
                    backgroundColor={listConfig.backgroundColor ?? undefined}
                    startingRating={listConfig.startingRating ?? undefined}
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
            {items.find((i) => i.id === activeId)?.name ?? ""}
          </Card>
        ) : null}
      </DragOverlay>

      <RankingsModal
        open={rankingsOpen}
        onClose={() => setRankingsOpen(false)}
        collection={activeCollection}
        items={items}
      />

      {/* Add Item Drawer */}
      {activeCollection && (
        <AddItemDrawer
          open={addItemOpen}
          collection={activeCollection}
          onClose={() => setAddItemOpen(false)}
        />
      )}

      {/* New Collection Drawer */}
      <>
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleImport}
        />
        <CollectionDrawer
          open={collectionDrawerOpen}
          onClose={() => setCollectionDrawerOpen(false)}
          onImport={openImportDialog}
        />
      </>

      {/* Manage Collection Drawer */}
      {activeCollection && (
        <CollectionDrawer
          open={manageDrawerOpen}
          collection={activeCollection}
          onClose={() => setManageDrawerOpen(false)}
          onExport={handleExport}
        />
      )}
    </DndContext>
  );
}

export default App;
