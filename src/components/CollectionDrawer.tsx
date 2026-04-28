import { useEffect, useState } from "react";
import {
  Button,
  ColorPicker,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import useCollectionStore, {
  type Collection,
  type ListConfig,
} from "../store/useCollectionStore";
import useBearStore from "../store/useBearStore";

const PRESET_COLORS = [
  "#ffffff",
  "#f6ffed",
  "#fff7e6",
  "#e6f4ff",
  "#fff1f0",
  "#f9f0ff",
  "#e6fffb",
  "#fffbe6",
];

// ─── Shared list row ──────────────────────────────────────────────────────────

interface ListRowProps {
  list: ListConfig;
  totalUserLists: number;
  itemCount?: number;
  usedRatings: Set<number>;
  onColorChange: (id: string, color: string) => void;
  onRename: (id: string, name: string) => void;
  onRatingChange: (id: string, rating: number | undefined) => void;
  onDelete: (list: ListConfig) => void;
}

function ListRow({
  list,
  totalUserLists,
  itemCount,
  usedRatings,
  onColorChange,
  onRename,
  onRatingChange,
  onDelete,
}: ListRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(list.name);
  const [ratingInput, setRatingInput] = useState(
    list.startingRating !== undefined ? list.startingRating.toFixed(2) : "",
  );
  const [ratingError, setRatingError] = useState("");

  const saveRename = () => {
    if (draft.trim()) onRename(list.id, draft.trim());
    setRenaming(false);
  };

  const handleRatingBlur = () => {
    if (ratingInput === "") {
      onRatingChange(list.id, undefined);
      setRatingError("");
      return;
    }
    const parsed = parseFloat(ratingInput);
    if (Number.isNaN(parsed)) {
      setRatingError("Must be a number");
      return;
    }
    if (parsed < 0 || parsed > 10) {
      setRatingError("Must be 0–10");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(ratingInput.trim())) {
      setRatingError("Max 2 decimals");
      return;
    }
    if (usedRatings.has(parsed) && parsed !== list.startingRating) {
      setRatingError("Already used");
      return;
    }
    setRatingError("");
    onRatingChange(list.id, parsed);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px",
        border: "1px solid #f0f0f0",
        borderRadius: "6px",
        backgroundColor: list.backgroundColor ?? "#ffffff",
      }}
    >
      {renaming ? (
        <Space.Compact style={{ flex: 1 }}>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPressEnter={saveRename}
            autoFocus
          />
          <Button icon={<SaveOutlined />} onClick={saveRename} />
        </Space.Compact>
      ) : (
        <span style={{ flex: 1 }}>
          {list.name}
          {itemCount !== undefined && (
            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
              ({itemCount} item{itemCount !== 1 ? "s" : ""})
            </Typography.Text>
          )}
          {list.protected && (
            <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
              (default)
            </Typography.Text>
          )}
        </span>
      )}

      {!renaming && (
        <>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <Input
              size="small"
              placeholder="Rating"
              value={ratingInput}
              onChange={(e) => { setRatingInput(e.target.value); setRatingError(""); }}
              onBlur={handleRatingBlur}
              onPressEnter={handleRatingBlur}
              style={{ width: 70, textAlign: "right" }}
              status={ratingError ? "error" : ""}
            />
            {ratingError && (
              <Typography.Text type="danger" style={{ fontSize: 10 }}>{ratingError}</Typography.Text>
            )}
          </div>
          <ColorPicker
            size="small"
            value={list.backgroundColor ?? "#ffffff"}
            presets={[{ label: "Presets", colors: PRESET_COLORS }]}
            onChange={(color) => onColorChange(list.id, color.toHexString())}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={!!list.protected}
            onClick={() => { setDraft(list.name); setRenaming(true); }}
          />
          <Popconfirm
            title={`Delete "${list.name}"?`}
            description={
              itemCount !== undefined && itemCount > 0
                ? `${itemCount} item${itemCount !== 1 ? "s" : ""} will need to be moved.`
                : "This list has no items."
            }
            okText="Delete"
            okButtonProps={{ danger: true }}
            disabled={!!list.protected || totalUserLists <= 1}
            onConfirm={() => onDelete(list)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!!list.protected || totalUserLists <= 1}
              title={
                list.protected
                  ? "Cannot delete the Ungraded list"
                  : totalUserLists <= 1
                    ? "Cannot delete the only list"
                    : undefined
              }
            />
          </Popconfirm>
        </>
      )}
    </div>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

interface CollectionDrawerProps {
  open: boolean;
  onClose: () => void;
  /** If provided, the drawer operates in "manage" mode; otherwise "create" mode. */
  collection?: Collection;
}

export default function CollectionDrawer({
  open,
  onClose,
  collection,
}: CollectionDrawerProps) {
  const {
    createCollection,
    updateCollection,
    deleteCollection,
    addListToCollection,
    updateListColor,
    updateListRating,
    renameList,
    removeList,
  } = useCollectionStore();
  const { moveAllItemsFromList, deleteItemsByCollection, list: storeList } =
    useBearStore();

  const isManage = !!collection;

  // ── Create-mode state ──
  const [form] = Form.useForm<{ name: string }>();
  const [draftLists, setDraftLists] = useState<ListConfig[]>([]);

  // ── Manage-mode state ──
  const [collName, setCollName] = useState(collection?.name ?? "");
  const [defaultListId, setDefaultListId] = useState(
    collection?.defaultListId ?? "",
  );

  // ── Shared ──
  const [newListName, setNewListName] = useState("");
  const [deleteListModal, setDeleteListModal] = useState<{
    listId: string;
    listName: string;
  } | null>(null);
  const [moveToListId, setMoveToListId] = useState("");

  useEffect(() => {
    if (collection) {
      setCollName(collection.name);
      setDefaultListId(collection.defaultListId);
    }
  }, [collection]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const newList: ListConfig = { id: crypto.randomUUID(), name: trimmed };
    if (isManage && collection) {
      addListToCollection(collection.id, newList);
    } else {
      setDraftLists((prev) => [...prev, newList]);
    }
    setNewListName("");
  };

  const handleDraftColorChange = (id: string, color: string) =>
    setDraftLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, backgroundColor: color } : l)),
    );

  const handleDraftRatingChange = (id: string, rating: number | undefined) =>
    setDraftLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, startingRating: rating } : l)),
    );

  const handleDraftRename = (id: string, name: string) =>
    setDraftLists((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name } : l)),
    );

  const handleDraftDelete = (l: ListConfig) =>
    setDraftLists((prev) => prev.filter((d) => d.id !== l.id));

  const handleManageDeleteList = (l: ListConfig) => {
    if (!collection) return;
    const hasItems = storeList.some(
      (i) => i.collectionId === collection.id && i.listId === l.id,
    );
    const others = collection.lists.filter((ol) => ol.id !== l.id);
    if (hasItems && others.length > 0) {
      setMoveToListId(others[0].id);
      setDeleteListModal({ listId: l.id, listName: l.name });
    } else {
      if (hasItems) moveAllItemsFromList(collection.id, l.id, "");
      removeList(collection.id, l.id);
    }
  };

  const handleConfirmDeleteList = () => {
    if (!deleteListModal || !collection) return;
    if (moveToListId) {
      moveAllItemsFromList(collection.id, deleteListModal.listId, moveToListId);
    }
    removeList(collection.id, deleteListModal.listId);
    setDeleteListModal(null);
  };

  const handleCreate = () => {
    form.validateFields().then(({ name }) => {
      createCollection(name, draftLists);
      handleClose();
    });
  };

  const handleSaveCollection = () => {
    if (!collName.trim() || !collection) return;
    updateCollection(collection.id, collName.trim(), defaultListId);
  };

  const handleDeleteCollection = () => {
    if (!collection) return;
    deleteItemsByCollection(collection.id);
    deleteCollection(collection.id);
    onClose();
  };

  const handleClose = () => {
    form.resetFields();
    setDraftLists([]);
    setNewListName("");
    onClose();
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const displayLists = isManage ? (collection?.lists ?? []) : draftLists;
  const userListCount = displayLists.filter((l) => !l.protected).length;
  const usedRatings = new Set(
    displayLists
      .map((l) => l.startingRating)
      .filter((r): r is number => r !== undefined),
  );
  const moveTargetOptions = (collection?.lists ?? [])
    .filter((l) => l.id !== deleteListModal?.listId)
    .map((l) => ({ value: l.id, label: l.name }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Drawer
        title={isManage ? "Manage Collection" : "New Collection"}
        placement="right"
        open={open}
        onClose={handleClose}
        width={440}
        footer={
          isManage ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Popconfirm
                title="Delete this collection?"
                description="All items in this collection will be permanently deleted."
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={handleDeleteCollection}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete Collection
                </Button>
              </Popconfirm>
              <Button onClick={handleClose}>Close</Button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="primary" onClick={handleCreate}>
                Create
              </Button>
            </div>
          )
        }
      >
        {/* Create: collection name */}
        {!isManage && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Collection Name"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Please enter a collection name",
                },
              ]}
            >
              <Input placeholder="e.g. Movies, Games, Books..." />
            </Form.Item>
          </Form>
        )}

        {/* Manage: collection name + default list */}
        {isManage && collection && (
          <Form layout="vertical">
            <Form.Item label="Collection Name">
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  value={collName}
                  onChange={(e) => setCollName(e.target.value)}
                  onPressEnter={handleSaveCollection}
                />
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveCollection}
                  disabled={
                    !collName.trim() || collName.trim() === collection.name
                  }
                >
                  Save
                </Button>
              </Space.Compact>
            </Form.Item>
            <Form.Item label="Default List for New Items">
              <Select
                value={defaultListId}
                onChange={(v) => {
                  setDefaultListId(v);
                  updateCollection(
                    collection.id,
                    collName.trim() || collection.name,
                    v,
                  );
                }}
                options={collection.lists.map((l) => ({
                  value: l.id,
                  label: l.name,
                }))}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Form>
        )}

        {/* Lists */}
        <Typography.Title level={5} style={{ marginTop: 8, marginBottom: 8 }}>
          Lists
        </Typography.Title>

        {/* Locked Ungraded placeholder shown only in create mode */}
        {!isManage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              border: "1px solid #f0f0f0",
              borderRadius: "6px",
              marginBottom: "8px",
              color: "#8c8c8c",
              fontSize: 13,
            }}
          >
            <span style={{ flex: 1 }}>
              Ungraded{" "}
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                (default, always present)
              </Typography.Text>
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {displayLists.map((l) => {
            const itemCount =
              isManage && collection
                ? storeList.filter(
                    (i) =>
                      i.collectionId === collection.id && i.listId === l.id,
                  ).length
                : undefined;

            return (
              <ListRow
                key={l.id}
                list={l}
                totalUserLists={userListCount}
                itemCount={itemCount}
                usedRatings={usedRatings}
                onColorChange={
                  isManage && collection
                    ? (id, color) => updateListColor(collection.id, id, color)
                    : handleDraftColorChange
                }
                onRename={
                  isManage && collection
                    ? (id, name) => renameList(collection.id, id, name)
                    : handleDraftRename
                }
                onRatingChange={
                  isManage && collection
                    ? (id, rating) => updateListRating(collection.id, id, rating)
                    : handleDraftRatingChange
                }
                onDelete={isManage ? handleManageDeleteList : handleDraftDelete}
              />
            );
          })}
        </div>

        <Space.Compact style={{ width: "100%", marginTop: "12px" }}>
          <Input
            placeholder="New list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onPressEnter={handleAddList}
          />
          <Button icon={<PlusOutlined />} onClick={handleAddList}>
            Add List
          </Button>
        </Space.Compact>
      </Drawer>

      {/* Move-items modal (manage only) */}
      <Modal
        title={`Delete "${deleteListModal?.listName}"`}
        open={!!deleteListModal}
        onCancel={() => setDeleteListModal(null)}
        onOk={handleConfirmDeleteList}
        okText="Delete & Move"
        okButtonProps={{ danger: true }}
      >
        <p>Select which list to move all items to before deleting:</p>
        <Select
          value={moveToListId}
          onChange={setMoveToListId}
          options={moveTargetOptions}
          style={{ width: "100%" }}
        />
      </Modal>
    </>
  );
}

