/** Baking timeline (milliseconds). */
export const LOCK_MS = 400; // bowls fade, receipt locks
export const BAKE_MS = 4000; // raw → baked cross-fade and countdown
export const HOLD_MS = 1000; // finished pizza stays visible before the lid closes

export type Phase = "build" | "locking" | "baking" | "holding" | "boxed";
