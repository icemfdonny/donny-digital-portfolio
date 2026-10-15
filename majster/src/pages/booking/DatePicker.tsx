import { useMemo } from "react";
import { Clock, User } from "../../components/icons";
import { BOOKING } from "../../config";
import { holidayName, slotsFor, windowLabel, type Slot } from "../../lib/availability";
import { addDays, MONTHS_SHORT, toISODate, WEEKDAYS_SHORT } from "../../lib/format";
import { TRADE } from "../../lib/profile";
import type { EmergencyCall, Visit } from "../../lib/types";

type Busy = { visits: Visit[]; emergencies: EmergencyCall[] };

/** Day strip plus arrival windows, all computed by the availability engine. */
export function DatePicker({
  db,
  now,
  date,
  window,
  onPick,
  ignoreVisitId,
}: {
  db: Busy;
  now: Date;
  date: string | null;
  window: number | null;
  onPick: (date: string, window: number | null) => void;
  /** When rescheduling, the visit being moved does not block its own slot. */
  ignoreVisitId?: string;
}) {
  const busy = useMemo(() => ({ ...db, visits: db.visits.filter((v) => v.id !== ignoreVisitId) }), [db, ignoreVisitId]);
  const days = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Array.from({ length: BOOKING.horizonDays }, (_, i) => {
      const d = addDays(today, i);
      const slots = slotsFor(d, busy, now);
      return { d, iso: toISODate(d), slots, free: slots.filter((s) => s.bookable).length, holiday: holidayName(d) };
    });
  }, [busy, now]);
  const selected = days.find((x) => x.iso === date);

  return (
    <div>
      <div className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2" role="listbox" aria-label="Deň">
        {days.map((day) => {
          const closed = !day.slots.length;
          const tone = closed ? "bg-line" : day.free === 0 ? "bg-danger" : day.free <= 2 ? "bg-accent" : "bg-ok";
          return (
            <button
              key={day.iso}
              type="button"
              role="option"
              aria-selected={day.iso === date}
              disabled={closed || day.free === 0}
              onClick={() => onPick(day.iso, day.slots.find((s) => s.bookable)?.index ?? null)}
              title={day.holiday ?? (closed ? "Zatvorené" : day.free === 0 ? "Plne obsadené" : `${day.free} voľné okná`)}
              className={`flex w-[4.4rem] shrink-0 snap-start flex-col items-center rounded-2xl border-2 py-2.5 transition-colors disabled:opacity-40 ${
                day.iso === date ? "border-ink bg-ink text-white" : "border-line bg-paper hover:border-ink/30"
              }`}
            >
              <span className={`text-xs font-semibold ${day.iso === date ? "text-white/70" : "text-mute"}`}>{WEEKDAYS_SHORT[day.d.getDay()]}</span>
              <span className="display text-xl leading-tight">{day.d.getDate()}</span>
              <span className={`text-[11px] ${day.iso === date ? "text-white/70" : "text-mute"}`}>{MONTHS_SHORT[day.d.getMonth()]}</span>
              <span className={`mt-1.5 h-1.5 w-6 rounded-full ${tone}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-ok" /> voľno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-accent" /> posledné okná
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-danger" /> obsadené
        </span>
      </div>
      {selected && (
        <div className="mt-5 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Čas príchodu">
          {selected.slots.map((s: Slot) => {
            const tech = TRADE.crew.find((c) => c.id === s.free[0]);
            return (
              <button key={s.index} type="button" role="radio" aria-checked={window === s.index} disabled={!s.bookable} onClick={() => onPick(selected.iso, s.index)} className="option-tile items-center disabled:opacity-40">
                <Clock size={20} className="shrink-0 text-mute" />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold tabular-nums">{windowLabel(s)}</span>
                  <span className="flex items-center gap-1 text-xs text-mute">
                    {s.bookable ? (
                      <>
                        <User size={12} /> {s.free.length === 1 ? `posledný voľný technik (${tech?.name.split(" ")[0]})` : `voľní ${s.free.length} technici`}
                      </>
                    ) : s.free.length ? (
                      "už sa nedá stihnúť"
                    ) : (
                      "obsadené"
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
