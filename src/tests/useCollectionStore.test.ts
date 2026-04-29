import { describe, it, expect, beforeEach } from "vitest";
import useCollectionStore from "../store/useCollectionStore";

beforeEach(() => {
  useCollectionStore.setState({ collections: [], activeCollectionId: null });
});

describe("createCollection", () => {
  it("creates a collection with an auto-added protected Unrated list", () => {
    useCollectionStore.getState().createCollection("Movies", []);
    const { collections, activeCollectionId } = useCollectionStore.getState();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toBe("Movies");
    expect(collections[0].lists).toHaveLength(1);
    expect(collections[0].lists[0]).toMatchObject({ name: "Unrated", protected: true });
    expect(activeCollectionId).toBe(collections[0].id);
  });

  it("sets defaultListId to the Unrated list", () => {
    useCollectionStore.getState().createCollection("Games", []);
    const c = useCollectionStore.getState().collections[0];
    expect(c.defaultListId).toBe(c.lists[0].id);
  });

  it("prepends extra lists after Unrated", () => {
    useCollectionStore.getState().createCollection("Music", [
      { id: "custom-1", name: "S Tier" },
    ]);
    const lists = useCollectionStore.getState().collections[0].lists;
    expect(lists[0].name).toBe("Unrated");
    expect(lists[1].name).toBe("S Tier");
  });
});

describe("selectCollection", () => {
  it("sets activeCollectionId", () => {
    useCollectionStore.getState().createCollection("TV Shows", []);
    const id = useCollectionStore.getState().collections[0].id;
    useCollectionStore.getState().selectCollection(id);
    expect(useCollectionStore.getState().activeCollectionId).toBe(id);
  });
});

describe("updateCollection", () => {
  it("renames a collection and updates defaultListId", () => {
    useCollectionStore.getState().createCollection("Old Name", []);
    const { id, lists } = useCollectionStore.getState().collections[0];
    useCollectionStore.getState().updateCollection(id, "New Name", lists[0].id);
    const updated = useCollectionStore.getState().collections[0];
    expect(updated.name).toBe("New Name");
    expect(updated.defaultListId).toBe(lists[0].id);
  });
});

describe("deleteCollection", () => {
  it("removes the collection and clears activeCollectionId", () => {
    useCollectionStore.getState().createCollection("To Delete", []);
    const id = useCollectionStore.getState().collections[0].id;
    useCollectionStore.getState().deleteCollection(id);
    expect(useCollectionStore.getState().collections).toHaveLength(0);
    expect(useCollectionStore.getState().activeCollectionId).toBeNull();
  });
});

describe("addListToCollection", () => {
  it("appends a new list to the collection", () => {
    useCollectionStore.getState().createCollection("Books", []);
    const { id } = useCollectionStore.getState().collections[0];
    useCollectionStore.getState().addListToCollection(id, { id: "l2", name: "A Tier" });
    expect(useCollectionStore.getState().collections[0].lists).toHaveLength(2);
  });
});

describe("renameList", () => {
  it("renames the specified list", () => {
    useCollectionStore.getState().createCollection("Films", []);
    const c = useCollectionStore.getState().collections[0];
    const listId = c.lists[0].id;
    useCollectionStore.getState().renameList(c.id, listId, "Backlog");
    const updated = useCollectionStore.getState().collections[0].lists[0];
    expect(updated.name).toBe("Backlog");
  });
});

describe("updateListColor", () => {
  it("updates the backgroundColor of a list", () => {
    useCollectionStore.getState().createCollection("Anime", []);
    const c = useCollectionStore.getState().collections[0];
    const listId = c.lists[0].id;
    useCollectionStore.getState().updateListColor(c.id, listId, "#ff0000");
    const updated = useCollectionStore.getState().collections[0].lists[0];
    expect(updated.backgroundColor).toBe("#ff0000");
  });
});

describe("removeList", () => {
  it("removes a list from the collection", () => {
    useCollectionStore.getState().createCollection("Podcasts", [
      { id: "extra", name: "Extra" },
    ]);
    const c = useCollectionStore.getState().collections[0];
    const extraId = c.lists.find((l) => l.name === "Extra")!.id;
    useCollectionStore.getState().removeList(c.id, extraId);
    expect(useCollectionStore.getState().collections[0].lists.map((l) => l.name)).not.toContain("Extra");
  });
});
