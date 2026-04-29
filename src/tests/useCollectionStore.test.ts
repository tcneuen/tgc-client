import { describe, it, expect, beforeEach } from "vitest";
import useCollectionStore from "../store/useCollectionStore";

beforeEach(() => {
  useCollectionStore.setState({ activeCollectionId: null });
});

describe("selectCollection", () => {
  it("sets activeCollectionId", () => {
    useCollectionStore.getState().selectCollection("col-1");
    expect(useCollectionStore.getState().activeCollectionId).toBe("col-1");
  });

  it("replaces the previous selection", () => {
    useCollectionStore.getState().selectCollection("col-1");
    useCollectionStore.getState().selectCollection("col-2");
    expect(useCollectionStore.getState().activeCollectionId).toBe("col-2");
  });
});

describe("clearSelection", () => {
  it("resets activeCollectionId to null", () => {
    useCollectionStore.getState().selectCollection("col-1");
    useCollectionStore.getState().clearSelection();
    expect(useCollectionStore.getState().activeCollectionId).toBeNull();
  });
});

