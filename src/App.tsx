import { useState } from "react";
import { Button, Card, Col, Input, List, Row } from "antd";
import { create } from "zustand";

interface ListStuff {
  list: {
    id: number;
    name: string;
    rank: number;
  }[];
  addList: (name: string) => void;
  updateRank: (id: number, rank: number) => void;
}

const useBearStore = create<ListStuff>((set) => ({
  list: [],
  addList: (name) =>
    set((state) => ({
      list: [
        ...state.list,
        {
          id: state.list.length + 1,
          name,
          rank: 0,
        },
      ],
    })),
  updateRank: (id, rank) =>
    set((state) => ({
      list: state.list.map((item) =>
        item.id === id ? { ...item, rank } : item,
      ),
    })),
}));

function App() {
  const [count, setCount] = useState(0);
  const { list, addList, updateRank } = useBearStore();

  const unsortedList = [...list].filter((item) => item.rank === 0);
  const sortedList = [...list]
    .filter((item) => item.rank !== 0)
    .sort((a, b) => a.rank - b.rank);
  return (
    <>
      <Row>
        <Col span={12}>
          <List
            header={<div>Sorted</div>}
            footer={<div>{sortedList.length}</div>}
            bordered
            dataSource={sortedList}
            renderItem={(item) => (
              <List.Item>
                <Card
                  title={
                    <>
                      {item.rank} {item.name}
                    </>
                  }
                >
                  <Input
                    defaultValue={item.rank === 0 ? "" : item.rank}
                    id={item.id.toString()}
                    placeholder="Rank"
                    onBlur={(event) => {
                      // Access the input value from event.target.value
                      const rank = event.target.value;
                      updateRank(item.id, Number(rank));
                    }}
                  />
                </Card>
              </List.Item>
            )}
          />
        </Col>
        <Col span={12}>
          <List
            header={<div>Unsorted</div>}
            footer={<div>{unsortedList.length}</div>}
            bordered
            dataSource={unsortedList}
            renderItem={(item) => (
              <List.Item>
                <Card
                  title={
                    <>
                      {item.rank} {item.name}
                    </>
                  }
                >
                  <Input
                    defaultValue={item.rank === 0 ? "" : item.rank}
                    placeholder="Rank"
                    onBlur={(event) => {
                      // Access the input value from event.target.value
                      const rank = event.target.value;
                      updateRank(item.id, Number(rank));
                    }}
                  />
                </Card>
              </List.Item>
            )}
          />
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Button
            onClick={() => {
              addList(`test ${count}`);
              setCount((count) => count + 1);
            }}
          >
            add list
          </Button>
        </Col>
      </Row>
    </>
  );
}

export default App;
