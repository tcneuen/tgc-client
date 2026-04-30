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
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import type { ApiCollection, ApiList } from "../types/api";
import { useNavigate } from "react-router-dom";
import {
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useCreateList,
  useUpdateList,
  useDeleteList,
} from "../hooks/useCollections";
import { useItems } from "../hooks/useItems";

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

// ─── Draft list type (create mode only) ──────────────────────────────────────

interface DraftList {
  id: string;
  name: string;
  startingRating?: number;
  backgroundColor?: string;
}

// ─── Shared list row ──────────────────────────────────────────────────────────

interface ListRowProps {
  list: ApiList | DraftList;
  totalUserLists: number;
  itemCount?: number;
  usedRatings: Set<number>;
  onColorChange: (id: string, color: string) => void;
  onRename: (id: string, name: string) => void;
  onRatingChange: (id: string, rating: number | undefined) => void;
  onDelete: (list: ApiList | DraftList) => void;
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
  const isProtected = "protected" in list ? list.protected : false;
  const initRating =
    list.startingRating != null ? list.startingRating.toFixed(2) : "";
  const [ratingInput, setRatingInput] = useState(initRating);
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
    if (parsed < 0 || parsed > 9.5) {
      setRatingError("Must be 0–9.50");
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
    setRatingInput(parsed.toFixed(2));
    onRatingChange(list.id, parsed);
  };

