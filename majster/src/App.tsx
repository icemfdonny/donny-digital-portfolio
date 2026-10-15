import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/layout/Footer";
import Header, { MobileActionBar } from "./components/layout/Header";
import Overlays from "./components/layout/Overlays";
import { ToastProvider } from "./components/toast";
import Home from "./pages/Home";

const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const CalculatorPage = lazy(() => import("./pages/calculator/CalculatorPage"));
const RequestPage = lazy(() => import("./pages/RequestPage"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const VisitPage = lazy(() => import("./pages/booking/VisitPage"));
const EmergencyPage = lazy(() => import("./pages/emergency/EmergencyPage"));
const TrackingPage = lazy(() => import("./pages/emergency/TrackingPage"));
const QuotePage = lazy(() => import("./pages/QuotePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const GeneratorPage = lazy(() => import("./pages/GeneratorPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));

/** Scrolls to the top on navigation, or to the #anchor when the link has one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = window.setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      return () => window.clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const bare = pathname.startsWith("/admin") || pathname === "/generator";

  return (
    <ToastProvider>
      <ScrollManager />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-semibold">
        Preskočiť na obsah
      </a>
      {!bare && <Header />}
      <main id="main">
        <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sluzby" element={<ServicesPage />} />
            <Route path="/realizacie" element={<ProjectsPage />} />
            <Route path="/kalkulacka" element={<CalculatorPage />} />
            <Route path="/dopyt/:code" element={<RequestPage />} />
            <Route path="/obhliadka" element={<BookingPage />} />
            <Route path="/termin/:code" element={<VisitPage />} />
            <Route path="/havaria" element={<EmergencyPage />} />
            <Route path="/havaria/:code" element={<TrackingPage />} />
            <Route path="/ponuka/:code" element={<QuotePage />} />
            <Route path="/kontakt" element={<ContactPage />} />
            <Route path="/ochrana-sukromia" element={<PrivacyPage />} />
            <Route path="/generator" element={<GeneratorPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!bare && <Footer />}
      {!bare && <MobileActionBar />}
      <Overlays />
    </ToastProvider>
  );
}
