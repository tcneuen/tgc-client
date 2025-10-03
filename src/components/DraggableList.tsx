import { useState } from "react";
import { Button, Card, Input, List } from "antd";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
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
  rankInputs: { [key: number]: string };
  onInputChange: (itemId: number, value: string) => void;
  onUpdateRank: (itemId: number) => void;
  onDelete: (id: number) => void;
  titleFormatter: (item: ListItem, index: number) => string;
}

function SortableItem({
  item,
  index,
  rankInputs,
  onInputChange,
  onUpdateRank,
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <List.Item ref={setNodeRef} style={style}>
      <Card
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
      >
        <div style={{ marginBottom: "12px" }}>
          <strong>Description:</strong> {item.description}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Input
            value={
              rankInputs[item.id] !== undefined
                ? rankInputs[item.id]
                : item.rank === 0
                  ? ""
                  : item.rank.toString()
            }
            placeholder="Rank"
            onChange={(e) => onInputChange(item.id, e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            size="small"
            onClick={() => onUpdateRank(item.id)}
          >
            Update
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            onClick={() => onDelete(item.id)}
          >
            Delete
          </Button>
        </div>
      </Card>
    </List.Item>
  );
}

interface DraggableListProps {
  items: ListItem[];
  onUpdateRank: (id: number, rank: number) => void;
  onDelete: (id: number) => void;
  onReorder: (activeId: number, overId: number) => void;
  listType: 'sorted' | 'unsorted';
  title: string;
}

export default function DraggableList({
  items,
  onUpdateRank,
  onDelete,
  onReorder,
  listType,
  title,
}: DraggableListProps) {
  const [rankInputs, setRankInputs] = useState<{ [key: number]: string }>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleInputChange = (itemId: number, value: string) => {
    setRankInputs((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleUpdateRank = (itemId: number) => {
    const newRank = rankInputs[itemId];
    if (newRank !== undefined) {
      onUpdateRank(itemId, Number(newRank));
      // Clear the input state after updating
      setRankInputs((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onReorder(Number(active.id), Number(over.id));
    }
  };

  // Filter and sort items based on list type
  const filteredItems = listType === 'sorted' 
    ? [...items].filter((item) => item.rank !== 0).sort((a, b) => a.rank - b.rank)
    : [...items].filter((item) => item.rank === 0);

  // Title formatter based on list type
  const titleFormatter = (item: ListItem, index: number): string => {
    if (listType === 'sorted') {
      return `#${index + 1} - Rank ${item.rank}: ${item.name}`;
    } else {
      return `#${index + 1}: ${item.name}`;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={filteredItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <List
          header={<div>{title} (Drag to reorder)</div>}
          footer={<div>{filteredItems.length}</div>}
          bordered
          dataSource={filteredItems}
          renderItem={(item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              rankInputs={rankInputs}
              onInputChange={handleInputChange}
              onUpdateRank={handleUpdateRank}
              onDelete={onDelete}
              titleFormatter={titleFormatter}
            />
          )}
        />
      </SortableContext>
    </DndContext>
  );
}