import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ScrollManager } from "./components/ScrollManager";
import Builder from "./pages/Builder";
import Home from "./pages/Home";
import { ROUTES } from "./lib/routes";

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<Layout />}>
          <Route path={ROUTES.builder} element={<Builder />} />
          {/* the section paths show the landing page and scroll to the section */}
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.offer} element={<Home />} />
          <Route path={ROUTES.about} element={<Home />} />
          <Route path={ROUTES.location} element={<Home />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}
