import { dayInfo } from "./hours";
import { fromISODate, makeCode, minutesOfDay, minutesToTime, normalizePhone, timeToMinutes, toISODate } from "./format";
import { hashString, pick, seeded, slovakName } from "./random";
import type { DB } from "./store";
import type { AreaId, Reservation, ReservationStatus } from "./types";

export type Area = {
  id: AreaId;
  name: string;
  description: string;
  capacity: number;
  minGuests: number;
  maxGuests: number;
  /** Months it is open (0 = January); all year when missing. */
  months?: number[];
  /** Weekdays it is open (0 = Sunday); every day when missing. */
  days?: number[];
  /** Fixed seatings (HH:MM); any slot when missing. */
  times?: string[];
  /** Deposit per guest, paid when booking. */
  deposit?: number;
  note?: string;
};

export const AREAS: Area[] = [
  {
    id: "interier",
    name: "Interiér",
    description: "Hlavná sála s výhľadom do otvorenej kuchyne a na pec na drevo.",
    capacity: 44,
    minGuests: 1,
    maxGuests: 8,
  },
  {
    id: "terasa",
    name: "Vyhrievaná terasa",
    description: "Tichý vnútorný dvor pod storočnou lipou, s dekami a infražiaričmi.",
    capacity: 30,
    minGuests: 1,
    maxGuests: 8,
    months: [3, 4, 5, 6, 7, 8, 9],
    note: "Otvorená apríl – október",
  },
  {
    id: "bar",
    name: "Vínny bar",
    description: "Miesta pri pulte vedľa sommeliéra: pohár vína a malé taniere.",
    capacity: 12,
    minGuests: 1,
    maxGuests: 4,
    note: "Najviac 4 hostia",
  },
  {
    id: "chefs",
    name: "Chef's table",
    description: "Sedemchodové degustačné menu priamo pri kuchyni, šéfkuchár varí pred vami.",
    capacity: 8,
    minGuests: 2,
    maxGuests: 8,
    days: [4, 5, 6],
    times: ["19:00"],
    deposit: 25,
    note: "Št – So o 19:00 · záloha 25 € / os.",
  },
];

export const areaById = (id: AreaId) => AREAS.find((a) => a.id === id) ?? AREAS[0];

export const SLOT_STEP = 30;
export const BOOKING_LEAD_MINUTES = 30;
export const BOOKING_DAYS_AHEAD = 60;
export const MAX_ONLINE_GUESTS = 8;

/** How long a table is held: shorter at lunch. */
export const durationAt = (minute: number) => (minute < 15 * 60 ? 90 : 120);

/** Bookable start times (minutes after midnight): from opening until an hour before the kitchen closes. */
export function slotsForDate(date: Date) {
  const { hours } = dayInfo(date);
  if (!hours) return [];
  const slots: number[] = [];
  for (let m = hours.open; m <= hours.kitchen - 60; m += SLOT_STEP) slots.push(m);
  return slots;
}

export function areaOpenAt(area: Area, date: Date, minute?: number) {
  if (area.months && !area.months.includes(date.getMonth())) return false;
  if (area.days && !area.days.includes(date.getDay())) return false;
  if (minute !== undefined && area.times && !area.times.includes(minutesToTime(minute))) return false;
  return true;
}

const ACTIVE: ReservationStatus[] = ["confirmed", "seated", "completed"];

function covers(bookings: Reservation[], area: AreaId, minute: number) {
  const end = minute + durationAt(minute);
  let sum = 0;
  for (const b of bookings) {
    if (b.area !== area || !ACTIVE.includes(b.status)) continue;
    const start = timeToMinutes(b.time);
    if (start < end && minute < start + durationAt(start)) sum += b.guests;
  }
  return sum;
}

const OCCASIONS = ["Narodeniny", "Výročie", "Pracovné stretnutie", "Rande"];
const NOTES = ["Bezlepková diéta", "Detská stolička, prosím", "Ak sa dá, stôl pri okne", "Vegánka v spoločnosti", "Prídeme s malým psíkom", "Alergia na orechy"];

const generatedCache = new Map<string, Reservation[]>();

/**
 * Other guests' bookings for a day. Deterministic per date, so availability and the admin agree, and busier at
 * weekends and around lunch and dinner peaks.
 */
