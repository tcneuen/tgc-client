import { useRef, useState } from "react";
import { Button, Card, Popconfirm, theme } from "antd";
import { DeleteOutlined, EditOutlined, StarOutlined } from "@ant-design/icons";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ApiItem } from "../types/api";
import EditItemDrawer from "./EditItemDrawer";
import RateItemModal from "./RateItemModal";

interface SortableItemProps {
  item: ApiItem;
  index: number;
  onDelete: (id: number) => void;
  onEdit: (item: ApiItem) => void;
  onRate: (item: ApiItem) => void;
  rating?: number;
}

function SortableItem({ item, index, onDelete, onEdit, onRate, rating }: SortableItemProps) {
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
    <div ref={setNodeRef} style={{ ...style, padding: "4px 8px" }}>
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
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
          >
            <span>{`#${index + 1}: ${item.name}`}</span>
            {rating !== undefined && (
              <span style={{ fontSize: 11, fontWeight: "normal", color: "#8c8c8c", marginLeft: 8 }}>
                {rating.toFixed(2)}
              </span>
            )}
          </div>
        }
        extra={
          <div style={{ display: "flex", gap: "4px" }}>
            <Button
              type="text"
              icon={<StarOutlined />}
              size="small"
              onClick={(e) => { e.stopPropagation(); onRate(item); }}
            />
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
    </div>
  );
}

interface DraggableListProps {
  items: ApiItem[];
  collectionId: string;
  listId: string;
  title: string;
  droppableId: string;
  onDelete: (id: number) => void;
  backgroundColor?: string;
  startingRating?: number;
  isLoading?: boolean;
}

export default function DraggableList({
  items,
  collectionId,
  listId,
  title,
  droppableId,
  onDelete,
  backgroundColor = "#ffffff",
  startingRating,
  isLoading = false,
}: DraggableListProps) {
  const [editingItem, setEditingItem] = useState<ApiItem | null>(null);
  const [ratingItem, setRatingItem] = useState<ApiItem | null>(null);
  const { token } = theme.useToken();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { setNodeRef: setDroppableRef } = useDroppable({ id: droppableId });

  // Items arrive from the server already in linked-list order
  const filteredItems = items.filter(
    (i) => i.collectionId === collectionId && i.listId === listId,
  );

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  const setRefs = (el: HTMLDivElement | null) => {
    setDroppableRef(el);
    (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <div
      style={{
        backgroundColor,
        borderRadius: token.borderRadius,
        border: `1px solid ${token.colorBorderSecondary}`,
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 130px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          fontWeight: token.fontWeightStrong,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          backgroundColor: token.colorFillAlter,
          borderRadius: `${token.borderRadius}px ${token.borderRadius}px 0 0`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        {startingRating !== undefined && (
          <span style={{ fontSize: 11, fontWeight: "normal", color: token.colorTextSecondary }}>
            starts at {startingRating.toFixed(2)}
          </span>
        )}
      </div>

      {/* Virtualized scroll area */}
      <div
        ref={setRefs}
        style={{ flex: 1, overflowY: "auto" }}
      >
        <SortableContext
          items={filteredItems.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = filteredItems[virtualRow.index];
              return (
                <div
                  key={item.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <SortableItem
                    item={item}
                    index={virtualRow.index}
                    onDelete={onDelete}
                    onEdit={setEditingItem}
                    onRate={setRatingItem}
                    rating={isLoading ? undefined : (item.rating ?? undefined)}
                  />
                </div>
              );
            })}
          </div>
        </SortableContext>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "6px 12px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          color: token.colorTextSecondary,
          fontSize: token.fontSizeSM,
          flexShrink: 0,
        }}
      >
        {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
      </div>

      <EditItemDrawer
        item={editingItem}
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
      />
      <RateItemModal
        item={ratingItem}
        open={ratingItem !== null}
        onClose={() => setRatingItem(null)}
      />
    </div>
  );
}
