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
      afterId,
    }: {
      collectionId: string;
      itemId: number;
      listId: string;
      /** ID of the item to place this one after, or null to move to head */
      afterId: number | null;
    }): Promise<ApiItem> => {
      const res = await apiFetch(
        `/collections/${collectionId}/items/${itemId}/move`,
        {
          method: "PATCH",
          body: JSON.stringify({ listId, afterId }),
        },
      );
      if (!res.ok) throw new Error("Failed to move item");
      return res.json();
    },
    onMutate: async ({ collectionId, itemId, listId, afterId }) => {
      await qc.cancelQueries({ queryKey: itemsKey(collectionId) });
      const previous = qc.getQueryData<ApiItem[]>(itemsKey(collectionId));
      if (previous) {
        // Rebuild the optimistic list by splicing `itemId` out of its current
        // position and inserting it after `afterId` in `listId`.
        const item = previous.find((i) => i.id === itemId);
        if (item) {
          // Walk each list in linked-list order to produce an ordered array,
          // then reinsert the moving item at the desired position.
          const sortLinked = (listItems: ApiItem[]) => {
            const byId = new Map(listItems.map((i) => [i.id, i]));
            let cur: ApiItem | undefined = listItems.find((i) => i.prevId === null);
            const result: ApiItem[] = [];
            const seen = new Set<number>();
            while (cur && !seen.has(cur.id)) {
              result.push(cur);
              seen.add(cur.id);
              cur = cur.nextId != null ? byId.get(cur.nextId) : undefined;
            }
            return result;
          };

          // Get the ordered array for the target list (excluding the moving item)
          const targetOrdered = sortLinked(
            previous.filter((i) => i.listId === listId && i.id !== itemId),
          );
          const afterIdx = afterId != null
            ? targetOrdered.findIndex((i) => i.id === afterId)
            : -1;
          // Insert after `afterIdx` (or at head if afterId is null / not found)
          targetOrdered.splice(afterIdx + 1, 0, { ...item, listId });

          // Rebuild prev/next for all items in target list
          const withPointers = targetOrdered.map((i, idx) => ({
            ...i,
            prevId: idx === 0 ? null : targetOrdered[idx - 1].id,
            nextId: idx === targetOrdered.length - 1 ? null : targetOrdered[idx + 1].id,
          }));
          const patchedIds = new Set(withPointers.map((i) => i.id));

          // Items in other lists: remove the moved item, fix pointers around the gap
          const others = previous.filter(
            (i) => i.listId !== listId || (i.listId === listId && !patchedIds.has(i.id)),
          );
          // Repair pointers in old list around the removed item
          const repairedOthers = others.map((i) => {
            if (i.nextId === itemId) return { ...i, nextId: item.nextId };
            if (i.prevId === itemId) return { ...i, prevId: item.prevId };
            return i;
          }).filter((i) => i.id !== itemId);

          qc.setQueryData(itemsKey(collectionId), [...repairedOthers, ...withPointers]);
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
