import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CalendarPicker, { type DayState } from "../components/CalendarPicker";
import { ArrowLeft, ArrowRight, Accessible, Baby, Calendar, Check, Clock, Dog, Info, MapPin, Phone, Users } from "../components/icons";
import { CardForm, Spinner } from "../components/Payment";
import { emptyCard, simulatePayment, validateCard, type CardErrors, type CardState } from "../lib/payment";
import { Checkbox, PageHero, TextArea, TextField } from "../components/ui";
import { RESTAURANT } from "../config";
import {
  AREAS,
  BOOKING_DAYS_AHEAD,
  MAX_ONLINE_GUESTS,
  areaById,
  areaState,
  dayUnavailableReason,
  slotsWithState,
  type Slot,
  type SlotState,
} from "../lib/availability";
import { addDays, capitalize, formatDateLong, formatPrice, fromISODate, guestsLabel, isEmail, makeCode, normalizePhone, startOfDay, timeToMinutes, toISODate, uid } from "../lib/format";
import { dayInfo } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { updateDB, useDB } from "../lib/store";
import type { AreaId, Reservation } from "../lib/types";

const OCCASIONS = ["Narodeniny", "Výročie", "Rande", "Pracovné stretnutie", "Oslava"];
const EXTRAS = [
  { id: "stolicka", label: "Detská stolička", icon: Baby },
  { id: "bezbarierovy", label: "Bezbariérový prístup", icon: Accessible },
  { id: "pes", label: "Prídeme so psom", icon: Dog },
];

type Step = 1 | 2 | 3;

/** Adds the generated fields (id, guest-facing code, timestamp) to a booking. */
function newReservation(fields: Omit<Reservation, "id" | "code" | "createdAt">): Reservation {
  return { ...fields, id: uid(), code: makeCode("LP"), createdAt: Date.now() };
}

