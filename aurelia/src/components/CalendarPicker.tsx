import { useState } from "react";
import { MONTHS, WEEKDAYS_SHORT, formatDateLong, toISODate } from "../lib/format";
import type { DayState } from "../lib/availability";
import { ChevronLeft, ChevronRight } from "./icons";

/** Month view, Monday first, with keyboard-friendly day buttons. */
export default function CalendarPicker({
  value,
  onChange,
  dayState,
  minMonth,
  maxMonth,
}: {
  value: string;
  onChange: (iso: string) => void;
  dayState: (date: Date) => DayState;
  minMonth: Date;
  maxMonth: Date;
}) {
  const initial = value ? new Date(`${value}T00:00:00`) : minMonth;
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  // Follow the value when it is set from outside, e.g. by "nearest free time" in another month.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (value) {
      const d = new Date(`${value}T00:00:00`);
      if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const canPrev = month > new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);
  const canNext = month < new Date(maxMonth.getFullYear(), maxMonth.getMonth(), 1);
  const [todayIso] = useState(() => toISODate(new Date()));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-2xl font-medium capitalize text-plum" aria-live="polite">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-line hover:border-ink/30 disabled:opacity-30"
            disabled={!canPrev}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="Predchádzajúci mesiac"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-line hover:border-ink/30 disabled:opacity-30"
            disabled={!canNext}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Nasledujúci mesiac"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center" role="grid">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className="pb-2 text-xs font-medium text-mute" role="columnheader">
            {WEEKDAYS_SHORT[d]}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const iso = toISODate(date);
          const state = dayState(date);
          const selected = iso === value;
          // Full days stay clickable: picking one offers the waitlist.
          const off = state === "disabled" || state === "full";
          return (
            <button
              key={iso}
              type="button"
              disabled={state === "disabled"}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              aria-label={`${formatDateLong(date)}${state === "full" ? ", obsadené, čakacia listina" : state === "busy" ? ", posledné miesta" : ""}`}
              className={`relative mx-auto grid aspect-square w-full max-w-12 place-items-center rounded-full text-[15px] tabular-nums transition-colors ${
                selected
                  ? "bg-plum font-semibold text-ivory"
                  : off
                    ? `text-mute/50 ${state === "full" ? "line-through" : ""}`
                    : "text-ink hover:bg-blush"
              } ${iso === todayIso && !selected ? "ring-1 ring-ink/25" : ""}`}
            >
              {date.getDate()}
              {state === "busy" && !selected && <span className="absolute bottom-1.5 size-1 rounded-full bg-gold" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-mute">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-gold" /> posledné voľné termíny
        </span>
        <span className="flex items-center gap-1.5">
          <span className="line-through">12</span> obsadené (čakacia listina)
        </span>
      </div>
    </div>
  );
}
