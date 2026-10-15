import { useState } from "react";
import { Link } from "react-router-dom";
import { AreaMap } from "../components/AreaMap";
import { ArrowRight, Award, Calculator, Calendar, Check, CheckCircle, Icon, Siren, Star } from "../components/icons";
import { useEmergencyOn } from "../components/layout/nav";
import { ProjectDialog } from "../components/ProjectDialog";
import { CtaBand, Faq, ProjectCard, ReviewCard } from "../components/sections";
import { TownInput, type TownPick } from "../components/TownInput";
import { Photo, Reveal, SectionHeading, Stars } from "../components/ui";
import { TRAVEL } from "../config";
import type { Project } from "../data/trades";
import { nextFreeSlot, windowLabel } from "../lib/availability";
import { etaFor } from "../lib/emergency";
import { capitalize, formatDateLong, formatPrice, fromISODate, toISODate } from "../lib/format";
import { findTown, useGeo } from "../lib/geo";
import { useNow, usePageMeta } from "../lib/hooks";
import { BIZ, TRADE } from "../lib/profile";
import { useDB } from "../lib/store";
import QuickEstimate from "./home/QuickEstimate";

export default function Home() {
  usePageMeta(null, `${TRADE.tagline} – ${BIZ.city} a okolie. Cena online, termín obhliadky hneď${TRADE.emergency ? ", pohotovosť 24/7" : ""}.`);
  const [project, setProject] = useState<Project | null>(null);
  return (
    <>
      <Hero />
      <TrustBar />
      <Services />
      <section className="bg-paper py-16 sm:py-24" id="cena">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:items-center [&>*]:min-w-0">
          <SectionHeading
            eyebrow="Cena hneď, nie o týždeň"
            title="Koľko to bude stáť? Pozrite sa sami."
            text="Posuňte posuvník a uvidíte orientačnú cenu podľa nášho aktuálneho cenníka. V kalkulačke potom rozpočet spresníte po položkách a pošlete nám ho jedným klikom."
          />
          <Reveal delay={100}>
            <QuickEstimate />
          </Reveal>
        </div>
      </section>
      <Process />
      <About />
      <section className="py-16 sm:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Realizácie" title="Naša práca hovorí za nás" text="Výber zákaziek z posledných mesiacov. Pri každej nájdete rozsah, trvanie aj cenu." />
            <Link to="/realizacie" className="btn-outline">
              Všetky realizácie <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRADE.projects.slice(0, 3).map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProjectCard project={p} onOpen={() => setProject(p)} />
              </Reveal>
            ))}
          </div>
        </div>
        <ProjectDialog project={project} onClose={() => setProject(null)} />
      </section>
      <Reviews />
      <ServiceArea />
      <section className="py-16 sm:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading eyebrow="Časté otázky" title="Čo sa nás ľudia pýtajú" text="Nenašli ste odpoveď? Napíšte nám alebo zavolajte, odpovieme do 2 hodín v pracovnom čase." />
          <Reveal>
            <Faq items={TRADE.faq} />
          </Reveal>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function Hero() {
  const db = useDB();
  const now = useNow(60_000);
  const emergency = useEmergencyOn();
  const slot = nextFreeSlot(db, now);
  const eta = etaFor(9, now);
  const slotDay = slot ? fromISODate(slot.date) : null;
  const dayLabel = slotDay ? (slot!.date === toISODate(now) ? "Dnes" : slot!.date === toISODate(new Date(now.getTime() + 86_400_000)) ? "Zajtra" : capitalize(formatDateLong(slotDay))) : "";

  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="grid-paper absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden="true" />
      <div className="container-page relative grid gap-10 pb-14 pt-8 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-20 lg:pt-16">
        <div className="flex flex-col justify-center">
          <div className="flex animate-rise flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold shadow-sm">
              <Star size={15} className="text-[#f5b400]" /> {TRADE.stats.rating.toLocaleString("sk-SK")} · {TRADE.stats.reviews} recenzií
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-white">
              <Icon name={TRADE.icon} size={15} className="text-accent" /> {TRADE.label} · {BIZ.city} a okolie
            </span>
          </div>
          <h1 className="display mt-6 animate-rise text-[2.7rem] leading-[0.98] sm:text-[3.8rem] xl:text-[4.4rem]">
            {TRADE.hero.title} <span className="bg-[linear-gradient(transparent_60%,color-mix(in_srgb,var(--color-accent)_55%,transparent)_60%,color-mix(in_srgb,var(--color-accent)_55%,transparent)_92%,transparent_92%)] [box-decoration-break:clone]">{TRADE.hero.highlight}</span>
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-soft">{TRADE.hero.text}</p>
          <div className="mt-8 flex animate-rise flex-col gap-3 sm:flex-row">
            <Link to="/kalkulacka" className="btn-accent px-6 py-4 text-base">
              <Calculator size={20} /> Spočítať cenu online
            </Link>
            <Link to="/obhliadka" className="btn-outline px-6 py-4 text-base">
              <Calendar size={20} /> Objednať obhliadku
            </Link>
          </div>
          {emergency && (
            <Link to="/havaria" className="group mt-4 flex animate-rise items-center gap-3 rounded-2xl border-2 border-danger/20 bg-danger-soft/60 p-3 pr-4 transition-colors hover:border-danger/50 sm:max-w-md">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger text-white">
                <Siren size={20} />
              </span>
              <span className="text-sm leading-snug">
                <strong className="block text-danger">Havária? Pohotovosť 24/7</strong>
                <span className="text-soft">Technik môže byť u vás o {eta} – {eta + 15} min. Nahláste ju online.</span>
              </span>
              <ArrowRight size={18} className="ml-auto text-danger transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <ul className="mt-7 flex animate-rise flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-soft">
            {["Obhliadka zadarmo", "Pevná cena vopred", `Záruka ${TRADE.stats.warranty} rokov`].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle size={17} className="text-ok" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative animate-rise lg:pl-4">
          <Photo src={TRADE.hero.photo} alt={`${TRADE.label} pri práci`} priority sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3.6] rounded-[2rem] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.5)] lg:aspect-[4/4.6]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </Photo>
          <div className="hazard absolute -left-2 top-10 hidden h-3 w-24 rounded-full lg:block" aria-hidden="true" />
          {slot && (
            <Link
              to={`/obhliadka?datum=${slot.date}&okno=${slot.index}`}
              className="absolute -bottom-5 left-4 right-4 flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-2xl ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 sm:left-auto sm:right-6 sm:w-80 lg:-left-6 lg:right-auto"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
                <Calendar size={22} />
              </span>
              <span className="min-w-0 text-sm leading-tight">
                <span className="block text-xs font-semibold uppercase tracking-wide text-mute">Najbližší voľný termín</span>
                <span className="mt-1 block truncate text-[15px] font-bold">
                  {dayLabel}, {windowLabel(slot)}
                </span>
              </span>
              <ArrowRight size={18} className="ml-auto shrink-0 text-mute" />
            </Link>
          )}
          <div className="absolute right-4 top-4 rounded-2xl bg-paper/95 px-4 py-3 shadow-xl backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="display text-2xl">{TRADE.stats.rating.toLocaleString("sk-SK")}</span>
              <Stars value={TRADE.stats.rating} size={14} />
            </div>
            <p className="text-xs font-semibold text-mute">{TRADE.stats.reviews} overených recenzií</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const YEARS = new Date().getFullYear() - TRADE.stats.since;

function TrustBar() {
  const years = YEARS;
  const items = [
    { value: `${years} rokov`, label: "na trhu" },
    { value: TRADE.stats.jobs.toLocaleString("sk-SK"), label: "dokončených zákaziek" },
    { value: `${TRADE.stats.rating.toLocaleString("sk-SK")} / 5`, label: `z ${TRADE.stats.reviews} recenzií` },
    { value: `${TRADE.stats.warranty} rokov`, label: "záruka na prácu" },
  ];
  return (
    <section className="bg-ink text-white">
      <div className="container-page grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={s.label} delay={i * 70} className={`px-2 md:px-6 ${i > 0 ? "md:border-l md:border-white/10" : ""}`}>
            <p className="display text-[2rem] leading-none text-accent sm:text-[2.4rem]">{s.value}</p>
            <p className="mt-2 text-sm text-white/60">{s.label}</p>
          </Reveal>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page no-scrollbar flex gap-8 overflow-x-auto py-4 text-sm text-white/60">
          {TRADE.certs.map((c) => (
            <span key={c} className="flex shrink-0 items-center gap-2">
              <Award size={16} className="text-accent" /> {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Služby" title={`Čo pre vás urobíme`} text="Od malej opravy po kompletnú rekonštrukciu. Pri každej službe vidíte, od akej ceny začíname." />
          <Link to="/sluzby" className="btn-outline">
            Služby a cenník <ArrowRight size={18} />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRADE.services.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 70}>
              <article className="group card flex h-full flex-col overflow-hidden">
                <Photo src={s.photo} alt={s.title} className="aspect-[16/10]" imgClassName="transition-transform duration-700 group-hover:scale-[1.04]">
                  <span className="absolute bottom-3 left-3 grid size-11 place-items-center rounded-xl bg-accent text-accent-ink shadow-lg">
                    <Icon name={s.icon} size={22} strokeWidth={2.2} />
                  </span>
                </Photo>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="display text-xl leading-tight">{s.title}</h3>
                    <span className="shrink-0 rounded-lg bg-sand px-2 py-1 text-xs font-bold">{s.from}</span>
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-soft">{s.text}</p>
                  <ul className="mt-4 space-y-1.5">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm font-medium">
                        <Check size={16} strokeWidth={2.6} className="text-ok" /> {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-5">
                    {s.job ? (
                      <Link to={`/kalkulacka?praca=${s.job}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-accent-deep">
                        <Calculator size={17} /> Spočítať cenu <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ) : s.id === "havaria" ? (
                      <Link to="/havaria" className="inline-flex items-center gap-1.5 text-sm font-bold text-danger">
                        <Siren size={17} /> Nahlásiť haváriu <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <Link to="/obhliadka" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-accent-deep">
                        <Calendar size={17} /> Dohodnúť konzultáciu <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    { title: "Dopyt alebo kalkulačka", text: "Spočítate si cenu online alebo nám pošlete, čo potrebujete. Fotky pomôžu." },
    { title: "Obhliadka zadarmo", text: "Vyberiete si termín v kalendári. Prídeme, zameriame a poradíme." },
    { title: "Pevná cenová ponuka", text: "Do 48 hodín máte ponuku po položkách. Prijmete ju jedným klikom online." },
    { title: "Realizácia so zárukou", text: `Urobíme v dohodnutom termíne, upraceme a dáme záruku ${TRADE.stats.warranty} rokov.` },
  ];
  return (
    <section className="bg-bg py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading eyebrow="Ako to prebieha" title="Štyri kroky, žiadne prekvapenia" align="center" />
        <ol className="relative mt-12 grid gap-6 md:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 bg-[repeating-linear-gradient(90deg,var(--color-line)_0_10px,transparent_10px_18px)] md:block" aria-hidden="true" />
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="relative text-center">
              <span className="relative mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-accent text-xl font-black text-accent-ink shadow-[4px_4px_0_var(--color-ink)]">{i + 1}</span>
              <h3 className="display mt-5 text-lg">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-60 text-[15px] leading-relaxed text-soft">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="bg-paper py-16 sm:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal className="relative">
          <Photo src={TRADE.aboutPhoto} alt={`Tím firmy ${BIZ.name}`} className="aspect-[4/3] rounded-[2rem]" />
          <div className="absolute -bottom-6 right-4 max-w-xs rounded-2xl bg-ink p-5 text-white shadow-2xl sm:right-8">
            <p className="text-[15px] leading-relaxed">„Za každou prácou si stojím menom. Keď niečo nie je v poriadku, volajte priamo mne.“</p>
            <p className="mt-3 text-sm font-bold text-accent">— {BIZ.owner}, majiteľ</p>
          </div>
        </Reveal>
        <div>
          <SectionHeading eyebrow={`O nás · od roku ${TRADE.stats.since}`} title={`Prečo ${BIZ.name}`} text={TRADE.about} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {TRADE.usps.map((u, i) => (
              <Reveal key={u.title} delay={i * 70} className="rounded-2xl border border-line p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-deep">
                  <Icon name={u.icon} size={21} strokeWidth={2.2} />
                </span>
                <h3 className="mt-3 font-bold">{u.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-soft">{u.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="bg-bg py-16 sm:py-24">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[1fr_2.2fr]">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-accent-deep">
              <span className="h-[3px] w-6 rounded-full bg-accent" /> Recenzie
            </p>
            <h2 className="display mt-3 text-[2rem] leading-[1.05] sm:text-[2.6rem]">Čo o nás hovoria zákazníci</h2>
            <div className="mt-6 rounded-2xl bg-paper p-6 shadow-sm ring-1 ring-line">
              <div className="flex items-end gap-3">
                <span className="display text-6xl leading-none">{TRADE.stats.rating.toLocaleString("sk-SK")}</span>
                <span className="pb-1">
                  <Stars value={TRADE.stats.rating} size={18} />
                  <span className="mt-1 block text-sm text-mute">{TRADE.stats.reviews} hodnotení na Google</span>
                </span>
              </div>
              {[
                [5, 92],
                [4, 6],
                [3, 2],
              ].map(([stars, pct]) => (
                <div key={stars} className="mt-3 flex items-center gap-3 text-sm">
                  <span className="w-3 font-semibold">{stars}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                    <span className="block h-full rounded-full bg-[#f5b400]" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-9 text-right tabular-nums text-mute">{pct} %</span>
                </div>
              ))}
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {TRADE.reviews.map((r, i) => (
              <Reveal key={r.name} delay={(i % 2) * 80}>
                <ReviewCard review={r} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceArea() {
  const geo = useGeo();
  const [town, setTown] = useState<TownPick | null>(null);
  const target = town && geo ? (findTown(town.name, geo.towns) ?? null) : null;
  return (
    <section className="bg-paper py-16 sm:py-24" id="oblast">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Kde pôsobíme"
            title={`${BIZ.city} a okolie do ${TRAVEL.radiusKm} km`}
            text={`Do ${TRAVEL.freeKm} km je doprava zadarmo, ďalej účtujeme ${formatPrice(TRAVEL.perKm)} za km. Zadajte svoju obec a hneď uvidíte, či k vám chodíme.`}
          />
          <div className="mt-8 max-w-md">
            <TownInput value={town} onChange={setTown} label="Pracujete aj u nás?" />
          </div>
          {geo?.nearby.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {geo.nearby.slice(0, 8).map((t) => (
                <span key={t.name} className="rounded-full bg-sand px-3 py-1.5 text-sm font-medium text-soft">
                  {t.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Reveal>
          <AreaMap target={target} />
        </Reveal>
      </div>
    </section>
  );
}
