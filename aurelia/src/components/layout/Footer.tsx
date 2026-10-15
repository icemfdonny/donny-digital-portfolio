import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { SALON } from "../../config";
import { isEmail } from "../../lib/format";
import { hoursRows } from "../../lib/hours";
import { useNow } from "../../lib/hooks";
import { updateDB } from "../../lib/store";
import { ArrowRight, Instagram, Mail, MapPin, Phone } from "../icons";
import { useToast } from "../toast";
import { Logo, Monogram } from "../ui";
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
    toast("Ďakujeme! Prvý beauty list príde začiatkom mesiaca.");
  };
  if (done)
    return <p className={`rounded-2xl px-5 py-4 text-sm ${tone === "light" ? "bg-ivory/8 text-ivory/80" : "bg-blush text-soft"}`}>Hotovo, {email} je na zozname. Píšeme raz mesačne, nikdy nespamujeme.</p>;
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={`newsletter-${tone}`} className="sr-only">
        E-mail pre odber noviniek
      </label>
      <div className={`flex items-center rounded-full border p-1.5 pl-5 ${tone === "light" ? "border-ivory/20 bg-ivory/5 focus-within:border-ivory/50" : "border-line bg-paper focus-within:border-mauve"}`}>
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
          className={`min-w-0 flex-1 bg-transparent text-[15px] outline-none ${tone === "light" ? "text-ivory placeholder:text-ivory/40" : "text-ink placeholder:text-mute"}`}
          aria-invalid={!!error}
        />
        <button type="submit" className={tone === "light" ? "btn-gold px-4 py-2.5" : "btn-primary px-4 py-2.5"} aria-label="Prihlásiť na odber">
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
    <footer className="relative overflow-hidden bg-night text-ivory">
      <Monogram arc={false} className="pointer-events-none absolute -bottom-28 -left-24 size-[480px] text-ivory/[0.04]" />
      <div className="container-page relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_1fr_1.3fr] lg:py-20">
        <div>
          <Logo tone="light" />
          <p className="mt-6 max-w-xs text-sm font-light leading-relaxed text-ivory/60">
            Vlasy, nechty, pleť a pohľad pod jednou strechou. Malé ateliérové štúdio v srdci Bratislavy, od roku {SALON.founded}.
          </p>
          <div className="mt-6 flex gap-2">
            <a href={`https://instagram.com/${SALON.instagram}`} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-ivory/15 text-ivory/70 hover:border-ivory/50 hover:text-ivory" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href={`mailto:${SALON.email}`} className="grid size-10 place-items-center rounded-full border border-ivory/15 text-ivory/70 hover:border-ivory/50 hover:text-ivory" aria-label="E-mail">
              <Mail size={18} />
            </a>
          </div>
        </div>

        <div>
          <p className="eyebrow text-gold-soft/80">Salón</p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {[...NAV, { to: "/rezervacia", label: "Rezervácia" }, { to: "/ucet", label: "Môj účet" }].map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="link-underline text-ivory/70 hover:text-ivory">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-gold-soft/80">Otváracie hodiny</p>
          <dl className="mt-5 space-y-2 text-sm">
            {hoursRows().map((row) => (
              <div key={row.days} className={`flex justify-between gap-4 ${row.dayIndexes.includes(today) ? "text-ivory" : "text-ivory/60"}`}>
                <dt>{row.days}</dt>
                <dd className="tabular-nums">{row.hours}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 space-y-2 text-sm text-ivory/70">
            <a href={SALON.phoneHref} className="flex items-center gap-2 hover:text-ivory">
              <Phone size={15} /> {SALON.phone}
            </a>
            <p className="flex items-center gap-2">
              <MapPin size={15} /> {SALON.street}, {SALON.city}
            </p>
          </div>
        </div>

        <div>
          <p className="eyebrow text-gold-soft/80">Beauty list</p>
          <p className="mt-5 text-sm font-light leading-relaxed text-ivory/60">Raz mesačne tipy na starostlivosť, voľné termíny na poslednú chvíľu a pozvánky na beauty večery.</p>
          <div className="mt-5">
            <NewsletterForm />
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {now.getFullYear()} {SALON.fullName}. Ukážkový web, salón je fiktívny.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/ochrana-sukromia" className="hover:text-ivory">
              Ochrana súkromia
            </Link>
            <button type="button" className="hover:text-ivory" onClick={() => window.dispatchEvent(new Event("aurelia:cookies"))}>
              Nastavenia cookies
            </button>
            <Link to="/admin" className="hover:text-ivory">
              Pre personál
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
