import { useState, type FormEvent } from "react";
import { ChevronDown, Clock, External, Instagram, Mail, MapPin, Phone } from "../components/icons";
import { Spinner } from "../components/Payment";
import { Checkbox, PageHero, Reveal, SectionHeading, SelectField, StatusDot, TextArea, TextField } from "../components/ui";
import { SALON } from "../config";
import { FAQ } from "../data/content";
import { capitalize, formatDateLong, isEmail, minutesToTime, uid } from "../lib/format";
import { hoursRows, openStatus, upcomingSpecialDays } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { updateDB } from "../lib/store";

const TOPICS = ["Všeobecná otázka", "Rezervácia", "Svadba", "Darček", "Spolupráca", "Pochvala alebo sťažnosť"];

export default function ContactPage() {
  usePageMeta("Kontakt a otváracie hodiny", `${SALON.street}, ${SALON.city}. Otváracie hodiny, mapa, parkovanie a kontakt na salón Aurelia.`);
  const now = useNow();
  const status = openStatus(now);
  const specials = upcomingSpecialDays(now, 75);
  const [mapLoaded, setMapLoaded] = useState(false);
  const destination = encodeURIComponent(`${SALON.street}, ${SALON.zip} ${SALON.city}`);
  const bbox = [SALON.lng - 0.006, SALON.lat - 0.003, SALON.lng + 0.006, SALON.lat + 0.003].join(",");

  return (
    <>
      <PageHero
        eyebrow="Kontakt"
        photo="interior2"
        title={
          <>
            Tešíme sa na vás <em className="font-normal text-gold-soft">na Palisádach.</em>
          </>
        }
        text="Prvé poschodie, zvonček s monogramom. Káva je vždy pripravená."
      >
        <p className="mt-8 inline-flex items-center gap-3 rounded-full bg-ivory/10 px-4 py-2 text-sm backdrop-blur-sm">
          <StatusDot tone={status.open ? (status.closingSoon ? "warn" : "ok") : "off"} />
          <span className="font-medium">{status.label}</span>
          <span className="text-ivory/60">{status.detail}</span>
        </p>
      </PageHero>

      <section className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="space-y-4">
          {[
            { icon: MapPin, label: "Adresa", value: `${SALON.street}, ${SALON.zip} ${SALON.city}`, href: `https://www.google.com/maps/dir/?api=1&destination=${destination}` },
            { icon: Phone, label: "Recepcia", value: SALON.phone, href: SALON.phoneHref },
            { icon: Mail, label: "E-mail", value: SALON.email, href: `mailto:${SALON.email}` },
            { icon: Instagram, label: "Instagram", value: `@${SALON.instagram}`, href: `https://instagram.com/${SALON.instagram}` },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 50}>
              <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="card group flex items-center gap-5 p-5 hover:border-ink/25">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-plum text-gold-soft">
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

        <Reveal delay={80} className="card p-6 sm:p-8">
          <h2 id="otvaracie-hodiny" className="flex scroll-mt-28 items-center gap-3 font-display text-[2rem] font-medium text-plum">
            <Clock size={24} className="text-gold" /> Otváracie hodiny
          </h2>
          <dl className="mt-6 divide-y divide-line">
            {hoursRows().map((row) => {
              const today = row.dayIndexes.includes(now.getDay());
              return (
                <div key={row.days} className={`flex items-center justify-between gap-4 py-3.5 ${today ? "font-medium text-plum" : "text-soft"}`}>
                  <dt className="flex items-center gap-2">
                    {row.days}
                    {today && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-plum">dnes</span>}
                  </dt>
                  <dd className="text-right tabular-nums">{row.hours}</dd>
                </div>
              );
            })}
          </dl>
          {specials.length > 0 && (
            <div className="mt-6 rounded-2xl bg-gold-soft/60 p-4">
              <p className="text-sm font-medium text-plum">Sviatky a zmeny</p>
              <ul className="mt-2 space-y-1 text-sm text-plum/80">
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
          <p className="mt-6 text-sm text-mute">Online rezervácia funguje nonstop, aj keď máme zatvorené.</p>
        </Reveal>
      </section>

      <section id="mapa" className="scroll-mt-20 bg-paper py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div className="relative overflow-hidden rounded-[2rem] bg-blush">
            {mapLoaded ? (
              <iframe
                title={`Mapa: ${SALON.fullName}`}
                className="aspect-[4/3] w-full border-0 lg:h-full"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${SALON.lat},${SALON.lng}`}
              />
            ) : (
              <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 p-6 text-center lg:h-full">
                <svg className="absolute inset-0 size-full text-rose/60" aria-hidden="true">
                  <defs>
                    <pattern id="map-grid" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
                      <path d="M0 28h56M28 0v56" stroke="currentColor" strokeWidth="8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#map-grid)" />
                </svg>
                <span className="relative grid size-14 place-items-center rounded-full bg-plum text-gold-soft shadow-lg">
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
                { t: "Pešo", d: "2 minúty od Bratislavského hradu, 5 minút z Hlavného námestia." },
                { t: "MHD", d: "Električky 4 a 9, zastávka Kapucínska, odtiaľ 2 minúty pešo." },
                { t: "Autom", d: "Garáž Kapitulská (4 min) alebo modrá zóna na Palisádach. Pri návšteve nad 2 hodiny vám parkovanie preplatíme." },
                { t: "S kočíkom", d: "Výťah z dvora, kočík odložíte priamo v salóne." },
              ].map((row) => (
                <div key={row.t} className="grid grid-cols-[90px_1fr] gap-4">
                  <dt className="font-medium text-plum">{row.t}</dt>
                  <dd className="font-light text-soft">{row.d}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap gap-2">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`} target="_blank" rel="noreferrer" className="btn-outline py-2.5">
                Google Maps <External size={14} />
              </a>
              <a href={`https://waze.com/ul?ll=${SALON.lat},${SALON.lng}&navigate=yes`} target="_blank" rel="noreferrer" className="btn-outline py-2.5">
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
        <div id="faq" className="scroll-mt-28">
          <SectionHeading eyebrow="Časté otázky" title="Na čo sa klientky pýtajú" />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-1">
                <summary className="flex list-none items-center justify-between gap-4 py-4 text-[17px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown size={20} className="shrink-0 text-mute transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 pr-8 font-light leading-relaxed text-soft">{item.a}</p>
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
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: TOPICS[0], message: "" });
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
    updateDB((db) => ({ ...db, messages: [{ id: uid(), ...form, phone: form.phone || undefined, createdAt: Date.now(), read: false }, ...db.messages] }));
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="card p-6 sm:p-8">
      {sent ? (
        <div className="py-10 text-center">
          <p className="font-display text-4xl font-medium text-plum">Ďakujeme, {form.name.split(" ")[0]}!</p>
          <p className="mt-2 text-soft">Odpovieme do 24 hodín na {form.email}. (Ukážka: správa sa nikam neposiela, ale uvidíte ju v administrácii.)</p>
          <button
            type="button"
            className="btn-outline mt-6"
            onClick={() => {
              setSent(false);
              setForm({ name: "", email: "", phone: "", topic: TOPICS[0], message: "" });
              setConsent(false);
            }}
          >
            Napísať ďalšiu správu
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <h2 className="font-display text-[2rem] font-medium text-plum">Napíšte nám</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Meno" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
            <TextField label="E-mail" required type="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Telefón" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
            <SelectField label="Téma" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </SelectField>
          </div>
          <TextArea label="Správa" required rows={5} value={form.message} error={errors.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Checkbox checked={consent} onChange={setConsent} error={errors.consent}>
            Súhlasím so spracovaním údajov na účel odpovede. <span className="text-gold">*</span>
          </Checkbox>
          <button type="submit" className="btn-primary w-full py-3.5" disabled={busy}>
            {busy && <Spinner />} Odoslať správu
          </button>
        </form>
      )}
    </div>
  );
}
