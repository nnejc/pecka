import { Reveal } from "../../components/Reveal";
import { img } from "../../lib/assets";

interface Chapter {
  when: string;
  title?: string;
  text: string;
}

const CHAPTERS: Chapter[] = [
  {
    when: "2019",
    title: "Dvorišče",
    text: "Vse se je začelo s krušno pečjo, ki jo je dedek Franc sezidal za hišo, da bi babica v njej pekla kruh. Ko je peč po njegovi smrti nekaj let samevala, sta jo vnuka Luka in Nina eno poletje zakurila \"samo za probo\". Prva pica je bila zažgana, druga surova, tretjo so pojedli sosedje, še preden se je ohladila.",
  },
  {
    when: "2020",
    title: "Vrsta čez ulico",
    text: "Tisto poletje sta pekla vsak petek. Brez cenika in brez imena, samo s škatlo za prostovoljne prispevke na mizi. Luka je mesil testo po receptu, ki ga je popravljal iz tedna v teden, Nina je vodila seznam, kdo je na vrsti. Ko je sosed prvič vprašal, ali lahko naroči deset pic za obletnico, sta vedela, da to ni več hobi.",
  },
  {
    when: "2021",
    title: "Lokal",
    text: "Našla sta majhen prostor nekdanje pekarne in vanj sezidala novo peč, v njen obok pa vgradila opeke iz dedkove. Pridružila se jima je Sara, ki se je peke učila v Neaplju in je prva povedala, da testo rabi več časa in manj kvasa. Imela je prav.",
  },
  {
    when: "Danes",
    text: "Testo še vedno zori 48 ur. Kurimo samo z bukovimi drvmi, pelate dobimo iz Italije, baziliko pa od gospe Marije, tri hiše stran. Peč prižgemo vsak dan ob treh in jo ugasnemo, ko zmanjka testa. Ime Pečka je ostalo po dedkovi peči, ki jo je babica vedno klicala tako.",
  },
];

const FACTS = [
  { value: "48", unit: "ur", label: "zorenja testa" },
  { value: "450", unit: "°C", label: "v peči" },
  { value: "90", unit: "sekund", label: "peke" },
];

export function About() {
  return (
    <section id="o-nas" className="section about" aria-labelledby="about-title">
      <div className="about__grid">
        <Reveal className="about__photo">
          <img
            src={img("team")}
            width={1280}
            height={714}
            alt="Ekipa Pečke za pultom, pred njimi štiri pice na pladnjih"
            loading="lazy"
            decoding="async"
          />
        </Reveal>

        <div className="about__story">
          <Reveal>
            <h2 id="about-title" className="section__title">
              Začelo se je s pečjo.
            </h2>
          </Reveal>
          <ol className="timeline">
            {CHAPTERS.map((c, i) => (
              <li key={c.when} className="timeline__item">
                <Reveal delay={Math.min(i * 0.05, 0.15)}>
                  <h3 className="timeline__title">
                    <span className="timeline__when">{c.when}</span>
                    {c.title && <span className="timeline__dot"> · {c.title}</span>}
                  </h3>
                  <p className="timeline__text">{c.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <Reveal>
        <ul className="facts">
          {FACTS.map((f) => (
            <li key={f.label} className="facts__item">
              <span className="facts__value">
                {f.value}
                <span className="facts__unit"> {f.unit}</span>
              </span>
              <span className="facts__label">{f.label}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
