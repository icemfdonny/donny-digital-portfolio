import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { RESTAURANT } from "../../config";
import { useCart } from "../../lib/cart";
import { openStatus } from "../../lib/hours";
import { useNow, useScrolled } from "../../lib/hooks";
import { Bag, Calendar, MapPin, Menu, Phone, X } from "../icons";
import { Logo, StatusDot } from "../ui";
import { NAV } from "./nav";



export function OpenStatusPill({ tone = "light" }: { tone?: "light" | "dark" }) {
  const now = useNow();
  const status = openStatus(now);
  return (
    <Link
      to="/kontakt#otvaracie-hodiny"
      className={`inline-flex items-center gap-2 text-[13px] ${tone === "light" ? "text-cream/80 hover:text-cream" : "text-soft hover:text-ink"}`}
    >
      <StatusDot tone={status.open ? (status.closingSoon ? "warn" : "ok") : "off"} />
      <span className="font-medium">{status.label}</span>
      <span className="hidden opacity-70 2xl:inline">· {status.detail}</span>
    </Link>
  );
}

export default function Header() {
  const scrolled = useScrolled(40);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { totals } = useCart();
  const solid = scrolled || open;

  // Close the mobile menu when the route changes.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const light = !solid;
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,color] duration-300 ${
        solid ? "bg-cream/92 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-transparent text-cream"
      } ${open ? "!bg-forest !text-cream !shadow-none" : ""}`}
    >
      <div className="container-page flex h-[72px] items-center gap-6">
        <Link to="/" aria-label={`${RESTAURANT.name}, domov`} className="shrink-0">
          <Logo tone={light || open ? "light" : "dark"} />
        </Link>

        <nav aria-label="Hlavná navigácia" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-[14.5px] transition-colors ${
                  isActive ? (light ? "bg-cream/12 text-cream" : "bg-forest/[0.07] text-forest") : light ? "text-cream/80 hover:text-cream" : "text-soft hover:text-ink"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="mr-2 hidden xl:block">
            <OpenStatusPill tone={light ? "light" : "dark"} />
          </div>
          {totals.items > 0 && (
            <Link
              to="/objednavka"
              className={`relative grid size-11 place-items-center rounded-full border transition-colors ${
                light || open ? "border-cream/25 text-cream hover:border-cream/60" : "border-ink/15 text-ink hover:border-ink/40"
              }`}
              aria-label={`Košík, ${totals.items} položiek`}
            >
              <Bag size={19} />
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-honey text-[11px] font-semibold text-forest">{totals.items}</span>
            </Link>
          )}
          <Link to="/rezervacia" className="btn-honey size-11 p-0 sm:size-auto sm:px-5 sm:py-3" aria-label="Rezervovať stôl">
            <Calendar size={17} /> <span className="hidden sm:inline">Rezervovať stôl</span>
          </Link>
          <button
            type="button"
            className={`grid size-11 place-items-center rounded-full border lg:hidden ${light || open ? "border-cream/25" : "border-ink/15"}`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Zavrieť menu" : "Otvoriť menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="h-[calc(100dvh-72px)] overflow-y-auto bg-forest px-5 pb-10 pt-4 text-cream sm:px-8 lg:hidden">
          <nav aria-label="Mobilná navigácia" className="flex flex-col">
            {[{ to: "/", label: "Domov" }, ...NAV].map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `animate-rise border-b border-cream/10 py-4 font-display text-[1.9rem] tracking-tight ${isActive ? "text-honey" : "text-cream"}`
                }
                style={{ animationDelay: `${i * 35}ms` }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/rezervacia" className="btn-honey w-full py-4 text-base">
              <Calendar size={18} /> Rezervovať stôl
            </Link>
            <Link to="/objednavka" className="btn-ghost-light w-full py-4 text-base">
              <Bag size={18} /> Objednať so sebou
            </Link>
          </div>
          <div className="mt-8 space-y-3 text-sm text-cream/70">
            <OpenStatusPill />
            <a href={RESTAURANT.phoneHref} className="flex items-center gap-2">
              <Phone size={16} /> {RESTAURANT.phone}
            </a>
            <p className="flex items-center gap-2">
              <MapPin size={16} /> {RESTAURANT.street}, {RESTAURANT.city}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
