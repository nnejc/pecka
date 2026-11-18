import { Link } from "react-router-dom";
import { img } from "../../lib/assets";
import { ROUTES } from "../../lib/routes";

/** Full-screen hero: the oven photo, copy on its dark left side. */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* eager + high priority: it is the first thing people see */}
      <img
        className="hero__img"
        src={img("hero")}
        width={1280}
        height={714}
        alt="Pica na lopatici pred krušno pečjo z ognjem"
        fetchPriority="high"
        decoding="async"
      />
      <div className="hero__content">
        <p className="eyebrow">Picerija s krušno pečjo</p>
        <h1 id="hero-title" className="hero__title">
          Iz tvojih rok v našo peč.
        </h1>
        <p className="hero__lead">Testo zori 48 ur. Ti izbereš, kaj gre nanj.</p>
        <div className="hero__actions">
          <Link to={ROUTES.builder} className="btn btn--primary btn--lg">
            Sestavi svojo pico
          </Link>
          <Link to={ROUTES.offer} className="btn btn--ghost-light btn--lg">
            Poglej ponudbo
          </Link>
        </div>
      </div>
    </section>
  );
}
