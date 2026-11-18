import { Link } from "react-router-dom";
import { Reveal } from "../../components/Reveal";
import { SITE } from "../../data/site";
import { img } from "../../lib/assets";
import { ROUTES } from "../../lib/routes";

export function Location() {
  return (
    <section id="lokacija" className="section location" aria-labelledby="location-title">
      <Reveal className="section__head">
        <h2 id="location-title" className="section__title">
          Pridi na toplo.
        </h2>
      </Reveal>

      <div className="location__media">
        <img
          src={img("interior")}
          width={1280}
          height={714}
          alt="Notranjost lokala: lesene mize, krušna peč za steklenim pultom in zložene škatle za pice"
          loading="lazy"
          decoding="async"
        />
      </div>

      <Reveal className="location__panel">
        <div className="location__card">
          <h3 className="location__label">Naslov</h3>
          <address className="location__text">
            {SITE.address}
            <br />
            {/* invented number: plain text on purpose, not a tel: link */}
            <span>Telefon: {SITE.phone}</span>
          </address>

          <h3 className="location__label">Delovni čas</h3>
          <ul className="location__hours">
            {SITE.hours.map((h) => (
              <li key={h.days}>
                <span>{h.days}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link to={ROUTES.builder} className="btn btn--primary btn--lg">
          Sestavi svojo pico
        </Link>
      </Reveal>
    </section>
  );
}
