import { Button, Card, List } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ListItem {
  id: number;
  name: string;
  description: string;
  rank: number;
}

interface SortableItemProps {
  item: ListItem;
  index: number;
  onDelete: (id: number) => void;
  titleFormatter: (item: ListItem, index: number) => string;
}

function SortableItem({
  item,
  index,
  onDelete,
  titleFormatter,
}: SortableItemProps) {
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
            <span>{titleFormatter(item, index)}</span>
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
  onDelete: (id: number) => void;
  listType: "sorted" | "unsorted";
  title: string;
  droppableId: string;
}

export default function DraggableList({
  items,
  onDelete,
  listType,
  title,
  droppableId,
}: DraggableListProps) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: droppableId,
  });

  // Filter and sort items based on list type
  const filteredItems =
    listType === "sorted"
      ? [...items]
          .filter((item) => item.rank !== 0)
          .sort((a, b) => a.rank - b.rank)
      : [...items].filter((item) => item.rank === 0);

  // Title formatter based on list type
  const titleFormatter = (item: ListItem, index: number): string => {
    if (listType === "sorted") {
      return `#${index + 1} - Rank ${item.rank}: ${item.name}`;
    } else {
      return `#${index + 1}: ${item.name}`;
    }
  };

  return (
    <div ref={setDroppableRef}>
      <SortableContext
        items={filteredItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <List
          header={<div>{title} (Drag between lists)</div>}
          footer={<div>{filteredItems.length}</div>}
          bordered
          dataSource={filteredItems}
          renderItem={(item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              onDelete={onDelete}
              titleFormatter={titleFormatter}
            />
          )}
        />
      </SortableContext>
    </div>
  );
}
