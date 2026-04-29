import { Button, Drawer, Form, Input, Select } from "antd";
import type { ApiCollection } from "../types/api";
import { useCreateItem } from "../hooks/useItems";

interface AddItemDrawerProps {
  open: boolean;
  collection: ApiCollection;
  onClose: () => void;
}

export default function AddItemDrawer({
  open,
  collection,
  onClose,
}: AddItemDrawerProps) {
  const [form] = Form.useForm<{
    name: string;
    description: string;
    listId: string;
  }>();
  const createItem = useCreateItem();

  const handleOpen = () => {
    form.setFieldValue("listId", collection.defaultListId);
  };

  const handleAdd = () => {
    form.validateFields().then(({ name, description, listId }) => {
      createItem.mutate(
        { collectionId: collection.id, name: name.trim(), description: description.trim(), listId },
        { onSuccess: () => { form.resetFields(); onClose(); } },
      );
    });
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title="Add New Item"
      placement="right"
      open={open}
      onClose={handleClose}
      afterOpenChange={(visible) => {
        if (visible) handleOpen();
      }}
      footer={
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={handleAdd}>
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
            { required: true, whitespace: true, message: "Please enter a name" },
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
            options={collection.lists.map((l) => ({
              value: l.id,
              label: l.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
