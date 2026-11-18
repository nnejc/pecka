// Single source of truth for the menu. To reuse the demo for another client,
// swap this file (and the images in public/img).

export type IngredientId =
  | "mozzarella"
  | "prosciutto"
  | "salami"
  | "mushroom"
  | "onion"
  | "olive"
  | "basil";

export interface Ingredient {
  id: IngredientId;
  /** Slovenian display name */
  name: string;
  /** Price in cents (avoids float errors) */
  price: number;
  /** Number of pieces placed on the pizza */
  pieces: number;
  /** Piece size as a fraction of the pizza diameter */
  size: number;
  /** Stacking order, 1 = bottom */
  layer: number;
}

export const INGREDIENTS: Ingredient[] = [
  { id: "mozzarella", name: "Mocarela", price: 150, pieces: 6, size: 0.2, layer: 1 },
  { id: "prosciutto", name: "Pršut", price: 250, pieces: 5, size: 0.24, layer: 2 },
  { id: "salami", name: "Pikantna salama", price: 200, pieces: 8, size: 0.17, layer: 3 },
  { id: "mushroom", name: "Šampinjoni", price: 120, pieces: 9, size: 0.13, layer: 4 },
  { id: "onion", name: "Rdeča čebula", price: 80, pieces: 7, size: 0.15, layer: 5 },
  { id: "olive", name: "Olive", price: 100, pieces: 14, size: 0.06, layer: 6 },
  { id: "basil", name: "Bazilika", price: 50, pieces: 6, size: 0.13, layer: 7 },
];

/** Dough and tomato base, in cents */
export const BASE_PRICE = 700;
/** Delivery fee in cents; pickup is free */
export const DELIVERY_PRICE = 200;
