import { useRef } from "react";
import { Link } from "react-router-dom";
import { OpenStatusPill } from "../components/layout/Header";
import { LunchList } from "../components/Lunch";
import QuickBooking from "../components/QuickBooking";
import { ArrowLeft, ArrowRight, Bag, Dog, Flame, Gift, Leaf, MapPin, Phone, Wine } from "../components/icons";
import { Allergens, LeafMark, Photo, Reveal, SectionHeading, Stars } from "../components/ui";
import { LUNCH, RESTAURANT } from "../config";
import { REVIEWS, RATING, SPACES } from "../data/content";
import { upcomingEvents } from "../data/events";
import { lunchFor } from "../data/lunch";
import { DISHES } from "../data/menu";
import { MONTHS_SHORT, addDays, formatDateLong, formatPrice, minutesToTime, plural, startOfDay } from "../lib/format";
import { hoursRows, isLunchDay, isLunchTime, openStatus } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { useDB } from "../lib/store";

export default function Home() {
  usePageMeta(null);
  return (
    <>
      <Hero />
      <Highlights />
      <LunchToday />
      <Signatures />
      <Story />
      <Spaces />
      <EventsTeaser />
      <Reviews />
      <VoucherBand />
      <Visit />
    </>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-night text-cream">
      <div className="absolute inset-0">
        <Photo name="hero" priority className="size-full" showLabel={false} />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_26_21/0.55)_0%,rgb(18_26_21/0.25)_35%,rgb(18_26_21/0.85)_100%)]" />
      <div className="container-page relative flex flex-1 flex-col justify-end pb-8 pt-32 sm:pb-12">
        <div className="max-w-3xl">
          <p className="eyebrow mb-5 flex items-center gap-2 text-honey animate-rise">
            <MapPin size={14} /> {RESTAURANT.city} · {RESTAURANT.district}
          </p>
          <h1 className="font-display text-[2.9rem] font-light leading-[1.02] tracking-tight animate-rise sm:text-7xl lg:text-[5.4rem]">
            Sezónna kuchyňa, <em className="font-normal text-honey-soft">slovenské vína</em> a dlhé večery pod lipou.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-cream/75 animate-rise sm:text-lg" style={{ animationDelay: "80ms" }}>
            Moderné bistro a vínny bar v tichom dvore Starého Mesta. Na obed rýchlo a poctivo, večer pomaly, s pohárom vína od rodinných vinárov.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-rise" style={{ animationDelay: "140ms" }}>
            <Link to="/menu" className="btn-light">
              Pozrieť menu <ArrowRight size={17} />
            </Link>
            <Link to="/objednavka" className="btn-ghost-light">
              <Bag size={17} /> Objednať so sebou
            </Link>
            <span className="ml-1 hidden sm:inline-flex xl:hidden">
              <OpenStatusPill />
            </span>
          </div>
        </div>
        <div className="mt-10 grid items-end gap-6 lg:mt-14 lg:grid-cols-[1fr_minmax(0,640px)]">
          <div className="hidden lg:block" />
          <div className="animate-rise" style={{ animationDelay: "220ms" }}>
            <p className="mb-3 hidden items-center justify-end gap-3 text-sm text-cream/70 lg:flex">
              <Stars value={RATING.score} size={15} />
              <span>
                <strong className="font-semibold text-cream">{RATING.score.toLocaleString("sk-SK")}</strong> z {RATING.count.toLocaleString("sk-SK")} hodnotení hostí
              </span>
            </p>
            <QuickBooking />
          </div>
        </div>
      </div>
    </section>
  );
}