export default function ReservationPage() {
  usePageMeta("Rezervácia stola", "Rezervujte si stôl online s okamžitým potvrdením. Interiér, terasa pod lipou, vínny bar alebo chef's table.");
  const db = useDB();
  const now = useNow(60_000);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStepState] = useState<Step>(1);
  const setStep = (next: Step) => {
    setStepState(next);
    requestAnimationFrame(() => document.getElementById("kroky")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const [guests, setGuests] = useState(() => Math.min(MAX_ONLINE_GUESTS, Math.max(1, Number(params.get("hostia")) || 2)));
  const [date, setDate] = useState(() => {
    const fromUrl = params.get("datum");
    if (fromUrl && !dayUnavailableReason(fromISODate(fromUrl), now)) return fromUrl;
    for (let i = 0; i < 14; i++) {
      const d = addDays(startOfDay(now), i);
      if (!dayUnavailableReason(d, now) && slotsWithState(toISODate(d), 2, db, now).some((s) => s.state === "free" || s.state === "limited")) return toISODate(d);
    }
    return toISODate(now);
  });
  const [time, setTime] = useState(params.get("cas") ?? "");
  const [area, setArea] = useState<AreaId | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [consent, setConsent] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [card, setCard] = useState<CardState>(emptyCard);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [busy, setBusy] = useState(false);

  const slots = useMemo(() => slotsWithState(date, guests, db, now), [date, guests, db, now]);
  const slot = slots.find((s) => s.time === time && (s.state === "free" || s.state === "limited"));
  const minute = slot ? timeToMinutes(slot.time) : null;
  const areaStates = Object.fromEntries(AREAS.map((a) => [a.id, minute === null ? "closed" : areaState(a, date, minute, guests, db, now)])) as Record<AreaId, SlotState>;
  const chosenArea = area && (areaStates[area] === "free" || areaStates[area] === "limited") ? areaById(area) : null;
  const deposit = chosenArea?.deposit ? chosenArea.deposit * guests : 0;

  const dayState = (d: Date): DayState => {
    if (dayUnavailableReason(d, now)) return "disabled";
    const states = slotsWithState(toISODate(d), guests, db, now).map((s) => s.state);
    if (!states.some((s) => s === "free" || s === "limited")) return "full";
    return states.filter((s) => s === "free").length < 3 ? "busy" : "available";
  };

  const validateContact = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Napíšte meno a priezvisko.";
    if (!isEmail(form.email)) e.email = "Zadajte platný e-mail, pošleme naň potvrdenie.";
    if (!normalizePhone(form.phone)) e.phone = "Zadajte telefón, napr. 0905 123 456.";
    if (!consent) e.consent = "Bez súhlasu rezerváciu nemôžeme uložiť.";
    return e;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateContact();
    const foundCard = deposit ? validateCard(card) : {};
    setErrors(found);
    setCardErrors(foundCard);
    if (Object.keys(found).length || Object.keys(foundCard).length || !slot || !chosenArea) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setBusy(true);
    if (deposit) await simulatePayment();
    else await new Promise((r) => setTimeout(r, 500));
    const reservation = newReservation({
      date,
      time: slot.time,
      guests,
      area: chosenArea.id,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: normalizePhone(form.phone)!,
      occasion: occasion ?? undefined,
      note: form.note.trim() || undefined,
      extras: extras.map((x) => EXTRAS.find((o) => o.id === x)!.label),
      status: "confirmed",
      source: "web",
      deposit: deposit || undefined,
    });
    updateDB((db) => ({
      ...db,
      reservations: [...db.reservations, reservation],
      newsletter: newsletter ? [...new Set([...db.newsletter, reservation.email.toLowerCase()])] : db.newsletter,
    }));
    navigate(`/rezervacia/${reservation.code}?nova=1`);
  };

  const groups: { label: string; slots: Slot[] }[] = [
    { label: "Obed", slots: slots.filter((s) => s.minute < 15 * 60) },
    { label: "Popoludnie", slots: slots.filter((s) => s.minute >= 15 * 60 && s.minute < 17 * 60 + 30) },
    { label: "Večer", slots: slots.filter((s) => s.minute >= 17 * 60 + 30) },
  ].filter((g) => g.slots.length);
  const available = slots.filter((s) => s.state === "free" || s.state === "limited");
  const special = dayInfo(fromISODate(date)).special;

  const stepTitles = ["Termín", "Miesto", "Kontakt"];

  return (
    <>
      <PageHero
        eyebrow="Rezervácia"
        title={
          <>
            Stôl pre vás, <em className="text-honey-soft">potvrdený hneď.</em>
          </>
        }
        text={`Online rezervujeme stoly do ${MAX_ONLINE_GUESTS} osôb a ${BOOKING_DAYS_AHEAD} dní dopredu. Väčšiu skupinu radi usadíme v salóniku.`}
      />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px] lg:gap-14 lg:py-16">
        <div>
          <ol id="kroky" className="mb-10 flex scroll-mt-28 items-center gap-2 sm:gap-4" aria-label="Kroky rezervácie">
            {stepTitles.map((title, i) => {
              const n = (i + 1) as Step;
              const done = step > n;
              return (
                <li key={title} className="flex flex-1 items-center gap-2 sm:gap-3" aria-current={step === n ? "step" : undefined}>
                  <button
                    type="button"
                    disabled={n > step}
                    onClick={() => setStep(n)}
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors ${
                      step === n ? "bg-forest text-cream" : done ? "bg-moss/15 text-moss" : "bg-sand text-mute"
                    }`}
                    aria-label={`Krok ${n}: ${title}`}
                  >
                    {done ? <Check size={16} /> : n}
                  </button>
                  <span className={`text-sm font-medium ${step === n ? "text-ink" : "hidden text-mute sm:inline"}`}>{title}</span>
                  {i < 2 && <span className="h-px flex-1 bg-line" />}
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <div className="animate-rise space-y-10">
              <section aria-labelledby="guests-h">
                <h2 id="guests-h" className="font-display text-2xl text-forest">
                  Koľko vás bude?
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {Array.from({ length: MAX_ONLINE_GUESTS }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" className="chip size-12 justify-center p-0 text-base" aria-pressed={guests === n} onClick={() => setGuests(n)}>
                      {n}
                    </button>
                  ))}
                  <Link to="/podujatia#sukromne-akcie" className="ml-2 text-sm text-moss underline underline-offset-4">
                    Viac ako {MAX_ONLINE_GUESTS}?
                  </Link>
                </div>
              </section>

              <section aria-labelledby="date-h" className="grid gap-8 md:grid-cols-[minmax(0,340px)_1fr]">
                <div>
                  <h2 id="date-h" className="mb-4 font-display text-2xl text-forest">
                    Kedy?
                  </h2>
                  <CalendarPicker
                    value={date}
                    onChange={(iso) => {
                      setDate(iso);
                      setTime("");
                    }}
                    dayState={dayState}
                    minMonth={now}
                    maxMonth={addDays(now, BOOKING_DAYS_AHEAD)}
                  />
                </div>
                <div>
                  <h2 className="mb-1 font-display text-2xl text-forest">O koľkej?</h2>
                  <p className="mb-4 text-sm text-soft">
                    {capitalize(formatDateLong(fromISODate(date)))}
                    {special && <span> · {special}</span>}
                  </p>
                  {available.length === 0 ? (
                    <div className="rounded-2xl bg-sand p-5 text-sm text-soft">
                      <p className="font-medium text-ink">V tento deň je už plno.</p>
                      <p className="mt-1">
                        Skúste iný deň alebo nám zavolajte na{" "}
                        <a href={RESTAURANT.phoneHref} className="underline">
                          {RESTAURANT.phone}
                        </a>
                        , často sa uvoľní stôl na poslednú chvíľu.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {groups.map((group) => (
                        <div key={group.label}>
                          <p className="eyebrow mb-2 text-mute">{group.label}</p>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-4 xl:grid-cols-5">
                            {group.slots.map((s) => {
                              const off = s.state === "full" || s.state === "closed";
                              return (
                                <button
                                  key={s.time}
                                  type="button"
                                  disabled={off}
                                  onClick={() => setTime(s.time)}
                                  aria-pressed={time === s.time}
                                  title={s.state === "limited" ? "Posledné voľné stoly" : s.state === "full" ? "Obsadené" : undefined}
                                  className={`relative rounded-xl border py-2.5 text-sm tabular-nums transition-colors ${
                                    time === s.time
                                      ? "border-forest bg-forest font-semibold text-cream"
                                      : off
                                        ? "border-transparent bg-sand/50 text-mute/50 line-through"
                                        : "border-line bg-paper hover:border-ink/40"
                                  }`}
                                >
                                  {s.time}
                                  {s.state === "limited" && time !== s.time && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-honey" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
              <div className="flex justify-end border-t border-line pt-6">
                <button type="button" className="btn-primary px-7" disabled={!slot} onClick={() => setStep(2)}>
                  Pokračovať <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-rise space-y-10">
              <section aria-labelledby="area-h">
                <h2 id="area-h" className="font-display text-2xl text-forest">
                  Kde chcete sedieť?
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {AREAS.map((a) => {
                    const state = areaStates[a.id];
                    const off = state === "closed" || state === "full";
                    const selected = chosenArea?.id === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        disabled={off}
                        aria-pressed={selected}
                        onClick={() => setArea(a.id)}
                        className={`flex flex-col rounded-2xl border p-5 text-left transition-colors ${
                          selected ? "border-forest bg-forest text-cream" : off ? "border-line bg-sand/40 opacity-60" : "border-line bg-paper hover:border-ink/40"
                        }`}
                      >
                        <span className="flex w-full items-center justify-between gap-3">
                          <span className="font-display text-xl">{a.name}</span>
                          {selected ? (
                            <Check size={18} />
                          ) : (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                state === "free" ? "bg-[#4cbf7a]/15 text-ok" : state === "limited" ? "bg-honey-soft text-forest" : "bg-sand text-mute"
                              }`}
                            >
                              {state === "free" ? "Voľné" : state === "limited" ? "Posledné miesta" : state === "full" ? "Obsadené" : "Nedostupné"}
                            </span>
                          )}
                        </span>
                        <span className={`mt-2 text-sm leading-relaxed ${selected ? "text-cream/75" : "text-soft"}`}>{a.description}</span>
                        {a.note && <span className={`mt-3 text-xs ${selected ? "text-cream/60" : "text-mute"}`}>{a.note}</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
              <section aria-labelledby="occasion-h">
                <h2 id="occasion-h" className="font-display text-2xl text-forest">
                  Je to špeciálna príležitosť?
                </h2>
                <p className="mt-1 text-sm text-soft">Nepovinné. Radi pripravíme niečo navyše.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {OCCASIONS.map((o) => (
                    <button key={o} type="button" className="chip" aria-pressed={occasion === o} onClick={() => setOccasion(occasion === o ? null : o)}>
                      {o}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {EXTRAS.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      className="chip"
                      aria-pressed={extras.includes(x.id)}
                      onClick={() => setExtras((list) => (list.includes(x.id) ? list.filter((v) => v !== x.id) : [...list, x.id]))}
                    >
                      <x.icon size={16} /> {x.label}
                    </button>
                  ))}
                </div>
              </section>
              <div className="flex justify-between border-t border-line pt-6">
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>
                  <ArrowLeft size={17} /> Späť
                </button>
                <button type="button" className="btn-primary px-7" disabled={!chosenArea} onClick={() => setStep(3)}>
                  Pokračovať <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form className="animate-rise space-y-6" onSubmit={submit} noValidate>
              <h2 className="font-display text-2xl text-forest">Na koho napíšeme rezerváciu?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Meno a priezvisko"
                  required
                  autoComplete="name"
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="sm:col-span-2"
                />
                <TextField label="E-mail" required type="email" autoComplete="email" inputMode="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <TextField
                  label="Telefón"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="0905 123 456"
                  value={form.phone}
                  error={errors.phone}
                  hint="Zavoláme len v prípade zmeny."
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <TextArea
                  label="Poznámka pre nás"
                  placeholder="Alergie, diéty, stôl pri okne, torta…"
                  value={form.note}
                  maxLength={300}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="sm:col-span-2"
                  hint={`${form.note.length}/300`}
                />
              </div>
              {deposit > 0 && (
                <div>
                  <p className="mb-3 flex items-start gap-2 rounded-2xl bg-honey-soft/60 p-4 text-sm text-forest">
                    <Info size={18} className="mt-0.5 shrink-0" />
                    Chef's table vyžaduje zálohu {formatPrice(chosenArea!.deposit!)} na osobu, spolu {formatPrice(deposit)}. Odpočítame ju z účtu, pri zrušení do 48 hodín vopred ju vrátime.
                  </p>
                  <CardForm card={card} onChange={setCard} errors={cardErrors} />
                </div>
              )}
              <div className="space-y-3">
                <Checkbox checked={consent} onChange={setConsent} error={errors.consent}>
                  Súhlasím so spracovaním osobných údajov na účel rezervácie podľa{" "}
                  <Link to="/ochrana-sukromia" className="underline" target="_blank">
                    zásad ochrany súkromia
                  </Link>
                  . <span className="text-honey">*</span>
                </Checkbox>
                <Checkbox checked={newsletter} onChange={setNewsletter}>
                  Chcem raz mesačne dostávať novinky a pozvánky na vínne večery.
                </Checkbox>
              </div>
              <div className="flex justify-between border-t border-line pt-6">
                <button type="button" className="btn-outline" onClick={() => setStep(2)}>
                  <ArrowLeft size={17} /> Späť
                </button>
                <button type="submit" className="btn-honey px-7" disabled={busy}>
                  {busy ? (
                    <>
                      <Spinner /> {deposit ? "Overujeme platbu…" : "Ukladáme…"}
                    </>
                  ) : deposit ? (
                    <>Zaplatiť {formatPrice(deposit)} a rezervovať</>
                  ) : (
                    <>
                      Potvrdiť rezerváciu <Check size={17} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="bg-forest px-6 py-5 text-cream">
              <p className="eyebrow text-honey">Vaša rezervácia</p>
              <p className="mt-1 font-display text-2xl">{RESTAURANT.fullName}</p>
            </div>
            <dl className="divide-y divide-line px-6">
              <SummaryRow icon={<Users size={18} />} label="Hostia" value={guestsLabel(guests)} />
              <SummaryRow icon={<Calendar size={18} />} label="Dátum" value={capitalize(formatDateLong(fromISODate(date)))} />
              <SummaryRow icon={<Clock size={18} />} label="Čas" value={slot ? `${slot.time}, stôl na ${timeToMinutes(slot.time) < 15 * 60 ? "1,5 hodiny" : "2 hodiny"}` : "vyberte čas"} muted={!slot} />
              <SummaryRow icon={<MapPin size={18} />} label="Miesto" value={chosenArea?.name ?? "vyberte v ďalšom kroku"} muted={!chosenArea} />
              {deposit > 0 && <SummaryRow icon={<Info size={18} />} label="Záloha" value={formatPrice(deposit)} />}
            </dl>
          </div>
          <div className="mt-5 space-y-3 px-1 text-sm text-soft">
            <p className="flex gap-2.5">
              <Check size={17} className="mt-0.5 shrink-0 text-moss" /> Potvrdenie hneď a pripomienka deň vopred
            </p>
            <p className="flex gap-2.5">
              <Check size={17} className="mt-0.5 shrink-0 text-moss" /> Zrušenie zdarma kedykoľvek cez odkaz v e-maile
            </p>
            <p className="flex gap-2.5">
              <Phone size={17} className="mt-0.5 shrink-0 text-moss" />
              <span>
                Radšej telefonicky?{" "}
                <a href={RESTAURANT.phoneHref} className="font-medium text-ink underline underline-offset-2">
                  {RESTAURANT.phone}
                </a>
              </span>
            </p>
          </div>
          <ManageLookup />
        </aside>
      </div>
    </>
  );
}

function SummaryRow({ icon, label, value, muted }: { icon: ReactNode; label: string; value: ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <span className="text-moss">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className={`text-[15px] ${muted ? "text-mute" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

function ManageLookup() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  return (
    <form
      className="mt-8 rounded-2xl border border-line p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) navigate(`/rezervacia/${code.trim().toUpperCase()}`);
      }}
    >
      <label htmlFor="manage-code" className="text-sm font-medium">
        Už máte rezerváciu?
      </label>
      <div className="mt-2 flex gap-2">
        <input id="manage-code" className="field py-2.5 uppercase" placeholder="LP-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
        <button type="submit" className="btn-outline shrink-0 py-2.5">
          Spravovať
        </button>
      </div>
    </form>
  );
}
