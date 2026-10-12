import { useState } from "react";
import { MONTHS, WEEKDAYS_SHORT, formatDateLong, toISODate } from "../lib/format";
import { ChevronLeft, ChevronRight } from "./icons";

export type DayState = "available" | "busy" | "full" | "disabled";

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
        <p className="font-display text-xl capitalize text-forest" aria-live="polite">
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
          const off = state === "disabled" || state === "full";
          return (
            <button
              key={iso}
              type="button"
              disabled={off}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              aria-label={`${formatDateLong(date)}${state === "full" ? ", obsadené" : state === "busy" ? ", posledné miesta" : ""}`}
              className={`relative mx-auto grid aspect-square w-full max-w-12 place-items-center rounded-full text-[15px] tabular-nums transition-colors ${
                selected
                  ? "bg-forest font-semibold text-cream"
                  : off
                    ? `text-mute/50 ${state === "full" ? "line-through" : ""}`
                    : "text-ink hover:bg-sand"
              } ${iso === todayIso && !selected ? "ring-1 ring-ink/25" : ""}`}
            >
              {date.getDate()}
              {state === "busy" && !selected && <span className="absolute bottom-1.5 size-1 rounded-full bg-honey" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-mute">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-honey" /> posledné voľné stoly
        </span>
        <span className="flex items-center gap-1.5">
          <span className="line-through">12</span> plno alebo zatvorené
        </span>
      </div>
    </div>
  );
}
