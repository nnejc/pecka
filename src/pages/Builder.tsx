import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { INGREDIENTS, type IngredientId } from "../data/ingredients";
import { preloadAll, loadManifest, isPreloaded, img, type Manifest } from "../lib/assets";
import { layoutAll } from "../lib/layout";
import { computeTotal, type Fulfilment } from "../lib/pricing";
import { BAKE_MS, HOLD_MS, LOCK_MS, type Phase } from "../lib/timing";
import { BakeBar } from "../components/BakeBar";
import { DoneCard } from "../components/DoneCard";
import { IngredientBowl, type DragState } from "../components/IngredientBowl";
import { Loader } from "../components/Loader";
import { OvenTimer } from "../components/OvenTimer";
import { PizzaBox } from "../components/PizzaBox";
import { PizzaToppings } from "../components/PizzaToppings";
import { Receipt } from "../components/Receipt";
import { findMenuPizza } from "../data/menu";
import { ROUTES } from "../lib/routes";

export default function Builder() {
  const [params] = useSearchParams();
  const picaId = params.get("pica");
  const appliedPica = useRef<string | null>(null);
  const [ready, setReady] = useState(isPreloaded);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [added, setAdded] = useState<ReadonlySet<IngredientId>>(() => new Set());
  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [drag, setDrag] = useState<DragState>({ dragging: false, over: false });
  const [phase, setPhase] = useState<Phase>("build");
  const [remaining, setRemaining] = useState(BAKE_MS);
  const pizzaRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let alive = true;
    loadManifest().then((m) => alive && setManifest(m), () => {});
    // the builder preloads all its pictures; the landing page stays light
    if (!isPreloaded()) preloadAll().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Sestavi svojo pico — Pečka";
    return () => {
      document.title = prev;
    };
  }, []);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  // Fixed seed â†’ the arrangement is computed once and never changes.
  const layouts = useMemo(() => (manifest ? layoutAll(manifest) : null), [manifest]);

  // /sestavi?pica=<id>: once the page is ready, the pizza's toppings fall on it
  // (the usual animation) and land on the receipt. After that the visitor is free
  // to add and remove as usual.
  useEffect(() => {
    if (!ready || !layouts || appliedPica.current === picaId) return;
    appliedPica.current = picaId;
    const pizza = findMenuPizza(picaId);
    if (!pizza) return;
    const t = window.setTimeout(() => setAdded(new Set(pizza.builder)), 450);
    return () => window.clearTimeout(t);
  }, [ready, layouts, picaId]);
  const total = useMemo(() => computeTotal(added, fulfilment), [added, fulfilment]);

  const toggle = useCallback((id: IngredientId) => {
    setAdded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addOnly = useCallback((id: IngredientId) => {
    setAdded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  // ---- baking timeline: lock â†’ bake â†’ hold â†’ box --------------------------------
  const bake = () => {
    if (phase !== "build") return;
    clearTimers();
    setRemaining(BAKE_MS);
    setPhase("locking");
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(LOCK_MS, () => setPhase("baking"));
    at(LOCK_MS + BAKE_MS, () => setPhase("holding"));
    at(LOCK_MS + BAKE_MS + HOLD_MS, () => setPhase("boxed"));
  };

  // Countdown text only; the visual cross-fade runs on its own transition.
  useEffect(() => {
    if (phase !== "baking") return;
    const start = performance.now();
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, BAKE_MS - (performance.now() - start)));
    }, 100);
    return () => window.clearInterval(id);
  }, [phase]);

  const reset = () => {
    clearTimers();
    setPhase("build");
    setAdded(new Set());
    setFulfilment("delivery");
    setRemaining(BAKE_MS);
    setDrag({ dragging: false, over: false });
  };

  const inOven = phase !== "build";
  const baked = phase === "baking" || phase === "holding" || phase === "boxed";
  const bakeDone = phase === "holding" || phase === "boxed";

  return (
    <>
      <AnimatePresence>{!ready && <Loader key="loader" />}</AnimatePresence>

      <div className="stage" data-phase={phase} style={{ backgroundImage: `url(${img("surface")})` }}>
        <section className="left">
          <Link to={ROUTES.offer} className="backlink fade-out" data-hidden={inOven} {...(inOven ? { tabIndex: -1 } : {})}>
            ← Nazaj na ponudbo
          </Link>

          <h1 className="headline fade-out" data-hidden={inOven} aria-hidden={inOven}>
            Sestavi svojo.
          </h1>
          <div
            className="bowls fade-out"
            data-hidden={inOven}
            role="group"
            aria-label="Sestavine"
            {...(inOven ? { inert: true } : {})}
          >
            {INGREDIENTS.map((ing) => (
              <IngredientBowl
                key={ing.id}
                ingredient={ing}
                added={added.has(ing.id)}
                onToggle={toggle}
                onDropOnPizza={addOnly}
                pizzaRef={pizzaRef}
                onDragState={setDrag}
                variants={manifest?.pieces[ing.id]}
              />
            ))}
          </div>

          <AnimatePresence>
            {inOven && (
              <OvenTimer
                key="timer"
                remainingMs={phase === "locking" ? BAKE_MS : remaining}
                ringing={phase === "holding"}
                done={bakeDone}
              />
            )}
          </AnimatePresence>
        </section>

        <section className="center">
          <PizzaBox
            ref={pizzaRef}
            dragging={drag.dragging}
            over={drag.over}
            baked={baked}
            glow={phase === "baking"}
            closed={phase === "boxed"}
          >
            <PizzaToppings added={added} layouts={layouts} showBaked={inOven} baked={baked} bakeDone={bakeDone} />
          </PizzaBox>
        </section>

        <section className="right">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "boxed" ? (
              <DoneCard key="done" total={total} onReset={reset} />
            ) : (
              <motion.div
                key="receipt"
                className="right__slot"
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
              >
                <Receipt
                  added={added}
                  fulfilment={fulfilment}
                  onFulfilment={setFulfilment}
                  total={total}
                  onBake={bake}
                  locked={inOven}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <BakeBar phase={phase} onBake={bake} onReset={reset} />
        <img className="towel" src={img("towel")} alt="" draggable={false} />
      </div>
    </>
  );
}
