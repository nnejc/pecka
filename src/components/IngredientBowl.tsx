import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Ingredient, IngredientId } from "../data/ingredients";
import { formatPrice } from "../lib/format";
import { img } from "../lib/assets";

export interface DragState {
  dragging: boolean;
  over: boolean;
}

interface Props {
  ingredient: Ingredient;
  added: boolean;
  /** click / tap / keyboard: add if missing, remove if present */
  onToggle: (id: IngredientId) => void;
  /** dropped on the pizza while not yet added */
  onDropOnPizza: (id: IngredientId) => void;
  pizzaRef: RefObject<HTMLElement | null>;
  onDragState: (s: DragState) => void;
  /** cut-out variants of this ingredient (from the manifest) for the drag preview */
  variants?: { n: number; w: number; h: number }[];
}

const DRAG_THRESHOLD = 8; // px of movement before a press becomes a drag
const GHOST_FALLBACK = 96; // px, bowl picture used if the pieces are not known yet

interface GhostItem {
  src: string;
  w: number;
  x: number;
  y: number;
  rot: number;
}
interface GhostCfg {
  box: number;
  items: GhostItem[];
}

// loose cluster: offset (in piece widths) and rotation of each piece
const SLOTS: [number, number, number][] = [
  [-0.55, -0.35, -18],
  [0.5, -0.25, 32],
  [0.02, 0.5, 75],
  [-0.5, 0.55, -50],
  [0.58, 0.55, 10],
];

/**
 * What follows the pointer: a few real pieces of the ingredient at the size they
 * will have on the pizza (not the whole bowl), so you "pick up" some cheese.
 */
function buildGhost(ing: Ingredient, variants: Props["variants"], pizzaW: number): GhostCfg {
  if (!variants?.length) {
    return { box: GHOST_FALLBACK, items: [{ src: img(`bowl-${ing.id}`), w: GHOST_FALLBACK, x: 0, y: 0, rot: 0 }] };
  }
  const count = ing.size < 0.1 ? 5 : 3; // tiny pieces (olives) come in more
  const pw = Math.max(28, ing.size * pizzaW);
  const items = Array.from({ length: count }, (_, i) => {
    const v = variants[i % variants.length];
    const [ox, oy, rot] = SLOTS[i];
    return {
      src: img(`${ing.id}-${v.n}-raw`),
      w: (v.w / Math.max(v.w, v.h)) * pw,
      x: ox * pw,
      y: oy * pw,
      rot,
    };
  });
  return { box: Math.round(pw * 2.7), items };
}

/**
 * A real <button> (keyboard + screen readers). Pointer Events drive the drag,
 * one code path for mouse, pen and touch. A press without movement is a click.
 *
 * Move/up listeners live on `window` while a press is active, so the drag keeps
 * working wherever the pointer goes (no reliance on pointer capture).
 */
