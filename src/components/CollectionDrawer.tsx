import { useState } from "react";
import { Button, Drawer, Form, Input, Select, Space, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import useCollectionStore, { type ListConfig } from "../store/useCollectionStore";

interface CollectionDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CollectionDrawer({
  open,
  onClose,
}: CollectionDrawerProps) {
  const createCollection = useCollectionStore((s) => s.createCollection);
  const [form] = Form.useForm<{ name: string }>();
  const [lists, setLists] = useState<ListConfig[]>([]);
  const [defaultListId, setDefaultListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [listError, setListError] = useState("");

  const handleAddList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    const newList: ListConfig = { id, name: trimmed };
    setLists((prev) => [...prev, newList]);
    if (!defaultListId) setDefaultListId(id);
    setNewListName("");
    setListError("");
  };

  const handleRemoveList = (id: string) => {
    setLists((prev) => {
      const remaining = prev.filter((l) => l.id !== id);
      if (defaultListId === id) {
        setDefaultListId(remaining[0]?.id ?? "");
      }
      return remaining;
    });
  };

  const handleCreate = () => {
    if (lists.length === 0) {
      setListError("Please add at least one list.");
      return;
    }
    form.validateFields().then(({ name }) => {
      createCollection(name, lists, defaultListId || lists[0].id);
      handleClose();
    });
  };

  const handleClose = () => {
    form.resetFields();
    setLists([]);
    setDefaultListId("");
    setNewListName("");
    setListError("");
    onClose();
  };

  return (
    <Drawer
      title="New Collection"
      placement="right"
      open={open}
      onClose={handleClose}
      footer={
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={handleCreate}>
            Create
          </Button>
        </div>
      }
    >
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

      <div style={{ marginBottom: "16px" }}>
        <div style={{ marginBottom: "8px", fontWeight: 500 }}>Lists</div>
        {lists.length > 0 && (
          <Space wrap style={{ marginBottom: "8px" }}>
            {lists.map((l) => (
              <Tag key={l.id} closable onClose={() => handleRemoveList(l.id)}>
                {l.name}
              </Tag>
            ))}
          </Space>
        )}
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="List name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onPressEnter={handleAddList}
          />
          <Button icon={<PlusOutlined />} onClick={handleAddList}>
            Add
          </Button>
        </Space.Compact>
        {listError && (
          <div style={{ color: "#ff4d4f", marginTop: "4px", fontSize: "14px" }}>
            {listError}
          </div>
        )}
      </div>

      {lists.length > 0 && (
        <Form layout="vertical">
          <Form.Item label="Default List for New Items">
            <Select
              value={defaultListId}
              onChange={setDefaultListId}
              options={lists.map((l) => ({ value: l.id, label: l.name }))}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
}
