import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SALON } from "../../config";
import { openStatus } from "../../lib/hours";
import { useNow, useScrolled } from "../../lib/hooks";
import { useAccount } from "../../lib/store";
import { useVisit } from "../../lib/visit";
import { Calendar, MapPin, Menu, Phone, User, X } from "../icons";
import { Initials, Logo, StatusDot } from "../ui";
import { NAV } from "./nav";

export function OpenStatusPill({ tone = "light" }: { tone?: "light" | "dark" }) {
  const now = useNow();
  const status = openStatus(now);
  return (
    <Link to="/kontakt#otvaracie-hodiny" className={`inline-flex items-center gap-2 text-[13px] ${tone === "light" ? "text-ivory/80 hover:text-ivory" : "text-soft hover:text-ink"}`}>
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
  const account = useAccount();
  const { items } = useVisit();
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
        solid ? "bg-ivory/92 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-transparent text-ivory"
      } ${open ? "!bg-plum !text-ivory !shadow-none" : ""}`}
    >
      <div className="container-page flex h-[76px] items-center gap-6">
        <Link to="/" aria-label={`${SALON.name}, domov`} className="shrink-0">
          <Logo tone={light || open ? "light" : "dark"} />
        </Link>

        <nav aria-label="Hlavná navigácia" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-[14.5px] transition-colors ${
                  isActive ? (light ? "bg-ivory/12 text-ivory" : "bg-plum/[0.07] text-plum") : light ? "text-ivory/80 hover:text-ivory" : "text-soft hover:text-ink"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="mr-1 hidden 2xl:block">
            <OpenStatusPill tone={light ? "light" : "dark"} />
          </div>
          <Link
            to="/ucet"
            className={`relative inline-flex h-11 items-center gap-2 rounded-full border text-sm transition-colors ${account ? "pl-1 pr-1 sm:pr-4" : "w-11 justify-center sm:w-auto sm:px-4"} ${
              light || open ? "border-ivory/25 text-ivory hover:border-ivory/60" : "border-ink/15 text-ink hover:border-ink/40"
            }`}
            aria-label={account ? `Môj účet, ${account.name}` : "Prihlásiť sa"}
          >
            {account ? (
              <>
                <Initials name={account.name} className="size-9 text-xs" />
                <span className="hidden sm:inline">{account.name.split(" ")[0]}</span>
              </>
            ) : (
              <>
                <User size={18} />
                <span className="hidden sm:inline">Prihlásiť</span>
              </>
            )}
          </Link>
          <Link to="/rezervacia" className="btn-gold relative size-11 p-0 sm:size-auto sm:px-5 sm:py-3" aria-label="Rezervovať termín">
            <Calendar size={17} /> <span className="hidden sm:inline">Rezervovať</span>
            {items.length > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-plum text-[11px] font-semibold text-ivory ring-2 ring-ivory">{items.length}</span>
            )}
          </Link>
          <button
            type="button"
            className={`grid size-11 place-items-center rounded-full border lg:hidden ${light || open ? "border-ivory/25" : "border-ink/15"}`}
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
        <div id="mobile-nav" className="h-[calc(100dvh-76px)] overflow-y-auto bg-plum px-4 pb-10 pt-4 text-ivory sm:px-8 lg:hidden">
          <nav aria-label="Mobilná navigácia" className="flex flex-col">
            {[{ to: "/", label: "Domov" }, ...NAV, { to: "/ucet", label: account ? "Môj účet" : "Prihlásenie" }].map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) => `animate-rise border-b border-ivory/10 py-4 font-display text-[2rem] font-medium ${isActive ? "text-gold-soft" : "text-ivory"}`}
                style={{ animationDelay: `${i * 35}ms` }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/rezervacia" className="btn-gold mt-8 w-full py-4 text-base">
            <Calendar size={18} /> Rezervovať termín
          </Link>
          <div className="mt-8 space-y-3 text-sm text-ivory/70">
            <OpenStatusPill />
            <a href={SALON.phoneHref} className="flex items-center gap-2">
              <Phone size={16} /> {SALON.phone}
            </a>
            <p className="flex items-center gap-2">
              <MapPin size={16} /> {SALON.street}, {SALON.city}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
