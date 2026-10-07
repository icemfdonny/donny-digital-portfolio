import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { PROJECTS, SERVICES } from "../data";
import { ArrowRightIcon, CloseIcon, MenuIcon } from "./icons";
import Logo from "./Logo";

type MenuKey = "work" | "services";
const NAV: { label: string; to: string; menu?: MenuKey }[] = [
  { label: "Work", to: "/work", menu: "work" },
  { label: "Services", to: "/services", menu: "services" },
  { label: "About", to: "/about" },
  { label: "Process", to: "/process" },
  { label: "Contact", to: "/contact" },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function WorkPanel({ active, onNavigate }: { active: boolean; onNavigate: () => void }) {
  const [preview, setPreview] = useState(PROJECTS[0].slug);
  // The panel is always mounted (just hidden), so only start fetching screenshots once the menu has been opened.
  const [seen, setSeen] = useState(false);
  if (active && !seen) setSeen(true);
  const current = PROJECTS.find((p) => p.slug === preview) ?? PROJECTS[0];

  return (
    <div className="grid w-[660px] grid-cols-[1fr_250px] gap-3 p-3">
      <div className="flex flex-col">
        <p className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Selected work</p>
        <ul className="flex-1 space-y-0.5">
          {PROJECTS.map((p) => (
            <li key={p.slug}>
              <Link
                to={`/work/${p.slug}`}
                onClick={onNavigate}
                onMouseEnter={() => setPreview(p.slug)}
                onFocus={() => setPreview(p.slug)}
                className="group/row flex items-baseline gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06]"
              >
                <span className="font-mono text-[10px] text-dim">{p.index}</span>
                <span className="font-display text-[13px] text-white">{p.title}</span>
                <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-dim">{p.year}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/work"
          onClick={onNavigate}
          className="mt-2 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
        >
          View all work
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>

      <div className="relative h-[220px] overflow-hidden rounded-xl border border-white/10 bg-panel">
        {seen && (
          <img
            key={current.slug}
            src={current.cover}
            alt=""
            width={1600}
            height={1000}
            decoding="async"
            className="absolute inset-0 size-full animate-[fade-up_0.5s_both] object-cover object-top"
          />
        )}
        <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent px-4 pb-3 pt-8 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          {current.category}
        </p>
      </div>
    </div>
  );
}

function ServicesPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="w-[560px] p-3">
      <p className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">What I do</p>
      <ul className="grid grid-cols-2 gap-1">
        {SERVICES.map((s) => (
          <li key={s.slug}>
            <Link
              to={`/services#${s.slug}`}
              onClick={onNavigate}
              className="block h-full rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06]"
            >
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-dim">{s.number}</span>
                <span className="font-display text-[13px] text-white">{s.title}</span>
              </span>
              <span className="mt-1.5 line-clamp-2 block pl-[1.6rem] text-xs leading-relaxed text-muted">{s.short}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/services"
        onClick={onNavigate}
        className="mt-2 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
      >
        All services
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<MenuKey | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const list = useRef<HTMLUListElement>(null);

  const closeMenu = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setMenu(null);
  }, []);
  const openMenu = (key: MenuKey | null) => {
    window.clearTimeout(closeTimer.current);
    setMenu(key);
  };
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenu(null), 140);
  };

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMenu(null);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // "Scrolled" comes from an observer on a 24px sentinel at the top of the page (see App), so there is no scroll handler.
  useEffect(() => {
    const sentinel = document.getElementById("top-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  const solid = scrolled || mobileOpen || menu !== null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <nav
        aria-label="Primary"
        className="relative isolate mx-auto flex max-w-6xl items-center justify-between rounded-full border border-transparent py-2 pl-5 pr-2"
      >
        {/* The pill is its own layer that only fades in. A backdrop blur plus transition-all re-blurred the page under the bar
            and repainted the shadow on every frame of the first scroll, which was the lag when leaving the hero. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-px -z-10 rounded-full border border-white/10 bg-black/[0.98] shadow-[0_10px_50px_-15px_rgba(0,0,0,1)] transition-opacity duration-500 ${
            solid ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="flex items-center gap-3 lg:gap-6">
          <Link to="/" aria-label="Donny-Digital — home" className="flex items-center">
            <Logo className="h-5 md:h-6" />
          </Link>

          <ul ref={list} className="ml-2 hidden items-center gap-0.5 md:flex" onMouseLeave={scheduleClose}>
            {NAV.map((item) => (
              <li
                key={item.to}
                className="relative"
                onMouseEnter={() => openMenu(item.menu ?? null)}
                onFocus={() => openMenu(item.menu ?? null)}
                onBlur={(e) => {
                  if (!list.current?.contains(e.relatedTarget as Node | null)) scheduleClose();
                }}
              >
                <NavLink
                  to={item.to}
                  aria-haspopup={item.menu ? "true" : undefined}
                  aria-expanded={item.menu ? menu === item.menu : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors lg:px-4 ${
                      isActive || (item.menu && menu === item.menu)
                        ? "bg-white/10 text-white"
                        : "text-muted hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                  {item.menu && <Chevron open={menu === item.menu} />}
                </NavLink>

                {item.menu && (
                  <div
                    data-menu-closed={menu === item.menu ? undefined : ""}
                    className={`absolute left-0 top-full pt-5 transition-all duration-300 ${
                      menu === item.menu ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/[0.97] shadow-[0_30px_80px_-20px_rgba(0,0,0,1),0_0_0_1px_rgba(255,255,255,0.03)]">
                      {item.menu === "work" ? <WorkPanel active={menu === "work"} onNavigate={closeMenu} /> : <ServicesPanel onNavigate={closeMenu} />}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-1">
          <Link to="/contact" className="btn-primary hidden px-5 py-2.5 text-sm md:inline-flex">
            Let&rsquo;s talk
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        inert={!mobileOpen}
        className={`mx-auto mt-2 max-h-[calc(100dvh-5.5rem)] max-w-6xl origin-top overflow-y-auto rounded-3xl border border-white/10 bg-black p-3 transition-[transform,opacity] duration-300 md:hidden ${
          mobileOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <ul className="flex flex-col">
          <li>
            <Link to="/" className="block rounded-2xl px-4 py-3.5 text-lg text-fg transition-colors hover:bg-white/5">
              Home
            </Link>
          </li>
          {NAV.map((item) => (
            <li key={item.to}>
              {item.menu ? (
                <details className="group/d rounded-2xl open:bg-white/[0.03]">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-3.5 text-lg text-fg transition-colors hover:bg-white/5 [&::-webkit-details-marker]:hidden">
                    {item.label}
                    <span className="transition-transform duration-300 group-open/d:rotate-180">
                      <Chevron open={false} />
                    </span>
                  </summary>
                  <ul className="pb-2 pl-3 pr-1">
                    <li>
                      <Link to={item.to} className="block rounded-xl px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5">
                        {item.menu === "work" ? "All work" : "All services"}
                      </Link>
                    </li>
                    {item.menu === "work"
                      ? PROJECTS.map((p) => (
                          <li key={p.slug}>
                            <Link to={`/work/${p.slug}`} className="block rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-white/5">
                              {p.title}
                            </Link>
                          </li>
                        ))
                      : SERVICES.map((s) => (
                          <li key={s.slug}>
                            <Link to={`/services#${s.slug}`} className="block rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-white/5">
                              {s.title}
                            </Link>
                          </li>
                        ))}
                  </ul>
                </details>
              ) : (
                <Link to={item.to} className="block rounded-2xl px-4 py-3.5 text-lg text-fg transition-colors hover:bg-white/5">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
          <li className="p-1 pt-3">
            <Link to="/contact" className="btn-primary w-full px-5 py-3.5 text-sm">
              Let&rsquo;s talk
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