function generatedFor(iso: string): Reservation[] {
  const cached = generatedCache.get(iso);
  if (cached) return cached;
  const date = fromISODate(iso);
  const rand = seeded(`lipa:${iso}`);
  const slots = slotsForDate(date);
  const load = [0.62, 0.5, 0.55, 0.6, 0.72, 0.88, 0.92][date.getDay()] + (rand() - 0.5) * 0.12;
  const out: Reservation[] = [];

  const add = (area: AreaId, minute: number, guests: number) => {
    const n = out.length;
    out.push({
      id: `g-${iso}-${n}`,
      code: makeCode("LP", 4, rand),
      date: iso,
      time: minutesToTime(minute),
      guests,
      area,
      name: slovakName(rand),
      email: "",
      phone: normalizePhone(`09${Math.floor(rand() * 90_000_000 + 10_000_000)}`) ?? "",
      occasion: rand() < 0.12 ? pick(rand, OCCASIONS) : undefined,
      note: rand() < 0.14 ? pick(rand, NOTES) : undefined,
      extras: [],
      status: "confirmed",
      source: rand() < 0.68 ? "web" : "phone",
      createdAt: date.getTime() - Math.floor(rand() * 14 + 1) * 86_400_000,
      generated: true,
    });
  };

  for (const area of AREAS) {
    if (!areaOpenAt(area, date)) continue;
    if (area.id === "chefs") {
      let seats = Math.floor(rand() * 7) + 2;
      while (seats >= 2) {
        const party = Math.min(seats, rand() < 0.7 ? 2 : 4);
        add("chefs", timeToMinutes("19:00"), party);
        seats -= party;
      }
      continue;
    }
    for (const minute of slots) {
      const peak =
        minute >= 12 * 60 && minute <= 13 * 60 + 30 ? 1 : minute >= 18 * 60 + 30 && minute <= 20 * 60 + 30 ? 1.15 : minute >= 17 * 60 ? 0.6 : 0.28;
      const attempts = area.capacity > 20 ? 4 : 2;
      for (let k = 0; k < attempts; k++) {
        if (rand() > load * peak * 0.75) continue;
        const r = rand();
        const guests = Math.min(area.maxGuests, r < 0.5 ? 2 : r < 0.62 ? 3 : r < 0.86 ? 4 : r < 0.95 ? 5 : 6);
        if (covers(out, area.id, minute) + guests > area.capacity * 0.94) continue;
        add(area.id, minute, guests);
      }
    }
  }
  generatedCache.set(iso, out);
  return out;
}

/** Generated bookings move from confirmed to seated to completed as the day goes by, unless staff changed them. */
function liveStatus(r: Reservation, now: Date): ReservationStatus {
  if (r.status !== "confirmed") return r.status;
  const startAt = fromISODate(r.date);
  startAt.setMinutes(timeToMinutes(r.time));
  const start = startAt.getTime();
  const end = start + durationAt(timeToMinutes(r.time)) * 60_000;
  const t = now.getTime();
  if (t >= end) return hashString(r.id) % 41 === 0 ? "noshow" : "completed";
  if (t >= start) return "seated";
  return "confirmed";
}

/** Every booking for a day: generated ones plus those made on this device, sorted by time. */
export function reservationsForDate(iso: string, db: DB, now: Date) {
  const generated = generatedFor(iso).map((r) => ({ ...r, status: db.reservationStatus[r.id] ?? liveStatus(r, now) }));
  const own = db.reservations.filter((r) => r.date === iso);
  return [...generated, ...own].sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name, "sk"));
}

export type SlotState = "free" | "limited" | "full" | "closed";

export function areaState(area: Area, iso: string, minute: number, guests: number, db: DB, now: Date): SlotState {
  const date = fromISODate(iso);
  if (!areaOpenAt(area, date, minute)) return "closed";
  if (guests < area.minGuests || guests > area.maxGuests) return "closed";
  const remaining = area.capacity - covers(reservationsForDate(iso, db, now), area.id, minute);
  if (remaining < guests) return "full";
  if (remaining - guests < Math.max(3, Math.round(area.capacity * 0.18))) return "limited";
  return "free";
}

const RANK: Record<SlotState, number> = { free: 3, limited: 2, full: 1, closed: 0 };

export type Slot = { minute: number; time: string; state: SlotState };

/** Start times for a day, each with the best state across the areas that fit the party. */
export function slotsWithState(iso: string, guests: number, db: DB, now: Date): Slot[] {
  const date = fromISODate(iso);
  const isToday = iso === toISODate(now);
  const earliest = isToday ? minutesOfDay(now) + BOOKING_LEAD_MINUTES : -1;
  return slotsForDate(date).map((minute) => {
    if (minute < earliest) return { minute, time: minutesToTime(minute), state: "closed" as SlotState };
    let best: SlotState = "closed";
    for (const area of AREAS) {
      const s = areaState(area, iso, minute, guests, db, now);
      if (RANK[s] > RANK[best]) best = s;
    }
    return { minute, time: minutesToTime(minute), state: best };
  });
}

/** Why a calendar day cannot be picked, or null when it can. */
export function dayUnavailableReason(date: Date, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date < today) return "past";
  const limit = new Date(today);
  limit.setDate(limit.getDate() + BOOKING_DAYS_AHEAD);
  if (date > limit) return "far";
  const info = dayInfo(date);
  if (!info.hours) return "closed";
  return null;
}
