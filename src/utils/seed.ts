import { faker } from "@faker-js/faker";
import { apiFetch } from "./api";

export async function seedList(collectionId: string, listId: string) {
  for (let i = 0; i < 10; i++) {
    await apiFetch(`/collections/${collectionId}/items`, {
      method: "POST",
      body: JSON.stringify({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        listId,
      }),
    });
  }
}
