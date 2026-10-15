import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OpenStatusPill } from "../components/layout/Header";
import { ArrowRight, Calendar, Coffee, Leaf, MapPin, Phone, Shield, Sparkles, Star } from "../components/icons";
import LoyaltyCard from "../components/LoyaltyCard";
import { CategoryIcon, Photo, Reveal, SectionHeading, Stars } from "../components/ui";
import { LOYALTY, SALON } from "../config";
import { BRANDS, GALLERY, RATING, REVIEWS } from "../data/content";
import { CATEGORIES, SERVICES, type CategoryId } from "../data/services";
import { SPECIALIST_BY_ID, TEAM } from "../data/team";
import { nextFree, signatureService } from "../lib/availability";
import { fromPrice, liveService, liveServices } from "../lib/catalog";
import { capitalize, formatEuro, fromISODate, minutesToTime } from "../lib/format";
import { hoursRows, relativeDay } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { useDB } from "../lib/store";

export default function Home() {
  usePageMeta(null);
  return (
    <>
      <Hero />
      <Brands />
      <Categories />
      <Promise />
      <TeamTeaser />
      <GalleryStrip />
      <LoyaltyBand />
      <Reviews />
      <Visit />
    </>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-night text-ivory">
      <div className="absolute inset-0">
        <Photo name="hero" priority className="size-full" showLabel={false} />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(35_26_30/0.55)_0%,rgb(35_26_30/0.15)_40%,rgb(35_26_30/0.85)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(35_26_30/0.8)_0%,rgb(35_26_30/0.35)_50%,transparent_80%)]" />
      <div className="container-page relative flex flex-1 flex-col justify-end pb-20 pt-32 sm:pb-16">
        <div className="grid grid-cols-[minmax(0,1fr)] items-end gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5 flex animate-rise items-center gap-2 text-gold-soft">
              <MapPin size={14} /> {SALON.city} · {SALON.district}
            </p>
            <h1 className="animate-rise font-display text-[3.3rem] font-medium leading-[0.95] tracking-[-0.015em] sm:text-[5.2rem] lg:text-[6rem]">
              Krása, ktorá <em className="font-normal text-gold-soft">sedí</em> práve vám.
            </h1>
            <p className="mt-6 max-w-lg animate-rise text-[17px] font-light leading-relaxed text-ivory/80 sm:text-lg" style={{ animationDelay: "80ms" }}>
              Vlasy, nechty, pleť a pohľad pod jednou strechou. Termín si vyberiete online za minútu, u koho chcete a kedy chcete.
            </p>
            <div className="mt-8 flex animate-rise flex-wrap items-center gap-3" style={{ animationDelay: "140ms" }}>
              <Link to="/rezervacia" className="btn-gold px-7 py-3.5">
                <Calendar size={17} /> Rezervovať termín
              </Link>
              <Link to="/sluzby" className="btn-ghost-light px-7 py-3.5">
                Služby a cenník
              </Link>
            </div>
            <p className="mt-8 flex animate-rise items-center gap-3 text-sm text-ivory/75" style={{ animationDelay: "200ms" }}>
              <Stars value={RATING.score} size={15} />
              <span>
                <strong className="font-medium text-ivory">{RATING.score.toLocaleString("sk-SK")}</strong> z {RATING.count.toLocaleString("sk-SK")} hodnotení
              </span>
              <span className="hidden sm:inline">
                · <OpenStatusPill />
              </span>
            </p>
          </div>
          <div className="animate-rise" style={{ animationDelay: "260ms" }}>
            <NextFreeWidget />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Live "next free time" for a category, computed by the same engine as the booking page. */
