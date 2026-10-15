import { BOOKING } from "../config";
import { SERVICES, type Service } from "../data/services";
import { TEAM, SPECIALIST_BY_ID, type Shift, type Specialist } from "../data/team";
import { durationOf, liveService, priceFor, qualified } from "./catalog";
import { addDays, fromISODate, makeCode, minutesOfDay, toISODate } from "./format";
import { dayInfo } from "./hours";
import { pick, seeded, slovakName } from "./random";
import type { DB } from "./store";
import type { Appointment, ApptStatus } from "./types";

/**
 * The booking engine. Other clients' appointments are generated deterministically per day and specialist, so the
 * calendar looks like a busy salon and the admin and the public booking always agree on what is free.
 */

export type AvailabilityDB = Pick<DB, "appointments" | "generatedStatus" | "serviceOverrides" | "absences" | "blocks">;

// ---------------------------------------------------------------------------------------------------------------
// Client pool for generated bookings

export type PoolClient = { id: string; name: string; phone: string; email: string };

const ascii = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const CLIENTS: PoolClient[] = (() => {
  const rand = seeded("aurelia-clients");
  const seen = new Map<string, number>();
  const out: PoolClient[] = [];
  while (out.length < 900) {
    const name = slovakName(rand, 0.86);
    // Names repeat in a pool this size, as they do in real life; e-mails stay unique.
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    const [first, last] = ascii(name).split(" ");
    const phone = `+4219${Math.floor(rand() * 4)}${String(Math.floor(rand() * 10_000_000)).padStart(7, "0")}`;
    out.push({ id: `c${out.length + 1}`, name, phone, email: `${first}.${last}${n > 1 ? n : ""}@example.com` });
  }
  return out;
})();

const NOTES = ["Citlivá pokožka hlavy", "Prosím kávu bez mlieka", "Prvýkrát u vás, odporúčanie od kamarátky", "Chcem len zastrihnúť končeky", "Alergia na latex", "Možno prídem o 5 minút neskôr", ""];

// ---------------------------------------------------------------------------------------------------------------
// Generated appointments

/** How full a specialist's day is, before the drop-off for days further ahead. */
const WEEKDAY_LOAD = [0, 0.46, 0.52, 0.56, 0.62, 0.74, 0.84];

function weightedServices(person: Specialist): Service[] {
  const out: Service[] = [];
  for (const s of SERVICES) {
    if (!person.cats.includes(s.cat) || s.deposit || s.price === 0 || s.id === "nail-art") continue;
    const weight = s.popular ? 4 : 1;
    for (let i = 0; i < weight; i++) out.push(s);
  }
  return out;
}

const generatedCache = new Map<string, Appointment[]>();

function generateFor(person: Specialist, iso: string, todayIso: string): Appointment[] {
  const date = fromISODate(iso);
  const shift = person.week[date.getDay()];
  const hours = dayInfo(date).hours;
  if (!shift || !hours) return [];
  const start = Math.max(shift.start, hours.open);
  const end = Math.min(shift.end, hours.close);
  const rand = seeded(`${iso}|${person.id}`);
  const daysAhead = Math.round((date.getTime() - fromISODate(todayIso).getTime()) / 86_400_000);
  const decay = daysAhead <= 2 ? 1.08 : Math.max(0.18, 1 - daysAhead / 38);
  const load = Math.min(0.97, Math.max(0.15, (WEEKDAY_LOAD[date.getDay()] + (rand() - 0.5) * 0.3) * decay));
  const pool = weightedServices(person);
  const out: Appointment[] = [];
  let t = start + (rand() < load ? 0 : pick(rand, [15, 30, 45, 60]));
  let n = 0;
  while (t < end) {
    if (rand() > load) {
      t += pick(rand, [15, 30, 45, 60, 90]);
      continue;
    }
    const service = pick(rand, pool);
    const variant = service.variants ? pick(rand, service.variants) : undefined;
    const duration = variant?.duration ?? service.duration;
    if (t + duration > end) {
      t += 15;
      continue;
    }
    // A minority of regulars make most of the visits; the long tail comes once or twice.
    const client = CLIENTS[Math.floor(Math.pow(rand(), 2.2) * CLIENTS.length)];
    const price = priceFor(service.id, variant?.id, person.id, {});
    const past = iso < todayIso;
    const status: ApptStatus = past && rand() < 0.035 ? "noshow" : "confirmed";
    out.push({
      id: `g-${iso}-${person.id}-${n++}`,
      code: makeCode("AU", 4, rand),
      date: iso,
      start: t,
      end: t + duration,
      items: [{ serviceId: service.id, variantId: variant?.id, name: service.name, specialistId: person.id, start: t, end: t + duration, price }],
      clientName: client.name,
      phone: client.phone,
      email: client.email,
      note: rand() < 0.18 ? pick(rand, NOTES) : "",
      subtotal: price,
      discounts: [],
      total: price,
      deposit: 0,
      depositPaid: false,
      status,
      source: rand() < 0.64 ? "web" : "phone",
      createdAt: date.getTime() - Math.floor(rand() * 20 + 1) * 86_400_000,
      log: [],
      generated: true,
    });
    t += duration + (service.bufferAfter ?? 0);
    t = Math.ceil(t / 15) * 15;
  }
  return out;
}

