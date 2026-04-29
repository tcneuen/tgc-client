import { faker } from "@faker-js/faker";
import { apiFetch } from "./api";

export async function seedList(collectionId: string, listId: string) {
  const items = Array.from({ length: 10 }, () => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
  }));
  await apiFetch(`/collections/${collectionId}/items/batch`, {
    method: "POST",
    body: JSON.stringify({ listId, items }),
  });
}
