import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "./Logo";

/** Shown while all images preload. */
export function Loader() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="loader"
      role="status"
      aria-label="Nalaganje"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Logo className="logo--xl" />
      </motion.div>
    </motion.div>
  );
}