/** Other clients' appointments for one day, all specialists. */
export function generatedFor(iso: string, todayIso = toISODate(new Date())): Appointment[] {
  const key = `${todayIso}|${iso}`;
  let list = generatedCache.get(key);
  if (!list) {
    list = TEAM.flatMap((p) => generateFor(p, iso, todayIso));
    if (generatedCache.size > 400) generatedCache.clear();
    generatedCache.set(key, list);
  }
  return list;
}

// ---------------------------------------------------------------------------------------------------------------
// Status

export const atMinute = (iso: string, minutes: number) => {
  const d = fromISODate(iso);
  d.setMinutes(minutes);
  return d;
};

/** Stored status moved on by the clock: a confirmed visit in progress reads "arrived", a finished one "completed". */
export function effectiveStatus(a: Appointment, now: Date, overrides?: Record<string, ApptStatus>): ApptStatus {
  const s = (a.generated && overrides?.[a.id]) || a.status;
  if (s === "confirmed" || s === "arrived") {
    if (atMinute(a.date, a.end) <= now) return "completed";
    if (s === "confirmed" && atMinute(a.date, a.start) <= now) return "arrived";
  }
  return s;
}

/** Every appointment on a day, generated and real, with the clock-adjusted status. */
export function appointmentsOn(iso: string, db: AvailabilityDB, now: Date) {
  const todayIso = toISODate(now);
  return [...generatedFor(iso, todayIso), ...db.appointments.filter((a) => a.date === iso)]
    .map((a) => ({ ...a, status: effectiveStatus(a, now, db.generatedStatus) }))
    .sort((a, b) => a.start - b.start || a.items[0].specialistId.localeCompare(b.items[0].specialistId));
}

// ---------------------------------------------------------------------------------------------------------------
// Shifts and busy time

export const absenceKey = (specialistId: string, iso: string) => `${specialistId}|${iso}`;

export function shiftFor(person: Specialist, iso: string, db: Pick<DB, "absences">): Shift | null {
  if (db.absences.includes(absenceKey(person.id, iso))) return null;
  const date = fromISODate(iso);
  const shift = person.week[date.getDay()];
  const hours = dayInfo(date).hours;
  if (!shift || !hours) return null;
  const start = Math.max(shift.start, hours.open);
  const end = Math.min(shift.end, hours.close);
  return end > start ? { start, end } : null;
}

type Interval = [number, number];

function busyByPerson(iso: string, db: AvailabilityDB, now: Date, excludeId?: string) {
  const map = new Map<string, Interval[]>(TEAM.map((p) => [p.id, []]));
  const todayIso = toISODate(now);
  for (const a of generatedFor(iso, todayIso)) {
    if ((db.generatedStatus[a.id] ?? a.status) === "cancelled") continue;
    for (const item of a.items) map.get(item.specialistId)?.push([item.start, item.end + (liveService(item.serviceId, {}).bufferAfter ?? 0)]);
  }
  for (const a of db.appointments) {
    if (a.date !== iso || a.status === "cancelled" || a.id === excludeId) continue;
    for (const item of a.items) map.get(item.specialistId)?.push([item.start, item.end + (liveService(item.serviceId, db.serviceOverrides).bufferAfter ?? 0)]);
  }
  for (const b of db.blocks) if (b.date === iso) map.get(b.specialistId)?.push([b.start, b.end]);
  return map;
}

/** Share of a specialist's shift that is booked, 0–1. */
export function utilisation(personId: string, iso: string, db: AvailabilityDB, now: Date) {
  const person = SPECIALIST_BY_ID.get(personId);
  if (!person) return 0;
  const shift = shiftFor(person, iso, db);
  if (!shift) return 0;
  const busy = busyByPerson(iso, db, now).get(personId) ?? [];
  const minutes = busy.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(b, shift.end) - Math.max(a, shift.start)), 0);
  return Math.min(1, minutes / (shift.end - shift.start));
}

// ---------------------------------------------------------------------------------------------------------------
// Slot search