function NextFreeWidget() {
  const db = useDB();
  const now = useNow(60_000);
  const [cat, setCat] = useState<CategoryId>("strih");
  const service = SERVICES.find((s) => s.cat === cat && s.popular) ?? SERVICES.find((s) => s.cat === cat)!;
  const next = useMemo(() => nextFree([{ serviceId: service.id, variantId: service.variants?.[0].id, specialistId: "any" }], db, now), [service, db, now]);
  const person = next ? SPECIALIST_BY_ID.get(next.slot.parts[0].specialistId) : null;
  return (
    <div className="rounded-[1.75rem] border border-ivory/15 bg-night/55 p-5 shadow-2xl backdrop-blur-xl">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-soft">
        <Sparkles size={14} /> Najbližší voľný termín
      </p>
      <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={cat === c.id}
            onClick={() => setCat(c.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors ${cat === c.id ? "bg-ivory text-plum" : "bg-ivory/10 text-ivory/80 hover:bg-ivory/20"}`}
          >
            <CategoryIcon cat={c.id} size={14} /> {c.short}
          </button>
        ))}
      </div>
      {next && person ? (
        <div className="mt-5 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[2rem] font-medium leading-none" aria-live="polite">
              {capitalize(relativeDay(fromISODate(next.iso), now))} {minutesToTime(next.slot.start)}
            </p>
            <p className="mt-1.5 truncate text-sm text-ivory/65">
              {service.name} · {person.firstName}
            </p>
          </div>
          <Link to={`/rezervacia?sluzba=${service.id}&specialista=${person.id}&datum=${next.iso}&cas=${next.slot.start}`} className="btn-gold shrink-0 px-5 py-3">
            Chcem <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <p className="mt-5 text-sm text-ivory/70">Najbližšie týždne sú plné. Zapíšte sa na čakaciu listinu pri rezervácii.</p>
      )}
    </div>
  );
}

function Brands() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <div className="overflow-hidden border-b border-line bg-paper py-5" aria-label="Značky, s ktorými pracujeme">
      <div className="flex w-max animate-marquee gap-14 pr-14">
        {row.map((b, i) => (
          <span key={i} className="whitespace-nowrap font-display text-2xl italic text-plum/45">
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

function Categories() {
  const db = useDB();
  const services = liveServices(db.serviceOverrides);
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Služby" title={<>Všetko pre vás, <em className="font-normal text-mauve">pod jednou strechou.</em></>} />
          <Reveal>
            <Link to="/sluzby" className="btn-outline">
              Celý cenník <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => {
            const inCat = services.filter((s) => s.cat === c.id && s.price > 0);
            const from = Math.min(...inCat.map((s) => fromPrice(s, db.serviceOverrides)));
            return (
              <Reveal key={c.id} delay={i * 50} className={i === 0 ? "col-span-2 row-span-2" : i >= 5 ? "lg:col-span-2" : ""}>
                <Link to={`/sluzby#${c.id}`} className="group relative block h-full min-h-56 overflow-hidden rounded-[1.4rem] sm:min-h-64">
                  <Photo name={c.photo} className="!absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(35_26_30/0.85)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-ivory sm:p-5">
                    <span className="mb-3 grid size-9 place-items-center rounded-full bg-ivory/15 backdrop-blur-md">
                      <CategoryIcon cat={c.id} size={17} />
                    </span>
                    <p className={`font-display font-medium leading-tight ${i === 0 ? "text-[2.2rem] sm:text-5xl" : "text-[1.55rem]"}`}>{c.name}</p>
                    {i === 0 && <p className="mt-2 hidden max-w-sm text-sm font-light text-ivory/75 sm:block">{c.text}</p>}
                    <p className="mt-1 text-sm text-ivory/70">od {formatEuro(from)}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Promise() {
  const now = useNow(3_600_000);
  const items = [
    { icon: Calendar, title: "Online 24/7", text: "Termín, špecialistka aj zmena jedným klikom, aj o polnoci." },
    { icon: Shield, title: "Sterilné náradie", text: "Autokláv pre nechty, jednorazové pilníky a čisté uteráky." },
    { icon: Leaf, title: "Prémiová kozmetika", text: "Wella, Olaplex, Dermalogica. Nič, čo by sme nedali sebe." },
    { icon: Coffee, title: "Čas pre vás", text: "Káva z lokálnej pražiarne, ticho a žiadne náhlenie." },
  ];
  return (
    <section className="bg-blush/60 py-20 sm:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-20">
        <Reveal className="relative">
          <Photo name="interior" className="aspect-[4/5] rounded-[2rem] sm:aspect-[5/4] lg:aspect-[4/5]" />
          <div className="absolute -bottom-6 -right-2 hidden rounded-[1.4rem] bg-paper p-5 shadow-xl sm:block lg:-right-10">
            <p className="font-display text-5xl font-medium text-plum">{now.getFullYear() - SALON.founded}+</p>
            <p className="text-sm text-soft">rokov v Starom Meste</p>
          </div>
        </Reveal>
        <div>
          <SectionHeading
            eyebrow="Ateliér, nie továreň"
            title={
              <>
                Sedem ľudí, ktorí <em className="font-normal text-mauve">počúvajú.</em>
              </>
            }
            text="Každá návšteva začína rozhovorom. Čo sa vám páči, čo nie, koľko času máte ráno na styling. Až potom berieme do ruky nožnice alebo štetec."
          />
          <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {items.map((item, i) => (
              <Reveal key={item.title} delay={i * 60} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-gold shadow-sm">
                  <item.icon size={20} />
                </span>
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-sm font-light leading-relaxed text-soft">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamTeaser() {
  const db = useDB();
  const now = useNow(60_000);
  const frees = useMemo(
    () =>
      TEAM.map((p) => {
        const s = signatureService(p);
        return { person: p, service: s, next: nextFree([{ serviceId: s.id, variantId: s.variants?.[0].id, specialistId: p.id }], db, now, 30) };
      }),
    [db, now],
  );
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Tím" title={<>Vyberte si, <em className="font-normal text-mauve">komu sa zveríte.</em></>} text="Pri každej špecialistke vidíte jej najbližší voľný čas, naživo." />
          <Reveal>
            <Link to="/tim" className="btn-outline">
              Celý tím <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </div>
      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-8 xl:px-[max(2rem,calc((100vw-1240px)/2+2rem))]">
        {frees.map(({ person, service, next }, i) => (
          <Reveal key={person.id} delay={i * 50} className="w-[72vw] max-w-[290px] shrink-0 snap-start">
            <Link to={`/tim/${person.id}`} className="group block">
              <Photo name={person.photo} className="aspect-[3/4] rounded-[1.4rem]" imgClassName="transition-transform duration-700 group-hover:scale-105" />
              <p className="mt-4 font-display text-[1.6rem] font-medium leading-tight text-plum">{person.name}</p>
              <p className="text-sm text-mute">{person.role}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-soft">
                <Star size={14} className="text-gold" /> {person.rating.toLocaleString("sk-SK")} · {person.reviews} hodnotení
              </p>
              {next && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-blush px-3 py-1.5 text-xs text-plum">
                  <span className="size-1.5 rounded-full bg-ok" /> {capitalize(relativeDay(fromISODate(next.iso), now))} {minutesToTime(next.slot.start)} · {service.name.split(" ")[0]}
                </p>
              )}
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function GalleryStrip() {
  const picks = GALLERY.slice(0, 6);
  return (
    <section className="bg-plum py-20 text-ivory sm:py-28">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading tone="light" eyebrow="Galéria" title={<>Naše práce <em className="font-normal text-gold-soft">hovoria za nás.</em></>} />
          <Reveal>
            <Link to="/galeria" className="btn-ghost-light">
              Celá galéria <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {picks.map((g, i) => (
            <Reveal key={g.photo} delay={i * 50} className={i % 3 === 0 ? "lg:translate-y-8" : ""}>
              <Link to="/galeria" className="group block">
                <Photo name={g.photo} className="aspect-[3/4] rounded-2xl" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                <p className="mt-2 truncate text-xs text-ivory/60">{g.title}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoyaltyBand() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Vernostný program"
            title={
              <>
                Každá návšteva sa <em className="font-normal text-mauve">ráta.</em>
              </>
            }
            text={`Za každé euro bod, v mesiaci narodenín dvojnásobok. Body vymeníte za zľavy či ošetrenia a od ${LOYALTY.tiers[1].from} bodov máte status Gold so zľavou ${Math.round(LOYALTY.tiers[1].discount * 100)} % navždy.`}
          />
          <Reveal className="mt-8 flex flex-wrap gap-3">
            <Link to="/vernostny-program" className="btn-primary">
              Ako to funguje <ArrowRight size={16} />
            </Link>
            <Link to="/ucet?registracia=1" className="btn-outline">
              Získať {LOYALTY.signupBonus} bodov
            </Link>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <LoyaltyCard name="Zuzana Kováčová" tier="Gold" points={695} since={2025} />
        </Reveal>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="bg-blush/60 py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Recenzie" title={<>{RATING.score.toLocaleString("sk-SK")} z 5, <em className="font-normal text-mauve">a nie náhodou.</em></>} />
          <Reveal className="flex items-center gap-3 rounded-full bg-paper px-4 py-2 text-sm shadow-sm">
            <Stars value={RATING.google} size={15} />
            <span className="text-soft">
              Google · {RATING.googleCount.toLocaleString("sk-SK")} recenzií
            </span>
          </Reveal>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => {
            const person = SPECIALIST_BY_ID.get(r.specialist);
            return (
              <Reveal key={r.name} delay={(i % 3) * 60} className="card flex flex-col p-6">
                <Stars value={r.rating} size={14} />
                <p className="mt-4 flex-1 font-display text-[1.3rem] leading-snug text-ink">„{r.text}“</p>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
                  <span>
                    <span className="block font-medium text-ink">{r.name}</span>
                    <span className="text-xs text-mute">
                      {r.service} · {person?.firstName}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-mute">{r.when}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Visit() {
  const now = useNow(60_000);
  const db = useDB();
  const consultation = liveService("konzultacia-plet", db.serviceOverrides);
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <Photo name="interior2" className="aspect-[4/3] rounded-[2rem]" />
        </Reveal>
        <div>
          <SectionHeading eyebrow="Navštívte nás" title={<>Palisády 22, <em className="font-normal text-mauve">prvé poschodie.</em></>} text="Dve minúty od Hradu, tri od Hlavného námestia. Zazvoňte na zvonček s monogramom." />
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {hoursRows().map((row) => (
              <div key={row.days} className={`flex justify-between py-3 text-[15px] ${row.dayIndexes.includes(now.getDay()) ? "font-medium text-plum" : "text-soft"}`}>
                <dt>{row.days}</dt>
                <dd className="tabular-nums">{row.hours}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/kontakt" className="btn-primary">
              <MapPin size={16} /> Mapa a parkovanie
            </Link>
            <a href={SALON.phoneHref} className="btn-outline">
              <Phone size={16} /> {SALON.phone}
            </a>
          </div>
          {consultation.online && (
            <p className="mt-6 text-sm text-soft">
              Neviete, čo vybrať?{" "}
              <Link to="/rezervacia?sluzba=konzultacia-plet" className="font-medium text-plum underline underline-offset-4">
                Konzultácia pleti je zadarmo
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
