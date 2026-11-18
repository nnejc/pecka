import { motion, useReducedMotion } from "framer-motion";
import { img } from "../lib/assets";

interface Props {
  remainingMs: number;
  /** the timer just ran out: shake once */
  ringing: boolean;
  /** baking is over */
  done: boolean;
}

/** Kitchen timer with a "V peči" label and countdown, shown where the bowls were. */
export function OvenTimer({ remainingMs, ringing, done }: Props) {
  const reduce = useReducedMotion();
  const secs = Math.ceil(remainingMs / 1000);

  return (
    <motion.div
      className="oven-timer"
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <motion.img
        className="oven-timer__img"
        src={img("timer")}
        alt=""
        draggable={false}
        animate={ringing && !reduce ? { rotate: [0, -8, 8, -7, 7, -4, 4, 0] } : { rotate: 0 }}
        transition={ringing ? { duration: 0.7, repeat: 1, ease: "easeInOut" } : { duration: 0.2 }}
      />
      <div className="oven-timer__text">
        <p className="oven-timer__label" role="status">
          {done ? "Pečeno!" : "V peči"}
        </p>
        <p className="oven-timer__time" aria-hidden="true">
          0:{String(done ? 0 : secs).padStart(2, "0")}
        </p>
      </div>
    </motion.div>
  );
}
