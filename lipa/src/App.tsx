import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import Overlays from "./components/layout/Overlays";
import { ToastProvider } from "./components/toast";
import { CartProvider } from "./lib/cart";
import Home from "./pages/Home";

const MenuPage = lazy(() => import("./pages/MenuPage"));
const ReservationPage = lazy(() => import("./pages/ReservationPage"));
const ManageReservationPage = lazy(() => import("./pages/ManageReservationPage"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const VouchersPage = lazy(() => import("./pages/VouchersPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
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
  return <div className="min-h-[70vh] bg-forest" aria-busy="true" />;
}

export default function App() {
  const { pathname } = useLocation();
  const admin = pathname.startsWith("/admin");

  return (
    <ToastProvider>
      <CartProvider>
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
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/rezervacia" element={<ReservationPage />} />
              <Route path="/rezervacia/:code" element={<ManageReservationPage />} />
              <Route path="/objednavka" element={<OrderPage />} />
              <Route path="/objednavka/pokladna" element={<CheckoutPage />} />
              <Route path="/objednavka/:id" element={<OrderTrackingPage />} />
              <Route path="/podujatia" element={<EventsPage />} />
              <Route path="/poukazky" element={<VouchersPage />} />
              <Route path="/o-nas" element={<AboutPage />} />
              <Route path="/kontakt" element={<ContactPage />} />
              <Route path="/ochrana-sukromia" element={<PrivacyPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        {!admin && <Footer />}
        <Overlays />
      </CartProvider>
    </ToastProvider>
  );
}
