import { SALON } from "../config";
import { SPECIALIST_BY_ID } from "../data/team";
import { downloadIcs, googleCalendarUrl } from "../lib/calendar";
import { capitalize, durationLabel, formatDateLong, formatPrice, fromISODate, minutesToTime } from "../lib/format";
import { calendarEvent } from "../lib/labels";
import type { Appointment, ApptStatus } from "../lib/types";
import { Calendar, Download, External, MapPin } from "./icons";
import { Avatar, QrCode } from "./ui";

/** The booking as the client sees it: what, when, with whom, how much. */
export default function AppointmentCard({ appt, status, showQr = true }: { appt: Appointment; status: ApptStatus; showQr?: boolean }) {
  const date = fromISODate(appt.date);
  const remaining = Math.max(0, appt.total - (appt.depositPaid ? appt.deposit : 0));
  return (
    <div className="print-area card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line bg-blush/40 p-5 sm:p-6">
        <div>
          <p className="eyebrow text-gold">Rezervácia {appt.code}</p>
          <p className={`mt-2 font-display text-3xl font-medium leading-tight text-plum ${status === "cancelled" ? "line-through decoration-1" : ""}`}>{capitalize(formatDateLong(date))}</p>
          <p className="mt-1 text-lg text-soft">
            {minutesToTime(appt.start)} – {minutesToTime(appt.end)} <span className="text-sm text-mute">· {durationLabel(appt.end - appt.start)}</span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-soft">
            <MapPin size={15} className="text-gold" /> {SALON.street}, {SALON.city}
          </p>
        </div>
        {showQr && (
          <div className="rounded-2xl bg-white p-2 shadow-sm">
            <QrCode value={`${window.location.origin}/rezervacia/${appt.code}`} size={104} />
          </div>
        )}
      </div>
      <ul className="divide-y divide-line">
        {appt.items.map((item, i) => {
          const person = SPECIALIST_BY_ID.get(item.specialistId);
          return (
            <li key={i} className="flex items-center gap-3.5 px-5 py-3.5 sm:px-6">
              <Avatar id={item.specialistId} size={42} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{item.name}</p>
                <p className="text-xs text-mute">
                  {person?.firstName}, {person?.role.toLowerCase()} · {minutesToTime(item.start)} – {minutesToTime(item.end)}
                </p>
              </div>
              <p className="text-sm tabular-nums text-ink">{formatPrice(item.price)}</p>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1.5 border-t border-line px-5 py-4 text-sm sm:px-6">
        {appt.discounts.map((d) => (
          <p key={d.label} className="flex justify-between text-ok">
            <span>{d.label}</span>
            <span className="tabular-nums">−{formatPrice(d.amount)}</span>
          </p>
        ))}
        <p className="flex items-baseline justify-between">
          <span className="font-medium">Spolu</span>
          <span className="font-display text-2xl font-medium tabular-nums text-plum">{formatPrice(appt.total)}</span>
        </p>
        {appt.deposit > 0 && (
          <p className="flex justify-between text-mute">
            <span>{appt.depositPaid ? "Záloha zaplatená kartou" : "Záloha"}</span>
            <span className="tabular-nums">{formatPrice(appt.deposit)}</span>
          </p>
        )}
        {appt.depositPaid && status !== "cancelled" && (
          <p className="flex justify-between text-mute">
            <span>Doplatíte v salóne</span>
            <span className="tabular-nums">{formatPrice(remaining)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function CalendarButtons({ appt }: { appt: Appointment }) {
  const event = calendarEvent(appt);
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-outline py-2.5" onClick={() => downloadIcs(event)}>
        <Download size={16} /> Apple / Outlook (.ics)
      </button>
      <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="btn-outline py-2.5">
        <Calendar size={16} /> Google kalendár <External size={14} />
      </a>
    </div>
  );
}
