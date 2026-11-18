import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { INGREDIENTS, type IngredientId } from "../data/ingredients";
import { img } from "../lib/assets";
import type { PlacedPiece } from "../lib/layout";
import { BAKE_MS } from "../lib/timing";

const STAGGER = 0.04; // seconds between pieces

interface Props {
  added: ReadonlySet<IngredientId>;
  layouts: Record<IngredientId, PlacedPiece[]> | null;
  /** baked pictures are mounted (oven phases) */
  showBaked?: boolean;
  /** cross-fade target: baked pictures fade in over the raw ones */
  baked?: boolean;
  /** cross-fade finished: the raw picture underneath can go */
  bakeDone?: boolean;
}

/**
 * Every ingredient is always rendered in its own layer (z-index = layer), so
 * stacking follows the table, never the order of adding. Only transform and
 * opacity are animated.
 */
export function PizzaToppings({ added, layouts, showBaked = false, baked = false, bakeDone = false }: Props) {
  const reduce = useReducedMotion();
  if (!layouts) return null;

  return (
    <div className="toppings">
      {INGREDIENTS.map((ing) => (
        <AnimatePresence key={ing.id}>
          {added.has(ing.id) &&
            layouts[ing.id].map((p, i, all) => (
              <div
                key={p.key}
                className="topping"
                style={{
                  left: `${50 + p.x * 50}%`,
                  top: `${50 + p.y * 50}%`,
                  width: `${p.widthPct}%`,
                  zIndex: ing.layer,
                }}
              >
                <motion.div
                  className="topping__motion"
                  initial={reduce ? { opacity: 0 } : { y: "-170%", scale: 1.35, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0.15 } }
                      : {
                          y: "-40%",
                          scale: 0.85,
                          opacity: 0,
                          // reverse order: the last piece to land leaves first
                          transition: { duration: 0.18, delay: (all.length - 1 - i) * STAGGER },
                        }
                  }
                  transition={
                    reduce
                      ? { duration: 0.2 }
                      : {
                          delay: i * STAGGER,
                          y: { type: "spring", stiffness: 420, damping: 24, mass: 0.8, delay: i * STAGGER },
                          scale: { type: "spring", stiffness: 420, damping: 24, mass: 0.8, delay: i * STAGGER },
                          opacity: { duration: 0.12, delay: i * STAGGER },
                        }
                  }
                >
                  <div className="topping__stack">
                    {/* raw picture: defines the size; baked one fades in on the same spot */}
                    <img
                      src={img(`${ing.id}-${p.variant}-raw`)}
                      alt=""
                      draggable={false}
                      style={{ transform: `rotate(${p.rot}deg)`, opacity: bakeDone ? 0 : 1 }}
                    />
                    {showBaked && (
                      <motion.img
                        className="topping__baked"
                        src={img(`${ing.id}-${p.variant}-baked`)}
                        alt=""
                        draggable={false}
                        style={{ rotate: p.rot }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: baked ? 1 : 0 }}
                        transition={{ duration: baked ? BAKE_MS / 1000 : 0.4, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            ))}
        </AnimatePresence>
      ))}
    </div>
  );
}
