import { useEffect, useRef } from "react";
import type { Phase } from "../lib/timing";

interface Props {
  phase: Phase;
  onBake: () => void;
  onReset: () => void;
}

/**
 * Sticky bottom button for narrow screens (hidden by CSS on desktop, where the
 * button lives in the receipt). "V peč" while building, "Sestavi še eno" at the end.
 */
export function BakeBar({ phase, onBake, onReset }: Props) {
  const btn = useRef<HTMLButtonElement>(null);

  // keyboard focus follows the action when the receipt button disappears
  useEffect(() => {
    if (phase === "boxed") btn.current?.focus({ preventScroll: true });
  }, [phase]);

  if (phase !== "build" && phase !== "boxed") return null;
  return (
    <div className="bakebar">
      <button ref={btn} type="button" className="cta" onClick={phase === "build" ? onBake : onReset}>
        {phase === "build" ? "V peč" : "Sestavi še eno"}
      </button>
    </div>
  );
}
