import { Reveal } from "../../components/Reveal";
import { MenuCarousel } from "../../components/MenuCarousel";

export function Offer() {
  return (
    <section id="ponudba" className="section offer" aria-labelledby="offer-title">
      <Reveal className="section__head">
        <h2 id="offer-title" className="section__title">
          Naše pice
        </h2>
      </Reveal>
      <MenuCarousel />
    </section>
  );
}
