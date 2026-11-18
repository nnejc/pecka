import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SECTION_BY_PATH } from "../lib/routes";

/**
 * On every navigation: jump to the top, or, for /ponudba, /o-nas and /lokacija,
 * glide to that section of the landing page (also when you click the same link again).
 */
export function ScrollManager() {
  const { pathname, key } = useLocation();

  useEffect(() => {
    const id = SECTION_BY_PATH[pathname];
    if (!id) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // wait a frame so a freshly mounted landing page has its sections laid out
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, key]);

  return null;
}
