import { BASE_PRICE, INGREDIENTS, type IngredientId } from "./ingredients";

export interface MenuPizza {
  id: string;
  name: string;
  description: string;
  /** shown in the "Sestavine" row */
  ingredients: string[];
  /** shown in the "Alergeni" row; the custom card has none */
  allergens?: string[];
  badge?: string;
  /** toppings the builder pre-fills (the base is always there) */
  builder: IngredientId[];
  /** the "Sestavi svojo" card */
  custom?: boolean;
  /** file name (without .webp) in public/img */
  image: string;
}

export const MENU: MenuPizza[] = [
  {
    id: "margerita",
    name: "Margerita",
    description: "Za vse, ki vedo, da dobra pica ne rabi skrivanja.",
    ingredients: ["pelati", "mocarela", "bazilika"],
    allergens: ["gluten", "mleko"],
    builder: ["mozzarella", "basil"],
    image: "menu-margerita",
  },
  {
    id: "pecka",
    name: "Pečka",
    description: "Naša prva in še vedno najbolj naročena. Za tiste, ki hočejo vse naenkrat.",
    ingredients: ["pelati", "mocarela", "pršut", "šampinjoni", "bazilika"],
    allergens: ["gluten", "mleko"],
    badge: "Hišna",
    builder: ["mozzarella", "prosciutto", "mushroom", "basil"],
    image: "menu-pecka",
  },
  {
    id: "vrazja",
    name: "Vražja",
    description: "Za vse, ki jim \"malo pekoče\" ni dovolj.",
    ingredients: ["pelati", "mocarela", "pikantna salama", "rdeča čebula", "olive"],
    allergens: ["gluten", "mleko"],
    builder: ["mozzarella", "salami", "onion", "olive"],
    image: "menu-vrazja",
  },
  {
    id: "gozdna",
    name: "Gozdna",
    description: "Brez mesa in brez kompromisov.",
    ingredients: ["pelati", "mocarela", "šampinjoni", "rdeča čebula", "bazilika"],
    allergens: ["gluten", "mleko"],
    builder: ["mozzarella", "mushroom", "onion", "basil"],
    image: "menu-gozdna",
  },
  {
    id: "kraska",
    name: "Kraška",
    description: "Slano, sočno in malo po morju.",
    ingredients: ["pelati", "mocarela", "pršut", "olive", "bazilika"],
    allergens: ["gluten", "mleko"],
    builder: ["mozzarella", "prosciutto", "olive", "basil"],
    image: "menu-kraska",
  },
  {
    id: "custom",
    name: "Sestavi svojo",
    description: "Tvoja pica, tvoja pravila. Izberi sestavine, mi jo spečemo.",
    ingredients: ["po tvoji izbiri"],
    builder: [],
    custom: true,
    image: "pizza-raw",
  },
];

/** Price in cents, always derived from the builder's data (base + toppings). */
export function menuPrice(p: MenuPizza): number {
  return INGREDIENTS.filter((i) => p.builder.includes(i.id)).reduce((sum, i) => sum + i.price, BASE_PRICE);
}

export function findMenuPizza(id: string | null): MenuPizza | undefined {
  return id ? MENU.find((p) => p.id === id && !p.custom) : undefined;
}
