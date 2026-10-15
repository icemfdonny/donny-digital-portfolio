import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { officeStatus } from "../../lib/hours";
import { useNow, useScrolled } from "../../lib/hooks";
import { BIZ } from "../../lib/profile";
import { NAV, useEmergencyOn } from "./nav";
import { Calculator, Calendar, Clock, Menu, Phone, Siren, X } from "../icons";
import { ContactLink, Logo, StatusDot } from "../ui";

export default function Header() {
  const now = useNow();
  const scrolled = useScrolled(8);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const status = officeStatus(now);
  const emergency = useEmergencyOn();

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <div className="no-print hidden bg-ink text-[13px] text-white/75 md:block">
        <div className="container-page flex h-9 items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5 whitespace-nowrap">
            <span className="flex items-center gap-2">
              <StatusDot tone={status.open ? "ok" : "off"} />
              {status.text}
            </span>
            <span className="hidden items-center gap-1.5 xl:flex">
              <Clock size={14} /> Odpovieme do 2 hodín v pracovnom čase
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-5 whitespace-nowrap">
            <ContactLink kind="tel" className="flex items-center gap-1.5 whitespace-nowrap font-semibold text-white hover:text-accent">
              <Phone size={14} /> {BIZ.phoneLabel}
            </ContactLink>
            {emergency && (
              <Link to="/havaria" className="flex items-center gap-1.5 whitespace-nowrap font-semibold text-white hover:text-accent">
                <StatusDot tone="danger" /> Pohotovosť 24/7
              </Link>
            )}
            <ContactLink kind="mail" className="hidden max-w-64 truncate hover:text-white xl:inline">
              {BIZ.email}
            </ContactLink>
          </div>
        </div>
      </div>
      <header className={`no-print sticky top-0 z-40 border-b bg-paper/95 backdrop-blur transition-shadow ${scrolled ? "border-line shadow-[0_6px_20px_-12px_rgb(0_0_0/0.25)]" : "border-transparent"}`}>
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[72px]">
          <Link to="/" className="flex min-w-0" aria-label={`${BIZ.name} – domov`}>
            <Logo taglineClassName="lg:max-xl:hidden" />
          </Link>
          <nav aria-label="Hlavná navigácia" className="hidden shrink-0 items-center gap-0.5 lg:flex xl:gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `whitespace-nowrap rounded-lg px-2.5 py-2 text-[15px] font-semibold xl:px-3 transition-colors ${isActive ? "bg-sand text-ink" : "text-soft hover:text-ink"}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {emergency && (
              <Link to="/havaria" className="btn btn-sm hidden whitespace-nowrap border-2 border-danger/25 py-1.5 text-danger hover:border-danger hover:bg-danger-soft sm:inline-flex">
                <Siren size={17} /> Havária
              </Link>
            )}
            <Link to="/obhliadka" className="btn-accent btn-sm hidden whitespace-nowrap sm:inline-flex">
              <Calendar size={17} /> Objednať termín
            </Link>
            <button type="button" className="grid size-11 place-items-center rounded-xl text-ink hover:bg-sand lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Zavrieť menu" : "Otvoriť menu"}>
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="fixed inset-x-0 bottom-0 top-16 z-40 animate-rise overflow-y-auto bg-paper lg:hidden">
            <nav aria-label="Mobilná navigácia" className="container-page flex flex-col gap-1 py-6">
              <NavLink to="/" end className={({ isActive }) => `rounded-xl px-4 py-3.5 text-xl font-bold ${isActive ? "bg-sand" : ""}`}>
                Domov
              </NavLink>
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `rounded-xl px-4 py-3.5 text-xl font-bold ${isActive ? "bg-sand" : ""}`}>
                  {n.label}
                </NavLink>
              ))}
              <div className="mt-6 grid gap-2">
                <Link to="/obhliadka" className="btn-accent w-full py-4">
                  <Calendar size={18} /> Objednať termín
                </Link>
                <Link to="/kalkulacka" className="btn-outline w-full py-4">
                  <Calculator size={18} /> Spočítať cenu
                </Link>
                {emergency && (
                  <Link to="/havaria" className="btn-danger w-full py-4">
                    <Siren size={18} /> Havária 24/7
                  </Link>
                )}
              </div>
              <p className="mt-6 flex items-center gap-2 px-1 text-sm text-soft">
                <StatusDot tone={status.open ? "ok" : "off"} /> {status.text}
              </p>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

/** Thumb-reach actions on phones: call, price, emergency or booking. */
export function MobileActionBar() {
  const { pathname } = useLocation();
  const emergency = useEmergencyOn();
  const hidden = ["/kalkulacka", "/obhliadka", "/havaria", "/ponuka", "/generator"].some((p) => pathname.startsWith(p));
  if (hidden) return null;
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden">
      <div className="grid grid-cols-3 gap-2">
        <ContactLink kind="tel" className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold text-ink">
          <Phone size={20} /> Zavolať
        </ContactLink>
        <Link to="/kalkulacka" className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold text-ink">
          <Calculator size={20} /> Cena online
        </Link>
        {emergency ? (
          <Link to="/havaria" className="flex flex-col items-center gap-0.5 rounded-xl bg-danger py-1.5 text-[11px] font-bold text-white">
            <Siren size={20} /> Havária
          </Link>
        ) : (
          <Link to="/obhliadka" className="flex flex-col items-center gap-0.5 rounded-xl bg-accent py-1.5 text-[11px] font-bold text-accent-ink">
            <Calendar size={20} /> Termín
          </Link>
        )}
      </div>
    </div>
  );
}
