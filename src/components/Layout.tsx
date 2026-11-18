import { Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../lib/routes";
import { SiteFooter } from "./Footer";
import { SiteHeader } from "./SiteHeader";

/** Header and footer for every page; the builder gets the compact versions. */
export function Layout() {
  const { pathname } = useLocation();
  const isBuilder = pathname === ROUTES.builder;

  return (
    <div className="layout" data-compact={isBuilder}>
      <button
        type="button"
        className="skip-link"
        onClick={() => document.getElementById("vsebina")?.focus()}
      >
        Preskoči na vsebino
      </button>
      <SiteHeader compact={isBuilder} />
      <main id="vsebina" tabIndex={-1} className="layout__main">
        <Outlet />
      </main>
      <SiteFooter compact={isBuilder} />
    </div>
  );
}
