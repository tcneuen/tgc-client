import { useState } from "react";
import {
  Modal,
  Select,
  Typography,
  Button,
  Space,
  Card,
  Divider,
} from "antd";
import type { ApiItem } from "../types/api";
import { useItems, useMoveItem } from "../hooks/useItems";
import { useCollections } from "../hooks/useCollections";

interface Props {
  item: ApiItem | null;
  open: boolean;
  onClose: () => void;
}

type Step = "select-list" | "compare";

export default function RateItemModal({ item, open, onClose }: Props) {
  const { data: allItems = [] } = useItems(item?.collectionId ?? null);
  const { data: collections = [] } = useCollections();
  const moveItem = useMoveItem();

  const [selectedListId, setSelectedListId] = useState<string>("");
  const [step, setStep] = useState<Step>("select-list");
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);

  if (!item) return null;

  const collection = collections.find((c) => c.id === item.collectionId);
  if (!collection) return null;

  // Items in a given list excluding the item being rated, sorted by linked-list order
  const getListItems = (listId: string) => {
    const listItems = allItems.filter(
      (i) =>
        i.collectionId === collection.id &&
        i.listId === listId &&
        i.id !== item.id,
    );
    const byId = new Map(listItems.map((i) => [i.id, i]));
    let cur: typeof listItems[0] | undefined = listItems.find(
      (i) => i.prevId === null || !byId.has(i.prevId),
    );
    const result: typeof listItems = [];
    const seen = new Set<number>();
    while (cur && !seen.has(cur.id)) {
      result.push(cur);
      seen.add(cur.id);
      cur = cur.nextId != null ? byId.get(cur.nextId) : undefined;
    }
    return result;
  };

  const handleSelectList = () => {
    if (!selectedListId) return;
    const listItems = getListItems(selectedListId);
    if (listItems.length === 0) {
      moveItem.mutate(
        { collectionId: item.collectionId, itemId: item.id, listId: selectedListId, afterId: null },
        { onSuccess: handleClose },
      );
      return;
    }
    setLow(0);
    setHigh(listItems.length - 1);
    setStep("compare");
  };

  const listItems = step === "compare" ? getListItems(selectedListId) : [];
  const mid = Math.floor((low + high) / 2);
  const pivotItem = listItems[mid];

  const placeAt = (index: number) => {
    // afterId = the item at index-1 (null means insert at head)
    const afterId = index > 0 ? listItems[index - 1].id : null;
    moveItem.mutate(
      { collectionId: item.collectionId, itemId: item.id, listId: selectedListId, afterId },
      { onSuccess: handleClose },
    );
  };

  const handleBetter = () => {
    const newHigh = mid - 1;
    if (low > newHigh) {
      placeAt(low);
    } else {
      setHigh(newHigh);
    }
  };

  const handleWorse = () => {
    const newLow = mid + 1;
    if (newLow > high) {
      placeAt(newLow);
    } else {
      setLow(newLow);
    }
  };

  const handleClose = () => {
    setStep("select-list");
    setSelectedListId("");
    setLow(0);
    setHigh(0);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={`Rate: ${item.name}`}
      footer={null}
      width={480}
    >
      {step === "select-list" && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Typography.Text>
            Which list should <strong>{item.name}</strong> be ranked in?
          </Typography.Text>
          <Select
            style={{ width: "100%" }}
            placeholder="Select a list"
            value={selectedListId || undefined}
            onChange={setSelectedListId}
            options={collection.lists
              .filter((l) => !l.protected)
              .map((l) => ({
              value: l.id,
              label: l.name,
            }))}
          />
          <Button
            type="primary"
            onClick={handleSelectList}
            disabled={!selectedListId}
            block
          >
            Start Rating
          </Button>
        </Space>
      )}

      {step === "compare" && pivotItem && (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Typography.Text>
            Is <strong>{item.name}</strong> better or worse than:
          </Typography.Text>
          <Card size="small" style={{ background: "#fafafa" }}>
            <Typography.Text strong>{pivotItem.name}</Typography.Text>
            {pivotItem.description && (
              <>
                <Divider style={{ margin: "6px 0" }} />
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12 }}
                >
                  {pivotItem.description}
                </Typography.Text>
              </>
            )}
          </Card>
          <Space style={{ width: "100%", justifyContent: "center" }}>
            <Button type="primary" size="large" onClick={handleBetter}>
              Better ↑
            </Button>
            <Button danger size="large" onClick={handleWorse}>
              Worse ↓
            </Button>
          </Space>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11, textAlign: "center", display: "block" }}
          >
            Comparing against rank #{mid + 1} of {listItems.length}
          </Typography.Text>
        </Space>
      )}
    </Modal>
  );
}
