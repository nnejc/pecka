import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { MENU, menuPrice, type MenuPizza } from "../data/menu";
import { BASE_PRICE } from "../data/ingredients";
import { formatPrice } from "../lib/format";
import { img } from "../lib/assets";
import { builderPath, ROUTES } from "../lib/routes";

const AUTOPLAY_MS = 6000;
const SWIPE_PX = 50;

function priceLabel(p: MenuPizza) {
  return p.custom ? `od ${formatPrice(BASE_PRICE)}` : formatPrice(menuPrice(p));
}

/**
 * One pizza at a time. Autoplays every 6 s and pauses on hover, on focus and
 * while the tab is hidden; never autoplays with reduced motion. Arrow keys,
 * dots and a swipe move it by hand.
 */
export function MenuCarousel() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(typeof document !== "undefined" && document.hidden);
  const [touched, setTouched] = useState(false); // someone used the controls: announce changes
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);

  const count = MENU.length;
  const playing = !reduce && !hover && !focus && !hidden;

  const go = useCallback(
    (to: number, d?: number) => {
      setIndex((cur) => {
        const next = (to + count) % count;
        setDir(d ?? (next >= cur ? 1 : -1));
        return next;
      });
    },
    [count],
  );
  const next = useCallback(() => go(index + 1, 1), [go, index]);
  const prev = useCallback(() => go(index - 1, -1), [go, index]);

  // pause while the tab is hidden
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  // autoplay (restarts after every change, so a manual click gets a full 6 s)
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => go(index + 1, 1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [playing, index, go]);

  // warm the cache so a slide never pops in mid-animation
  useEffect(() => {
    const t = window.setTimeout(() => MENU.forEach((p) => (new Image().src = img(p.image))), 800);
    return () => window.clearTimeout(t);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setTouched(true);
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setTouched(true);
      prev();
    }
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") return; // swipe is for touch and pen
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      setTouched(true);
      dx < 0 ? next() : prev();
    }
  };

  const pizza = MENU[index];

  // spin and slide in from the side; a plain fade with reduced motion
  const imgVariants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: 90 * d, rotate: 38 * d, scale: 0.9 }),
    center: { opacity: 1, x: 0, rotate: 0, scale: 1 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: -90 * d, rotate: -38 * d, scale: 0.9 }),
  };
  const dur = reduce ? 0.2 : 0.6;

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="vrtiljak"
      aria-label="Ponudba pic"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false);
      }}
      onKeyDown={onKeyDown}
    >
      <div
        className="carousel__media"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <div className="carousel__stage">
          <AnimatePresence initial={false} custom={dir}>
            <motion.img
              key={pizza.id}
              className="carousel__img"
              src={img(pizza.image)}
              width={993}
              height={1002}
              alt={`Pica ${pizza.name}`}
              loading={index === 0 ? "lazy" : "eager"}
              draggable={false}
              custom={dir}
              variants={imgVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: dur, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </AnimatePresence>
        </div>
      </div>

      <div className="carousel__body" aria-live={touched && !playing ? "polite" : "off"}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={pizza.id}
            className="menu-card"
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={{ duration: reduce ? 0.15 : 0.3 }}
          >
            {pizza.badge && <span className="badge">{pizza.badge}</span>}
            <h3 className="menu-card__name">{pizza.name}</h3>
            <p className="menu-card__desc">{pizza.description}</p>
            <dl className="menu-card__facts">
              <div>
                <dt>Sestavine</dt>
                <dd>{pizza.ingredients.join(", ")}</dd>
              </div>
              {pizza.allergens && (
                <div>
                  <dt>Alergeni</dt>
                  <dd>{pizza.allergens.join(", ")}</dd>
                </div>
              )}
            </dl>
            <p className="menu-card__price">{priceLabel(pizza)}</p>
            <Link to={pizza.custom ? ROUTES.builder : builderPath(pizza.id)} className="btn btn--primary btn--lg">
              {pizza.custom ? "Začni sestavljati" : "Prilagodi to pico"}
            </Link>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="carousel__controls">
        <button
          type="button"
          className="round-btn"
          aria-label="Prejšnja pica"
          onClick={() => {
            setTouched(true);
            prev();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ul className="dots">
          {MENU.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className="dot"
                aria-label={`${p.name}, ${i + 1} od ${count}`}
                aria-current={i === index}
                onClick={() => {
                  setTouched(true);
                  go(i);
                }}
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="round-btn"
          aria-label="Naslednja pica"
          onClick={() => {
            setTouched(true);
            next();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
