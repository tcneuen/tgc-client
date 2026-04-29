import { useEffect } from "react";
import { Button, Drawer, Form, Input } from "antd";
import type { ApiItem } from "../types/api";
import { useUpdateItem } from "../hooks/useItems";

interface EditItemDrawerProps {
  item: ApiItem | null;
  open: boolean;
  onClose: () => void;
}

export default function EditItemDrawer({
  item,
  open,
  onClose,
}: EditItemDrawerProps) {
  const [form] = Form.useForm<{ name: string; description: string }>();
  const updateItem = useUpdateItem();

  useEffect(() => {
    if (item && open) {
      form.setFieldsValue({ name: item.name, description: item.description });
    }
  }, [item, open, form]);

  const handleSave = () => {
    form.validateFields().then(({ name, description }) => {
      if (item) {
        updateItem.mutate(
          { collectionId: item.collectionId, itemId: item.id, name: name.trim(), description: description.trim() },
          { onSuccess: () => { form.resetFields(); onClose(); } },
        );
      }
    });
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title="Edit Item"
      placement="right"
      open={open}
      onClose={handleClose}
      footer={
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            Save
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
      </Form>
    </Drawer>
  );
}
