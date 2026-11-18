import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../lib/routes";
import { Logo } from "./Logo";

const NAV = [
  { to: ROUTES.offer, label: "Ponudba" },
  { to: ROUTES.about, label: "O nas" },
  { to: ROUTES.location, label: "Lokacija" },
];

/**
 * Fixed header. Transparent with light text above the hero, --ink after you
 * start scrolling; always solid and slimmer on the builder (compact). On phones
 * the links live in a full-screen menu.
 */
export function SiteHeader({ compact }: { compact: boolean }) {
  const { pathname, key } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // every navigation closes the menu
  useEffect(() => setOpen(false), [pathname, key]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = compact || scrolled || open;

  return (
    <header className="site-header" data-solid={solid} data-compact={compact}>
      <div className="site-header__bar">
        <Link to={ROUTES.home} className="site-header__logo" aria-label="Pečka, domov">
          <Logo className="logo--md" />
        </Link>

        <nav className="site-header__nav" aria-label="Glavna navigacija">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="site-header__link">
              {n.label}
            </Link>
          ))}
          <Link to={ROUTES.builder} className="btn btn--primary btn--sm">
            Sestavi svojo
          </Link>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Zapri meni" : "Odpri meni"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="burger" data-open={open} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="menu-overlay" role="dialog" aria-modal="true" aria-label="Meni">
          <nav className="menu-overlay__nav" aria-label="Meni">
            {NAV.map((n, i) => (
              <Link key={n.to} to={n.to} className="menu-overlay__link" ref={i === 0 ? firstLinkRef : undefined}>
                {n.label}
              </Link>
            ))}
            <Link to={ROUTES.builder} className="btn btn--primary btn--lg">
              Sestavi svojo
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
