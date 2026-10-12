import { LUNCH, SPECIAL_DAYS, WEEK_HOURS, type DayHours } from "../config";
import { WEEKDAYS_ON, WEEKDAYS_SHORT, addDays, formatDateShort, minutesOfDay, minutesToTime, pad, startOfDay } from "./format";

export function dayInfo(d: Date): { hours: DayHours | null; special?: string } {
  const special = SPECIAL_DAYS[`${pad(d.getMonth() + 1)}-${pad(d.getDate())}`];
  if (special) return { hours: special.hours, special: special.label };
  return { hours: WEEK_HOURS[d.getDay()] };
}

/** "dnes", "zajtra", "v piatok", or "24. 12." further out. */
export function relativeDay(target: Date, now: Date) {
  const diff = Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return "dnes";
  if (diff === 1) return "zajtra";
  if (diff > 1 && diff < 7) return WEEKDAYS_ON[target.getDay()];
  return formatDateShort(target);
}

/** The next moment the doors open, after `now`. */
export function nextOpening(now: Date) {
  for (let i = 0; i < 21; i++) {
    const day = addDays(startOfDay(now), i);
    const { hours } = dayInfo(day);
    if (!hours) continue;
    const at = new Date(day);
    at.setMinutes(hours.open);
    if (at > now) return at;
  }
  return null;
}

export type OpenStatus = { open: boolean; closingSoon: boolean; kitchenOpen: boolean; label: string; detail: string };

export function openStatus(now: Date): OpenStatus {
  const { hours } = dayInfo(now);
  const m = minutesOfDay(now);
  if (hours && m >= hours.open && m < hours.close) {
    const kitchenOpen = m < hours.kitchen;
    const closingSoon = hours.close - m <= 60;
    return {
      open: true,
      closingSoon,
      kitchenOpen,
      label: closingSoon ? `Zatvárame o ${minutesToTime(hours.close)}` : "Teraz otvorené",
      detail: [
        closingSoon ? null : `do ${minutesToTime(hours.close)}`,
        kitchenOpen ? `kuchyňa do ${minutesToTime(hours.kitchen)}` : "kuchyňa zatvorená, bar ešte nalieva",
      ]
        .filter(Boolean)
        .join(" · "),
    };
  }
  const next = nextOpening(now);
  return {
    open: false,
    closingSoon: false,
    kitchenOpen: false,
    label: "Teraz zatvorené",
    detail: next ? `Otvárame ${relativeDay(next, now)} o ${minutesToTime(minutesOfDay(next))}` : "",
  };
}

export function isLunchDay(d: Date) {
  return LUNCH.days.includes(d.getDay()) && dayInfo(d).hours !== null && !dayInfo(d).special;
}

export function isLunchTime(now: Date) {
  const m = minutesOfDay(now);
  return isLunchDay(now) && m >= LUNCH.from && m < LUNCH.to;
}

export type HoursRow = { days: string; dayIndexes: number[]; hours: string; kitchen: string };

/** Regular week grouped into rows with identical hours, Monday first: "Po – Št 11:00 – 23:00". */
export function hoursRows(): HoursRow[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const rows: HoursRow[] = [];
  for (const day of order) {
    const h = WEEK_HOURS[day];
    const hours = h ? `${minutesToTime(h.open)} – ${minutesToTime(h.close)}` : "Zatvorené";
    const kitchen = h ? minutesToTime(h.kitchen) : "";
    const last = rows[rows.length - 1];
    if (last && last.hours === hours && last.kitchen === kitchen) last.dayIndexes.push(day);
    else rows.push({ days: "", dayIndexes: [day], hours, kitchen });
  }
  for (const row of rows) {
    const first = WEEKDAYS_SHORT[row.dayIndexes[0]];
    const lastDay = WEEKDAYS_SHORT[row.dayIndexes[row.dayIndexes.length - 1]];
    row.days = row.dayIndexes.length > 1 ? `${first} – ${lastDay}` : first;
  }
  return rows;
}

/** Special days (holidays) coming up within `withinDays`, for notices. */
export function upcomingSpecialDays(now: Date, withinDays = 40) {
  const out: { date: Date; label: string; hours: DayHours | null }[] = [];
  for (let i = 0; i <= withinDays; i++) {
    const day = addDays(startOfDay(now), i);
    const info = dayInfo(day);
    if (info.special) out.push({ date: day, label: info.special, hours: info.hours });
  }
  return out;
}
