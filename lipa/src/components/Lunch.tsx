import { useState } from "react";
import { LUNCH } from "../config";
import { lunchWeek } from "../data/lunch";
import { WEEKDAYS, WEEKDAYS_SHORT, capitalize, formatDateLong, formatDateShort, formatPrice, isSameDay, minutesToTime } from "../lib/format";
import { useNow } from "../lib/hooks";
import { useDB } from "../lib/store";
import type { LunchDay } from "../lib/types";
import { Allergens, DietBadges } from "./ui";
import type { DietTag } from "../data/menu";

export function LunchList({ menu, soldOut, tone = "light" }: { menu: LunchDay; soldOut: string[]; tone?: "light" | "dark" }) {
  const muted = tone === "dark" ? "text-cream/55" : "text-mute";
  return (
    <div>
      <div className={`flex items-baseline gap-3 border-b pb-4 ${tone === "dark" ? "border-cream/12" : "border-line"}`}>
        <span className={`eyebrow shrink-0 ${tone === "dark" ? "text-honey" : "text-moss"}`}>Polievka</span>
        <p className="flex-1">
          {menu.soup.name} <span className={`whitespace-nowrap text-sm ${muted}`}>{menu.soup.detail}</span> <Allergens list={menu.soup.allergens} className={tone === "dark" ? "!text-cream/45" : ""} />
        </p>
      </div>
      <ol className="mt-1">
        {menu.dishes.map((dish, i) => {
          const out = soldOut.includes(dish.id);
          return (
            <li key={dish.id} className={`flex gap-4 border-b py-4 last:border-0 ${tone === "dark" ? "border-cream/12" : "border-line"} ${out ? "opacity-50" : ""}`}>
              <span className={`font-display text-xl leading-6 ${tone === "dark" ? "text-honey" : "text-moss"}`}>{i + 1}.</span>
              <div className="flex-1">
                <p className={out ? "line-through" : ""}>
                  {dish.name} <span className={`whitespace-nowrap text-sm ${muted}`}>{dish.detail}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Allergens list={dish.allergens} className={tone === "dark" ? "!text-cream/45" : ""} />
                  <DietBadges diet={(dish.tags ?? []) as DietTag[]} />
                  {out && <span className="rounded-full bg-wine/15 px-2 py-0.5 text-[11px] font-semibold text-wine">Vypredané</span>}
                </div>
              </div>
              <span className="font-medium tabular-nums">{formatPrice(dish.price)}</span>
            </li>
          );
        })}
      </ol>
      <p className={`mt-3 text-xs ${muted}`}>
        Cena obsahuje polievku. Menu box so sebou {formatPrice(LUNCH.box)}. Podávame {minutesToTime(LUNCH.from)} – {minutesToTime(LUNCH.to)}, kým zásoby stačia.
      </p>
    </div>
  );
}

/** The whole week with a tab per day, opening on today (or Monday at weekends). */
export function LunchWeek() {
  const db = useDB();
  const now = useNow(60_000);
  const showNextWeek = now.getDay() === 0 || now.getDay() === 6;
  const base = showNextWeek ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + (now.getDay() === 6 ? 2 : 1)) : now;
  const week = lunchWeek(base, db.lunch);
  const todayIndex = week.findIndex((d) => isSameDay(d.date, now));
  const [active, setActive] = useState(todayIndex >= 0 ? todayIndex : 0);
  const day = week[active];

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
      <div className="min-w-0">
        {showNextWeek && <p className="mb-4 rounded-2xl bg-honey-soft px-4 py-3 text-sm text-forest">Cez víkend obedové menu nepodávame. Toto je ponuka na budúci týždeň.</p>}
        <div role="tablist" aria-label="Dni v týždni" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:px-0">
          {week.map((d, i) => {
            const isToday = isSameDay(d.date, now);
            return (
              <button
                key={d.date.toISOString()}
                role="tab"
                type="button"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={`flex shrink-0 items-center justify-between gap-6 rounded-2xl border px-4 py-3 text-left transition-colors lg:w-full ${
                  active === i ? "border-forest bg-forest text-cream" : "border-line bg-paper text-ink hover:border-ink/30"
                }`}
              >
                <span>
                  <span className="block text-sm font-medium">
                    <span className="lg:hidden">{WEEKDAYS_SHORT[d.date.getDay()]}</span>
                    <span className="hidden lg:inline">{capitalize(WEEKDAYS[d.date.getDay()])}</span>
                  </span>
                  <span className={`text-xs ${active === i ? "text-cream/60" : "text-mute"}`}>{formatDateShort(d.date)}</span>
                </span>
                {isToday && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active === i ? "bg-honey text-forest" : "bg-honey-soft text-forest"}`}>Dnes</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div role="tabpanel" aria-label={formatDateLong(day.date)} className="card p-6 sm:p-8">
        <h3 className="mb-6 font-display text-2xl text-forest">{capitalize(formatDateLong(day.date))}</h3>
        {day.menu ? <LunchList menu={day.menu} soldOut={db.soldOut} /> : <p className="text-soft">V tento deň je reštaurácia zatvorená.</p>}
      </div>
    </div>
  );
}
