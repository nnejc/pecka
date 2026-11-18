import { Link } from "react-router-dom";
import { SITE } from "../data/site";
import { ROUTES } from "../lib/routes";
import { Logo } from "./Logo";

// Fill these in before publishing.
const AGENCY_NAME = "[IME AGENCIJE]";
const AGENCY_URL = "[POVEZAVA]";

/**
 * Site footer. On the builder (desktop) only the thin legal line stays, as a
 * narrow strip at the bottom, so that screen keeps fitting without scrolling.
 */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`site-footer${compact ? " site-footer--compact" : ""}`}>
      <div className="site-footer__cols">
        <div className="site-footer__col">
          <Link to={ROUTES.home} aria-label="Pečka, domov">
            <Logo className="logo--md" />
          </Link>
          <p className="site-footer__slogan">{SITE.slogan}</p>
        </div>

        <div className="site-footer__col">
          <h2 className="site-footer__title">Delovni čas</h2>
          <ul className="site-footer__list">
            {SITE.hours.map((h) => (
              <li key={h.days}>
                {h.days}: {h.time}
              </li>
            ))}
          </ul>
          <address className="site-footer__address">
            {SITE.address}
            <br />
            {SITE.phone}
          </address>
        </div>

        <nav className="site-footer__col" aria-label="Povezave v nogi">
          <h2 className="site-footer__title">Povezave</h2>
          <ul className="site-footer__list">
            <li>
              <Link to={ROUTES.offer}>Ponudba</Link>
            </li>
            <li>
              <Link to={ROUTES.about}>O nas</Link>
            </li>
            <li>
              <Link to={ROUTES.location}>Lokacija</Link>
            </li>
            <li>
              <Link to={ROUTES.builder}>Sestavi svojo</Link>
            </li>
          </ul>
        </nav>
      </div>

      <p className="site-footer__legal">
        Demo koncept. Picerija Pečka ne obstaja. Izdelava:{" "}
        <a href={AGENCY_URL} target="_blank" rel="noopener noreferrer">
          {AGENCY_NAME}
        </a>
      </p>
    </footer>
  );
}
