import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useOffscreenAnimationPause } from "./hooks";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProcessPage from "./pages/ProcessPage";
import ProjectPage from "./pages/ProjectPage";
import ServicesPage from "./pages/ServicesPage";
import WorkPage from "./pages/WorkPage";

/** Scrolls to the top on navigation, or to the #anchor when the link has one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      return () => window.clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  useOffscreenAnimationPause(pathname);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
      >
        Skip to content
      </a>
      <ScrollManager />
      {/* 24px marker at the very top of the page: the navbar watches it instead of listening to scroll events */}
      <div id="top-sentinel" aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-6 w-px" />
      <Navbar />
      <main id="main" key={pathname} className="page-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/work/:slug" element={<ProjectPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/process" element={<ProcessPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
