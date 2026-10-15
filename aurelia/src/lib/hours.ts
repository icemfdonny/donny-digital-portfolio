import { SPECIAL_DAYS, WEEK_HOURS, type DayHours } from "../config";
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

export type OpenStatus = { open: boolean; closingSoon: boolean; label: string; detail: string };

export function openStatus(now: Date): OpenStatus {
  const { hours } = dayInfo(now);
  const m = minutesOfDay(now);
  if (hours && m >= hours.open && m < hours.close) {
    const closingSoon = hours.close - m <= 60;
    return {
      open: true,
      closingSoon,
      label: closingSoon ? `Zatvárame o ${minutesToTime(hours.close)}` : "Teraz otvorené",
      detail: closingSoon ? "posledné klientky dnes" : `do ${minutesToTime(hours.close)}`,
    };
  }
  const next = nextOpening(now);
  return {
    open: false,
    closingSoon: false,
    label: "Teraz zatvorené",
    detail: next ? `Otvárame ${relativeDay(next, now)} o ${minutesToTime(minutesOfDay(next))}` : "",
  };
}

export type HoursRow = { days: string; dayIndexes: number[]; hours: string };

/** Regular week grouped into rows with identical hours, Monday first: "Ut – Pi 8:00 – 20:00". */
export function hoursRows(): HoursRow[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const rows: HoursRow[] = [];
  for (const day of order) {
    const h = WEEK_HOURS[day];
    const hours = h ? `${minutesToTime(h.open)} – ${minutesToTime(h.close)}` : "Zatvorené";
    const last = rows[rows.length - 1];
    if (last && last.hours === hours) last.dayIndexes.push(day);
    else rows.push({ days: "", dayIndexes: [day], hours });
  }
  for (const row of rows) {
    const first = WEEKDAYS_SHORT[row.dayIndexes[0]];
    const lastDay = WEEKDAYS_SHORT[row.dayIndexes[row.dayIndexes.length - 1]];
    row.days = row.dayIndexes.length > 1 ? `${first} – ${lastDay}` : first;
  }
  return rows;
}

export function upcomingSpecialDays(now: Date, withinDays = 40) {
  const out: { date: Date; label: string; hours: DayHours | null }[] = [];
  for (let i = 0; i <= withinDays; i++) {
    const day = addDays(startOfDay(now), i);
    const info = dayInfo(day);
    if (info.special) out.push({ date: day, label: info.special, hours: info.hours });
  }
  return out;
}
