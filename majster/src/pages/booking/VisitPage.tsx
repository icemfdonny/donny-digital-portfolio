import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, ArrowRight, Calendar, Check, Clock, Download, External, MapPin, Phone, Printer, User, X } from "../../components/icons";
import { useToast } from "../../components/toast";
import { ContactLink, Dialog, Initials, TextArea } from "../../components/ui";
import { BOOKING } from "../../config";
import { updateVisit } from "../../lib/actions";
import { windowLabel, windowOf } from "../../lib/availability";
import { capitalize, formatDateLong, formatPhone, fromISODate } from "../../lib/format";
import { useNow, usePageMeta } from "../../lib/hooks";
import { downloadIcs, googleCalendarUrl, windowDates } from "../../lib/ics";
import { BIZ, TRADE } from "../../lib/profile";
import { useDB } from "../../lib/store";
import NotFound from "../NotFound";
import { DatePicker } from "./DatePicker";

/** Confirmation and self-service page for a booked visit. */
export default function VisitPage() {
  const { code } = useParams();
  usePageMeta(`Termín ${code}`);
  const db = useDB();
  const now = useNow(30_000);
  const toast = useToast();
  const [moving, setMoving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pick, setPick] = useState<{ date: string | null; window: number | null }>({ date: null, window: null });
  const [reason, setReason] = useState("");
  const visit = db.visits.find((v) => v.code === code);
  if (!visit) return <NotFound />;

  const type = TRADE.visitTypes.find((t) => t.id === visit.typeId) ?? TRADE.visitTypes[0];
  const tech = TRADE.crew.find((c) => c.id === visit.techId);
  const w = windowOf(visit.date, visit.window) ?? { start: 480, end: 600 };
  const { from, to } = windowDates(visit.date, w.start, w.end);
  const hoursLeft = (from.getTime() - now.getTime()) / 3_600_000;
  const canChange = visit.status === "planned" && hoursLeft > BOOKING.freeChangeHours;
  const place = `${visit.street}, ${visit.town}`;
  const cal = { title: `${type.title} – ${BIZ.name}`, description: `Termín ${visit.code}. Technik: ${tech?.name}. Kontakt: ${BIZ.phoneLabel}`, location: place, from, to };

  return (
    <div className="bg-bg py-10 sm:py-16">
      <div className="container-page max-w-3xl">
        <div className="print-area overflow-hidden rounded-3xl bg-paper shadow-sm ring-1 ring-line">
          <div className={`flex items-center gap-4 p-6 sm:p-8 ${visit.status === "cancelled" ? "bg-sand" : "bg-ink text-white"}`}>
            <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${visit.status === "cancelled" ? "bg-paper text-mute" : "animate-pop bg-accent text-accent-ink"}`}>
              {visit.status === "cancelled" ? <X size={28} /> : <Check size={30} strokeWidth={3} />}
            </span>
            <div>
              <p className={`text-sm font-semibold ${visit.status === "cancelled" ? "text-mute" : "text-white/60"}`}>Rezervácia {visit.code}</p>
              <h1 className="display text-2xl sm:text-3xl">{visit.status === "cancelled" ? "Termín je zrušený" : visit.status === "done" ? "Návšteva prebehla" : "Termín je potvrdený"}</h1>
            </div>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <dl className="space-y-4">
              <Item icon={Calendar} label="Deň" value={capitalize(formatDateLong(fromISODate(visit.date)))} />
              <Item icon={Clock} label="Príchod" value={`medzi ${windowLabel(w)}`} />
              <Item icon={MapPin} label="Adresa" value={place} />
              <Item icon={User} label="Typ" value={`${type.title} · ${type.price}`} />
            </dl>
            <div className="rounded-2xl bg-bg p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-mute">Príde k vám</p>
              <div className="mt-3 flex items-center gap-3">
                <Initials name={tech?.name ?? "?"} className="size-12 bg-accent text-accent-ink" />
                <div>
                  <p className="font-bold">{tech?.name}</p>
                  <p className="text-sm text-soft">
                    {tech?.role} · u nás od {tech?.since}
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-soft">
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-ok" /> Deň vopred vám pošleme SMS pripomienku.
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-ok" /> 30 minút pred príchodom technik zavolá na {formatPhone(visit.phone)}.
                </li>
              </ul>
            </div>
          </div>
          {visit.status === "planned" && (
            <div className="no-print flex flex-wrap gap-2 border-t border-line px-6 py-5 sm:px-8">
              <button type="button" className="btn-outline btn-sm" onClick={() => downloadIcs({ uid: visit.code, ...cal })}>
                <Download size={16} /> Do kalendára (.ics)
              </button>
              <a className="btn-outline btn-sm" href={googleCalendarUrl(cal)} target="_blank" rel="noreferrer">
                <External size={16} /> Google kalendár
              </a>
              <button type="button" className="btn-outline btn-sm" onClick={() => window.print()}>
                <Printer size={16} /> Vytlačiť
              </button>
            </div>
          )}
        </div>

        {visit.status === "planned" && (
          <div className="no-print mt-6 rounded-3xl bg-paper p-6 ring-1 ring-line sm:p-8">
            <h2 className="display text-xl">Potrebujete zmenu?</h2>
            {canChange ? (
              <>
                <p className="mt-1 text-soft">Presunúť alebo zrušiť termín môžete zadarmo do {BOOKING.freeChangeHours} hodín pred príchodom.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-dark btn-sm" onClick={() => {
                      setPick({ date: visit.date, window: null });
                      setMoving(true);
                    }}>
                    <Calendar size={16} /> Presunúť termín
                  </button>
                  <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => setCancelling(true)}>
                    Zrušiť termín
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-2 flex items-start gap-2 text-soft">
                <Alert size={18} className="mt-0.5 shrink-0 text-warn" />
                <span>
                  Do príchodu ostáva menej ako {BOOKING.freeChangeHours} hodín. Zmenu prosím dohodnite telefonicky:{" "}
                  <ContactLink kind="tel" className="link">
                    {BIZ.phoneLabel}
                  </ContactLink>
                </span>
              </p>
            )}
          </div>
        )}
        {visit.status === "cancelled" && (
          <Link to="/obhliadka" className="btn-accent mt-6">
            Vybrať nový termín <ArrowRight size={18} />
          </Link>
        )}
        <p className="no-print mt-6 flex items-center gap-2 text-sm text-soft">
          <Phone size={16} />
          <span>
            Otázky?{" "}
            <ContactLink kind="tel" className="link">
              {BIZ.phoneLabel}
            </ContactLink>
          </span>
        </p>
      </div>

      <Dialog
        open={moving}
        onClose={() => setMoving(false)}
        title="Presunúť termín"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setMoving(false)}>
              Späť
            </button>
            <button
              type="button"
              className="btn-accent btn-sm"
              disabled={!pick.date || pick.window === null || (pick.date === visit.date && pick.window === visit.window)}
              onClick={() => {
                const nw = windowOf(pick.date!, pick.window!)!;
                updateVisit(visit.id, { date: pick.date!, window: pick.window! }, `Presunuté zákazníkom na ${formatDateLong(fromISODate(pick.date!))} ${windowLabel(nw)}`);
                setMoving(false);
                toast("Termín je presunutý. Potvrdenie sme poslali e-mailom.");
              }}
            >
              Potvrdiť nový termín
            </button>
          </div>
        }
      >
        <div className="p-5 sm:p-6">
          <DatePicker db={db} now={now} date={pick.date} window={pick.window} ignoreVisitId={visit.id} onPick={(date, window) => setPick({ date, window })} />
        </div>
      </Dialog>

      <Dialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        title="Zrušiť termín?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setCancelling(false)}>
              Ponechať
            </button>
            <button
              type="button"
              className="btn-danger btn-sm"
              onClick={() => {
                updateVisit(visit.id, { status: "cancelled" }, `Zrušené zákazníkom${reason.trim() ? `: ${reason.trim()}` : ""}`);
                setCancelling(false);
                toast("Termín je zrušený.", "info");
              }}
            >
              Zrušiť termín
            </button>
          </div>
        }
      >
        <div className="p-5 sm:p-6">
          <TextArea label="Dôvod (nepovinné)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Pomôže nám to plánovať lepšie." />
        </div>
      </Dialog>
    </div>
  );
}

function Item({ icon: I, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-deep">
        <I size={19} />
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</dt>
        <dd className="font-bold">{value}</dd>
      </div>
    </div>
  );
}