function Highlights() {
  const items = [
    { icon: Leaf, title: "Od farmárov zo Slovenska", text: "Šesť dodávateľov, ktorých poznáme po mene." },
    { icon: Wine, title: "120 slovenských vín", text: "Od Malých Karpát po Tokaj, 16 aj na pohár." },
    { icon: Flame, title: "Gril na drevenom uhlí", text: "Steaky zrené 28 dní v našej komore." },
    { icon: Dog, title: "Psíky vítané", text: "Na terase aj v bare, s miskou vody." },
  ];
  return (
    <section className="border-b border-line bg-paper">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={i * 60} className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-forest/[0.06] text-moss">
              <item.icon size={21} />
            </span>
            <div>
              <p className="font-medium text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-soft">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LunchToday() {
  const db = useDB();
  const now = useNow(60_000);
  let day = startOfDay(now);
  let label = "Dnes";
  if (!isLunchDay(day) || now.getHours() * 60 + now.getMinutes() >= LUNCH.to) {
    for (let i = 1; i < 8; i++) {
      const next = addDays(startOfDay(now), i);
      if (isLunchDay(next)) {
        day = next;
        label = i === 1 ? "Zajtra" : formatDateLong(next);
        break;
      }
    }
  }
  const menu = lunchFor(day, db.lunch);
  const serving = isLunchTime(now);
  const minPrice = menu ? Math.min(...menu.dishes.map((d) => d.price)) : 0;

  return (
    <section className="py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:pt-4">
          <SectionHeading
            eyebrow="Obedové menu"
            title={
              <>
                Obed za pár minút, <em className="text-moss">uvarený od rána.</em>
              </>
            }
            text={`Polievka a hlavné jedlo od ${formatPrice(minPrice)}. Menu sa mení každý deň, podávame ho v pracovné dni od ${minutesToTime(LUNCH.from)} do ${minutesToTime(LUNCH.to)}.`}
          />
          <Reveal delay={100} className="mt-8 flex flex-wrap gap-3">
            <Link to="/menu?karta=obed" className="btn-primary">
              Menu na celý týždeň <ArrowRight size={17} />
            </Link>
            <Link to="/objednavka#obed" className="btn-outline">
              <Bag size={17} /> Obed so sebou
            </Link>
          </Reveal>
        </div>
        <Reveal delay={80} className="card relative overflow-hidden p-6 sm:p-9">
          <LeafMark className="pointer-events-none absolute -right-10 -top-10 size-48 text-forest/[0.04]" />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl text-forest">
              {label}
              {label === "Dnes" || label === "Zajtra" ? <span className="text-mute">, {formatDateLong(day)}</span> : null}
            </h3>
            {serving ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#4cbf7a]/12 px-3 py-1 text-xs font-semibold text-ok">
                <span className="size-1.5 rounded-full bg-ok" /> Práve podávame
              </span>
            ) : null}
          </div>
          {menu ? <LunchList menu={menu} soldOut={db.soldOut} /> : <p>Menu pripravujeme.</p>}
        </Reveal>
      </div>
    </section>
  );
}

function Signatures() {
  const dishes = DISHES.filter((d) => d.highlight?.includes("signature") && d.photo);
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  return (
    <section className="overflow-hidden bg-forest py-20 text-cream sm:py-28">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            tone="light"
            eyebrow="Podpisové jedlá"
            title={
              <>
                Klasiky, ku ktorým sa <em className="text-honey-soft">hostia vracajú.</em>
              </>
            }
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => scrollBy(-1)} className="hidden size-11 place-items-center rounded-full border border-cream/25 text-cream hover:border-cream/60 md:grid" aria-label="Predchádzajúce jedlá">
              <ArrowLeft size={18} />
            </button>
            <button type="button" onClick={() => scrollBy(1)} className="mr-2 hidden size-11 place-items-center rounded-full border border-cream/25 text-cream hover:border-cream/60 md:grid" aria-label="Ďalšie jedlá">
              <ArrowRight size={18} />
            </button>
            <Link to="/menu" className="btn-ghost-light">
              Celý jedálny lístok <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div ref={scroller} className="no-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8">
          {dishes.map((dish, i) => (
            <Reveal key={dish.id} delay={i * 70} as="article" className="w-[78vw] max-w-[320px] shrink-0 snap-start">
              <Link to={`/menu?jedlo=${dish.id}`} className="group block">
                <Photo name={dish.photo!} className="aspect-[4/5] rounded-3xl" imgClassName="transition-transform duration-700 group-hover:scale-[1.04]" />
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-xl leading-snug">{dish.name}</h3>
                  <span className="shrink-0 tabular-nums text-honey">{formatPrice(dish.price)}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-cream/60">{dish.description}</p>
                <Allergens list={dish.allergens} className="mt-2 block !text-cream/40" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Story() {
  const now = useNow(3_600_000);
  const years = now.getFullYear() - RESTAURANT.founded;
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative">
          <Photo name="kitchen" className="aspect-[4/5] rounded-[2rem] sm:aspect-[5/6]" />
          <div className="absolute -bottom-6 -right-2 hidden w-56 rounded-3xl bg-paper p-5 shadow-xl sm:block lg:-right-8">
            <p className="font-display text-4xl text-forest">6</p>
            <p className="mt-1 text-sm text-soft">farmárov a pestovateľov, od ktorých berieme suroviny každý týždeň</p>
          </div>
        </Reveal>
        <div>
          <SectionHeading
            eyebrow="Náš príbeh"
            title={
              <>
                Varíme to, čo práve <em className="text-moss">rastie okolo nás.</em>
              </>
            }
            text="Lipu sme otvorili v roku 2019 v dvore meštianskeho domu, pod stromom, ktorý tu stál dávno pred nami. Šéfkuchár Tomáš Hudák skladá menu podľa toho, čo v ten týždeň prinesú farmári z Pezinka, Liptova a Hontu. Nič zložité, len poctivé suroviny, oheň a čas."
          />
          <Reveal delay={120} className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {[
              { n: String(years), l: `${plural(years, ["rok", "roky", "rokov"])} pod lipou` },
              { n: "120", l: "vín zo Slovenska" },
              { n: "28", l: "dní zrenia steakov" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-4xl text-forest">{s.n}</p>
                <p className="mt-1 text-sm text-soft">{s.l}</p>
              </div>
            ))}
          </Reveal>
          <Reveal delay={160} className="mt-10">
            <Link to="/o-nas" className="btn-outline">
              Spoznajte nás <ArrowRight size={17} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Spaces() {
  return (
    <section className="bg-paper py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Priestory" title="Miesto pre každú príležitosť" text="Rýchly obed pri bare, rande na dvore pod lipou, aj firemná večera pre deväťdesiat ľudí." />
          <Link to="/podujatia#sukromne-akcie" className="btn-outline">
            Súkromné akcie <ArrowRight size={17} />
          </Link>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SPACES.map((space, i) => (
            <Reveal key={space.id} delay={i * 70} as="article">
              <Photo name={space.photo} className="aspect-[3/4] rounded-3xl" labelAt="top">
                <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-cream">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-honey">{space.capacity}</p>
                  <h3 className="mt-1 font-display text-2xl">{space.name}</h3>
                  <p className="mt-1 text-sm text-cream/70">{space.text}</p>
                </div>
              </Photo>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventsTeaser() {
  const now = useNow(300_000);
  // One of each kind, so the teaser shows the range rather than the same evening twice.
  const events = upcomingEvents(now, 75, 12)
    .filter((e, i, all) => all.findIndex((o) => o.title === e.title) === i)
    .slice(0, 3);
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Čo chystáme"
            title={
              <>
                Večery, na ktoré sa <em className="text-moss">oplatí prísť.</em>
              </>
            }
          />
          <Link to="/podujatia" className="btn-outline">
            Všetky podujatia <ArrowRight size={17} />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {events.map((event, i) => {
            const left = event.capacity - event.sold;
            return (
              <Reveal key={event.id} delay={i * 80} as="article">
                <Link to={`/podujatia#${event.id}`} className="group block">
                  <Photo name={event.photo} className="aspect-[4/3] rounded-3xl" imgClassName="transition-transform duration-700 group-hover:scale-[1.04]" labelAt="top">
                    <div className="absolute left-4 top-4 rounded-2xl bg-paper px-3 py-2 text-center shadow">
                      <p className="font-display text-2xl leading-none text-forest">{event.date.getDate()}</p>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-mute">{MONTHS_SHORT[event.date.getMonth()]}</p>
                    </div>
                  </Photo>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-moss">
                    {event.kind} · {event.time}
                  </p>
                  <h3 className="mt-1.5 font-display text-2xl text-forest group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{event.title}</h3>
                  <p className="mt-2 text-sm text-soft">
                    {event.price ? `${formatPrice(event.price)} / osoba` : "Vstup voľný"}
                    {event.price > 0 && (left <= 0 ? " · vypredané" : left <= 5 ? ` · posledných ${left} miest` : "")}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="bg-sand/60 py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <SectionHeading eyebrow="Hodnotenia hostí" title="Čo o nás hovoria hostia" />
          <Reveal delay={100} className="mt-8 flex items-center gap-5">
            <p className="font-display text-7xl font-light text-forest">{RATING.score.toLocaleString("sk-SK")}</p>
            <div>
              <Stars value={RATING.score} size={20} />
              <p className="mt-1.5 text-sm text-soft">{RATING.count.toLocaleString("sk-SK")} overených hodnotení</p>
            </div>
          </Reveal>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {REVIEWS.slice(0, 4).map((r, i) => (
            <Reveal key={r.name} delay={i * 70} as="figure" className="card flex flex-col p-6">
              <Stars value={r.rating} size={14} />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">„{r.text}“</blockquote>
              <figcaption className="mt-5 flex items-center justify-between text-sm">
                <span className="font-medium">{r.name}</span>
                <span className="text-mute">{r.when}</span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function VoucherBand() {
  return (
    <section className="relative overflow-hidden bg-wine py-20 text-cream sm:py-24">
      <LeafMark className="pointer-events-none absolute -right-24 top-1/2 size-[520px] -translate-y-1/2 text-cream/[0.05]" />
      <div className="container-page relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-4 text-honey-soft">Darčekové poukážky</p>
          <h2 className="font-display text-[2.2rem] leading-[1.08] tracking-tight sm:text-5xl">Darujte večer, na ktorý sa nezabúda.</h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-cream/75">
            Hodnotová poukážka alebo zážitok, napríklad degustačné menu pre dvoch. Vlastné venovanie a doručenie do e-mailu hneď, alebo presne v deň oslavy.
          </p>
          <Link to="/poukazky" className="btn-light mt-8">
            <Gift size={17} /> Vytvoriť poukážku
          </Link>
        </div>
        <Reveal className="mx-auto w-full max-w-md">
          <div className="relative aspect-[1.6] rotate-[-4deg] rounded-3xl bg-forest p-7 shadow-2xl ring-1 ring-cream/10 transition-transform duration-500 hover:rotate-0">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-display text-3xl italic">Lipa</span>
                <LeafMark className="size-10 text-honey" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cream/50">Darčeková poukážka</p>
                <p className="mt-1 font-display text-5xl text-honey">100 €</p>
              </div>
              <p className="text-sm text-cream/60">Pre Zuzku, s láskou ♡</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Visit() {
  const now = useNow(60_000);
  const status = openStatus(now);
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Navštívte nás"
            title={
              <>
                {RESTAURANT.street}, <em className="text-moss">tri minúty od Hlavného námestia.</em>
              </>
            }
          />
          <Reveal delay={100} className="mt-8 space-y-6">
            <p className="flex items-center gap-3 text-[15px]">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${status.open ? "bg-[#4cbf7a]/12 text-ok" : "bg-sand text-soft"}`}>
                <span className={`size-1.5 rounded-full ${status.open ? "bg-ok" : "bg-mute"}`} /> {status.label}
              </span>
              <span className="text-soft">{status.detail}</span>
            </p>
            <dl className="divide-y divide-line border-y border-line">
              {hoursRows().map((row) => (
                <div key={row.days} className={`flex justify-between py-3 text-[15px] ${row.dayIndexes.includes(now.getDay()) ? "font-medium text-forest" : "text-soft"}`}>
                  <dt>{row.days}</dt>
                  <dd className="tabular-nums">
                    {row.hours} <span className="ml-2 text-xs text-mute">kuchyňa do {row.kitchen}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3">
              <Link to="/rezervacia" className="btn-primary">
                Rezervovať stôl
              </Link>
              <a href={RESTAURANT.phoneHref} className="btn-outline">
                <Phone size={17} /> {RESTAURANT.phone}
              </a>
            </div>
          </Reveal>
        </div>
        <Reveal delay={80}>
          <Link to="/kontakt#mapa" className="group relative block overflow-hidden rounded-[2rem]">
            <Photo name="terrace" className="aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[460px]" imgClassName="transition-transform duration-700 group-hover:scale-[1.03]" />
            <span className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2.5 text-sm font-medium text-forest shadow-lg">
              <MapPin size={16} /> Mapa a ako sa k nám dostanete
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
