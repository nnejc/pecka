/**
 * Routes of the site. With HashRouter the real URLs are /#/, /#/sestavi, …
 *
 * Section links use their own paths (/#/ponudba …) because "/#ponudba" would
 * collide with the router's hash. Those paths render the landing page and
 * scroll to the section.
 */
export const ROUTES = {
  home: "/",
  builder: "/sestavi",
  offer: "/ponudba",
  about: "/o-nas",
  location: "/lokacija",
} as const;

/** path → id of the section on the landing page */
export const SECTION_BY_PATH: Record<string, string> = {
  [ROUTES.offer]: "ponudba",
  [ROUTES.about]: "o-nas",
  [ROUTES.location]: "lokacija",
};

/** Builder link that pre-fills a menu pizza: /sestavi?pica=vrazja */
export function builderPath(pizzaId?: string): string {
  return pizzaId ? `${ROUTES.builder}?pica=${encodeURIComponent(pizzaId)}` : ROUTES.builder;
}
