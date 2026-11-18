import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { ROUTES } from "../lib/routes";
import { Logo } from "./Logo";

interface Props {
  total: number;
  onReset: () => void;
}

/** Replaces the receipt once the box is closed. */
export function DoneCard({ total, onReset }: Props) {
  const reduce = useReducedMotion();
  const btn = useRef<HTMLButtonElement>(null);

  // The "V peč" button disappeared; hand keyboard focus to the next action.
  useEffect(() => {
    btn.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div
      className="right__slot"
      initial={{ opacity: 0, y: reduce ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : 12 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <aside className="receipt receipt--done" aria-label="Zahvala">
        <header className="receipt__head">
          <Logo className="logo--sm" />
        </header>
        <h2 className="done__title">Dober tek!</h2>
        <div className="receipt__total">
          <span>Skupaj</span>
          <span className="done__amount">{formatPrice(total)}</span>
        </div>
        <button ref={btn} type="button" className="cta" onClick={onReset}>
          Sestavi še eno
        </button>
        <Link to={ROUTES.home} className="btn-link">
          Nazaj na začetek
        </Link>
        <p className="receipt__thanks">Hvala, ker pečeš z nami.</p>
      </aside>
    </motion.div>
  );
}
