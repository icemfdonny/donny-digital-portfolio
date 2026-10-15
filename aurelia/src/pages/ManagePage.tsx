import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppointmentCard, { CalendarButtons } from "../components/AppointmentCard";
import { STATUS_LABEL } from "../lib/labels";
import { Alert, ArrowRight, Calendar, Clock, Pencil, Phone, Refresh, Star, X } from "../components/icons";
import TimePicker from "../components/TimePicker";
import { useToast } from "../components/toast";
import { Dialog, SelectField, TextArea, TextField } from "../components/ui";
import { BOOKING, SALON } from "../config";
import { cancelAppointment, rescheduleAppointment, slotStillFree, updateNote } from "../lib/actions";
import { effectiveStatus, type Req, type Slot } from "../lib/availability";
import { capitalize, formatClock, formatDateLong, formatPrice, fromISODate, minutesToTime } from "../lib/format";
import { useNow, usePageMeta } from "../lib/hooks";
import { canCancelFree, hoursUntil } from "../lib/loyalty";
import { useDB } from "../lib/store";
import type { Appointment } from "../lib/types";
import { useVisit } from "../lib/visit";

export default function ManagePage() {
  const { code = "" } = useParams();
  usePageMeta(`Rezervácia ${code.toUpperCase()}`);
  const db = useDB();
  const appt = db.appointments.find((a) => a.code === code.toUpperCase());
  if (!appt) return <Lookup code={code} />;
  return <Manage appt={appt} />;
}

function Lookup({ code }: { code: string }) {
  const db = useDB();
  const navigate = useNavigate();
  const [value, setValue] = useState(code.toUpperCase());
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(code ? "Rezerváciu s týmto kódom sme nenašli." : null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = db.appointments.find((a) => a.code === value.trim().toUpperCase() && (!email || a.email === email.trim().toLowerCase()));
    if (!found) {
      setError("Kód alebo e-mail nesedí. Skúste to znova alebo nám zavolajte.");
      return;
    }
    navigate(`/rezervacia/${found.code}`);
  };
  return (
    <>
      <section className="bg-plum pb-12 pt-28 text-ivory sm:pt-32">
        <div className="container-page">
          <p className="eyebrow text-gold-soft">Moja rezervácia</p>
          <h1 className="mt-3 font-display text-[2.6rem] font-medium leading-none sm:text-6xl">Nájdime váš termín</h1>
          <p className="mt-4 max-w-xl font-light text-ivory/75">Kód nájdete v potvrdzujúcom e-maile, napríklad AU-7KQ2. S účtom vidíte všetky termíny bez kódu.</p>
        </div>
      </section>
      <div className="container-page grid gap-10 py-14 lg:grid-cols-2">
        <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8" noValidate>
          <TextField label="Kód rezervácie" value={value} onChange={(e) => setValue(e.target.value)} className="uppercase" error={error} />
          <TextField label="E-mail z rezervácie" type="email" value={email} onChange={(e) => setEmail(e.target.value)} hint="Nepovinné, pre istotu." />
          <button type="submit" className="btn-primary w-full">
            Zobraziť rezerváciu <ArrowRight size={16} />
          </button>
        </form>
        <div className="space-y-4 lg:pt-4">
          <Link to="/ucet" className="card flex items-center gap-4 p-5 hover:border-plum/30">
            <Calendar className="text-gold" />
            <span className="flex-1">
              <span className="block font-medium text-plum">Prihlásiť sa do účtu</span>
              <span className="text-sm text-soft">Všetky termíny, história a body na jednom mieste.</span>
            </span>
            <ArrowRight size={16} />
          </Link>
          <a href={SALON.phoneHref} className="card flex items-center gap-4 p-5 hover:border-plum/30">
            <Phone className="text-gold" />
            <span className="flex-1">
              <span className="block font-medium text-plum">{SALON.phone}</span>
              <span className="text-sm text-soft">Radšej telefonicky? Recepcia počas otváracích hodín.</span>
            </span>
          </a>
        </div>
      </div>
    </>
  );
}

