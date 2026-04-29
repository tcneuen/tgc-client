import { Modal, Table } from "antd";
import type { ApiItem, ApiCollection } from "../types/api";

interface RankedRow {
  key: number;
  rank: number;
  name: string;
  listName: string;
  rating: number | null;
}

interface RankingsModalProps {
  open: boolean;
  onClose: () => void;
  collection: ApiCollection | null;
  items: ApiItem[];
}

export default function RankingsModal({
  open,
  onClose,
  collection,
  items,
}: RankingsModalProps) {
  if (!collection) return null;

  const sortedLists = [...collection.lists].sort(
    (a, b) =>
      (b.startingRating ?? -Infinity) - (a.startingRating ?? -Infinity),
  );

  const rows: RankedRow[] = [];

  sortedLists.forEach((listConfig) => {
    const listItems = items.filter(
      (i) => i.collectionId === collection.id && i.listId === listConfig.id && i.rating !== null,
    );
    listItems.forEach((item) => {
      rows.push({
        key: item.id,
        rank: 0,
        name: item.name,
        listName: listConfig.name,
        rating: item.rating,
      });
    });
  });

  rows.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  const columns = [
    { title: "#", dataIndex: "rank", key: "rank", width: 50 },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "List", dataIndex: "listName", key: "listName", width: 140 },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 80,
      render: (v: number | null) => (v != null ? v.toFixed(2) : "—"),
    },
  ];

  return (
    <Modal
      title={`Rankings — ${collection.name}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={620}
    >
      <Table
        dataSource={rows}
        columns={columns}
        size="small"
        pagination={false}
        scroll={{ y: 520 }}
        locale={{ emptyText: "No rated items yet" }}
      />
    </Modal>
  );
}
