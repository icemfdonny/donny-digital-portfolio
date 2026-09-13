import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";
import Logo from "./Logo";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-charcoal/90 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20 md:px-10"
      >
        <a href="#home" aria-label="Donny Digital — home">
          <Logo className="h-8 w-auto md:h-9" />
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="hidden rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-charcoal transition-transform hover:-translate-y-0.5 md:inline-block"
        >
          Let&rsquo;s talk
        </a>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </nav>

      <div
        id="mobile-menu"
        inert={!open}
        className={`fixed inset-x-0 top-16 z-40 origin-top border-b border-white/10 bg-charcoal transition-[transform,opacity] duration-200 md:hidden ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1 px-6 py-6">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-lg text-white/80 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="pt-3">
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="inline-block w-full rounded-full bg-orange px-5 py-3 text-center text-sm font-semibold text-charcoal"
            >
              Let&rsquo;s talk
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
