import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { RESTAURANT, STUDIO } from "../../config";
import { isEmail } from "../../lib/format";
import { hoursRows } from "../../lib/hours";
import { useNow } from "../../lib/hooks";
import { updateDB } from "../../lib/store";
import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone } from "../icons";
import { useToast } from "../toast";
import { LeafMark, Logo } from "../ui";
import { NAV } from "./nav";

export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Zadajte platný e-mail.");
      return;
    }
    updateDB((db) => ({ ...db, newsletter: [...new Set([...db.newsletter, email.trim().toLowerCase()])] }));
    setDone(true);
    toast("Ďakujeme! Prvý list príde s novým sezónnym menu.");
  };
  if (done)
    return (
      <p className={`rounded-2xl px-5 py-4 text-sm ${tone === "light" ? "bg-cream/8 text-cream/80" : "bg-sand text-soft"}`}>
        Hotovo, {email} je na zozname. Píšeme raz za mesiac, nikdy nespamujeme.
      </p>
    );
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={`newsletter-${tone}`} className="sr-only">
        E-mail pre odber noviniek
      </label>
      <div
        className={`flex items-center rounded-full border p-1.5 pl-5 ${
          tone === "light" ? "border-cream/20 bg-cream/5 focus-within:border-cream/50" : "border-line bg-paper focus-within:border-moss"
        }`}
      >
        <input
          id={`newsletter-${tone}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vas@email.sk"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          className={`min-w-0 flex-1 bg-transparent text-[15px] outline-none ${tone === "light" ? "text-cream placeholder:text-cream/40" : "text-ink placeholder:text-mute"}`}
          aria-invalid={!!error}
        />
        <button type="submit" className={tone === "light" ? "btn-honey px-4 py-2.5" : "btn-primary px-4 py-2.5"} aria-label="Prihlásiť na odber">
          <ArrowRight size={18} />
        </button>
      </div>
      {error && <p className={`mt-2 pl-5 text-sm ${tone === "light" ? "text-[#f0a596]" : "text-danger"}`}>{error}</p>}
    </form>
  );
}

export default function Footer() {
  const now = useNow(60_000);
  const today = now.getDay();
  return (
    <footer className="relative overflow-hidden bg-night text-cream">
      <LeafMark className="pointer-events-none absolute -bottom-24 -left-20 size-[460px] text-cream/[0.03]" />
      <div className="container-page relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr] lg:py-20">
        <div>
          <Logo tone="light" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-cream/60">
            Sezónna kuchyňa, slovenské vína a dlhé večery pod lipou v srdci Starého Mesta. Od roku {RESTAURANT.founded}.
          </p>
          <div className="mt-6 flex gap-2">
            <a href={`https://instagram.com/${RESTAURANT.instagram}`} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-cream/15 text-cream/70 hover:border-cream/50 hover:text-cream" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-cream/15 text-cream/70 hover:border-cream/50 hover:text-cream" aria-label="Facebook">
              <Facebook size={18} />
            </a>
          </div>
        </div>

        <div>
          <h2 className="eyebrow mb-5 text-honey">Kontakt</h2>
          <ul className="space-y-3 text-sm text-cream/75">
            <li className="flex gap-3">
              <MapPin size={17} className="mt-0.5 text-cream/40" />
              <span>
                {RESTAURANT.street}
                <br />
                {RESTAURANT.zip} {RESTAURANT.city}
              </span>
            </li>
            <li>
              <a href={RESTAURANT.phoneHref} className="flex gap-3 hover:text-cream">
                <Phone size={17} className="text-cream/40" /> {RESTAURANT.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${RESTAURANT.email}`} className="flex gap-3 hover:text-cream">
                <Mail size={17} className="text-cream/40" /> {RESTAURANT.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="eyebrow mb-5 text-honey">Otváracie hodiny</h2>
          <dl className="space-y-2.5 text-sm">
            {hoursRows().map((row) => (
              <div key={row.days} className={`flex justify-between gap-4 ${row.dayIndexes.includes(today) ? "text-cream" : "text-cream/60"}`}>
                <dt className="flex items-center gap-2">
                  {row.dayIndexes.includes(today) && <span className="size-1.5 rounded-full bg-honey" aria-label="dnes" />}
                  {row.days}
                </dt>
                <dd className="tabular-nums">{row.hours}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-cream/45">Kuchyňa zatvára hodinu pred koncom. Obedové menu Po – Pi 11:00 – 14:30.</p>
        </div>

        <div>
          <h2 className="eyebrow mb-5 text-honey">Novinky raz za mesiac</h2>
          <p className="mb-5 text-sm leading-relaxed text-cream/60">Nové sezónne menu, vínne večery a pozvánky na akcie skôr, než sa vypredajú.</p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-4 py-6 text-xs text-cream/45 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Odkazy v pätičke" className="flex flex-wrap gap-x-5 gap-y-2">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="hover:text-cream">
                {item.label}
              </Link>
            ))}
            <Link to="/ochrana-sukromia" className="hover:text-cream">
              Ochrana súkromia
            </Link>
            <button type="button" className="hover:text-cream" onClick={() => window.dispatchEvent(new Event("lipa:cookies"))}>
              Nastavenia cookies
            </button>
          </nav>
          <p>
            © {now.getFullYear()} {RESTAURANT.name} · Fiktívna reštaurácia, ukážkový web od{" "}
            <a href={STUDIO.url || `mailto:${STUDIO.email}`} className="text-cream/70 underline-offset-4 hover:text-cream hover:underline">
              {STUDIO.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
