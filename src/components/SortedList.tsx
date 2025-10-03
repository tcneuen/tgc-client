import { useState } from "react";
import { Button, Card, Input, List } from "antd";

interface ListItem {
  id: number;
  name: string;
  description: string;
  rank: number;
}

interface SortedListProps {
  items: ListItem[];
  onUpdateRank: (id: number, rank: number) => void;
  onDelete: (id: number) => void;
}

export default function SortedList({
  items,
  onUpdateRank,
  onDelete,
}: SortedListProps) {
  const [rankInputs, setRankInputs] = useState<{ [key: number]: string }>({});

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

  const sortedItems = [...items]
    .filter((item) => item.rank !== 0)
    .sort((a, b) => a.rank - b.rank);

  return (
    <List
      header={<div>Sorted</div>}
      footer={<div>{sortedItems.length}</div>}
      bordered
      dataSource={sortedItems}
      renderItem={(item, index) => (
        <List.Item>
          <Card
            title={
              <>
                #{index + 1} - Rank {item.rank}: {item.name}
              </>
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
                onChange={(e) => handleInputChange(item.id, e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                size="small"
                onClick={() => handleUpdateRank(item.id)}
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
      )}
    />
  );
}
