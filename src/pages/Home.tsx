import { About } from "./home/About";
import { Hero } from "./home/Hero";
import { Location } from "./home/Location";
import { Offer } from "./home/Offer";

/** Landing page. /ponudba, /o-nas and /lokacija render it too and scroll to their section. */
export default function Home() {
  return (
    <>
      <Hero />
      <Offer />
      <About />
      <Location />
    </>
  );
}
