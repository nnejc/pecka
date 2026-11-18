import { forwardRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { img } from "../lib/assets";
import { BAKE_MS } from "../lib/timing";
import { Logo, OvenMark } from "./Logo";

interface Props {
  children?: ReactNode;
  /** a bowl is being dragged */
  dragging?: boolean;
  /** …and it is currently over the pizza */
  over?: boolean;
  /** cross-fade the pizza to its baked picture */
  baked?: boolean;
  /** warm glow while in the oven */
  glow?: boolean;
  /** lid is closed */
  closed?: boolean;
}

/**
 * Open box with the raw pizza on the parchment. The pizza element is the drop
 * target, so it is exposed through the forwarded ref.
 *
 * Position/size are measured on the cut-out box (parchment centre and width
 * relative to the box) so the pizza sits in the middle of the paper.
 * pizza-baked, box-open and box-closed share one frame, so they stack exactly.
 */
export const PizzaBox = forwardRef<HTMLDivElement, Props>(function PizzaBox(
  { children, dragging = false, over = false, baked = false, glow = false, closed = false },
  pizzaRef,
) {
  const reduce = useReducedMotion();

  return (
    <div className="box">
      <img className="box__img" src={img("box-open")} alt="" draggable={false} />
      <div className="pizza" ref={pizzaRef} id="pizza-zone">
        <span className="pizza__ring" data-on={dragging} aria-hidden="true" />
        <span className="pizza__ring pizza__ring--over" data-on={dragging && over} aria-hidden="true" />
        <img className="pizza__img" src={img("pizza-raw")} alt="Pica s paradižnikovo omako" draggable={false} />
        <motion.img
          className="pizza__img pizza__img--baked"
          src={img("pizza-baked")}
          alt=""
          aria-hidden="true"
          draggable={false}
          initial={false}
          animate={{ opacity: baked ? 1 : 0 }}
          transition={{ duration: baked ? BAKE_MS / 1000 : 0.4, ease: "easeInOut" }}
        />
        {children}
        <motion.span
          className="pizza__glow"
          aria-hidden="true"
          initial={false}
          animate={glow ? { opacity: reduce ? 0.3 : [0.12, 0.42, 0.12] } : { opacity: 0 }}
          transition={glow && !reduce ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
        />
      </div>

      <AnimatePresence>
        {closed && (
          <motion.div
            className="lid"
            initial={{ opacity: 0, y: reduce ? 0 : "-7%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : "-7%" }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <img className="lid__img" src={img("box-closed")} alt="" draggable={false} />
            <div className="lid__brand" aria-hidden="true">
              <OvenMark className="lid__mark" />
              <Logo className="lid__logo" />
            </div>
            <motion.p
              className="sticker"
              initial={{ opacity: 0, scale: reduce ? 1 : 0.2, rotate: reduce ? -7 : -28 }}
              animate={{ opacity: 1, scale: 1, rotate: -7 }}
              exit={{ opacity: 0 }}
              transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 360, damping: 18, delay: 0.4 }}
            >
              Tvoja pica je na poti!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
