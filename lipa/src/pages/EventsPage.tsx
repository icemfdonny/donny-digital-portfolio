import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Check, Clock, Download, Ticket, Users, Wine } from "../components/icons";
import { CardForm, Spinner } from "../components/Payment";
import { emptyCard, simulatePayment, validateCard, type CardErrors, type CardState } from "../lib/payment";
import { useToast } from "../components/toast";
import { Checkbox, Dialog, PageHero, Photo, QrCode, QuantityStepper, Reveal, SectionHeading, TextArea, TextField } from "../components/ui";
import { EVENT_TYPES, PACKAGES, PRIVATE_SPACES, WINE_PAIRING_PRICE } from "../data/content";
import { upcomingEvents, type LipaEvent } from "../data/events";
import { downloadIcs } from "../lib/calendar";
import { MONTHS_SHORT, WEEKDAYS_SHORT, addDays, capitalize, formatDateLong, formatPrice, isEmail, makeCode, normalizePhone, toISODate, uid } from "../lib/format";
import { useNow, usePageMeta } from "../lib/hooks";
import { updateDB, useDB } from "../lib/store";
import type { TicketPurchase } from "../lib/types";

export default function EventsPage() {
  usePageMeta("Podujatia a súkromné akcie", "Vínne večery, jazz pod lipou, večery so šéfkuchárom a súkromné akcie pre 6 až 90 hostí.");
  const db = useDB();
  const now = useNow(300_000);
  const events = useMemo(() => upcomingEvents(now, 75, 8), [now]);
  const [buying, setBuying] = useState<LipaEvent | null>(null);
  const [waitlist, setWaitlist] = useState<LipaEvent | null>(null);
  const soldFor = (e: LipaEvent) => e.sold + db.tickets.filter((t) => t.eventId === e.id).reduce((sum, t) => sum + t.qty, 0);

  return (
    <>
      <PageHero
        eyebrow="Podujatia"
        title={
          <>
            Večery, ktoré <em className="text-honey-soft">sa oplatí zažiť.</em>
          </>
        }
        text="Vínne degustácie, jazz na dvore, večery so šéfkuchárom aj kurzy. Vstupenky kúpite online a do kalendára si ich pridáte jedným klikom."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#program" className="btn-light">
            Program <ArrowRight size={17} />
          </a>
          <a href="#sukromne-akcie" className="btn-ghost-light">
            Súkromné akcie
          </a>
        </div>
      </PageHero>

      <section id="program" className="container-page scroll-mt-24 py-16 sm:py-20">
        <div className="space-y-6">
          {events.map((event, i) => {
            const sold = soldFor(event);
            const left = Math.max(0, event.capacity - sold);
            const free = event.price === 0;
            return (
              <Reveal key={event.id} delay={Math.min(i, 3) * 60}>
                <article id={event.id} className="card grid scroll-mt-28 overflow-hidden md:grid-cols-[minmax(0,360px)_1fr]">
                  <Photo name={event.photo} className="aspect-[16/10] md:aspect-auto md:h-full" labelAt="top">
                    <div className="absolute left-4 top-4 rounded-2xl bg-paper px-3.5 py-2.5 text-center shadow">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">{WEEKDAYS_SHORT[event.date.getDay()]}</p>
                      <p className="font-display text-3xl leading-none text-forest">{event.date.getDate()}</p>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-mute">{MONTHS_SHORT[event.date.getMonth()]}</p>
                    </div>
                  </Photo>
                  <div className="flex flex-col p-6 sm:p-8">
                    <p className="eyebrow text-moss">{event.kind}</p>
                    <h2 className="mt-2 font-display text-3xl text-forest">{event.title}</h2>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-soft">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={15} /> {capitalize(formatDateLong(event.date))}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={15} /> {event.time}
                      </span>
                    </p>
                    <p className="mt-4 max-w-2xl leading-relaxed text-soft">{event.lead}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {event.includes.map((inc) => (
                        <li key={inc} className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-sm text-soft">
                          <Check size={14} className="text-moss" /> {inc}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
                      <div>
                        <p className="font-display text-2xl text-forest">{free ? "Vstup voľný" : `${formatPrice(event.price)} / os.`}</p>
                        {!free && (
                          <div className="mt-2 w-48">
                            <div className="h-1.5 overflow-hidden rounded-full bg-sand">
                              <div className={`h-full rounded-full ${left === 0 ? "bg-wine" : left <= 5 ? "bg-honey" : "bg-moss"}`} style={{ width: `${(sold / event.capacity) * 100}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-mute">{left === 0 ? "Vypredané" : left <= 5 ? `Posledné ${left} miesta` : `Voľných ${left} z ${event.capacity} miest`}</p>
                          </div>
                        )}
                      </div>
                      {free ? (
                        <Link to={`/rezervacia?datum=${toISODate(event.date)}&cas=${event.time}`} className="btn-primary">
                          <Calendar size={17} /> Rezervovať stôl
                        </Link>
                      ) : left === 0 ? (
                        <button type="button" className="btn-outline" onClick={() => setWaitlist(event)}>
                          Čakacia listina
                        </button>
                      ) : (
                        <button type="button" className="btn-primary" onClick={() => setBuying(event)}>
                          <Ticket size={17} /> Kúpiť vstupenky
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <PrivateEvents />

      <TicketDialog event={buying} left={buying ? Math.max(0, buying.capacity - soldFor(buying)) : 0} onClose={() => setBuying(null)} />
      <WaitlistDialog event={waitlist} onClose={() => setWaitlist(null)} />
    </>
  );
}

function eventStart(event: LipaEvent) {
  const start = new Date(event.date);
  start.setHours(Number(event.time.slice(0, 2)), Number(event.time.slice(3)));
  return start;
}

function TicketDialog({ event, left, onClose }: { event: LipaEvent | null; left: number; onClose: () => void }) {
  const [qty, setQty] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [card, setCard] = useState<CardState>(emptyCard);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<TicketPurchase | null>(null);

  const close = () => {
    onClose();
    setTimeout(() => {
      setDone(null);
      setQty(2);
      setErrors({});
    }, 200);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!event) return;
    const found: Record<string, string> = {};
    if (name.trim().length < 3) found.name = "Na meno vystavíme vstupenky.";
    if (!isEmail(email)) found.email = "Pošleme na ňu vstupenky.";
    const foundCard = validateCard(card);
    setErrors(found);
    setCardErrors(foundCard);
    if (Object.keys(found).length || Object.keys(foundCard).length) return;
    setBusy(true);
    await simulatePayment();
    const purchase: TicketPurchase = {
      id: uid(),
      code: makeCode("TK", 5),
      eventId: event.id,
      qty: Math.min(qty, left),
      name: name.trim(),
      email: email.trim(),
      total: Math.min(qty, left) * event.price,
      createdAt: Date.now(),
    };
    updateDB((db) => ({ ...db, tickets: [...db.tickets, purchase] }));
    setBusy(false);
    setDone(purchase);
  };


  return (
    <Dialog open={!!event} onClose={close} title={done ? "Vstupenky sú vaše" : event?.title} size="md">
      {event && done ? (
        <div className="px-6 py-6">
          <div className="print-area flex flex-col items-center gap-5 rounded-2xl border border-dashed border-line bg-cream p-6 text-center sm:flex-row sm:text-left">
            <QrCode value={`LIPA:${done.code}`} size={120} />
            <div>
              <p className="eyebrow text-moss">{event.kind}</p>
              <p className="mt-1 font-display text-2xl text-forest">{event.title}</p>
              <p className="mt-1 text-sm text-soft">
                {capitalize(formatDateLong(event.date))} o {event.time} · {done.qty}× vstupenka
              </p>
              <p className="mt-2 text-sm">
                Kód <strong className="tabular-nums">{done.code}</strong> · zaplatené {formatPrice(done.total)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-soft">Vstupenky sme poslali na {done.email}. (Ukážka: e-mail sa neodosiela.)</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => downloadIcs({ title: event.title, start: eventStart(event), minutes: 150, description: `Vstupenky ${done.code}, ${done.qty}×`, uid: `lipa-${done.code}` })}
            >
              <Download size={17} /> Do kalendára
            </button>
            <button type="button" className="btn-outline" onClick={close}>
              Hotovo
            </button>
          </div>
        </div>
      ) : event ? (
        <form onSubmit={submit} noValidate className="space-y-5 px-6 py-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream p-4">
            <div>
              <p className="text-sm text-soft">
                {capitalize(formatDateLong(event.date))} · {event.time}
              </p>
              <p className="mt-0.5 text-sm text-mute">Zostáva {left} miest</p>
            </div>
            <QuantityStepper value={Math.min(qty, left)} onChange={setQty} min={1} max={Math.min(8, left)} label="Počet vstupeniek" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Meno a priezvisko" required value={name} error={errors.name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <TextField label="E-mail" required type="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <CardForm card={card} onChange={setCard} errors={cardErrors} />
          <button type="submit" className="btn-honey w-full py-4 text-base" disabled={busy}>
            {busy ? (
              <>
                <Spinner /> Overujeme platbu…
              </>
            ) : (
              <>Zaplatiť {formatPrice(Math.min(qty, left) * event.price)}</>
            )}
          </button>
        </form>
      ) : null}
    </Dialog>
  );
}

function WaitlistDialog({ event, onClose }: { event: LipaEvent | null; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  return (
    <Dialog open={!!event} onClose={onClose} title="Čakacia listina" size="sm">
      <form
        className="space-y-4 px-6 py-6"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!isEmail(email)) {
            setError("Zadajte platný e-mail.");
            return;
          }
          onClose();
          setEmail("");
          toast("Ak sa uvoľní miesto, ozveme sa vám ako prvým.");
        }}
      >
        <p className="text-soft">{event?.title} je vypredaný. Ak niekto vstupenky vráti, napíšeme vám ako prvým.</p>
        <TextField label="E-mail" type="email" value={email} error={error} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="btn-primary w-full">
          Zapísať sa
        </button>
      </form>
    </Dialog>
  );
}

function PrivateEvents() {
  const now = useNow(3_600_000);
  const [type, setType] = useState(EVENT_TYPES[0]);
  const [date, setDate] = useState(toISODate(addDays(now, 21)));
  const [guests, setGuests] = useState(16);
  const [space, setSpace] = useState(PRIVATE_SPACES[0].id);
  const [pkg, setPkg] = useState(PACKAGES[1].id);
  const [wine, setWine] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const fitting = PRIVATE_SPACES.filter((s) => guests >= s.min && guests <= s.max);
  const chosenSpace = fitting.find((s) => s.id === space) ?? fitting[0];
  const chosenPkg = PACKAGES.find((p) => p.id === pkg)!;
  const estimate = guests * (chosenPkg.price + (wine ? WINE_PAIRING_PRICE : 0)) + (chosenSpace?.fee ?? 0);
  const belowMin = chosenSpace && estimate < chosenSpace.minSpend;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (form.name.trim().length < 3) found.name = "Napíšte meno a priezvisko.";
    if (!isEmail(form.email)) found.email = "Zadajte platný e-mail.";
    if (!normalizePhone(form.phone)) found.phone = "Zadajte telefón.";
    if (!date || new Date(date) < addDays(now, 2)) found.date = "Akciu pripravíme najskôr o 3 dni.";
    if (!consent) found.consent = "Potrebujeme váš súhlas.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    const ref = makeCode("EV");
    updateDB((db) => ({
      ...db,
      inquiries: [
        {
          id: uid(),
          ref,
          type,
          date,
          guests,
          space: chosenSpace?.name ?? "Podľa dohody",
          pkg: chosenPkg.name,
          wine,
          estimate,
          name: form.name.trim(),
          company: form.company.trim() || undefined,
          email: form.email.trim(),
          phone: normalizePhone(form.phone)!,
          message: form.message.trim() || undefined,
          status: "new",
          createdAt: Date.now(),
        },
        ...db.inquiries,
      ],
    }));
    setBusy(false);
    setSent(ref);
  };

  return (
    <section id="sukromne-akcie" className="scroll-mt-20 bg-forest py-20 text-cream sm:py-28">
      <div className="container-page">
        <SectionHeading
          tone="light"
          eyebrow="Súkromné akcie"
          title={
            <>
              Oslava, firemná večera <em className="text-honey-soft">alebo svadba.</em>
            </>
          }
          text="Od 6 do 90 hostí. Vyberte si priestor a menu, odhad ceny uvidíte hneď. Ponuku na mieru pošleme do 24 hodín."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRIVATE_SPACES.map((s) => (
            <div key={s.id} className="rounded-3xl border border-cream/12 bg-cream/[0.04] p-5">
              <p className="font-display text-2xl">{s.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-honey">
                <Users size={15} /> {s.min} – {s.max} hostí
              </p>
              <p className="mt-3 text-sm text-cream/65">{s.text}</p>
              <p className="mt-3 text-xs text-cream/45">Minimálna útrata {formatPrice(s.minSpend)}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] bg-paper text-ink">
          {sent ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="grid size-16 animate-pop place-items-center rounded-full bg-moss text-cream">
                <Check size={28} />
              </span>
              <p className="mt-6 font-display text-3xl text-forest">Ďakujeme, dopyt máme!</p>
              <p className="mt-2 max-w-md text-soft">
                Číslo dopytu <strong>{sent}</strong>. Lucia, naša manažérka akcií, vám do 24 hodín pošle ponuku na mieru na {form.email}.
              </p>
              <button type="button" className="btn-outline mt-8" onClick={() => setSent(null)}>
                Poslať ďalší dopyt
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid lg:grid-cols-[1fr_360px]">
              <div className="space-y-8 p-6 sm:p-10">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ev-type" className="field-label">
                      Typ akcie
                    </label>
                    <select id="ev-type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
                      {EVENT_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <TextField label="Dátum" type="date" required value={date} min={toISODate(addDays(now, 3))} error={errors.date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="ev-guests" className="field-label">
                      Počet hostí
                    </label>
                    <span className="font-display text-2xl tabular-nums text-forest">{guests}</span>
                  </div>
                  <input id="ev-guests" type="range" min={6} max={90} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full accent-forest" />
                  <div className="flex justify-between text-xs text-mute">
                    <span>6</span>
                    <span>90</span>
                  </div>
                </div>

                <fieldset>
                  <legend className="field-label">Priestor</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PRIVATE_SPACES.map((s) => {
                      const fits = guests >= s.min && guests <= s.max;
                      const on = chosenSpace?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={!fits}
                          onClick={() => setSpace(s.id)}
                          className={`rounded-2xl border px-4 py-3 text-left transition-colors disabled:opacity-40 ${on ? "border-forest bg-forest text-cream" : "border-line hover:border-ink/30"}`}
                        >
                          <span className="block font-medium">{s.name}</span>
                          <span className={`text-sm ${on ? "text-cream/65" : "text-mute"}`}>{fits ? `${s.min} – ${s.max} hostí${s.fee ? ` · prenájom ${formatPrice(s.fee)}` : ""}` : `pre ${s.min} – ${s.max} hostí`}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="field-label">Menu</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PACKAGES.map((p) => {
                      const on = pkg === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setPkg(p.id)}
                          className={`rounded-2xl border px-4 py-3 text-left transition-colors ${on ? "border-forest bg-forest text-cream" : "border-line hover:border-ink/30"}`}
                        >
                          <span className="flex justify-between gap-3 font-medium">
                            {p.name} <span className="tabular-nums">{formatPrice(p.price)}</span>
                          </span>
                          <span className={`mt-0.5 block text-sm ${on ? "text-cream/65" : "text-mute"}`}>{p.text}</span>
                        </button>
                      );
                    })}
                  </div>
                  <label className="mt-3 flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
                    <input type="checkbox" checked={wine} onChange={(e) => setWine(e.target.checked)} className="size-4 accent-forest" />
                    <Wine size={18} className="text-wine" />
                    <span className="flex-1">Vínne párovanie od sommeliérky</span>
                    <span className="text-sm tabular-nums text-soft">+{formatPrice(WINE_PAIRING_PRICE)} / os.</span>
                  </label>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Meno a priezvisko" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <TextField label="Firma" value={form.company} hint="Nepovinné, pre faktúru" onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  <TextField label="E-mail" required type="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <TextField label="Telefón" required type="tel" value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <TextArea label="Čo by sme mali vedieť" placeholder="Program, diéty, výzdoba, vlastná torta…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="sm:col-span-2" />
                </div>
                <Checkbox checked={consent} onChange={setConsent} error={errors.consent}>
                  Súhlasím so spracovaním údajov na prípravu ponuky. <span className="text-honey">*</span>
                </Checkbox>
              </div>

              <aside className="border-t border-line bg-cream p-6 sm:p-10 lg:border-l lg:border-t-0">
                <div className="lg:sticky lg:top-24">
                  <p className="eyebrow text-moss">Orientačná cena</p>
                  <p className="mt-3 font-display text-5xl tabular-nums text-forest">{formatPrice(estimate)}</p>
                  <p className="mt-1 text-sm text-soft">približne {formatPrice(estimate / guests)} na hosťa</p>
                  <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-soft">
                        {chosenPkg.name} × {guests}
                      </dt>
                      <dd className="tabular-nums">{formatPrice(chosenPkg.price * guests)}</dd>
                    </div>
                    {wine && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-soft">Vínne párovanie × {guests}</dt>
                        <dd className="tabular-nums">{formatPrice(WINE_PAIRING_PRICE * guests)}</dd>
                      </div>
                    )}
                    {chosenSpace && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-soft">{chosenSpace.name}</dt>
                        <dd className="tabular-nums">{chosenSpace.fee ? formatPrice(chosenSpace.fee) : "bez prenájmu"}</dd>
                      </div>
                    )}
                  </dl>
                  {belowMin && (
                    <p className="mt-4 rounded-xl bg-honey-soft/70 p-3 text-sm text-forest">
                      Minimálna útrata pre priestor {chosenSpace.name} je {formatPrice(chosenSpace.minSpend)}. Rozdiel môžete doplniť nápojmi.
                    </p>
                  )}
                  {!chosenSpace && <p className="mt-4 rounded-xl bg-honey-soft/70 p-3 text-sm text-forest">Pre tento počet hostí pripravíme riešenie na mieru.</p>}
                  <button type="submit" className="btn-primary mt-6 w-full py-3.5" disabled={busy}>
                    {busy ? <Spinner /> : null} Poslať nezáväzný dopyt
                  </button>
                  <p className="mt-3 text-center text-xs text-mute">Cena je orientačná, presnú ponuku pošleme e-mailom.</p>
                </div>
              </aside>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
