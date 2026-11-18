import type { CSSProperties } from "react";

/** Flame path from the brand sheet (viewBox 0 0 24 30). */
const FLAME_PATH =
  "M12 0C14 6 22 10 22 19A10 10 0 0 1 2 19C2 14 5 11 7 8C8 11 9 12 10 12C10 8 10 4 12 0Z";

export function Flame({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 30" aria-hidden="true" focusable="false">
      <path d={FLAME_PATH} fill="var(--flame)" />
    </svg>
  );
}

/**
 * Wordmark: the "č" is a plain "c" with the flame sitting on top of it as its
 * háček. Size it with font-size on the parent (everything scales in em).
 */
export function Logo({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={`logo ${className}`} style={style} role="img" aria-label="pečka">
      <span aria-hidden="true">
        pe
        <span className="logo__c">
          c
          <Flame className="logo__flame" />
        </span>
        ka
      </span>
    </span>
  );
}

/** Bread-oven mark (viewBox 0 0 100 84): favicon and box lid. */
export function OvenMark({
  className,
  dome = "var(--tomato)",
  opening = "var(--ink)",
}: {
  className?: string;
  dome?: string;
  opening?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 100 84" aria-hidden="true" focusable="false">
      <path d="M8 80V46A42 42 0 0 1 92 46V80Z" fill={dome} />
      <path d="M30 80V54A20 20 0 0 1 70 54V80Z" fill={opening} />
      <path
        d="M50 44C52.3 50.5 61 54.5 61 64A11 11 0 0 1 39 64C39 58.5 42.3 55.5 44.5 52.5C45.5 55.5 46.8 57 48 57C48 52.5 48 48 50 44Z"
        fill="var(--flame)"
      />
      <rect x="0" y="78" width="100" height="6" rx="3" fill={dome} />
    </svg>
  );
}
