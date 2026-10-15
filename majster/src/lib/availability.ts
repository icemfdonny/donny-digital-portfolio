import { BOOKING, HOLIDAYS } from "../config";
import { addDays, pad, toISODate } from "./format";
import { TRADE } from "./profile";
import { hashString, pick, seeded, slovakName } from "./random";
import type { EmergencyCall, Visit } from "./types";

/**
 * Site visits are booked into two-hour arrival windows, one technician per window. Other customers' visits and the
 * days a technician spends on a job are generated deterministically per date, so the public booking page, the
 * home page and the admin schedule always agree on what is free.
 */

export type Window = { index: number; start: number; end: number };

export const isHoliday = (d: Date) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}` in HOLIDAYS;
export const holidayName = (d: Date) => HOLIDAYS[`${pad(d.getMonth() + 1)}-${pad(d.getDate())}`];

export function windowsOf(d: Date): Window[] {
  if (d.getDay() === 0 || isHoliday(d)) return [];
  const list = d.getDay() === 6 ? BOOKING.saturdayWindows : BOOKING.weekdayWindows;
  return list.map(([start, end], index) => ({ index, start, end }));
}

const rnd = (...parts: (string | number)[]) => seeded(hashString(`${TRADE.id}|${parts.join("|")}`))();

/** How busy the firm is on a date: near days are nearly full, later weeks open up. */
function load(date: Date, today: Date) {
  const ahead = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (ahead < 0) return 0.72;
  return Math.max(0.2, 0.74 - ahead * 0.04) + (date.getDay() === 6 ? 0.1 : 0);
}

export type GeneratedItem = { kind: "visit" | "job" | "off"; title: string; customer: string; place: number };

const JOB_KIND = ["Obhliadka", "Servis", "Obhliadka", "Zameranie"];

/** What a technician does on a date apart from bookings stored in the database. */
export function generatedDay(dateISO: string, techId: string, today: Date): { allDay: GeneratedItem | null; windows: (GeneratedItem | null)[] } {
  const date = new Date(`${dateISO}T12:00:00`);
  const wins = windowsOf(date);
  if (!wins.length) return { allDay: null, windows: [] };
  // Days off: about one in fourteen, never the owner on a weekday.
  if (rnd(dateISO, techId, "off") < (techId === "t1" ? 0.02 : 0.07)) return { allDay: { kind: "off", title: "Voľno", customer: "", place: 0 }, windows: [] };
  const r = seeded(hashString(`${TRADE.id}|${dateISO}|${techId}|names`));
  // Multi-day jobs: whole day on site (the owner less often, he does the surveys).
  if (date.getDay() !== 6 && rnd(dateISO, techId, "job") < (techId === "t1" ? 0.12 : 0.42)) {
    const job = TRADE.projects[Math.floor(rnd(dateISO.slice(0, 8), techId, "proj") * TRADE.projects.length)];
    return { allDay: { kind: "job", title: job.title, customer: slovakName(r, 0.45), place: 1 + Math.floor(r() * 6) }, windows: [] };
  }
  const l = load(date, today);
  return {
    allDay: null,
    windows: wins.map((w) => (rnd(dateISO, w.index, techId) < l ? { kind: "visit", title: pick(r, JOB_KIND), customer: slovakName(r, 0.45), place: Math.floor(r() * 7) } : null)),
  };
}

type Busy = { visits: Visit[]; emergencies: EmergencyCall[] };

/** Technicians still free in a window, after generated work and stored bookings. */
export function freeTechs(dateISO: string, window: number, db: Busy, today: Date) {
  return TRADE.crew
    .filter((t) => {
      const gen = generatedDay(dateISO, t.id, today);
      if (gen.allDay || !gen.windows.length || gen.windows[window]) return false;
      return !db.visits.some((v) => v.status !== "cancelled" && v.date === dateISO && v.window === window && v.techId === t.id);
    })
    .map((t) => t.id);
}

export type Slot = Window & { date: string; free: string[]; bookable: boolean };

export function slotsFor(date: Date, db: Busy, now: Date): Slot[] {
  const iso = toISODate(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minutesNow = (date.getTime() - today.getTime()) / 60_000;
  return windowsOf(date).map((w) => {
    const free = freeTechs(iso, w.index, db, today);
    const startsIn = minutesNow + w.start - (now.getHours() * 60 + now.getMinutes());
    return { ...w, date: iso, free, bookable: free.length > 0 && startsIn >= BOOKING.leadMinutes };
  });
}

export function nextFreeSlot(db: Busy, now: Date): Slot | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i <= BOOKING.horizonDays; i++) {
    const slot = slotsFor(addDays(today, i), db, now).find((s) => s.bookable);
    if (slot) return slot;
  }
  return null;
}

export const windowLabel = (w: { start: number; end: number }) => `${pad(Math.floor(w.start / 60))}:${pad(w.start % 60)} – ${pad(Math.floor(w.end / 60))}:${pad(w.end % 60)}`;

export function windowOf(dateISO: string, index: number): Window | undefined {
  return windowsOf(new Date(`${dateISO}T12:00:00`))[index];
}