function countdown(a: Appointment, now: Date) {
  const hours = hoursUntil(a, now);
  if (hours < 1) return `o ${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 24) return `o ${Math.round(hours)} h`;
  const days = Math.floor(hours / 24);
  return `o ${days} ${days === 1 ? "deň" : days < 5 ? "dni" : "dní"}`;
}

function deadlineLabel(a: Appointment) {
  const d = fromISODate(a.date);
  d.setMinutes(a.start);
  d.setHours(d.getHours() - BOOKING.freeCancelHours);
  return `${formatDateLong(d)} ${formatClock(d)}`;
}

const REASONS = ["Zmena plánov", "Som chorá", "Pracovné povinnosti", "Rezervovala som omylom", "Iný dôvod"];

function Manage({ appt }: { appt: Appointment }) {
  const db = useDB();
  const now = useNow(30_000);
  const toast = useToast();
  const navigate = useNavigate();
  const { replace } = useVisit();
  const status = effectiveStatus(appt, now);
  const upcoming = status === "confirmed";
  const free = canCancelFree(appt, now);
  const [moving, setMoving] = useState(false);
  const [anyone, setAnyone] = useState(false);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(appt.note);
  const [rating, setRating] = useState(0);

  const reqs: Req[] = useMemo(
    () => appt.items.map((i) => ({ serviceId: i.serviceId, variantId: i.variantId, specialistId: anyone ? "any" : i.specialistId })),
    [appt.items, anyone],
  );

  const confirmMove = () => {
    if (!slot) return;
    if (!slotStillFree(date, reqs, slot, new Date(), appt.id)) {
      toast("Tento čas medzitým obsadili, vyberte iný.", "info");
      setSlot(null);
      return;
    }
    rescheduleAppointment(appt, date, slot, now, "client");
    setMoving(false);
    setSlot(null);
    setDate("");
    toast(<>Presunuté na {formatDateLong(fromISODate(date))} o {minutesToTime(slot.start)}</>);
  };

  const bookAgain = () => {
    replace(appt.items.map((i) => ({ serviceId: i.serviceId, variantId: i.variantId, specialistId: i.specialistId })));
    navigate("/rezervacia");
  };

  return (
    <>
      <section className="bg-plum pb-12 pt-28 text-ivory sm:pt-32">
        <div className="container-page flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-gold-soft">Rezervácia {appt.code}</p>
            <h1 className="mt-3 font-display text-[2.6rem] font-medium leading-none sm:text-6xl">
              {status === "cancelled" ? "Termín je zrušený" : status === "completed" ? "Ďakujeme za návštevu" : status === "noshow" ? "Na termíne ste neboli" : `Vidíme sa ${countdown(appt, now)}`}
            </h1>
            <p className="mt-4 font-light text-ivory/75">
              {capitalize(formatDateLong(fromISODate(appt.date)))} o {minutesToTime(appt.start)} · {appt.clientName}
            </p>
          </div>
          <span className="rounded-full bg-ivory/10 px-4 py-2 text-sm">{STATUS_LABEL[status]}</span>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {moving ? (
            <div className="card p-5 sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-3xl font-medium text-plum">Nový termín</h2>
                <label className="flex items-center gap-2 text-sm text-soft">
                  <input type="checkbox" className="size-4 accent-plum" checked={anyone} onChange={(e) => setAnyone(e.target.checked)} /> Môže to byť aj iná špecialistka
                </label>
              </div>
              <TimePicker
                reqs={reqs}
                db={db}
                now={now}
                date={date}
                slot={slot}
                excludeId={appt.id}
                onChange={(d, s) => {
                  setDate(d);
                  setSlot(s);
                }}
              />
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                <button type="button" className="btn-primary" disabled={!slot} onClick={confirmMove}>
                  {slot ? `Presunúť na ${formatDateLong(fromISODate(date))}, ${minutesToTime(slot.start)}` : "Vyberte nový čas"}
                </button>
                <button type="button" className="btn-outline" onClick={() => setMoving(false)}>
                  Ponechať pôvodný
                </button>
              </div>
            </div>
          ) : (
            <AppointmentCard appt={appt} status={status} />
          )}

          {appt.stylistNote && (
            <div className="rounded-2xl bg-blush/70 p-5 text-sm">
              <p className="font-medium text-plum">Poznámka od špecialistky</p>
              <p className="mt-1 leading-relaxed text-soft">{appt.stylistNote}</p>
            </div>
          )}

          {status === "completed" && (
            <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium text-plum">Ako ste boli spokojná?</p>
                <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Hodnotenie">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={rating === i}
                      aria-label={`${i} z 5`}
                      onClick={() => {
                        setRating(i);
                        toast("Ďakujeme za hodnotenie!");
                      }}
                      className={i <= rating ? "text-gold" : "text-line hover:text-gold/60"}
                    >
                      <Star size={26} />
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="btn-primary" onClick={bookAgain}>
                <Refresh size={16} /> Rezervovať znova
              </button>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-plum">Poznámka pre salón</p>
              {upcoming && !editing && (
                <button type="button" className="inline-flex items-center gap-1.5 text-sm text-soft hover:text-ink" onClick={() => setEditing(true)}>
                  <Pencil size={14} /> Upraviť
                </button>
              )}
            </div>
            {editing ? (
              <div className="mt-3 space-y-3">
                <TextArea label="Poznámka" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary py-2.5"
                    onClick={() => {
                      updateNote(appt, note.trim(), now);
                      setEditing(false);
                      toast("Poznámka je uložená.");
                    }}
                  >
                    Uložiť
                  </button>
                  <button type="button" className="btn-outline py-2.5" onClick={() => setEditing(false)}>
                    Zrušiť
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-soft">{appt.note || "Bez poznámky."}</p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {upcoming && (
            <div className="card p-5">
              <p className="font-medium text-plum">Zmena alebo zrušenie</p>
              {free ? (
                <p className="mt-1 text-sm text-soft">
                  Bezplatne do {deadlineLabel(appt)}.
                </p>
              ) : (
                <p className="mt-1 flex gap-2 text-sm text-soft">
                  <Alert size={16} className="mt-0.5 shrink-0 text-gold" /> Menej ako {BOOKING.freeCancelHours} h do termínu. Presun nám prosím zavolajte{appt.depositPaid ? ", pri zrušení záloha prepadá" : ""}.
                </p>
              )}
              <div className="mt-4 space-y-2">
                <button type="button" className="btn-primary w-full" disabled={!free || moving} onClick={() => setMoving(true)}>
                  <Clock size={16} /> Presunúť termín
                </button>
                <button type="button" className="btn-outline w-full" onClick={() => setCancelOpen(true)}>
                  <X size={16} /> Zrušiť termín
                </button>
                {!free && (
                  <a href={SALON.phoneHref} className="btn w-full text-soft hover:text-ink">
                    <Phone size={16} /> {SALON.phone}
                  </a>
                )}
              </div>
            </div>
          )}
          {upcoming && (
            <div className="card p-5">
              <p className="mb-3 font-medium text-plum">Pridať do kalendára</p>
              <CalendarButtons appt={appt} />
            </div>
          )}
          <div className="card p-5">
            <p className="font-medium text-plum">História</p>
            <ol className="mt-3 space-y-3 border-l border-line pl-4 text-sm">
              {[...appt.log].reverse().map((l, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-gold" />
                  <p className="text-ink">{l.text}</p>
                  <p className="text-xs text-mute">
                    {formatDateLong(new Date(l.at))}, {formatClock(new Date(l.at))}
                  </p>
                </li>
              ))}
              {!appt.log.length && <li className="text-mute">Rezervované {formatDateLong(new Date(appt.createdAt))}</li>}
            </ol>
          </div>
        </aside>
      </div>

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Zrušiť termín?"
        size="sm"
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn-outline flex-1" onClick={() => setCancelOpen(false)}>
              Ponechať
            </button>
            <button
              type="button"
              className="btn flex-1 bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                cancelAppointment(appt, now, "client", reason);
                setCancelOpen(false);
                toast("Termín je zrušený. Uvoľnený čas ponúkneme čakacej listine.", "info");
              }}
            >
              Áno, zrušiť
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          <p className="text-sm leading-relaxed text-soft">
            {appt.depositPaid
              ? free
                ? `Zálohu ${formatPrice(appt.deposit)} vám vrátime na kartu do 3 pracovných dní.`
                : `Do termínu zostáva menej ako ${BOOKING.freeCancelHours} hodín, záloha ${formatPrice(appt.deposit)} preto prepadá.`
              : "Zrušenie je bezplatné. Ďakujeme, že dávate vedieť, termín ponúkneme ďalšej klientke."}
          </p>
          <SelectField label="Dôvod (pomôže nám)" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectField>
        </div>
      </Dialog>
    </>
  );
}
