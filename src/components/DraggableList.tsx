import { useState } from "react";
import { Button, Card, List, Popconfirm } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ListItem } from "../store/useBearStore";
import EditItemDrawer from "./EditItemDrawer";

interface SortableItemProps {
  item: ListItem;
  index: number;
  onDelete: (id: number) => void;
  onEdit: (item: ListItem) => void;
}

function SortableItem({ item, index, onDelete, onEdit }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <List.Item ref={setNodeRef} style={style}>
      <Card
        size="small"
        style={{ width: "100%" }}
        styles={{
          header: {
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          },
        }}
        title={
          <div
            {...attributes}
            {...listeners}
            style={{ display: "flex", alignItems: "center" }}
          >
            <span>{`#${index + 1}: ${item.name}`}</span>
          </div>
        }
        extra={
          <div style={{ display: "flex", gap: "4px" }}>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            />
            <Popconfirm
              title="Delete this item?"
              onConfirm={() => onDelete(item.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </div>
        }
      >
        <div>{item.description}</div>
      </Card>
    </List.Item>
  );
}

interface DraggableListProps {
  items: ListItem[];
  collectionId: string;
  listId: string;
  title: string;
  droppableId: string;
  onDelete: (id: number) => void;
  backgroundColor?: string;
}

export default function DraggableList({
  items,
  collectionId,
  listId,
  title,
  droppableId,
  onDelete,
  backgroundColor = "#ffffff",
}: DraggableListProps) {
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: droppableId,
  });

  const filteredItems = items
    .filter((i) => i.collectionId === collectionId && i.listId === listId)
    .sort((a, b) => a.order - b.order);

  return (
    <div ref={setDroppableRef} style={{ backgroundColor, borderRadius: 6 }}>
      <SortableContext
        items={filteredItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <List
          header={<div>{title}</div>}
          footer={
            <div>
              {filteredItems.length} item
              {filteredItems.length !== 1 ? "s" : ""}
            </div>
          }
          bordered
          dataSource={filteredItems}
          renderItem={(item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              onDelete={onDelete}
              onEdit={setEditingItem}
            />
          )}
        />
      </SortableContext>
      <EditItemDrawer
        item={editingItem}
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
}
