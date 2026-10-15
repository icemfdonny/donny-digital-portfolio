import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import Overlays from "./components/layout/Overlays";
import { ToastProvider } from "./components/toast";
import { VisitProvider } from "./lib/visit";
import Home from "./pages/Home";

const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const SpecialistPage = lazy(() => import("./pages/SpecialistPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const LoyaltyPage = lazy(() => import("./pages/LoyaltyPage"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const ManagePage = lazy(() => import("./pages/ManagePage"));
const AccountPage = lazy(() => import("./pages/account/AccountPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
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

function PageFallback() {
  return <div className="min-h-[70vh] bg-plum" aria-busy="true" />;
}

export default function App() {
  const { pathname } = useLocation();
  const admin = pathname.startsWith("/admin");

  return (
    <ToastProvider>
      <VisitProvider>
        <ScrollManager />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Preskočiť na obsah
        </a>
        {!admin && <Header />}
        <main id="main">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sluzby" element={<ServicesPage />} />
              <Route path="/tim" element={<TeamPage />} />
              <Route path="/tim/:id" element={<SpecialistPage />} />
              <Route path="/galeria" element={<GalleryPage />} />
              <Route path="/vernostny-program" element={<LoyaltyPage />} />
              <Route path="/rezervacia" element={<BookingPage />} />
              <Route path="/rezervacia/:code" element={<ManagePage />} />
              <Route path="/ucet" element={<AccountPage />} />
              <Route path="/kontakt" element={<ContactPage />} />
              <Route path="/ochrana-sukromia" element={<PrivacyPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        {!admin && <Footer />}
        <Overlays />
      </VisitProvider>
    </ToastProvider>
  );
}
