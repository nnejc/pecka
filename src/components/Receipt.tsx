import { useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BASE_PRICE, DELIVERY_PRICE, INGREDIENTS, type IngredientId } from "../data/ingredients";
import { formatPrice } from "../lib/format";
import type { Fulfilment } from "../lib/pricing";
import { Logo } from "./Logo";

interface Props {
  added: ReadonlySet<IngredientId>;
  fulfilment: Fulfilment;
  onFulfilment: (f: Fulfilment) => void;
  total: number;
  onBake: () => void;
  /** during baking the receipt is locked */
  locked?: boolean;
}

/** Decorative barcode: fixed bar widths so it never changes between renders. */
const BARS = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1];

function Barcode() {
  let x = 0;
  const rects = BARS.map((w, i) => {
    const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={30} /> : null;
    x += w;
    return r;
  });
  return (
    <svg className="receipt__barcode" viewBox={`0 0 ${x} 30`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g fill="currentColor">{rects}</g>
    </svg>
  );
}

export function Receipt({ added, fulfilment, onFulfilment, total, onBake, locked = false }: Props) {
  const reduce = useReducedMotion();
  const groupName = useId();
  const rows = INGREDIENTS.filter((i) => added.has(i.id));

  const rowMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 18 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 18 },
      };

  return (
    <aside
      className="receipt"
      aria-label="Račun"
      data-locked={locked}
      // `inert` keeps keyboard focus out while the pizza is baking
      {...(locked ? { inert: true } : {})}
    >
      <header className="receipt__head">
        <Logo className="logo--sm" />
        <p className="receipt__title">Tvoja mojstrovina</p>
      </header>

      <ul className="receipt__rows">
        <li className="receipt__row">
          <span>Osnova (testo, pelati)</span>
          <span>{formatPrice(BASE_PRICE)}</span>
        </li>
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((ing) => (
            <motion.li
              key={ing.id}
              className="receipt__row"
              layout={reduce ? false : "position"}
              {...rowMotion}
              transition={{ duration: reduce ? 0.15 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span>{ing.name}</span>
              <span>{formatPrice(ing.price)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <motion.div className="receipt__foot" layout={reduce ? false : "position"} transition={{ duration: 0.28 }}>
        <fieldset className="receipt__delivery">
          <legend className="visually-hidden">Način prejema</legend>
          <label className="choice">
            <input
              type="radio"
              name={groupName}
              value="delivery"
              checked={fulfilment === "delivery"}
              onChange={() => onFulfilment("delivery")}
            />
            <span className="choice__box">
              <span className="choice__label">Dostava</span>
              <span className="choice__sub">+{formatPrice(DELIVERY_PRICE)}</span>
            </span>
          </label>
          <label className="choice">
            <input
              type="radio"
              name={groupName}
              value="pickup"
              checked={fulfilment === "pickup"}
              onChange={() => onFulfilment("pickup")}
            />
            <span className="choice__box">
              <span className="choice__label">Prevzem</span>
              <span className="choice__sub">brezplačno</span>
            </span>
          </label>
        </fieldset>

        <div className="receipt__total">
          <span>Skupaj</span>
          <span className="receipt__amount" role="status" aria-live="polite">
            {/* keyed so every change replays a short pop (transform + opacity only) */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={total}
                className="receipt__amount-inner"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 1.12 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.92 }}
                transition={{ duration: reduce ? 0.15 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {formatPrice(total)}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>

        <button type="button" className="cta" onClick={onBake}>
          V peč
        </button>

        <div className="receipt__end">
          <Barcode />
          <p className="receipt__thanks">Hvala, ker pečeš z nami.</p>
        </div>
      </motion.div>
    </aside>
  );
}
