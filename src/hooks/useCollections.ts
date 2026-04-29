import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../utils/api";
import type { ApiCollection, ApiItem, ApiList } from "../types/api";
import { itemsKey } from "./useItems";

export const COLLECTIONS_KEY = ["collections"] as const;

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCollections() {
  return useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: async (): Promise<ApiCollection[]> => {
      const res = await apiFetch("/collections");
      if (!res.ok) throw new Error("Failed to fetch collections");
      return res.json();
    },
  });
}

// ─── Collection mutations ─────────────────────────────────────────────────────

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      draftLists,
    }: {
      name: string;
      draftLists: { name: string; startingRating?: number; backgroundColor?: string }[];
    }): Promise<string> => {
      // 1. Create collection
      const colRes = await apiFetch("/collections", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!colRes.ok) throw new Error("Failed to create collection");
      const collection: ApiCollection = await colRes.json();

      // 2. Create Unrated (protected) list
      const unratedRes = await apiFetch(`/collections/${collection.id}/lists`, {
        method: "POST",
        body: JSON.stringify({ name: "Unrated", protected: true }),
      });
      if (!unratedRes.ok) throw new Error("Failed to create Unrated list");
      const unrated: ApiList = await unratedRes.json();

      // 3. Set defaultListId
      await apiFetch(`/collections/${collection.id}`, {
        method: "PATCH",
        body: JSON.stringify({ defaultListId: unrated.id }),
      });

      // 4. Create extra draft lists
      for (const dl of draftLists) {
        await apiFetch(`/collections/${collection.id}/lists`, {
          method: "POST",
          body: JSON.stringify(dl),
        });
      }

      return collection.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useUpdateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      defaultListId,
    }: {
      id: string;
      name?: string;
      defaultListId?: string | null;
    }): Promise<ApiCollection> => {
      const res = await apiFetch(`/collections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, defaultListId }),
      });
      if (!res.ok) throw new Error("Failed to update collection");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await apiFetch(`/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete collection");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

// ─── List mutations ───────────────────────────────────────────────────────────

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      name,
      protected: isProtected,
      startingRating,
      backgroundColor,
    }: {
      collectionId: string;
      name: string;
      protected?: boolean;
      startingRating?: number;
      backgroundColor?: string;
    }): Promise<ApiList> => {
      const res = await apiFetch(`/collections/${collectionId}/lists`, {
        method: "POST",
        body: JSON.stringify({ name, protected: isProtected, startingRating, backgroundColor }),
      });
      if (!res.ok) throw new Error("Failed to create list");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      listId,
      ...data
    }: {
      collectionId: string;
      listId: string;
      name?: string;
      backgroundColor?: string | null;
      startingRating?: number | null;
      protected?: boolean;
    }): Promise<ApiList> => {
      const res = await apiFetch(`/collections/${collectionId}/lists/${listId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update list");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      listId,
      moveToListId,
      items,
    }: {
      collectionId: string;
      listId: string;
      moveToListId?: string;
      items?: ApiItem[];
    }): Promise<void> => {
      // Move items to another list first if requested
      if (moveToListId && items) {
        const toMove = items.filter((i) => i.listId === listId);
        for (const item of toMove) {
          await apiFetch(`/collections/${collectionId}/items/${item.id}/move`, {
            method: "PATCH",
            body: JSON.stringify({ listId: moveToListId, order: item.order }),
          });
        }
      }
      const res = await apiFetch(`/collections/${collectionId}/lists/${listId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete list");
    },
    onSuccess: (_, { collectionId }) => {
      qc.invalidateQueries({ queryKey: COLLECTIONS_KEY });
      qc.invalidateQueries({ queryKey: itemsKey(collectionId) });
    },
  });
}
