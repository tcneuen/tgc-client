import { useState } from "react";
import { Button, Card, Input, List } from "antd";

interface ListItem {
  id: number;
  name: string;
  description: string;
  rank: number;
}

interface UnsortedListProps {
  items: ListItem[];
  onUpdateRank: (id: number, rank: number) => void;
  onDelete: (id: number) => void;
}

export default function UnsortedList({
  items,
  onUpdateRank,
  onDelete,
}: UnsortedListProps) {
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

  const unsortedItems = [...items].filter((item) => item.rank === 0);

  return (
    <List
      header={<div>Unsorted</div>}
      footer={<div>{unsortedItems.length}</div>}
      bordered
      dataSource={unsortedItems}
      renderItem={(item, index) => (
        <List.Item>
          <Card
            title={
              <>
                #{index + 1}: {item.name}
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
