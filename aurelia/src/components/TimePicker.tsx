import { useMemo } from "react";
import { BOOKING } from "../config";
import { SPECIALIST_BY_ID } from "../data/team";
import { dayState, findSlots, nextFree, type Req, type Slot } from "../lib/availability";
import { liveService } from "../lib/catalog";
import { addDays, capitalize, formatDateLong, fromISODate, minutesToTime } from "../lib/format";
import { relativeDay } from "../lib/hours";
import type { DB } from "../lib/store";
import CalendarPicker from "./CalendarPicker";
import { Clock, Moon, Sparkles, Sun, Sunset } from "./icons";
import { Avatar } from "./ui";

/**
 * Month calendar plus the free start times of the chosen day. Used for new bookings and for rescheduling; the times
 * come straight from the booking engine, so they respect shifts, absences, other clients and clean-up time.
 */
export default function TimePicker({
  reqs,
  db,
  now,
  date,
  slot,
  onChange,
  excludeId,
  onWaitlist,
}: {
  reqs: Req[];
  db: DB;
  now: Date;
  date: string;
  slot: Slot | null;
  onChange: (date: string, slot: Slot | null) => void;
  excludeId?: string;
  onWaitlist?: () => void;
}) {
  const slots = useMemo(() => (date ? findSlots(date, reqs, db, now, { excludeId }) : []), [date, reqs, db, now, excludeId]);
  const nearest = useMemo(() => nextFree(reqs, db, now), [reqs, db, now]);
  const groups = [
    { label: "Dopoludnie", icon: Sun, list: slots.filter((s) => s.start < 12 * 60) },
    { label: "Popoludnie", icon: Sunset, list: slots.filter((s) => s.start >= 12 * 60 && s.start < 17 * 60) },
    { label: "Večer", icon: Moon, list: slots.filter((s) => s.start >= 17 * 60) },
  ].filter((g) => g.list.length);
  const sameSlot = (a: Slot, b: Slot | null) => !!b && a.start === b.start && a.parts.every((p, i) => p.specialistId === b.parts[i]?.specialistId);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
      <div>
        {nearest && (
          <button
            type="button"
            onClick={() => onChange(nearest.iso, nearest.slot)}
            className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft/50 px-4 py-3 text-left text-sm transition-colors hover:bg-gold-soft"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-white">
              <Sparkles size={17} />
            </span>
            <span>
              <span className="block text-mute">Najbližší voľný termín</span>
              <span className="font-medium text-plum">
                {capitalize(relativeDay(fromISODate(nearest.iso), now))} o {minutesToTime(nearest.slot.start)}
              </span>
            </span>
          </button>
        )}
        <CalendarPicker
          value={date}
          onChange={(iso) => onChange(iso, null)}
          dayState={(d) => dayState(d, reqs, db, now)}
          minMonth={new Date(now.getFullYear(), now.getMonth(), 1)}
          maxMonth={addDays(now, BOOKING.horizonDays)}
        />
      </div>

      <div className="min-w-0">
        {!date ? (
          <div className="grid h-full min-h-48 place-items-center rounded-2xl border border-dashed border-line p-6 text-center text-sm text-mute">Vyberte deň v kalendári a ukážeme voľné časy.</div>
        ) : (
          <>
            <p className="font-display text-2xl font-medium text-plum">{capitalize(formatDateLong(fromISODate(date)))}</p>
            <p className="mt-1 text-sm text-mute">
              {slots.length ? `${slots.length} voľných začiatkov` : "Na tento deň už nie je voľný čas pre vybrané služby."}
            </p>
            {!slots.length && onWaitlist && (
              <div className="mt-5 rounded-2xl bg-blush p-5">
                <p className="font-medium text-plum">Chcete sa zapísať na čakaciu listinu?</p>
                <p className="mt-1 text-sm text-soft">Keď sa niekto odhlási, ozveme sa vám ako prvej. Uvoľní sa približne každý piaty termín.</p>
                <button type="button" onClick={onWaitlist} className="btn-primary mt-4 py-2.5">
                  <Clock size={16} /> Zapísať sa
                </button>
              </div>
            )}
            <div className="mt-5 space-y-6">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-mute">
                    <g.icon size={14} /> {g.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {g.list.map((s) => (
                      <button
                        key={`${s.start}-${s.parts.map((p) => p.specialistId).join()}`}
                        type="button"
                        onClick={() => onChange(date, s)}
                        aria-pressed={sameSlot(s, slot)}
                        className={`rounded-xl border px-2 py-2.5 text-[15px] tabular-nums transition-colors ${
                          sameSlot(s, slot) ? "border-plum bg-plum font-medium text-ivory" : "border-line bg-paper hover:border-plum/40"
                        }`}
                      >
                        {minutesToTime(s.start)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {slot && <SlotTimeline slot={slot} reqs={reqs} db={db} className="mt-6" />}
      </div>
    </div>
  );
}

/** Who does what and when, for a chosen slot. */
export function SlotTimeline({ slot, reqs, db, className = "" }: { slot: Slot; reqs: Req[]; db: DB; className?: string }) {
  return (
    <ol className={`relative space-y-3 rounded-2xl border border-line bg-paper p-4 ${className}`}>
      {slot.parts.map((p, i) => {
        const person = SPECIALIST_BY_ID.get(p.specialistId);
        const service = liveService(reqs[i].serviceId, db.serviceOverrides);
        return (
          <li key={i} className="flex items-center gap-3">
            <Avatar id={p.specialistId} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{service.name}</p>
              <p className="text-xs text-mute">
                {person?.firstName} · {minutesToTime(p.start)} – {minutesToTime(p.end)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
