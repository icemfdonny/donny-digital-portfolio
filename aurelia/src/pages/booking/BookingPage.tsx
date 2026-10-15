import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Check, Clock, Lock, X } from "../../components/icons";
import { CardForm, Spinner } from "../../components/Payment";
import TimePicker from "../../components/TimePicker";
import { useToast } from "../../components/toast";
import { Avatar, Dialog, TextField } from "../../components/ui";
import { BOOKING } from "../../config";
import { SERVICE_BY_ID } from "../../data/services";
import { SPECIALIST_BY_ID } from "../../data/team";
import { createAppointment, emailTaken, register, slotStillFree } from "../../lib/actions";
import { findSlots, type Req, type Slot } from "../../lib/availability";
import { durationOf, liveService, variantOf } from "../../lib/catalog";
import { capitalize, durationLabel, formatDateLong, formatEuro, formatPrice, fromISODate, isEmail, minutesToTime, normalizePhone, uid } from "../../lib/format";
import { useNow, usePageMeta } from "../../lib/hooks";
import { quote as makeQuote } from "../../lib/loyalty";
import { emptyCard, simulatePayment, validateCard, type CardErrors } from "../../lib/payment";
import { updateDB, useAccount, useDB } from "../../lib/store";
import type { Appointment } from "../../lib/types";
import { useVisit } from "../../lib/visit";
import Confirmation from "./Confirmation";
import { emptyForm, type DetailsForm, type FormErrors } from "./form";
import StepDetails from "./StepDetails";
import StepServices from "./StepServices";
import StepSpecialists from "./StepSpecialists";

type Step = "sluzby" | "specialista" | "termin" | "udaje" | "platba";

const STEP_LABELS: Record<Step, string> = { sluzby: "Služby", specialista: "Špecialistka", termin: "Termín", udaje: "Údaje", platba: "Záloha" };

