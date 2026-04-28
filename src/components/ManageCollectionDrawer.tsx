import { useEffect, useState } from "react";
import {
  Button,
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

interface ManageCollectionDrawerProps {
  open: boolean;
  collection: Collection;
  onClose: () => void;
}

export default function ManageCollectionDrawer({
  open,
  collection,
  onClose,
}: ManageCollectionDrawerProps) {
  const { updateCollection, deleteCollection, addListToCollection, renameList, removeList } =
    useCollectionStore();
  const { moveAllItemsFromList, deleteItemsByCollection, list } = useBearStore();

  // Collection name edit
  const [collName, setCollName] = useState(collection.name);
  const [defaultListId, setDefaultListId] = useState(collection.defaultListId);

  // New list input
  const [newListName, setNewListName] = useState("");

  // Inline list rename state: listId -> draft name
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  // Delete-list modal
  const [deleteListModal, setDeleteListModal] = useState<{
    listId: string;
    listName: string;
  } | null>(null);
  const [moveToListId, setMoveToListId] = useState<string>("");

  // Sync when collection prop changes (e.g. after rename)
  useEffect(() => {
    setCollName(collection.name);
    setDefaultListId(collection.defaultListId);
  }, [collection.name, collection.defaultListId]);

  const handleSaveCollection = () => {
    if (!collName.trim()) return;
    updateCollection(collection.id, collName.trim(), defaultListId);
  };

  const handleAddList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const newList: ListConfig = { id: crypto.randomUUID(), name: trimmed };
    addListToCollection(collection.id, newList);
    setNewListName("");
  };

  const handleStartRename = (l: ListConfig) => {
    setRenamingId(l.id);
    setRenameDraft(l.name);
  };

  const handleSaveRename = (listId: string) => {
    if (renameDraft.trim()) {
      renameList(collection.id, listId, renameDraft.trim());
    }
    setRenamingId(null);
    setRenameDraft("");
  };

  const handleRequestDeleteList = (l: ListConfig) => {
    const hasItems = list.some(
      (i) => i.collectionId === collection.id && i.listId === l.id,
    );
    const otherLists = collection.lists.filter((ol) => ol.id !== l.id);

    if (hasItems && otherLists.length > 0) {
      setMoveToListId(otherLists[0].id);
      setDeleteListModal({ listId: l.id, listName: l.name });
    } else {
      // No items or no other lists — just remove (items will be gone if no other list)
      if (hasItems) {
        // Only one list left, items will be deleted with it
        moveAllItemsFromList(collection.id, l.id, "");
      }
      removeList(collection.id, l.id);
    }
  };

  const handleConfirmDeleteList = () => {
    if (!deleteListModal) return;
    if (moveToListId) {
      moveAllItemsFromList(collection.id, deleteListModal.listId, moveToListId);
    }
    removeList(collection.id, deleteListModal.listId);
    setDeleteListModal(null);
  };

  const handleDeleteCollection = () => {
    deleteItemsByCollection(collection.id);
    deleteCollection(collection.id);
    onClose();
  };

  const moveTargetOptions = collection.lists
    .filter((l) => l.id !== deleteListModal?.listId)
    .map((l) => ({ value: l.id, label: l.name }));

  return (
    <>
      <Drawer
        title="Manage Collection"
        placement="right"
        open={open}
        onClose={onClose}
        width={440}
        footer={
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
            <Button onClick={onClose}>Close</Button>
          </div>
        }
      >
        {/* Collection name & default list */}
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
                disabled={!collName.trim() || collName.trim() === collection.name}
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
                updateCollection(collection.id, collName.trim() || collection.name, v);
              }}
              options={collection.lists.map((l) => ({
                value: l.id,
                label: l.name,
              }))}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>

        <Typography.Title level={5} style={{ marginTop: 8 }}>
          Lists
        </Typography.Title>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {collection.lists.map((l) => {
            const itemCount = list.filter(
              (i) => i.collectionId === collection.id && i.listId === l.id,
            ).length;

            return (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  border: "1px solid #f0f0f0",
                  borderRadius: "6px",
                }}
              >
                {renamingId === l.id ? (
                  <Space.Compact style={{ flex: 1 }}>
                    <Input
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onPressEnter={() => handleSaveRename(l.id)}
                      autoFocus
                    />
                    <Button
                      icon={<SaveOutlined />}
                      onClick={() => handleSaveRename(l.id)}
                    />
                  </Space.Compact>
                ) : (
                  <span style={{ flex: 1 }}>
                    {l.name}{" "}
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      ({itemCount} item{itemCount !== 1 ? "s" : ""})
                    </Typography.Text>
                  </span>
                )}
                {renamingId !== l.id && (
                  <>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleStartRename(l)}
                    />
                    <Popconfirm
                      title={`Delete "${l.name}"?`}
                      description={
                        itemCount > 0
                          ? `${itemCount} item${itemCount !== 1 ? "s" : ""} will need to be moved.`
                          : "This list has no items."
                      }
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      disabled={collection.lists.length <= 1}
                      onConfirm={() => handleRequestDeleteList(l)}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={collection.lists.length <= 1}
                        title={
                          collection.lists.length <= 1
                            ? "Cannot delete the only list"
                            : undefined
                        }
                      />
                    </Popconfirm>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new list */}
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

      {/* Move-items modal for list deletion */}
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
