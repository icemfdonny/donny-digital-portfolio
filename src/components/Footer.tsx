import { Link } from "react-router-dom";
import { EMAIL, PROJECTS, SOCIALS } from "../data";
import { ArrowUpRightIcon } from "./icons";
import Logo from "./Logo";

const PAGES = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/process", label: "Process" },
  { to: "/contact", label: "Contact" },
];

const linkClass = "text-sm text-neutral-300 transition-colors hover:text-white";
const headClass = "font-mono text-[11px] uppercase tracking-[0.2em] text-dim";

export default function Footer() {
  return (
    <footer className="cv-auto relative overflow-hidden border-t border-white/10">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-10 pt-16 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 md:col-span-1">
          <Link to="/" aria-label="Donny-Digital — home">
            <Logo className="h-7" />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
            Freelance web design and front-end development studio &mdash; building bold, memorable digital experiences.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className={headClass}>Pages</p>
          <ul className="mt-4 space-y-2.5">
            {PAGES.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className={headClass}>Work</p>
          <ul className="mt-4 space-y-2.5">
            {PROJECTS.map((p) => (
              <li key={p.slug}>
                <Link to={`/work/${p.slug}`} className={linkClass}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={headClass}>Connect</p>
          <a href={`mailto:${EMAIL}`} className={`mt-4 inline-block break-all ${linkClass}`}>
            {EMAIL}
          </a>
          <ul className="mt-3 space-y-2.5">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 ${linkClass}`}>
                  {s.label}
                  <ArrowUpRightIcon className="size-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 px-6 py-6 font-mono text-[11px] text-dim sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Donny Digital. All rights reserved.</p>
        <p>Designed &amp; built in Bratislava, Slovakia.</p>
      </div>

      <div aria-hidden="true" className="pointer-events-none select-none px-6 pb-0 pt-4">
        <Logo className="mx-auto w-[min(1100px,100%)] opacity-[0.07] [mask-image:linear-gradient(to_bottom,#000_30%,transparent)]" />
      </div>
    </footer>
  );
}
