import { useState } from "react";
import { Button, Drawer, Form, Input, Space, Tag } from "antd";
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
  const [newListName, setNewListName] = useState("");
  const [listError, setListError] = useState("");

  const handleAddList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    const newList: ListConfig = { id, name: trimmed };
    setLists((prev) => [...prev, newList]);
    setNewListName("");
    setListError("");
  };

  const handleRemoveList = (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
  };

  const handleCreate = () => {
    form.validateFields().then(({ name }) => {
      createCollection(name, lists);
      handleClose();
    });
  };

  const handleClose = () => {
    form.resetFields();
    setLists([]);
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
        <Space wrap style={{ marginBottom: "8px" }}>
          <Tag color="default">Ungraded (default)</Tag>
          {lists.map((l) => (
            <Tag key={l.id} closable onClose={() => handleRemoveList(l.id)}>
              {l.name}
            </Tag>
          ))}
        </Space>
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

    </Drawer>
  );
}
