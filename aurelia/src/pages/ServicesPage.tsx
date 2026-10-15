import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock, Plus, Search, Shield, Tag } from "../components/icons";
import { useToast } from "../components/toast";
import { CategoryIcon, PageHero, Photo, Reveal } from "../components/ui";
import { BOOKING } from "../config";
import { FAQ } from "../data/content";
import { BUNDLES, CATEGORIES, SERVICE_BY_ID } from "../data/services";
import { LEVELS } from "../data/team";
import { fromPrice, liveServices, priceFor, type LiveService } from "../lib/catalog";
import { durationLabel, formatEuro } from "../lib/format";
import { usePageMeta } from "../lib/hooks";
import { useDB } from "../lib/store";
import { useVisit } from "../lib/visit";

export default function ServicesPage() {
  usePageMeta("Služby a cenník", "Kompletný cenník: strih, farbenie, balayage, nechty, mihalnice, ošetrenia pleti, masáže a líčenie. Ceny podľa úrovne stylistky.");
  const db = useDB();
  const [query, setQuery] = useState("");
  const services = useMemo(() => liveServices(db.serviceOverrides), [db.serviceOverrides]);
  const q = query.trim().toLowerCase();
  const match = (s: LiveService) => !q || `${s.name} ${s.desc}`.toLowerCase().includes(q);

  return (
    <>
      <PageHero
        eyebrow="Služby a cenník"
        photo="brushes"
        title={
          <>
            Cenník bez <em className="font-normal text-gold-soft">hviezdičiek.</em>
          </>
        }
        text="Čo vidíte, to platíte. Pri vlasoch sa cena líši podľa úrovne stylistky, presnú sumu uvidíte pri rezervácii ešte pred potvrdením."
      >
        <div className="relative mt-8 max-w-md">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ivory/50" />
          <label htmlFor="price-search" className="sr-only">
            Hľadať v cenníku
          </label>
          <input
            id="price-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hľadať v cenníku…"
            className="w-full rounded-full border border-ivory/25 bg-ivory/10 py-3 pl-11 pr-4 text-[15px] text-ivory outline-none backdrop-blur-sm placeholder:text-ivory/50 focus:border-ivory/60"
          />
        </div>
      </PageHero>

      <nav aria-label="Kategórie" className="sticky top-[76px] z-30 border-b border-line bg-ivory/92 backdrop-blur-md">
        <div className="no-scrollbar container-page flex gap-1.5 overflow-x-auto py-3">
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="chip shrink-0 py-1.5 text-[13.5px]">
              <CategoryIcon cat={c.id} size={15} /> {c.short}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-page space-y-20 py-14 sm:py-20">
        {CATEGORIES.map((c) => {
          const list = services.filter((s) => s.cat === c.id && match(s));
          if (!list.length) return null;
          return (
            <section key={c.id} id={c.id} className="scroll-mt-40 grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-14">
              <Reveal className="lg:sticky lg:top-40 lg:self-start">
                <Photo name={c.photo} className="aspect-[16/10] rounded-[1.4rem] lg:aspect-[4/5]" />
                <h2 className="mt-5 flex items-center gap-3 font-display text-[2.2rem] font-medium leading-none text-plum">
                  <span className={`grid size-10 place-items-center rounded-full text-plum ${c.tint}`}>
                    <CategoryIcon cat={c.id} size={18} />
                  </span>
                  {c.name}
                </h2>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-soft">{c.text}</p>
              </Reveal>
              <ul className="divide-y divide-line border-y border-line">
                {list.map((s) => (
                  <ServiceRow key={s.id} s={s} />
                ))}
              </ul>
            </section>
          );
        })}
        {services.every((s) => !match(s)) && <p className="py-16 text-center text-soft">Pre „{query}“ sme nič nenašli.</p>}

        <section className="rounded-[2rem] bg-plum p-6 text-ivory sm:p-10">
          <p className="eyebrow text-gold-soft">Výhodné kombinácie</p>
          <h2 className="mt-3 font-display text-[2.3rem] font-medium leading-none sm:text-5xl">Spojte, čo patrí k sebe.</h2>
          <p className="mt-3 max-w-xl font-light text-ivory/70">Zľava sa odpočíta automaticky, keď si služby pridáte do jednej návštevy.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BUNDLES.map((b) => (
              <div key={b.id} className="rounded-2xl bg-ivory/[0.07] p-5 ring-1 ring-ivory/10">
                <p className="flex items-center gap-2 text-sm text-gold-soft">
                  <Tag size={15} /> −{formatEuro(b.amount)}
                </p>
                <p className="mt-2 font-display text-2xl font-medium">{b.label}</p>
                <p className="mt-2 text-sm font-light text-ivory/65">{b.groups.map((g) => g.map((id) => SERVICE_BY_ID.get(id)?.name).join(" alebo ")).join(" + ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {(Object.keys(LEVELS) as (keyof typeof LEVELS)[]).map((l) => (
            <div key={l} className="card p-6">
              <p className="eyebrow text-gold">{l === "senior" ? "Základná cena" : l === "junior" ? `−${Math.round((1 - LEVELS[l].multiplier) * 100)} %` : `+${Math.round((LEVELS[l].multiplier - 1) * 100)} %`}</p>
              <p className="mt-2 font-display text-3xl font-medium text-plum">{LEVELS[l].label}</p>
              <p className="mt-2 text-sm font-light leading-relaxed text-soft">{LEVELS[l].text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {FAQ.slice(1, 3).map((f) => (
            <div key={f.q} className="rounded-2xl bg-blush/70 p-6">
              <p className="flex items-center gap-2 font-medium text-plum">
                <Shield size={17} className="text-gold" /> {f.q}
              </p>
              <p className="mt-2 text-sm font-light leading-relaxed text-soft">{f.a}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function ServiceRow({ s }: { s: LiveService }) {
  const db = useDB();
  const { add, remove, items } = useVisit();
  const toast = useToast();
  const chosen = items.find((i) => i.serviceId === s.id);
  const junior = priceFor(s.id, s.variants?.[0].id, "natalia", db.serviceOverrides);
  const art = priceFor(s.id, s.variants?.[s.variants.length - 1].id, "veronika", db.serviceOverrides);
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-72">
          <p className="flex flex-wrap items-center gap-2 text-[17px] font-medium text-ink">
            {s.name}
            {s.popular && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-plum">Obľúbené</span>}
            {s.isNew && <span className="rounded-full bg-mauve/12 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-mauve">Novinka</span>}
          </p>
          <p className="mt-1 text-[15px] font-light leading-relaxed text-soft">{s.desc}</p>
          {s.includes && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-soft">
              {s.includes.map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <Check size={13} className="text-gold" /> {x}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {s.variants ? `${durationLabel(s.variants[0].duration)} – ${durationLabel(s.variants[s.variants.length - 1].duration)}` : durationLabel(s.duration)}
            </span>
            {s.deposit && <span>Záloha {Math.round(BOOKING.depositShare * 100)} %</span>}
            {s.patchTest && <span>Test citlivosti pri prvej návšteve</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-[1.7rem] font-medium leading-none tabular-nums text-plum">
              {s.price === 0 ? "Zadarmo" : `${s.variants || s.levelPricing ? "od " : ""}${formatEuro(fromPrice(s, db.serviceOverrides))}`}
            </p>
            {s.levelPricing && <p className="mt-1 text-xs text-mute">{`${formatEuro(junior)} – ${formatEuro(art)} podľa úrovne`}</p>}
          </div>
          {s.online ? (
            <button
              type="button"
              onClick={() => {
                if (chosen) remove(chosen.key);
                else {
                  add(s.id, s.variants?.[0].id);
                  toast(<>Pridané do návštevy: {s.name}</>);
                }
              }}
              aria-pressed={!!chosen}
              aria-label={chosen ? `Odobrať ${s.name} z návštevy` : `Pridať ${s.name} do návštevy`}
              className={`grid size-11 shrink-0 place-items-center rounded-full border transition-colors ${chosen ? "border-plum bg-plum text-ivory" : "border-line text-plum hover:border-plum"}`}
            >
              {chosen ? <Check size={18} /> : <Plus size={18} />}
            </button>
          ) : (
            <span className="rounded-full bg-blush px-3 py-1.5 text-xs text-soft">Len telefonicky</span>
          )}
        </div>
      </div>
      {s.variants && (
        <div className="mt-3 flex flex-wrap gap-2">
          {s.variants.map((v) => (
            <Link
              key={v.id}
              to={`/rezervacia?sluzba=${s.id}&variant=${v.id}`}
              className="group inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] text-soft hover:border-plum/40"
            >
              {v.label} <span className="text-mute">·</span> <span className="tabular-nums text-ink">{s.levelPricing ? "od " : ""}{formatEuro(s.levelPricing ? priceFor(s.id, v.id, "natalia", db.serviceOverrides) : v.price)}</span>
              <ArrowRight size={13} className="text-mute transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}
