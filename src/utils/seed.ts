import { faker } from "@faker-js/faker";
import useBearStore from "../store/useBearStore";

export function seedList(collectionId: string, listId: string) {
  const currentItems = useBearStore
    .getState()
    .list.filter(
      (i) => i.listId === listId && i.collectionId === collectionId,
    );
  const startOrder = currentItems.length + 1;
  const items = Array.from({ length: 10 }, (_, i) => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    collectionId,
    listId,
    order: startOrder + i,
  }));
  useBearStore.getState().addBulk(items);
}