/** One service the client wants; specialistId "any" lets the engine choose. */
export type Req = { serviceId: string; variantId?: string; specialistId: string };
export type PlanPart = { specialistId: string; start: number; end: number };
export type Slot = { start: number; end: number; parts: PlanPart[] };

export type SlotOptions = {
  /** Rescheduling: the visit's own time counts as free. */
  excludeId?: string;
  /** Staff bookings and seeding: no lead time, past days allowed, offline services allowed. */
  staff?: boolean;
};

export function findSlots(iso: string, reqs: Req[], db: AvailabilityDB, now: Date, opts: SlotOptions = {}): Slot[] {
  if (!reqs.length) return [];
  const todayIso = toISODate(now);
  if (!opts.staff && (iso < todayIso || iso > toISODate(addDays(now, BOOKING.horizonDays)))) return [];
  const hours = dayInfo(fromISODate(iso)).hours;
  if (!hours) return [];

  const services = reqs.map((r) => liveService(r.serviceId, db.serviceOverrides));
  if (!opts.staff && services.some((s) => !s.online)) return [];
  const durations = reqs.map((r) => durationOf(r.serviceId, r.variantId, db.serviceOverrides));
  const busy = busyByPerson(iso, db, now, opts.excludeId);
  const shifts = new Map(TEAM.map((p) => [p.id, shiftFor(p, iso, db)]));
  const load = (id: string) => (busy.get(id) ?? []).reduce((s, [a, b]) => s + b - a, 0);
  const candidates = reqs.map((r, i) => {
    const list = r.specialistId === "any" ? qualified(services[i]) : TEAM.filter((p) => p.id === r.specialistId);
    return list.filter((p) => shifts.get(p.id)).sort((a, b) => load(a.id) - load(b.id));
  });
  if (candidates.some((c) => !c.length)) return [];

  const fits = (id: string, from: number, to: number) => {
    const shift = shifts.get(id);
    if (!shift || from < shift.start || to > shift.end) return false;
    return !(busy.get(id) ?? []).some(([a, b]) => from < b && a < to);
  };

  let earliest = hours.open;
  if (iso === todayIso) {
    const nowMin = minutesOfDay(now);
    earliest = Math.max(earliest, Math.ceil((nowMin + (opts.staff ? 0 : BOOKING.leadMinutes)) / BOOKING.slotStep) * BOOKING.slotStep);
  }

  const slots: Slot[] = [];
  for (let start = earliest; start < hours.close; start += BOOKING.slotStep) {
    let t = start;
    let prev: string | null = null as string | null;
    const parts: PlanPart[] = [];
    for (let i = 0; i < reqs.length; i++) {
      const end = t + durations[i];
      const buffer = services[i].bufferAfter ?? 0;
      const ordered: Specialist[] = prev ? [...candidates[i].filter((p) => p.id === prev), ...candidates[i].filter((p) => p.id !== prev)] : candidates[i];
      // The last service may run its clean-up buffer past the end of the shift; others may not.
      const person: Specialist | undefined = ordered.find((p) => fits(p.id, t, end) && (i === reqs.length - 1 || fits(p.id, end, end + buffer)));
      if (!person) break;
      parts.push({ specialistId: person.id, start: t, end });
      prev = person.id;
      t = end;
    }
    if (parts.length === reqs.length) slots.push({ start, end: t, parts });
  }
  return slots;
}

export type DayState = "available" | "busy" | "full" | "disabled";

export function dayState(date: Date, reqs: Req[], db: AvailabilityDB, now: Date): DayState {
  const iso = toISODate(date);
  if (iso < toISODate(now) || iso > toISODate(addDays(now, BOOKING.horizonDays)) || !dayInfo(date).hours) return "disabled";
  const count = findSlots(iso, reqs, db, now).length;
  if (!count) return "full";
  return count <= BOOKING.busyThreshold ? "busy" : "available";
}

/** First free slot from today on, for "Najbližší voľný termín". */
export function nextFree(reqs: Req[], db: AvailabilityDB, now: Date, days = BOOKING.horizonDays) {
  for (let i = 0; i <= days; i++) {
    const iso = toISODate(addDays(now, i));
    const slots = findSlots(iso, reqs, db, now);
    if (slots.length) return { iso, slot: slots[0], count: slots.length };
  }
  return null;
}

/** A specialist's most booked service, to answer "when is Simona free?" without asking which service. */
export function signatureService(person: Specialist) {
  for (const cat of person.cats) {
    const s = SERVICES.find((x) => x.cat === cat && x.popular && x.price > 0);
    if (s) return s;
  }
  return SERVICES.find((s) => person.cats.includes(s.cat))!;
}
