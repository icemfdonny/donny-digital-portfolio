import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator, Check, Icon, Search } from "../components/icons";
import { CtaBand } from "../components/sections";
import { PageHero, Photo, Reveal } from "../components/ui";
import { TRAVEL, VAT_RATE } from "../config";
import { priceOf } from "../lib/calc";
import { formatPrice } from "../lib/format";
import { norm } from "../lib/geo";
import { usePageMeta } from "../lib/hooks";
import { BIZ, TRADE } from "../lib/profile";
import { useDB } from "../lib/store";

const YEAR = new Date().getFullYear();

export default function ServicesPage() {
  usePageMeta("Služby a cenník", `Služby a transparentný cenník – ${BIZ.name}, ${BIZ.city}.`);
  const db = useDB();
  const [query, setQuery] = useState("");
  const [withVat, setWithVat] = useState(true);
  const groups = useMemo(() => {
    const q = norm(query);
    const map = new Map<string, typeof TRADE.prices>();
    for (const p of TRADE.prices) {
      if (q && !norm(`${p.label} ${p.group}`).includes(q)) continue;
      map.set(p.group, [...(map.get(p.group) ?? []), p]);
    }
    return [...map.entries()];
  }, [query]);
  const vatOn = withVat && db.settings.vatPayer;

  return (
    <>
      <PageHero eyebrow="Služby a cenník" title="Všetko, čo robíme. A za koľko." text="Ceny zverejňujeme, lebo nemáme čo skrývať. Presnú sumu vám po obhliadke potvrdíme v ponuke po položkách." photo={TRADE.services[0].photo} />
      <section className="container-page py-14 sm:py-20">
        <div className="space-y-6">
          {TRADE.services.map((s, i) => (
            <Reveal key={s.id} className="card grid overflow-hidden md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <Photo src={s.photo} alt={s.title} className={`aspect-[16/10] md:aspect-auto md:min-h-72 ${i % 2 ? "md:order-2" : ""}`} />
              <div className="flex flex-col p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-ink">
                    <Icon name={s.icon} size={22} strokeWidth={2.2} />
                  </span>
                  <h2 className="display text-2xl">{s.title}</h2>
                  <span className="rounded-lg bg-sand px-2.5 py-1 text-sm font-bold">{s.from}</span>
                </div>
                <p className="mt-4 text-[16px] leading-relaxed text-soft">{s.text}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm font-medium">
                      <Check size={16} strokeWidth={2.6} className="mt-0.5 text-ok" /> {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  {s.job ? (
                    <Link to={`/kalkulacka?praca=${s.job}`} className="btn-accent btn-sm">
                      <Calculator size={17} /> Spočítať cenu
                    </Link>
                  ) : s.id === "havaria" ? (
                    <Link to="/havaria" className="btn-danger btn-sm">
                      Nahlásiť haváriu
                    </Link>
                  ) : null}
                  <Link to="/obhliadka" className="btn-outline btn-sm">
                    Objednať obhliadku <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="cennik" className="bg-paper py-14 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-accent-deep">
                <span className="h-[3px] w-6 rounded-full bg-accent" /> Cenník
              </p>
              <h2 className="display mt-3 text-[2rem] sm:text-[2.6rem]">Cenník prác a materiálu</h2>
              <p className="mt-2 max-w-xl text-soft">
                Platný od 1. 1. {YEAR}. Doprava do {TRAVEL.freeKm} km zadarmo, ďalej {formatPrice(db.settings.perKm)}/km. Tieto ceny používa aj online kalkulačka.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hľadať v cenníku" className="field w-56 py-2.5 pl-9" aria-label="Hľadať v cenníku" />
              </label>
              {db.settings.vatPayer && (
                <div className="inline-flex rounded-xl bg-sand p-1 text-sm font-semibold" role="radiogroup" aria-label="Zobrazenie cien">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" role="radio" aria-checked={withVat === v} onClick={() => setWithVat(v)} className={`rounded-lg px-3 py-2 ${withVat === v ? "bg-paper shadow-sm" : "text-soft"}`}>
                      {v ? "s DPH" : "bez DPH"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {groups.map(([group, items]) => (
              <div key={group} className="overflow-hidden rounded-2xl border border-line">
                <h3 className="bg-bg px-5 py-3 text-sm font-bold uppercase tracking-wider text-soft">{group}</h3>
                <table className="w-full text-[15px]">
                  <tbody className="divide-y divide-line">
                    {items.map((p) => {
                      const price = priceOf(p.id, db.settings.overrides) * (vatOn ? 1 + VAT_RATE : 1);
                      return (
                        <tr key={p.id}>
                          <td className="px-5 py-3">{p.label}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-right font-bold tabular-nums">
                            {formatPrice(price)} <span className="font-medium text-mute">/ {p.unit}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            {!groups.length && <p className="text-soft">Nič sme nenašli. Skúste iné slovo.</p>}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
