import { Button, Card, List } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ListItem } from "../store/useBearStore";

interface SortableItemProps {
  item: ListItem;
  index: number;
  onDelete: (id: number) => void;
}

function SortableItem({ item, index, onDelete }: SortableItemProps) {
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
        style={{ width: "100%" }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              {...attributes}
              {...listeners}
              style={{
                cursor: isDragging ? "grabbing" : "grab",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                minWidth: "20px",
                height: "20px",
              }}
              title="Drag to reorder"
            >
              ⋮⋮
            </div>
            <span>{`#${index + 1}: ${item.name}`}</span>
          </div>
        }
        extra={
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => onDelete(item.id)}
          />
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
}

export default function DraggableList({
  items,
  collectionId,
  listId,
  title,
  droppableId,
  onDelete,
}: DraggableListProps) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: droppableId,
  });

  const filteredItems = items
    .filter((i) => i.collectionId === collectionId && i.listId === listId)
    .sort((a, b) => a.order - b.order);

  return (
    <div ref={setDroppableRef}>
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
            />
          )}
        />
      </SortableContext>
    </div>
  );
}
