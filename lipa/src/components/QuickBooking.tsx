import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { BOOKING_DAYS_AHEAD, MAX_ONLINE_GUESTS, dayUnavailableReason, slotsWithState } from "../lib/availability";
import { WEEKDAYS_SHORT, addDays, formatDateShort, guestsLabel, startOfDay, toISODate } from "../lib/format";
import { useNow } from "../lib/hooks";
import { useDB } from "../lib/store";
import { ArrowRight, Calendar, Clock, Users } from "./icons";

/** Hero widget: party size, day and time, then straight into the booking flow with everything filled in. */
export default function QuickBooking() {
  const db = useDB();
  const now = useNow(60_000);
  const navigate = useNavigate();
  const [guests, setGuests] = useState(2);

  const days = useMemo(() => {
    const out: { iso: string; label: string }[] = [];
    for (let i = 0; i < Math.min(14, BOOKING_DAYS_AHEAD) && out.length < 10; i++) {
      const d = addDays(startOfDay(now), i);
      if (dayUnavailableReason(d, now)) continue;
      const iso = toISODate(d);
      if (i === 0 && !slotsWithState(iso, 2, db, now).some((s) => s.state !== "closed")) continue;
      out.push({ iso, label: i === 0 ? "Dnes" : i === 1 ? "Zajtra" : `${WEEKDAYS_SHORT[d.getDay()]} ${formatDateShort(d)}` });
    }
    return out;
  }, [now, db]);

  const [date, setDate] = useState(() => days[0]?.iso ?? "");
  const slots = useMemo(() => (date ? slotsWithState(date, guests, db, now).filter((s) => s.state !== "closed") : []), [date, guests, db, now]);
  const [time, setTime] = useState("");
  const preferred = slots.find((s) => s.time === time && s.state !== "full") ?? slots.find((s) => s.time >= "19:00" && s.state !== "full") ?? slots.find((s) => s.state !== "full");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ hostia: String(guests), datum: date });
    if (preferred) params.set("cas", preferred.time);
    navigate(`/rezervacia?${params}`);
  };

  const selectClass =
    "w-full appearance-none rounded-xl border border-cream/15 bg-cream/[0.07] py-3 pl-10 pr-3 text-[15px] text-cream outline-none transition-colors hover:border-cream/35 focus:border-honey [&>option]:text-ink";

  return (
    <form onSubmit={submit} className="rounded-3xl border border-cream/15 bg-night/55 p-4 backdrop-blur-xl sm:p-5" aria-label="Rýchla rezervácia">
      <p className="mb-3 flex items-center justify-between text-sm text-cream/80">
        <span className="font-medium text-cream">Rezervácia stola</span>
        <span className="text-xs text-cream/50">potvrdenie ihneď</span>
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[0.85fr_1fr_1fr_auto]">
        <label className="relative">
          <span className="sr-only">Počet hostí</span>
          <Users size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/50" />
          <select className={selectClass} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {Array.from({ length: MAX_ONLINE_GUESTS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {guestsLabel(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="relative">
          <span className="sr-only">Dátum</span>
          <Calendar size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/50" />
          <select className={selectClass} value={date} onChange={(e) => setDate(e.target.value)}>
            {days.map((d) => (
              <option key={d.iso} value={d.iso}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="relative col-span-2 sm:col-span-1">
          <span className="sr-only">Čas</span>
          <Clock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/50" />
          <select className={selectClass} value={preferred?.time ?? ""} onChange={(e) => setTime(e.target.value)} disabled={!slots.length}>
            {!slots.length && <option value="">Plno</option>}
            {slots.map((s) => (
              <option key={s.time} value={s.time} disabled={s.state === "full"}>
                {s.time}
                {s.state === "full" ? " · plno" : ""}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-honey col-span-2 py-3 sm:col-span-1">
          Nájsť stôl <ArrowRight size={17} />
        </button>
      </div>
    </form>
  );
}
