import { Link } from "react-router-dom";
import { STUDIO } from "../../config";
import { HOURS_ROWS } from "../../lib/hours";
import { minutesToTime } from "../../lib/format";
import { BIZ, TRADE } from "../../lib/profile";
import { Facebook, Instagram, Mail, MapPin, Phone } from "../icons";
import { ContactLink, Logo } from "../ui";
import { NAV, useEmergencyOn } from "./nav";

const YEAR = new Date().getFullYear();

export default function Footer() {
  const emergency = useEmergencyOn();
  return (
    <footer className="no-print bg-night pb-28 pt-16 text-white/70 sm:pb-10">
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              {TRADE.tagline} v okolí mesta {BIZ.city}. Od roku {BIZ.since}, s pevnou cenou vopred a zárukou {TRADE.stats.warranty} rokov na prácu.
            </p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Instagram].map((I, i) => (
                <span key={i} className="grid size-10 place-items-center rounded-xl bg-white/5 text-white/60" aria-hidden="true">
                  <I size={18} />
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Kontakt</p>
            <ul className="space-y-3 text-sm">
              <li>
                <ContactLink kind="tel" className="flex items-center gap-2.5 font-semibold text-white hover:text-accent">
                  <Phone size={16} /> {BIZ.phoneLabel}
                </ContactLink>
              </li>
              <li>
                <ContactLink kind="mail" className="flex items-center gap-2.5 hover:text-white">
                  <Mail size={16} /> {BIZ.email}
                </ContactLink>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5" />
                <span>
                  {BIZ.street}
                  <br />
                  {BIZ.city}
                </span>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Otváracie hodiny</p>
            <ul className="space-y-2 text-sm">
              {HOURS_ROWS.map((r) => (
                <li key={r.label} className="flex justify-between gap-4">
                  <span>{r.label}</span>
                  <span className="whitespace-nowrap tabular-nums text-white">{r.hours ? `${minutesToTime(r.hours.open)} – ${minutesToTime(r.hours.close)}` : "zatvorené"}</span>
                </li>
              ))}
            </ul>
            {emergency && (
              <Link to="/havaria" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-danger/15 px-3 py-2 text-sm font-semibold text-[#ff8a80] hover:bg-danger/25">
                Pohotovosť nonstop, aj cez sviatky
              </Link>
            )}
          </div>
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Web</p>
            <ul className="space-y-2 text-sm">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-white">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/obhliadka" className="hover:text-white">
                  Objednať termín
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white">
                  Administrácia
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {YEAR} {BIZ.name} · IČO {BIZ.ico} · DIČ {BIZ.dic} ·{" "}
            <Link to="/ochrana-sukromia" className="hover:text-white">
              Ochrana súkromia
            </Link>{" "}
            ·{" "}
            <button type="button" className="hover:text-white" onClick={() => window.dispatchEvent(new Event("majster:cookies"))}>
              Cookies
            </button>
          </p>
          <p>
            Web vytvoril{" "}
            {STUDIO.url ? (
              <a href={STUDIO.url} className="text-white/70 hover:text-white" target="_blank" rel="noreferrer">
                {STUDIO.name}
              </a>
            ) : (
              <span className="text-white/70">{STUDIO.name}</span>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
