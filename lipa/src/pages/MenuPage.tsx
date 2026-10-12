import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DishOrderForm from "../components/DishOrder";
import { LunchWeek } from "../components/Lunch";
import { ArrowRight, Bag, Filter, Search, Wine, X } from "../components/icons";
import { Allergens, DietBadges, Dialog, PageHero, Photo, Segmented } from "../components/ui";
import { DRINK_GROUPS, WINES, WINE_TYPES, wineById, type WineType } from "../data/drinks";
import {
  ALLERGENS,
  CATEGORIES,
  DIET_LABELS,
  DISHES,
  HIGHLIGHT_LABELS,
  dishById,
  dishMatchesDiet,
  type Dish,
  type DietTag,
} from "../data/menu";
import { formatPrice } from "../lib/format";
import { usePageMeta } from "../lib/hooks";
import { useDB } from "../lib/store";

type Tab = "jedla" | "obed" | "napoje";

export default function MenuPage() {
  usePageMeta("Menu", "Jedálny lístok, obedové menu na celý týždeň a vínna karta so slovenskými vínami. Alergény pri každom jedle.");
  const [params, setParams] = useSearchParams();
  const tab = (["jedla", "obed", "napoje"].includes(params.get("karta") ?? "") ? params.get("karta") : "jedla") as Tab;
  const setTab = (t: Tab) =>
    setParams(
      (p) => {
        p.set("karta", t);
        p.delete("jedlo");
        return p;
      },
      { replace: true },
    );

  return (
    <>
      <PageHero
        eyebrow="Menu"
        title={
          <>
            Čo sa u nás <em className="text-honey-soft">práve varí</em>
          </>
        }
        text="Jedálny lístok meníme so sezónou, obedové menu každý deň. Pri každom jedle nájdete alergény a jedlá si môžete vyfiltrovať podľa toho, čo nejete."
      >
        <div className="mt-10 overflow-x-auto">
          <Segmented<Tab>
            tone="dark"
            label="Časť menu"
            value={tab}
            onChange={setTab}
            options={[
              { value: "jedla", label: "Jedálny lístok" },
              { value: "obed", label: "Obedové menu" },
              { value: "napoje", label: "Víno a nápoje" },
            ]}
          />
        </div>
      </PageHero>
      {tab === "jedla" && <AlaCarte />}
      {tab === "obed" && (
        <section className="container-page py-14 sm:py-20">
          <LunchWeek />
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-forest px-6 py-6 text-cream sm:px-8">
            <p className="max-w-xl text-[15px] text-cream/80">Nestihnete prísť? Obed vám zabalíme so sebou alebo ho privezieme do kancelárie v Starom Meste.</p>
            <Link to="/objednavka#obed" className="btn-honey">
              <Bag size={17} /> Objednať obed
            </Link>
          </div>
        </section>
      )}
      {tab === "napoje" && <Drinks />}
    </>
  );
}

