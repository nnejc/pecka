import { BASE_PRICE, DELIVERY_PRICE, INGREDIENTS, type IngredientId } from "../data/ingredients";

export type Fulfilment = "delivery" | "pickup";

/** Total in cents: base + chosen toppings + delivery fee (pickup is free). */
export function computeTotal(added: ReadonlySet<IngredientId>, fulfilment: Fulfilment): number {
  let total = BASE_PRICE;
  for (const ing of INGREDIENTS) if (added.has(ing.id)) total += ing.price;
  if (fulfilment === "delivery") total += DELIVERY_PRICE;
  return total;
}
