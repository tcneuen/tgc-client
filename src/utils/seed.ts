import { faker } from "@faker-js/faker";
import useBearStore from "../store/useBearStore";

export function seedList() {
  const items = Array.from({ length: 10 }, () => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    rank: 0,
  }));
  useBearStore.getState().addBulk(items);
}