function AlaCarte() {
  const db = useDB();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [diets, setDiets] = useState<DietTag[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [allergenOpen, setAllergenOpen] = useState(false);
  const [active, setActive] = useState<string>(CATEGORIES[0].id);
  const openDish = params.get("jedlo") ? dishById(params.get("jedlo")!) : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("sk");
    return DISHES.filter(
      (d) =>
        (!q || `${d.name} ${d.description}`.toLocaleLowerCase("sk").includes(q)) &&
        diets.every((diet) => dishMatchesDiet(d, diet)) &&
        !d.allergens.some((a) => excluded.includes(a)),
    );
  }, [query, diets, excluded]);

  // Highlight the category being read: the last one whose heading has passed under the sticky bar.
  const sections = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string = CATEGORIES[0].id;
      for (const c of CATEGORIES) {
        const el = sections.current[c.id];
        if (el && el.getBoundingClientRect().top < 220) current = c.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [filtered]);

  const filtersOn = query || diets.length || excluded.length;
  const reset = () => {
    setQuery("");
    setDiets([]);
    setExcluded([]);
  };
  const showDish = (dish: Dish | null) =>
    setParams(
      (p) => {
        if (dish) p.set("jedlo", dish.id);
        else p.delete("jedlo");
        return p;
      },
      { replace: !dish },
    );

  return (
    <>
      <div className="sticky top-[72px] z-30 border-b border-line bg-cream/95 backdrop-blur-md">
        <div className="container-page flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <label className="relative block lg:w-72">
            <span className="sr-only">Hľadať jedlo</span>
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
            <input type="search" className="field rounded-full py-2.5 pl-11" placeholder="Hľadať, napr. kačica" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
            {(Object.keys(DIET_LABELS) as DietTag[]).map((diet) => (
              <button
                key={diet}
                type="button"
                className="chip shrink-0"
                aria-pressed={diets.includes(diet)}
                onClick={() => setDiets((list) => (list.includes(diet) ? list.filter((d) => d !== diet) : [...list, diet]))}
              >
                {DIET_LABELS[diet]}
              </button>
            ))}
            <button type="button" className="chip shrink-0" aria-pressed={excluded.length > 0} onClick={() => setAllergenOpen(true)}>
              <Filter size={15} /> Alergény{excluded.length ? ` (${excluded.length})` : ""}
            </button>
          </div>
          <p className="text-sm text-mute lg:ml-auto">
            {filtersOn ? (
              <>
                {filtered.length} z {DISHES.length} jedál ·{" "}
                <button type="button" className="font-medium text-forest underline underline-offset-2" onClick={reset}>
                  zrušiť filtre
                </button>
              </>
            ) : (
              `${DISHES.length} jedál`
            )}
          </p>
        </div>
        <nav aria-label="Kategórie" className="container-page no-scrollbar flex gap-1 overflow-x-auto pb-2">
          {CATEGORIES.filter((c) => filtered.some((d) => d.category === c.id)).map((c) => (
            <a
              key={c.id}
              href={`#kategoria-${c.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`kategoria-${c.id}`)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${active === c.id ? "bg-forest text-cream" : "text-soft hover:text-ink"}`}
            >
              {c.name}
            </a>
          ))}
        </nav>
      </div>

      <div className="container-page py-12 sm:py-16">
        {filtered.length === 0 && (
          <div className="card mx-auto max-w-lg p-10 text-center">
            <p className="font-display text-2xl text-forest">Takéto jedlo nemáme</p>
            <p className="mt-2 text-soft">Skúste uvoľniť filtre. Kuchyňa vie veľa jedál upraviť, napíšte nám to do poznámky k rezervácii.</p>
            <button type="button" className="btn-primary mt-6" onClick={reset}>
              Zrušiť filtre
            </button>
          </div>
        )}
        {CATEGORIES.map((category) => {
          const dishes = filtered.filter((d) => d.category === category.id);
          if (!dishes.length) return null;
          return (
            <section
              key={category.id}
              id={`kategoria-${category.id}`}
              ref={(el) => {
                sections.current[category.id] = el;
              }}
              className="scroll-mt-48 border-b border-line py-10 first:pt-0 last:border-0"
            >
              <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-3xl text-forest sm:text-4xl">{category.name}</h2>
                {category.note && <p className="text-sm text-mute">{category.note}</p>}
              </div>
              <div className="grid gap-x-14 gap-y-2 lg:grid-cols-2">
                {dishes.map((dish) => (
                  <DishRow key={dish.id} dish={dish} soldOut={db.soldOut.includes(dish.id)} onOpen={() => showDish(dish)} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-6 rounded-3xl bg-paper p-6 sm:p-8" aria-labelledby="alergeny">
          <h2 id="alergeny" className="font-display text-xl text-forest">
            Zoznam alergénov
          </h2>
          <ol className="mt-4 grid gap-x-8 gap-y-1.5 text-sm text-soft sm:grid-cols-2 lg:grid-cols-3">
            {ALLERGENS.map((a) => (
              <li key={a.n}>
                <span className="inline-block w-6 font-medium tabular-nums text-ink">{a.n}</span> {a.name}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-mute">Hmotnosť je uvedená v surovom stave. Ceny sú vrátane DPH. Informácie o alergénoch vám ochotne poskytne obsluha.</p>
        </section>
      </div>

      <AllergenDialog open={allergenOpen} onClose={() => setAllergenOpen(false)} excluded={excluded} onChange={setExcluded} matches={filtered.length} />
      <DishDialog dish={openDish} soldOut={!!openDish && db.soldOut.includes(openDish.id)} onClose={() => showDish(null)} />
    </>
  );
}

function DishRow({ dish, soldOut, onOpen }: { dish: Dish; soldOut: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className={`group -mx-3 flex gap-4 rounded-2xl px-3 py-4 text-left transition-colors hover:bg-paper ${soldOut ? "opacity-55" : ""}`}>
      {dish.photo && <Photo name={dish.photo} className="hidden size-20 shrink-0 rounded-xl sm:block" showLabel={false} />}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline">
          <span className={`font-display text-[1.2rem] leading-snug text-forest group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4 ${soldOut ? "line-through" : ""}`}>
            {dish.name}
          </span>
          <span className="dotted-leader" aria-hidden="true" />
          <span className="shrink-0 font-medium tabular-nums">{formatPrice(dish.price)}</span>
        </span>
        {dish.description && <span className="mt-1 block text-[15px] leading-relaxed text-soft">{dish.description}</span>}
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-mute">{dish.portion}</span>
          <Allergens list={dish.allergens} />
          <DietBadges diet={dish.diet} />
          {soldOut && <span className="rounded-full bg-wine/12 px-2 py-0.5 text-[11px] font-semibold text-wine">Dnes vypredané</span>}
          {!soldOut &&
            dish.highlight?.map((h) => (
              <span key={h} className="rounded-full bg-honey-soft px-2 py-0.5 text-[11px] font-semibold text-forest">
                {HIGHLIGHT_LABELS[h]}
              </span>
            ))}
        </span>
      </span>
    </button>
  );
}

function DishDialog({ dish, soldOut, onClose }: { dish?: Dish; soldOut: boolean; onClose: () => void }) {
  const [ordering, setOrdering] = useState(false);
  const wine = dish?.pairing ? wineById(dish.pairing) : undefined;
  const [shownId, setShownId] = useState(dish?.id);
  if (shownId !== dish?.id) {
    setShownId(dish?.id);
    setOrdering(false);
  }
  return (
    <Dialog open={!!dish} onClose={onClose} size="md" labelledBy="dish-title">
      {dish && (
        <div>
          <div className="relative">
            {dish.photo ? <Photo name={dish.photo} className="aspect-[16/10]" /> : <div className="photo-fallback grain relative h-28" />}
            <button type="button" onClick={onClose} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-paper/90 text-ink shadow" aria-label="Zavrieť">
              <X size={18} />
            </button>
          </div>
          {ordering ? (
            <>
              <div className="px-6 pt-5">
                <p className="eyebrow text-moss">Pridať do objednávky</p>
                <h2 id="dish-title" className="mt-1 font-display text-2xl text-forest">
                  {dish.name}
                </h2>
              </div>
              <DishOrderForm item={dish} onDone={onClose} />
            </>
          ) : (
            <div className="px-6 py-6">
              <div className="flex flex-wrap gap-1.5">
                {dish.highlight?.map((h) => (
                  <span key={h} className="rounded-full bg-honey-soft px-2.5 py-0.5 text-xs font-semibold text-forest">
                    {HIGHLIGHT_LABELS[h]}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-start justify-between gap-4">
                <h2 id="dish-title" className="font-display text-[1.9rem] leading-tight text-forest">
                  {dish.name}
                </h2>
                <p className="mt-1 shrink-0 text-xl tabular-nums">{formatPrice(dish.price)}</p>
              </div>
              <p className="mt-2 text-[16px] leading-relaxed text-soft">{dish.description}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-cream p-4 text-sm">
                <div>
                  <dt className="text-mute">Porcia</dt>
                  <dd className="mt-0.5 font-medium">{dish.portion}</dd>
                </div>
                <div>
                  <dt className="text-mute">Strava</dt>
                  <dd className="mt-0.5 font-medium">{dish.diet.length ? dish.diet.map((d) => DIET_LABELS[d]).join(", ") : "Bežná"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-mute">Alergény</dt>
                  <dd className="mt-0.5 font-medium">
                    {dish.allergens.length ? dish.allergens.map((n) => `${n} ${ALLERGENS.find((a) => a.n === n)?.short.toLowerCase()}`).join(", ") : "Neobsahuje žiadny zo 14 alergénov"}
                  </dd>
                </div>
              </dl>
              {wine && (
                <div className="mt-4 flex items-start gap-4 rounded-2xl border border-line p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-wine/10 text-wine">
                    <Wine size={19} />
                  </span>
                  <div className="text-sm">
                    <p className="text-mute">Sommeliérka odporúča</p>
                    <p className="mt-0.5 font-medium text-ink">
                      {wine.name} {wine.vintage}
                    </p>
                    <p className="text-soft">
                      {wine.region} · {wine.glass ? `${wine.glass[0]} ${formatPrice(wine.glass[1])}` : `${wine.bottle[0]} ${formatPrice(wine.bottle[1])}`}
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn-primary flex-1" onClick={() => setOrdering(true)} disabled={soldOut}>
                  <Bag size={17} /> {soldOut ? "Dnes vypredané" : "Objednať so sebou"}
                </button>
                <Link to="/rezervacia" className="btn-outline flex-1">
                  Rezervovať stôl <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

function AllergenDialog({
  open,
  onClose,
  excluded,
  onChange,
  matches,
}: {
  open: boolean;
  onClose: () => void;
  excluded: number[];
  onChange: (list: number[]) => void;
  matches: number;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Vylúčiť alergény"
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-outline" onClick={() => onChange([])} disabled={!excluded.length}>
            Zrušiť
          </button>
          <button type="button" className="btn-primary flex-1" onClick={onClose}>
            Zobraziť {matches} jedál
          </button>
        </div>
      }
    >
      <p className="px-6 pt-5 text-sm text-soft">Skryjeme jedlá, ktoré obsahujú čo i len jeden z vybraných alergénov.</p>
      <div className="grid grid-cols-2 gap-2 px-6 py-5">
        {ALLERGENS.map((a) => {
          const on = excluded.includes(a.n);
          return (
            <button
              key={a.n}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onChange(on ? excluded.filter((n) => n !== a.n) : [...excluded, a.n])}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${on ? "border-forest bg-forest text-cream" : "border-line hover:border-ink/30"}`}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${on ? "bg-cream/15" : "bg-sand"}`}>{a.n}</span>
              {a.short}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}

function Drinks() {
  const [type, setType] = useState<WineType | "all">("all");
  const types = WINE_TYPES.filter((t) => type === "all" || t.id === type);
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-moss">Vínna karta</p>
              <h2 className="mt-3 font-display text-4xl text-forest">Len slovenské vína</h2>
              <p className="mt-3 max-w-lg text-soft">Na pohár ponúkame {WINES.filter((w) => w.glass).length} vín, celú kartu so 120 fľašami vám prinesie sommeliérka.</p>
            </div>
          </div>
          <div className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <button type="button" className="chip shrink-0" aria-pressed={type === "all"} onClick={() => setType("all")}>
              Všetky
            </button>
            {WINE_TYPES.map((t) => (
              <button key={t.id} type="button" className="chip shrink-0" aria-pressed={type === t.id} onClick={() => setType(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
          <div className="mt-8 space-y-10">
            {types.map((t) => (
              <div key={t.id}>
                <h3 className="eyebrow mb-2 text-mute">{t.name}</h3>
                <ul className="divide-y divide-line">
                  {WINES.filter((w) => w.type === t.id).map((w) => (
                    <li key={w.id} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 py-4">
                      <p className="font-display text-lg text-forest">
                        {w.name} <span className="font-sans text-sm text-mute">{w.vintage}</span>
                        {w.pick && <span className="ml-2 rounded-full bg-honey-soft px-2 py-0.5 align-middle font-sans text-[11px] font-semibold text-forest">Tip sommeliérky</span>}
                      </p>
                      <p className="text-right text-sm tabular-nums">
                        {w.glass && (
                          <span className="block">
                            <span className="text-mute">{w.glass[0]}</span> {formatPrice(w.glass[1])}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-soft">
                        {w.region} · {w.notes}
                      </p>
                      <p className="text-right text-sm tabular-nums">
                        <span className="text-mute">{w.bottle[0]}</span> {formatPrice(w.bottle[1])}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {DRINK_GROUPS.map((group) => (
            <div key={group.id} className="card p-6">
              <h3 className="font-display text-2xl text-forest">{group.name}</h3>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item.name} className="text-[15px]">
                    <div className="flex items-baseline">
                      <span>{item.name}</span>
                      <span className="dotted-leader" aria-hidden="true" />
                      <span className="shrink-0 text-right tabular-nums">
                        {item.prices.map(([vol, price], i) => (
                          <span key={vol || i} className="ml-3">
                            {vol && <span className="text-xs text-mute">{vol} </span>}
                            {price === 0 ? "zdarma" : formatPrice(price)}
                          </span>
                        ))}
                      </span>
                    </div>
                    {item.detail && <p className="mt-0.5 text-sm text-mute">{item.detail}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
