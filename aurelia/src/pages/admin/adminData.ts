import { appointmentsOn, shiftFor, utilisation } from "../../lib/availability";
import { addDays, roundMoney, toISODate } from "../../lib/format";
import type { DB } from "../../lib/store";
import type { Appointment, ApptStatus } from "../../lib/types";
import { TEAM } from "../../data/team";

/** Chart colours: one gold hue, a darker step for today (both >= 3:1 on paper, checked with the dataviz validator). */
export const CHART = { bar: "#a8834a", today: "#6e4f22", grid: "#ebdfd6" };

export type DayAppt = Appointment & { status: ApptStatus };

const counts = (s: ApptStatus) => s !== "cancelled" && s !== "noshow";

export function greeting(now: Date) {
  const h = now.getHours();
  return h < 10 ? "Dobré ráno" : h < 18 ? "Dobrý deň" : "Dobrý večer";
}

export function dayRevenue(list: DayAppt[]) {
  return roundMoney(list.filter((a) => counts(a.status)).reduce((s, a) => s + a.total, 0));
}

/** Average share of working specialists' time that is booked. */
export function dayUtilisation(iso: string, db: DB, now: Date) {
  const working = TEAM.filter((p) => shiftFor(p, iso, db));
  if (!working.length) return 0;
  return working.reduce((s, p) => s + utilisation(p.id, iso, db, now), 0) / working.length;
}

export function revenueSeries(db: DB, now: Date, days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(now, i - days + 1);
    const iso = toISODate(date);
    const list = appointmentsOn(iso, db, now);
    return { iso, date, revenue: dayRevenue(list), count: list.filter((a) => counts(a.status)).length };
  });
}

export type Client = {
  key: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  noShows: number;
  spent: number;
  first: string;
  last: string | null;
  next: string | null;
  favourite: string;
  services: Record<string, number>;
  history: DayAppt[];
  accountId?: string;
};

/**
 * The client list, built from every appointment in a window around today: generated regulars plus everyone who
 * booked on this site. Keyed by e-mail.
 */
export function buildClients(db: DB, now: Date, back = 180, ahead = 45): Client[] {
  const today = toISODate(now);
  const map = new Map<string, Client>();
  const perPerson = new Map<string, Record<string, number>>();
  for (let i = -back; i <= ahead; i++) {
    const iso = toISODate(addDays(now, i));
    for (const a of appointmentsOn(iso, db, now)) {
      const key = (a.email || a.phone).toLowerCase();
      let c = map.get(key);
      if (!c) {
        c = { key, name: a.clientName, email: a.email, phone: a.phone, visits: 0, noShows: 0, spent: 0, first: iso, last: null, next: null, favourite: "", services: {}, history: [] };
        map.set(key, c);
        perPerson.set(key, {});
      }
      c.history.push(a);
      if (a.accountId) c.accountId = a.accountId;
      if (a.status === "completed") {
        c.visits++;
        c.spent += a.total;
        c.last = iso;
        for (const item of a.items) {
          c.services[item.name] = (c.services[item.name] ?? 0) + 1;
          const pp = perPerson.get(key)!;
          pp[item.specialistId] = (pp[item.specialistId] ?? 0) + 1;
        }
      }
      if (a.status === "noshow") c.noShows++;
      if ((a.status === "confirmed" || a.status === "arrived") && iso >= today && !c.next) c.next = iso;
    }
  }
  for (const [key, c] of map) {
    const pp = perPerson.get(key)!;
    c.favourite = Object.entries(pp).sort((a, b) => b[1] - a[1])[0]?.[0] ?? c.history[0]?.items[0].specialistId ?? "";
    c.spent = roundMoney(c.spent);
    const account = db.accounts.find((a) => a.email === key);
    if (account) c.accountId = account.id;
  }
  return [...map.values()];
}

export type Tag = { label: string; tone: "ok" | "warn" | "off" | "bad" | "info" };

export function clientTags(c: Client, now: Date): Tag[] {
  const tags: Tag[] = [];
  if (c.spent >= 700 && c.visits >= 8) tags.push({ label: "VIP", tone: "warn" });
  if (c.visits <= 1 && !c.noShows) tags.push({ label: "Nová", tone: "info" });
  if (c.last && !c.next && (now.getTime() - new Date(`${c.last}T00:00`).getTime()) / 86_400_000 > 60) tags.push({ label: "Dlho nebola", tone: "off" });
  if (c.noShows) tags.push({ label: `${c.noShows}× neprišla`, tone: "bad" });
  if (c.accountId) tags.push({ label: "Účet", tone: "ok" });
  return tags;
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const text = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`﻿${text}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