export function IngredientBowl({ ingredient, added, onToggle, onDropOnPizza, pizzaRef, onDragState, variants }: Props) {
  const { id, name, price } = ingredient;
  const btnRef = useRef<HTMLButtonElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<GhostCfg | null>(null);

  const press = useRef<{ pointerId: number; sx: number; sy: number; active: boolean } | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastOver = useRef<boolean | null>(null);
  const suppressClick = useRef(false);

  // Latest props for the window listeners (they outlive a single render).
  const latest = useRef({ id, added, onDropOnPizza, onDragState, pizzaRef });
  latest.current = { id, added, onDropOnPizza, onDragState, pizzaRef };
  const variantsRef = useRef(variants);
  variantsRef.current = variants;

  const placeGhost = () => {
    const g = ghostRef.current;
    if (!g) return;
    const { x, y } = lastPos.current;
    g.style.transform = `translate3d(${x - g.offsetWidth / 2}px, ${y - g.offsetHeight / 2}px, 0)`;
  };
  useLayoutEffect(placeGhost, [ghost]);

  const handlers = useRef<{ move: (e: PointerEvent) => void; up: (e: PointerEvent) => void } | null>(null);

  const stopTracking = () => {
    if (!handlers.current) return;
    window.removeEventListener("pointermove", handlers.current.move);
    window.removeEventListener("pointerup", handlers.current.up);
    window.removeEventListener("pointercancel", handlers.current.up);
    handlers.current = null;
  };
  useEffect(() => stopTracking, []);

  const isOverPizza = (x: number, y: number) => {
    const el = latest.current.pizzaRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return Math.hypot(x - cx, y - cy) <= (r.width / 2) * 1.02;
  };

  const startTracking = () => {
    const move = (e: PointerEvent) => {
      const p = press.current;
      if (!p || p.pointerId !== e.pointerId) return;
      if (!p.active) {
        if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < DRAG_THRESHOLD) return;
        p.active = true;
        const pizzaW = latest.current.pizzaRef.current?.getBoundingClientRect().width ?? 300;
        setGhost(buildGhost(ingredient, variantsRef.current, pizzaW));
      }
      lastPos.current = { x: e.clientX, y: e.clientY };
      placeGhost();
      const over = isOverPizza(e.clientX, e.clientY);
      if (over !== lastOver.current) {
        lastOver.current = over; // first call also announces "dragging"
        latest.current.onDragState({ dragging: true, over });
      }
    };

    const up = (e: PointerEvent) => {
      const p = press.current;
      if (!p || p.pointerId !== e.pointerId) return;
      stopTracking();
      press.current = null;
      if (!p.active) return; // plain click, handled by onClick

      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 60);

      const over = e.type === "pointerup" && isOverPizza(e.clientX, e.clientY);
      const g = ghostRef.current;
      lastOver.current = null;
      latest.current.onDragState({ dragging: false, over: false });

      const hide = () => setGhost(null);
      if (over) {
        if (!latest.current.added) latest.current.onDropOnPizza(latest.current.id);
        g?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" }).finished.then(hide, hide);
        return;
      }
      // missed: glide back to the bowl
      const b = btnRef.current?.getBoundingClientRect();
      if (!g || !b) return hide();
      const from = g.style.transform;
      const tx = b.left + b.width / 2 - g.offsetWidth / 2;
      const ty = b.top + b.height / 2 - g.offsetHeight / 2;
      g.animate(
        [
          { transform: from, opacity: 1 },
          { transform: `translate3d(${tx}px, ${ty}px, 0)`, opacity: 0.2 },
        ],
        { duration: 240, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
      ).finished.then(hide, hide);
    };

    handlers.current = { move, up };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopTracking();
    press.current = { pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, active: false };
    startTracking();
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="bowl"
        aria-pressed={added}
        aria-label={`${added ? "Odstrani" : "Dodaj"} ${name}, ${formatPrice(price)}`}
        data-ingredient={id}
        onPointerDown={onPointerDown}
        onClick={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            return;
          }
          onToggle(id);
        }}
      >
        <img className="bowl__img" src={img(`bowl-${id}`)} alt="" draggable={false} />
        <span className="bowl__name">{name}</span>
        <span className="bowl__price">{formatPrice(price)}</span>
        <AnimatePresence>
          {added && (
            <motion.span
              className="bowl__check"
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
            >
              <svg viewBox="0 0 20 20" focusable="false">
                <path
                  d="M4.5 10.5l3.6 3.6 7.4-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {ghost &&
        createPortal(
          <div ref={ghostRef} className="drag-ghost" style={{ width: ghost.box, height: ghost.box }} aria-hidden="true">
            {ghost.items.map((it, i) => (
              <img
                key={i}
                src={it.src}
                alt=""
                draggable={false}
                style={{
                  width: it.w,
                  left: ghost.box / 2 + it.x,
                  top: ghost.box / 2 + it.y,
                  transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
                }}
              />
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
