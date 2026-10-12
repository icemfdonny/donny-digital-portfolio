import { useState, type FormEvent } from "react";
import { Accessible, ChevronDown, Clock, External, Instagram, Mail, MapPin, Phone } from "../components/icons";
import { Spinner } from "../components/Payment";
import { Checkbox, PageHero, Reveal, SectionHeading, StatusDot, TextArea, TextField } from "../components/ui";
import { RESTAURANT } from "../config";
import { FAQ } from "../data/content";
import { capitalize, formatDateLong, isEmail, minutesToTime, uid } from "../lib/format";
import { hoursRows, openStatus, upcomingSpecialDays } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { updateDB } from "../lib/store";

const TOPICS = ["Všeobecná otázka", "Rezervácia", "Súkromná akcia", "Spolupráca", "Pochvala alebo sťažnosť"];

export default function ContactPage() {
  usePageMeta("Kontakt a otváracie hodiny", `${RESTAURANT.street}, ${RESTAURANT.city}. Otváracie hodiny, mapa, parkovanie a kontakt na reštauráciu Lipa.`);
  const now = useNow();
  const status = openStatus(now);
  const specials = upcomingSpecialDays(now, 75);
  const [mapLoaded, setMapLoaded] = useState(false);
  const destination = encodeURIComponent(`${RESTAURANT.street}, ${RESTAURANT.zip} ${RESTAURANT.city}`);
  const bbox = [RESTAURANT.lng - 0.006, RESTAURANT.lat - 0.003, RESTAURANT.lng + 0.006, RESTAURANT.lat + 0.003].join(",");

  return (
    <>
      <PageHero
        eyebrow="Kontakt"
        title={
          <>
            Nájdete nás v dvore <em className="text-honey-soft">na Lipovej ulici.</em>
          </>
        }
        text="Tri minúty pešo od Hlavného námestia, vchod cez bránu s lipovým listom."
      >
        <p className="mt-8 inline-flex items-center gap-3 rounded-full bg-cream/10 px-4 py-2 text-sm">
          <StatusDot tone={status.open ? (status.closingSoon ? "warn" : "ok") : "off"} />
          <span className="font-medium">{status.label}</span>
          <span className="text-cream/60">{status.detail}</span>
        </p>
      </PageHero>

      <section className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="space-y-4">
          {[
            { icon: MapPin, label: "Adresa", value: `${RESTAURANT.street}, ${RESTAURANT.zip} ${RESTAURANT.city}`, href: `https://www.google.com/maps/dir/?api=1&destination=${destination}` },
            { icon: Phone, label: "Rezervácie a rozvoz", value: RESTAURANT.phone, href: RESTAURANT.phoneHref },
            { icon: Mail, label: "E-mail", value: RESTAURANT.email, href: `mailto:${RESTAURANT.email}` },
            { icon: Instagram, label: "Instagram", value: `@${RESTAURANT.instagram}`, href: `https://instagram.com/${RESTAURANT.instagram}` },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 50}>
              <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="card group flex items-center gap-5 p-5 hover:border-ink/25">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-forest text-honey">
                  <item.icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-mute">{item.label}</span>
                  <span className="block truncate text-[17px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{item.value}</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={80} className="card scroll-mt-28 p-6 sm:p-8" as="div">
          <h2 id="otvaracie-hodiny" className="flex scroll-mt-28 items-center gap-3 font-display text-3xl text-forest">
            <Clock size={24} className="text-moss" /> Otváracie hodiny
          </h2>
          <dl className="mt-6 divide-y divide-line">
            {hoursRows().map((row) => {
              const today = row.dayIndexes.includes(now.getDay());
              return (
                <div key={row.days} className={`flex items-center justify-between gap-4 py-3.5 ${today ? "font-medium text-forest" : "text-soft"}`}>
                  <dt className="flex items-center gap-2">
                    {row.days}
                    {today && <span className="rounded-full bg-honey-soft px-2 py-0.5 text-[11px] font-semibold text-forest">dnes</span>}
                  </dt>
                  <dd className="text-right tabular-nums">
                    {row.hours}
                    <span className="block text-xs font-normal text-mute">kuchyňa do {row.kitchen}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
          {specials.length > 0 && (
            <div className="mt-6 rounded-2xl bg-honey-soft/60 p-4">
              <p className="text-sm font-medium text-forest">Sviatky a zmeny</p>
              <ul className="mt-2 space-y-1 text-sm text-forest/80">
                {specials.map((s) => (
                  <li key={s.date.toISOString()} className="flex justify-between gap-4">
                    <span>
                      {capitalize(formatDateLong(s.date))} · {s.label}
                    </span>
                    <span className="shrink-0 tabular-nums">{s.hours ? `${minutesToTime(s.hours.open)} – ${minutesToTime(s.hours.close)}` : "zatvorené"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-6 text-sm text-mute">Obedové menu podávame v pracovné dni od 11:00 do 14:30.</p>
        </Reveal>
      </section>

      <section id="mapa" className="scroll-mt-20 bg-paper py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div className="relative overflow-hidden rounded-[2rem] bg-sand">
            {mapLoaded ? (
              <iframe
                title={`Mapa: ${RESTAURANT.fullName}`}
                className="aspect-[4/3] w-full border-0 lg:h-full"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${RESTAURANT.lat},${RESTAURANT.lng}`}
              />
            ) : (
              <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 p-6 text-center lg:h-full">
                <svg className="absolute inset-0 size-full text-line" aria-hidden="true">
                  <defs>
                    <pattern id="map-grid" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
                      <path d="M0 28h56M28 0v56" stroke="currentColor" strokeWidth="8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#map-grid)" />
                </svg>
                <span className="relative grid size-14 place-items-center rounded-full bg-forest text-honey shadow-lg">
                  <MapPin size={24} />
                </span>
                <p className="relative max-w-xs text-sm text-soft">Mapu načítame až po kliknutí, aby sme bez vášho súhlasu nič neposielali tretím stranám.</p>
                <button type="button" className="btn-primary relative" onClick={() => setMapLoaded(true)}>
                  Zobraziť mapu
                </button>
              </div>
            )}
          </div>
          <div>
            <SectionHeading eyebrow="Ako sa k nám dostanete" title="Cesta k nám" />
            <dl className="mt-8 space-y-5 text-[15px]">
              {[
                { t: "Pešo", d: "3 minúty z Hlavného námestia, 5 minút od Michalskej brány." },
                { t: "MHD", d: "Električky 1, 4 a 9, zastávka Námestie SNP, odtiaľ 4 minúty pešo." },
                { t: "Autom", d: "Parkovací dom na Lipovej ulici (3 min). S rezerváciou nad 50 € parkujete 2 hodiny zadarmo." },
                { t: "Bicyklom", d: "Stojany priamo v dvore, pod lipou." },
              ].map((row) => (
                <div key={row.t} className="grid grid-cols-[90px_1fr] gap-4">
                  <dt className="font-medium text-forest">{row.t}</dt>
                  <dd className="text-soft">{row.d}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 flex items-start gap-3 rounded-2xl bg-cream p-4 text-sm text-soft">
              <Accessible size={20} className="shrink-0 text-moss" /> Bezbariérový vstup z ulice, bezbariérová toaleta. Terasa je na úrovni jedálne.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`} target="_blank" rel="noreferrer" className="btn-outline py-2.5">
                Google Maps <External size={14} />
              </a>
              <a href={`https://waze.com/ul?ll=${RESTAURANT.lat},${RESTAURANT.lng}&navigate=yes`} target="_blank" rel="noreferrer" className="btn-outline py-2.5">
                Waze <External size={14} />
              </a>
              <a href={`https://maps.apple.com/?daddr=${destination}`} target="_blank" rel="noreferrer" className="btn-outline py-2.5">
                Apple Mapy <External size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading eyebrow="Časté otázky" title="Na čo sa hostia pýtajú" />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-1">
                <summary className="flex list-none items-center justify-between gap-4 py-4 text-[17px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown size={20} className="shrink-0 text-mute transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 pr-8 leading-relaxed text-soft">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (form.name.trim().length < 2) found.name = "Ako vás máme osloviť?";
    if (!isEmail(form.email)) found.email = "Zadajte platný e-mail.";
    if (form.message.trim().length < 5) found.message = "Napíšte nám aspoň pár slov.";
    if (!consent) found.consent = "Potrebujeme váš súhlas, aby sme mohli odpovedať.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    updateDB((db) => ({ ...db, messages: [{ id: uid(), ...form, createdAt: Date.now() }, ...db.messages] }));
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="card p-6 sm:p-8">
      {sent ? (
        <div className="py-10 text-center">
          <p className="font-display text-3xl text-forest">Ďakujeme, {form.name.split(" ")[0]}!</p>
          <p className="mt-2 text-soft">Odpovieme do 24 hodín na {form.email}. (Ukážka: správa sa nikam neposiela.)</p>
          <button
            type="button"
            className="btn-outline mt-6"
            onClick={() => {
              setSent(false);
              setForm({ name: "", email: "", topic: TOPICS[0], message: "" });
              setConsent(false);
            }}
          >
            Napísať ďalšiu správu
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <h2 className="font-display text-3xl text-forest">Napíšte nám</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Meno" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
            <TextField label="E-mail" required type="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="contact-topic" className="field-label">
              Téma
            </label>
            <select id="contact-topic" className="field" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <TextArea label="Správa" required rows={5} value={form.message} error={errors.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Checkbox checked={consent} onChange={setConsent} error={errors.consent}>
            Súhlasím so spracovaním údajov na účel odpovede. <span className="text-honey">*</span>
          </Checkbox>
          <button type="submit" className="btn-primary w-full py-3.5" disabled={busy}>
            {busy && <Spinner />} Odoslať správu
          </button>
        </form>
      )}
    </div>
  );
}