export default function BookingPage() {
  usePageMeta("Online rezervácia", "Vyberte si služby, špecialistku a voľný termín. Potvrdenie hneď, zmena alebo zrušenie jedným klikom.");
  const db = useDB();
  const account = useAccount();
  const now = useNow(60_000);
  const toast = useToast();
  const { items, add, clear } = useVisit();
  const [params, setParams] = useSearchParams();
  // Links like /rezervacia?sluzba=balayage&specialista=simona&datum=2026-10-21&cas=600 from the price list, team pages and home.
  const [initial] = useState(() => {
    const serviceId = params.get("sluzba");
    const service = serviceId ? SERVICE_BY_ID.get(serviceId) : undefined;
    const person = params.get("specialista");
    const known = person && SPECIALIST_BY_ID.has(person) ? person : null;
    const fits = !!(service && known && SPECIALIST_BY_ID.get(known)!.cats.includes(service.cat));
    const time = Number(params.get("cas"));
    return { service, variant: params.get("variant") ?? undefined, person: known, fits, date: params.get("datum") ?? "", time: Number.isFinite(time) && time > 0 ? time : null };
  });
  const [step, setStep] = useState<Step>(() => (initial.service ? (initial.fits ? "termin" : "specialista") : "sluzby"));
  const [date, setDate] = useState(initial.date);
  const [pendingStart, setPendingStart] = useState(initial.time);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState<DetailsForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [card, setCard] = useState(emptyCard);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<{ appt: Appointment; newAccount: boolean } | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [preferred, setPreferred] = useState<string | null>(initial.person);
  const top = useRef<HTMLDivElement>(null);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    if (initial.service) add(initial.service.id, initial.variant ?? initial.service.variants?.[0].id, initial.fits ? initial.person! : "any");
    if (params.size) setParams({}, { replace: true });
  }, [initial, add, params, setParams]);

  const reqs: Req[] = useMemo(() => items.map((i) => ({ serviceId: i.serviceId, variantId: i.variantId, specialistId: i.specialistId })), [items]);
  const reqKey = JSON.stringify(reqs);
  // A chosen time belongs to the services it was found for; changing the visit drops it.
  const [slotKey, setSlotKey] = useState(reqKey);
  if (slotKey !== reqKey) {
    setSlotKey(reqKey);
    setSlot(null);
  }

  // A time picked on a profile page: select it once the visit is in place.
  if (pendingStart !== null && date && reqs.length) {
    setPendingStart(null);
    const match = findSlots(date, reqs, db, now).find((x) => x.start === pendingStart);
    if (match) setSlot(match);
  }

  // Fill in details from the profile when the client signs in.
  const [filledFor, setFilledFor] = useState<string | null>(null);
  if (account && filledFor !== account.id) {
    setFilledFor(account.id);
    setForm((f) => ({ ...f, name: account.name, phone: account.phone, email: account.email, note: f.note || "", createAccount: false }));
  }

  const lines = reqs.map((r, i) => ({ serviceId: r.serviceId, variantId: r.variantId, specialistId: slot ? slot.parts[i].specialistId : r.specialistId === "any" ? null : r.specialistId }));
  const q = makeQuote({ lines, account, code: form.code, db, now, date });
  const minutes = reqs.reduce((s, r) => s + durationOf(r.serviceId, r.variantId, db.serviceOverrides), 0);
  const needsPatch = reqs.some((r) => SERVICE_BY_ID.get(r.serviceId)?.patchTest);
  const steps: Step[] = ["sluzby", "specialista", "termin", "udaje", ...(q.deposit ? (["platba"] as Step[]) : [])];
  const stepIndex = steps.indexOf(step);

  const go = (next: Step) => {
    setStep(next);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (form.name.trim().split(/\s+/).length < 2) e.name = "Meno aj priezvisko, prosím.";
    if (!normalizePhone(form.phone)) e.phone = "Skontrolujte telefónne číslo.";
    if (!isEmail(form.email)) e.email = "Zadajte platný e-mail.";
    if (needsPatch && !form.patchTest) e.patchTest = "Vyberte jednu možnosť.";
    if (!account && form.createAccount && !emailTaken(form.email) && form.password.length < 6) e.password = "Heslo musí mať aspoň 6 znakov.";
    if (!form.terms) e.terms = "Bez súhlasu so storno podmienkami nemôžeme rezerváciu potvrdiť.";
    return e;
  };

  const finish = (depositPaid: boolean) => {
    if (!slot) return;
    if (!slotStillFree(date, reqs, slot, now)) {
      toast("Tento čas medzitým niekto obsadil. Vyberte, prosím, iný.", "info");
      setSlot(null);
      go("termin");
      return;
    }
    let owner = account;
    let newAccount = false;
    if (!owner && form.createAccount && !emailTaken(form.email)) {
      owner = register({ name: form.name, email: form.email, phone: normalizePhone(form.phone)!, password: form.password, marketing: form.marketing }, now);
      newAccount = true;
    }
    const appt = createAppointment({
      reqs,
      date,
      slot,
      details: { name: form.name, phone: normalizePhone(form.phone)!, email: form.email, note: form.note, firstVisit: form.firstVisit, patchTest: form.patchTest || undefined },
      code: form.code,
      account: owner,
      now,
      depositPaid,
    });
    if (form.marketing) updateDB((d) => ({ ...d, newsletter: [...new Set([...d.newsletter, appt.email])] }));
    clear();
    setDone({ appt, newAccount });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    if (step === "sluzby") return items.length ? go("specialista") : toast("Vyberte aspoň jednu službu.", "info");
    if (step === "specialista") return go("termin");
    if (step === "termin") return slot ? go("udaje") : toast("Vyberte si čas.", "info");
    if (step === "udaje") {
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length) {
        toast("Skontrolujte, prosím, zvýraznené polia.", "info");
        return;
      }
      if (q.code && !q.code.ok) return toast("Kód nie je platný. Opravte ho alebo ho vymažte.", "info");
      return q.deposit ? go("platba") : finish(false);
    }
  };

  const pay = async () => {
    const e = validateCard(card);
    setCardErrors(e);
    if (Object.keys(e).length) return;
    setPaying(true);
    await simulatePayment();
    setPaying(false);
    finish(true);
  };

  if (done) return <Confirmation appt={done.appt} newAccount={done.newAccount} />;

  const cta =
    step === "udaje"
      ? q.deposit
        ? `Pokračovať k zálohe ${formatEuro(q.deposit)}`
        : "Potvrdiť rezerváciu"
      : step === "termin"
        ? "Pokračovať"
        : step === "specialista"
          ? "Vybrať termín"
          : "Pokračovať";
  const ctaDisabled = (step === "sluzby" && !items.length) || (step === "termin" && !slot);

  return (
    <>
      <section className="bg-plum pb-10 pt-28 text-ivory sm:pt-32">
        <div className="container-page">
          <p className="eyebrow text-gold-soft">Online rezervácia</p>
          <h1 className="mt-3 font-display text-[2.6rem] font-medium leading-none sm:text-6xl">Váš čas v Aurelii</h1>
          <ol className="no-scrollbar -mx-4 mt-8 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Kroky rezervácie">
            {steps.map((s, i) => {
              const reachable = i < stepIndex;
              return (
                <li key={s} className="shrink-0">
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => go(s)}
                    aria-current={s === step ? "step" : undefined}
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm transition-colors ${
                      s === step ? "bg-ivory text-plum" : reachable ? "bg-ivory/10 text-ivory hover:bg-ivory/20" : "text-ivory/45"
                    }`}
                  >
                    <span className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${s === step ? "bg-plum text-ivory" : reachable ? "bg-gold text-white" : "border border-ivory/25"}`}>
                      {reachable ? <Check size={13} strokeWidth={2.4} /> : i + 1}
                    </span>
                    {STEP_LABELS[s]}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div ref={top} className="container-page scroll-mt-24 py-10 pb-36 lg:pb-20">
        {preferred && step === "sluzby" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 pr-4">
            <Avatar id={preferred} size={40} />
            <p className="flex-1 text-sm text-soft">
              Rezervujete u <strong className="font-medium text-plum">{SPECIALIST_BY_ID.get(preferred)?.firstName}</strong>. Vyberte službu, ktorú robí.
            </p>
            <button type="button" className="rounded-full p-2 text-mute hover:bg-blush" aria-label="Zrušiť výber špecialistky" onClick={() => setPreferred(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          <div className="min-w-0">
            <h2 className="mb-6 font-display text-3xl font-medium text-plum">
              {
                {
                  sluzby: "Čo si doprajete?",
                  specialista: "U koho?",
                  termin: "Kedy sa vám hodí?",
                  udaje: "Posledný krok",
                  platba: "Záloha a potvrdenie",
                }[step]
              }
            </h2>
            {step === "sluzby" && <StepServices db={db} preferred={preferred} />}
            {step === "specialista" && <StepSpecialists db={db} account={account} />}
            {step === "termin" && (
              <TimePicker
                reqs={reqs}
                db={db}
                now={now}
                date={date}
                slot={slot}
                onChange={(d, s) => {
                  setDate(d);
                  setSlot(s);
                }}
                onWaitlist={() => setWaitlistOpen(true)}
              />
            )}
            {step === "udaje" && <StepDetails form={form} setForm={setForm} errors={errors} account={account} needsPatch={needsPatch} quote={q} emailExists={!account && emailTaken(form.email)} />}
            {step === "platba" && (
              <div className="max-w-xl space-y-5">
                <p className="text-[15px] leading-relaxed text-soft">
                  Pri dlhších službách a návštevách nad {formatEuro(BOOKING.depositFrom)} si blokujeme čas zálohou {Math.round(BOOKING.depositShare * 100)} %. Odpočítame ju z ceny v salóne a pri zrušení do{" "}
                  {BOOKING.freeCancelHours} hodín vopred ju vrátime celú.
                </p>
                <CardForm card={card} onChange={setCard} errors={cardErrors} />
                <button type="button" className="btn-gold w-full py-4 text-base" onClick={pay} disabled={paying}>
                  {paying ? (
                    <>
                      <Spinner /> Overujeme platbu…
                    </>
                  ) : (
                    <>
                      <Lock size={17} /> Zaplatiť zálohu {formatPrice(q.deposit)}
                    </>
                  )}
                </button>
              </div>
            )}

            {stepIndex > 0 && step !== "platba" && (
              <button type="button" className="mt-8 inline-flex items-center gap-2 text-sm text-mute hover:text-ink" onClick={() => go(steps[stepIndex - 1])}>
                <ArrowLeft size={16} /> Späť
              </button>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Summary db={db} reqs={reqs} slot={slot} date={date} minutes={minutes} q={q} hasAccount={!!account} />
            {step !== "platba" && (
              <button type="button" className="btn-primary mt-4 hidden w-full py-4 text-base lg:flex" onClick={next} disabled={ctaDisabled}>
                {cta} <ArrowRight size={17} />
              </button>
            )}
          </aside>
        </div>
      </div>

      {step !== "platba" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-plum">{items.length ? formatPrice(q.total) : "Vyberte službu"}</p>
              <p className="truncate text-xs text-mute">{slot ? `${capitalize(formatDateLong(fromISODate(date)))}, ${minutesToTime(slot.start)}` : items.length ? durationLabel(minutes) : ""}</p>
            </div>
            <button type="button" className="btn-primary px-5" onClick={next} disabled={ctaDisabled}>
              {step === "udaje" ? (q.deposit ? "K zálohe" : "Potvrdiť") : "Pokračovať"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <WaitlistDialog open={waitlistOpen} onClose={() => setWaitlistOpen(false)} date={date} reqs={reqs} />
    </>
  );
}

function Summary({ db, reqs, slot, date, minutes, q, hasAccount }: { db: ReturnType<typeof useDB>; reqs: Req[]; slot: Slot | null; date: string; minutes: number; q: ReturnType<typeof makeQuote>; hasAccount: boolean }) {
  const { remove, items } = useVisit();
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <p className="font-display text-2xl font-medium text-plum">Vaša návšteva</p>
        {reqs.length > 0 && (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-mute">
            <Clock size={14} /> spolu {durationLabel(minutes)}
          </p>
        )}
      </div>
      {!reqs.length ? (
        <p className="px-5 py-8 text-center text-sm text-mute">Zatiaľ ste nevybrali žiadnu službu.</p>
      ) : (
        <ul className="divide-y divide-line">
          {reqs.map((r, i) => {
            const s = liveService(r.serviceId, db.serviceOverrides);
            const variant = variantOf(s, r.variantId);
            const who = slot ? slot.parts[i].specialistId : r.specialistId;
            return (
              <li key={items[i]?.key ?? i} className="flex items-start gap-3 px-5 py-3.5">
                <Avatar id={who} size={34} className="mt-0.5" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-mute">
                    {variant ? `${variant.label} · ` : ""}
                    {durationLabel(variant?.duration ?? s.duration)} · {who === "any" ? "ktokoľvek voľný" : SPECIALIST_BY_ID.get(who)?.firstName}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="tabular-nums text-ink">
                    {q.lines[i].approx ? "~" : ""}
                    {formatEuro(q.lines[i].price)}
                  </p>
                  {!slot && items[i] && (
                    <button type="button" className="text-xs text-mute hover:text-danger" onClick={() => remove(items[i].key)}>
                      odobrať
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {slot && (
        <div className="flex items-center gap-3 border-t border-line bg-blush/50 px-5 py-3.5 text-sm">
          <Calendar size={17} className="text-gold" />
          <span>
            <span className="font-medium text-plum">{capitalize(formatDateLong(fromISODate(date)))}</span>
            <span className="text-soft">
              {" "}
              · {minutesToTime(slot.start)} – {minutesToTime(slot.end)}
            </span>
          </span>
        </div>
      )}
      {reqs.length > 0 && (
        <div className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
          {q.discounts.map((d) => (
            <p key={d.label} className="flex justify-between gap-3 text-ok">
              <span>{d.label}</span>
              <span className="tabular-nums">−{formatPrice(d.amount)}</span>
            </p>
          ))}
          <p className="flex items-baseline justify-between pt-1">
            <span className="font-medium text-ink">Spolu</span>
            <span className="font-display text-[1.7rem] font-medium tabular-nums text-plum">{formatPrice(q.total)}</span>
          </p>
          {q.deposit > 0 && <p className="text-xs text-mute">Záloha {formatPrice(q.deposit)} pri rezervácii, zvyšok v salóne.</p>}
          {!slot && q.lines.some((l) => l.approx) && <p className="text-xs text-mute">~ Presná cena závisí od úrovne stylistky, uvidíte ju po výbere času.</p>}
          <p className="pt-1 text-xs text-gold">
            {hasAccount ? `Za návštevu získate ${q.points} bodov.` : `S účtom by ste za túto návštevu získali ${q.points} bodov.`}
          </p>
        </div>
      )}
    </div>
  );
}

function WaitlistDialog({ open, onClose, date, reqs }: { open: boolean; onClose: () => void; date: string; reqs: Req[] }) {
  const account = useAccount();
  const toast = useToast();
  const db = useDB();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && account) {
      setName(account.name);
      setPhone(account.phone);
      setEmail(account.email);
    }
  }
  const person = reqs.find((r) => r.specialistId !== "any")?.specialistId ?? "any";
  const submit = () => {
    if (name.trim().length < 3 || !normalizePhone(phone) || !isEmail(email)) {
      setError("Vyplňte meno, telefón a e-mail.");
      return;
    }
    updateDB((d) => ({
      ...d,
      waitlist: [
        ...d.waitlist,
        {
          id: uid(),
          date,
          services: reqs.map((r) => liveService(r.serviceId, db.serviceOverrides).name).join(", "),
          specialistId: person,
          name: name.trim(),
          phone: normalizePhone(phone)!,
          email: email.trim(),
          createdAt: Date.now(),
          status: "waiting",
        },
      ],
    }));
    toast("Ste na čakacej listine. Ozveme sa, keď sa uvoľní miesto.");
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Čakacia listina"
      size="sm"
      footer={
        <button type="button" className="btn-primary w-full" onClick={submit}>
          Zapísať sa na {date ? formatDateLong(fromISODate(date)) : "tento deň"}
        </button>
      }
    >
      <div className="space-y-4 p-6">
        <p className="text-sm text-soft">Keď niekto zruší termín, pošleme SMS najprv vám. Na odpoveď máte dve hodiny.</p>
        <TextField label="Meno a priezvisko" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Telefón" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
      </div>
    </Dialog>
  );
}
