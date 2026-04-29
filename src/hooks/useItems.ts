import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../utils/api";
import type { ApiItem } from "../types/api";

export const itemsKey = (collectionId: string) =>
  ["items", collectionId] as const;

// ─── Query ────────────────────────────────────────────────────────────────────

export function useItems(collectionId: string | null) {
  return useQuery({
    queryKey: collectionId ? itemsKey(collectionId) : (["items", null] as const),
    queryFn: async (): Promise<ApiItem[]> => {
      if (!collectionId) return [];
      const res = await apiFetch(`/collections/${collectionId}/items`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
    enabled: !!collectionId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      name,
      description,
      listId,
    }: {
      collectionId: string;
      name: string;
      description: string;
      listId: string;
    }): Promise<ApiItem> => {
      const res = await apiFetch(`/collections/${collectionId}/items`, {
        method: "POST",
        body: JSON.stringify({ name, description, listId }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      return res.json();
    },
    onSuccess: (_, { collectionId }) =>
      qc.invalidateQueries({ queryKey: itemsKey(collectionId) }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      itemId,
      name,
      description,
    }: {
      collectionId: string;
      itemId: number;
      name: string;
      description: string;
    }): Promise<ApiItem> => {
      const res = await apiFetch(`/collections/${collectionId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: (_, { collectionId }) =>
      qc.invalidateQueries({ queryKey: itemsKey(collectionId) }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      itemId,
    }: {
      collectionId: string;
      itemId: number;
    }): Promise<void> => {
      const res = await apiFetch(
        `/collections/${collectionId}/items/${itemId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: (_, { collectionId }) =>
      qc.invalidateQueries({ queryKey: itemsKey(collectionId) }),
  });
}

export function useMoveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionId,
      itemId,
      listId,
      order,
    }: {
      collectionId: string;
      itemId: number;
      listId: string;
      order: number;
    }): Promise<ApiItem> => {
      const res = await apiFetch(
        `/collections/${collectionId}/items/${itemId}/move`,
        {
          method: "PATCH",
          body: JSON.stringify({ listId, order }),
        },
      );
      if (!res.ok) throw new Error("Failed to move item");
      return res.json();
    },
    onMutate: async ({ collectionId, itemId, listId, order }) => {
      await qc.cancelQueries({ queryKey: itemsKey(collectionId) });
      const previous = qc.getQueryData<ApiItem[]>(itemsKey(collectionId));
      if (previous) {
        const item = previous.find((i) => i.id === itemId);
        if (item) {
          const oldListId = item.listId;
          const oldOrder = item.order;
          const movingDown =
            oldListId === listId && order > oldOrder;
          const updated = previous.map((i) => {
            if (i.id === itemId) return { ...i, listId, order };
            if (i.listId === listId && i.id !== itemId) {
              if (movingDown) {
                if (i.order > oldOrder && i.order <= order)
                  return { ...i, order: i.order - 1 };
              } else {
                if (i.order >= order) return { ...i, order: i.order + 1 };
              }
            }
            if (
              oldListId !== listId &&
              i.listId === oldListId &&
              i.order > oldOrder
            ) {
              return { ...i, order: i.order - 1 };
            }
            return i;
          });
          qc.setQueryData(itemsKey(collectionId), updated);
        }
      }
      return { previous };
    },
    onError: (_, { collectionId }, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(itemsKey(collectionId), ctx.previous);
    },
    onSettled: (_, __, { collectionId }) =>
      qc.invalidateQueries({ queryKey: itemsKey(collectionId) }),
  });
}