  const bgColor =
    list.backgroundColor != null ? list.backgroundColor : "#ffffff";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px",
        border: "1px solid #f0f0f0",
        borderRadius: "6px",
        backgroundColor: bgColor,
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
          {isProtected && (
            <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
              (default)
            </Typography.Text>
          )}
        </span>
      )}

      {!renaming && (
        <>
          {!isProtected && (
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
          )}
          <ColorPicker
            size="small"
            value={bgColor}
            presets={[{ label: "Presets", colors: PRESET_COLORS }]}
            onChange={(color) => onColorChange(list.id, color.toHexString())}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={isProtected}
            onClick={() => { setDraft(list.name); setRenaming(true); }}
          />
          <Popconfirm
            title={`Delete "${list.name}"?`}
            description={
              itemCount !== undefined && itemCount > 0
                ? `${itemCount} item${itemCount !== 1 ? "s" : ""} will be moved or deleted.`
                : "This list has no items."
            }
            okText="Delete"
            okButtonProps={{ danger: true }}
            disabled={isProtected || totalUserLists <= 1}
            onConfirm={() => onDelete(list)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={isProtected || totalUserLists <= 1}
              title={
                isProtected
                  ? "Cannot delete the Unrated list"
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
  collection?: ApiCollection;
  onExport?: () => void;
  onImport?: () => void;
}

export default function CollectionDrawer({
  open,
  onClose,
  collection,
  onExport,
  onImport,
}: CollectionDrawerProps) {
  const navigate = useNavigate();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const createList = useCreateList();
  const updateList = useUpdateList();
  const deleteList = useDeleteList();

  const { data: allItems = [] } = useItems(collection?.id ?? null);

  const isManage = !!collection;

  // ── Create-mode state ──
  const [form] = Form.useForm<{ name: string }>();
  const [draftLists, setDraftLists] = useState<DraftList[]>([]);

  // ── Manage-mode state ──
  const [collName, setCollName] = useState(collection?.name ?? "");
  const [defaultListId, setDefaultListId] = useState(
    collection?.defaultListId ?? "",
  );

  // ── Shared ──
  const [newListName, setNewListName] = useState("");
  const [newListRating, setNewListRating] = useState("");
  const [newListRatingError, setNewListRatingError] = useState("");
  const [deleteListModal, setDeleteListModal] = useState<{
    listId: string;
    listName: string;
  } | null>(null);
  const [moveToListId, setMoveToListId] = useState("");

  useEffect(() => {
    if (collection) {
      setCollName(collection.name);
      setDefaultListId(collection.defaultListId ?? "");
    }
  }, [collection]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;

    const parsedRating = parseFloat(newListRating);
    if (newListRating.trim() === "") {
      setNewListRatingError("Required");
      return;
    }
    if (Number.isNaN(parsedRating)) {
      setNewListRatingError("Must be a number");
      return;
    }
    if (parsedRating < 0 || parsedRating > 9.5) {
      setNewListRatingError("Must be 0–9.50");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(newListRating.trim())) {
      setNewListRatingError("Max 2 decimals");
      return;
    }
    const displayLists = isManage ? (collection?.lists ?? []) : draftLists;
    const alreadyUsed = displayLists.some(
      (l) => l.startingRating === parsedRating,
    );
    if (alreadyUsed) {
      setNewListRatingError("Already used");
      return;
    }

    if (isManage && collection) {
      createList.mutate({
        collectionId: collection.id,
        name: trimmed,
        startingRating: parsedRating,
      });
    } else {
      setDraftLists((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: trimmed, startingRating: parsedRating },
      ]);
    }
    setNewListName("");
    setNewListRating("");
    setNewListRatingError("");
  };

  // Draft-mode helpers
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
  const handleDraftDelete = (l: DraftList) =>
    setDraftLists((prev) => prev.filter((d) => d.id !== l.id));

  // Manage-mode list deletion with optional item move
  const handleManageDeleteList = (l: ApiList) => {
    if (!collection) return;
    const hasItems = allItems.some(
      (i) => i.collectionId === collection.id && i.listId === l.id,
    );
    const others = collection.lists.filter((ol) => ol.id !== l.id && !ol.protected);
    if (hasItems && others.length > 0) {
      setMoveToListId(others[0].id);
      setDeleteListModal({ listId: l.id, listName: l.name });
    } else {
      deleteList.mutate({ collectionId: collection.id, listId: l.id });
    }
  };

  const handleConfirmDeleteList = () => {
    if (!deleteListModal || !collection) return;
    deleteList.mutate({
      collectionId: collection.id,
      listId: deleteListModal.listId,
      moveToListId: moveToListId || undefined,
      items: allItems,
    });
    setDeleteListModal(null);
  };

  const handleCreate = () => {
    form.validateFields().then(({ name }) => {
      createCollection.mutate(
        { name, draftLists },
        {
          onSuccess: (newId) => {
            navigate(`/collections/${newId}`);
            handleClose();
          },
        },
      );
    });
  };

  const handleSaveCollection = () => {
    if (!collName.trim() || !collection) return;
    updateCollection.mutate({
      id: collection.id,
      name: collName.trim(),
    });
  };

  const handleDeleteCollection = () => {
    if (!collection) return;
    deleteCollection.mutate(collection.id, {
      onSuccess: () => {
        navigate('/');
        onClose();
      },
    });
  };

  const handleClose = () => {
    form.resetFields();
    setDraftLists([]);
    setNewListName("");
    setNewListRating("");
    setNewListRatingError("");
    onClose();
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const displayLists: (ApiList | DraftList)[] = isManage
    ? (collection?.lists ?? [])
    : draftLists;
  const userListCount = displayLists.filter(
    (l) => !("protected" in l && l.protected),
  ).length;
  const usedRatings = new Set(
    displayLists
      .map((l) => l.startingRating)
      .filter((r): r is number => r != null),
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
                <Button danger icon={<DeleteOutlined />} loading={deleteCollection.isPending}>
                  Delete Collection
                </Button>
              </Popconfirm>
              <Space>
                {onExport && (
                  <Button icon={<ExportOutlined />} onClick={onExport}>
                    Export
                  </Button>
                )}
                <Button onClick={handleClose}>Close</Button>
              </Space>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {onImport ? (
                <Button icon={<ImportOutlined />} onClick={onImport}>
                  Import
                </Button>
              ) : <span />}
              <Space>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                  type="primary"
                  onClick={handleCreate}
                  loading={createCollection.isPending}
                >
                  Create
                </Button>
              </Space>
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
                  loading={updateCollection.isPending}
                >
                  Save
                </Button>
              </Space.Compact>
            </Form.Item>
            <Form.Item label="Default List for New Items">
              <Select
                value={defaultListId || undefined}
                onChange={(v) => {
                  setDefaultListId(v);
                  updateCollection.mutate({
                    id: collection.id,
                    defaultListId: v,
                  });
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

        {/* Locked Unrated placeholder shown only in create mode */}
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
              Unrated{" "}
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
                ? allItems.filter(
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
                    ? (id, color) =>
                        updateList.mutate({ collectionId: collection.id, listId: id, backgroundColor: color })
                    : handleDraftColorChange
                }
                onRename={
                  isManage && collection
                    ? (id, name) =>
                        updateList.mutate({ collectionId: collection.id, listId: id, name })
                    : handleDraftRename
                }
                onRatingChange={
                  isManage && collection
                    ? (id, rating) =>
                        updateList.mutate({ collectionId: collection.id, listId: id, startingRating: rating ?? null })
                    : handleDraftRatingChange
                }
                onDelete={
                  isManage && collection
                    ? (list) => handleManageDeleteList(list as ApiList)
                    : (list) => handleDraftDelete(list as DraftList)
                }
              />
            );
          })}
        </div>

        {/* Add list form */}
        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Add a list
          </Typography.Text>
          <Space.Compact style={{ width: "100%", marginTop: 4 }}>
            <Input
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onPressEnter={handleAddList}
              style={{ flex: 2 }}
            />
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <Input
                placeholder="Rating"
                value={newListRating}
                onChange={(e) => { setNewListRating(e.target.value); setNewListRatingError(""); }}
                onPressEnter={handleAddList}
                status={newListRatingError ? "error" : ""}
              />
            </div>
            <Button icon={<PlusOutlined />} onClick={handleAddList} />
          </Space.Compact>
          {newListRatingError && (
            <Typography.Text type="danger" style={{ fontSize: 11 }}>
              {newListRatingError}
            </Typography.Text>
          )}
        </div>
      </Drawer>

      {/* Delete-list + move items modal */}
      <Modal
        open={!!deleteListModal}
        title={`Delete "${deleteListModal?.listName}"?`}
        okText="Delete List"
        okButtonProps={{ danger: true }}
        onOk={handleConfirmDeleteList}
        onCancel={() => setDeleteListModal(null)}
      >
        <Typography.Text>
          This list has items. Move them to another list before deleting:
        </Typography.Text>
        <Select
          style={{ width: "100%", marginTop: 8 }}
          value={moveToListId}
          onChange={setMoveToListId}
          options={moveTargetOptions}
        />
      </Modal>
    </>
  );
}

