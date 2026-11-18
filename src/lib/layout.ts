import { INGREDIENTS, type Ingredient, type IngredientId } from "../data/ingredients";
import type { Manifest } from "./assets";

/** Change the seed to get a different (but still fixed) arrangement. */
const SEED = 20240611;
/** Pieces stay inside the tomato sauce: 0.78 of the pizza radius. */
export const SAUCE_RADIUS = 0.78;

export interface PlacedPiece {
  /** stable React key */
  key: string;
  /** which cut-out variant (file suffix number) */
  variant: number;
  /** centre, in units of the pizza radius, relative to the pizza centre (-1..1) */
  x: number;
  y: number;
  /** degrees */
  rot: number;
  /** image width as a percentage of the pizza width */
  widthPct: number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Evenly scattered spots on a disc: a golden-angle (sunflower) spiral with a
 * little seeded jitter. Deterministic, so the pizza always looks the same.
 */
function layoutIngredient(ing: Ingredient, manifest: Manifest): PlacedPiece[] {
  const variants = manifest.pieces[ing.id] ?? [];
  if (variants.length === 0) return [];
  const rand = mulberry32(SEED ^ hashString(ing.id));

  // size is a fraction of the pizza diameter, i.e. 2*size in radius units
  const rMax = SAUCE_RADIUS - ing.size * 0.6;
  const n = ing.pieces;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const phase = rand() * Math.PI * 2;

  const out: PlacedPiece[] = [];
  for (let i = 0; i < n; i++) {
    const rBase = rMax * Math.sqrt((i + 0.5) / n);
    const r = Math.min(rMax, Math.max(0, rBase + (rand() - 0.5) * 0.1));
    const theta = phase + i * golden + (rand() - 0.5) * 0.35;
    const v = variants[Math.floor(rand() * variants.length)];
    // longest side of the piece = size * pizza diameter
    const widthPct = (v.w / Math.max(v.w, v.h)) * ing.size * 100;
    out.push({
      key: `${ing.id}-${i}`,
      variant: v.n,
      x: Math.cos(theta) * r,
      y: Math.sin(theta) * r,
      rot: rand() * 360,
      widthPct,
    });
  }
  return out;
}

export function layoutAll(manifest: Manifest): Record<IngredientId, PlacedPiece[]> {
  const out = {} as Record<IngredientId, PlacedPiece[]>;
  for (const ing of INGREDIENTS) out[ing.id] = layoutIngredient(ing, manifest);
  return out;
}
