import { useSyncExternalStore } from "react";
import { LOYALTY } from "../config";
import { findSlots, type Req } from "./availability";
import { addDays, makeCode, toISODate, uid } from "./format";
import { quote } from "./loyalty";
import { seeded } from "./random";
import type { Account, Appointment, ApptStatus, Block, ContactMessage, ServiceOverride, WaitlistEntry } from "./types";

/**
 * The demo's "backend": one JSON document in localStorage. Every page and the admin read it through useDB(), and
 * the storage event keeps open tabs in sync, so a booking made on the site pops up in the admin in another tab.
 */
export type DB = {
  version: 1;
  appointments: Appointment[];
  /** Admin status changes for generated appointments, keyed by id. */
  generatedStatus: Record<string, ApptStatus>;
  accounts: Account[];
  /** The client signed in on this browser. */
  sessionAccountId: string | null;
  serviceOverrides: Record<string, ServiceOverride>;
  /** "specialistId|YYYY-MM-DD" for days off. */
  absences: string[];
  blocks: Block[];
  waitlist: WaitlistEntry[];
  messages: ContactMessage[];
  newsletter: string[];
  adminVisited: boolean;
};

const KEY = "aurelia-demo:v1";
const DAY = 86_400_000;

export const DEMO_ACCOUNT = { email: "zuzana.kovacova@example.com", password: "ukazka2026" };

function empty(): DB {
  return {
    version: 1,
    appointments: [],
    generatedStatus: {},
    accounts: [],
    sessionAccountId: null,
    serviceOverrides: {},
    absences: [],
    blocks: [],
    waitlist: [],
    messages: [],
    newsletter: [],
    adminVisited: false,
  };
}

type SeedVisit = { daysAgo: number; specialist: string; reqs: Omit<Req, "specialistId">[]; note?: string; reward?: string };

/** Zuzana's history: a regular who colours every two months, does her nails and treats herself to a facial. */
const ZUZANA_VISITS: SeedVisit[] = [
  { daysAgo: 300, specialist: "simona", reqs: [{ serviceId: "farbenie-odrastov" }, { serviceId: "damsky-strih", variantId: "polodlhe" }], note: "Receptúra: Koleston 7/1 + 7/0 (1 : 1), oxidant 6 %, 35 min. Strih: zostrihané o 3 cm, jemné vrstvy." },
  { daysAgo: 252, specialist: "laura", reqs: [{ serviceId: "gel-lak" }], note: "Odtieň: OPI Bubble Bath, tvar mandľa." },
  { daysAgo: 208, specialist: "eva", reqs: [{ serviceId: "hydraglow" }], note: "Zmiešaná pleť, rozšírené póry na T-zóne. Doma: jemné kyseliny 2× týždenne, SPF 50." },
  {
    daysAgo: 160,
    specialist: "simona",
    reqs: [{ serviceId: "balayage", variantId: "polodlhe" }, { serviceId: "damsky-strih", variantId: "polodlhe" }],
    note: "Balayage: Blondor + Olaplex č. 1, 6 %. Tónovanie Illumina 9/19 + 10/36. Ďalšie osvieženie o 10–12 týždňov.",
    reward: "r5",
  },
  { daysAgo: 112, specialist: "laura", reqs: [{ serviceId: "gel-lak" }, { serviceId: "pedikura" }], note: "Ruky: Bubble Bath, nohy: červená Big Apple Red." },
  { daysAgo: 63, specialist: "simona", reqs: [{ serviceId: "farbenie-odrastov" }], note: "Receptúra: Koleston 7/1 + 7/0 (1 : 1), 6 %, 35 min. Odporúčam gloss pri ďalšej návšteve." },
  { daysAgo: 27, specialist: "laura", reqs: [{ serviceId: "lash-lift" }], note: "Valček S, farba čierna. Výsledok drží 6–8 týždňov." },
];

function seed(): DB {
  const now = new Date();
  const db = empty();
  const rand = seeded(toISODate(now));

  /** Puts a visit into the first sensible free slot on or after the day, so it never clashes with others. */
  const place = (fromDaysAgo: number, specialist: string, reqs: Omit<Req, "specialistId">[], future = false) => {
    const full = reqs.map((r) => ({ ...r, specialistId: specialist }));
    // Long visits need a long gap, so look a few weeks either way; prefer daytime starts.
    for (let i = 0; i < 40; i++) {
      const offset = i % 2 ? -Math.ceil(i / 2) : i / 2;
      const days = future ? fromDaysAgo + Math.abs(offset) : -fromDaysAgo + offset;
      if (!future && days >= 0) continue;
      const iso = toISODate(addDays(now, days));
      const slots = findSlots(iso, full, db, now, { staff: !future });
      const sensible = slots.filter((s) => s.start >= 9 * 60 && s.start <= 17 * 60);
      const pickFrom = sensible.length ? sensible : slots;
      if (pickFrom.length) return { iso, slot: pickFrom[Math.floor(pickFrom.length / 2)], reqs: full };
    }
    return null;
  };

  const zuzana: Account = {
    id: "demo-zuzana",
    name: "Zuzana Kováčová",
    email: DEMO_ACCOUNT.email,
    phone: "+421905123456",
    password: DEMO_ACCOUNT.password,
    birthday: "03-14",
    createdAt: now.getTime() - 320 * DAY,
    favouriteSpecialist: "simona",
    careNotes: "Citlivá pokožka hlavy, pri farbení prosím ochranný krém.",
    marketing: true,
    reminders: true,
    referralCode: "ZUZANA10",
    ledger: [
      { id: "l-signup", at: now.getTime() - 320 * DAY, points: LOYALTY.signupBonus, label: "Bonus za registráciu" },
      { id: "l-ref", at: now.getTime() - 196 * DAY, points: LOYALTY.referralPoints, label: "Odporúčanie: Petra" },
      { id: "l-redeem", at: now.getTime() - 166 * DAY, points: -150, label: "Výmena za odmenu: Zľava 5 €" },
    ],
    rewards: [],
  };
  db.accounts.push(zuzana);

  for (const v of ZUZANA_VISITS) {
    const placed = place(v.daysAgo, v.specialist, v.reqs);
    if (!placed) continue;
    const { iso, slot, reqs } = placed;
    const code = makeCode("AU", 4, rand);
    let rewardCode: string | undefined;
    if (v.reward) {
      rewardCode = "ODM-7F2KQ";
      zuzana.rewards.push({ code: rewardCode, rewardId: v.reward, createdAt: now.getTime() - 166 * DAY, usedAt: now.getTime() - v.daysAgo * DAY, usedOn: code });
    }
    const q = quote({ lines: reqs, db, now, date: iso, code: rewardCode, account: rewardCode ? { ...zuzana, rewards: zuzana.rewards.map((r) => ({ ...r, usedAt: undefined })) } : null });
    const discounts = q.discounts.filter((d) => !d.label.startsWith("Vernostná"));
    const total = Math.max(0, q.subtotal - discounts.reduce((s, d) => s + d.amount, 0));
    db.appointments.push({
      id: `seed-${v.daysAgo}`,
      code,
      date: iso,
      start: slot.start,
      end: slot.end,
      items: slot.parts.map((p, i) => ({ serviceId: reqs[i].serviceId, variantId: reqs[i].variantId, name: q.lines[i].name, specialistId: p.specialistId, start: p.start, end: p.end, price: q.lines[i].price })),
      clientName: zuzana.name,
      phone: zuzana.phone,
      email: zuzana.email,
      note: "",
      accountId: zuzana.id,
      subtotal: q.subtotal,
      discounts,
      total,
      deposit: 0,
      depositPaid: false,
      status: "completed",
      source: "web",
      createdAt: now.getTime() - (v.daysAgo + 12) * DAY,
      log: [],
      stylistNote: v.note,
      rewardCode,
    });
  }

  // One visit coming up, so the account and the admin both have something to show.
  const upcoming = place(6, "laura", [{ serviceId: "gel-lak" }], true);
  if (upcoming) {
    const { iso, slot, reqs } = upcoming;
    const q = quote({ lines: reqs, db, now, date: iso, account: zuzana });
    db.appointments.push({
      id: "seed-upcoming",
      code: "AU-ZK26",
      date: iso,
      start: slot.start,
      end: slot.end,
      items: slot.parts.map((p, i) => ({ serviceId: reqs[i].serviceId, name: q.lines[i].name, specialistId: p.specialistId, start: p.start, end: p.end, price: q.lines[i].price })),
      clientName: zuzana.name,
      phone: zuzana.phone,
      email: zuzana.email,
      note: "Prosím jemný nude odtieň.",
      accountId: zuzana.id,
      subtotal: q.subtotal,
      discounts: q.discounts,
      total: q.total,
      deposit: 0,
      depositPaid: false,
      status: "confirmed",
      source: "web",
      createdAt: now.getTime() - 3 * DAY,
      log: [{ at: now.getTime() - 3 * DAY, text: "Rezervované online" }],
    });
  }

  // Simona on holiday for a few days, so the calendar shows how absences close slots.
  for (let i = 9; i <= 13; i++) db.absences.push(`simona|${toISODate(addDays(now, i))}`);

  // A team training placed in a real gap in Veronika's day.
  const training = place(4, "veronika", [{ serviceId: "farbenie-odrastov" }], true);
  if (training) db.blocks.push({ id: "seed-block", specialistId: "veronika", date: training.iso, start: training.slot.start, end: training.slot.end, label: "Školenie tímu: nové techniky strihu" });

  db.waitlist.push(
    {
      id: "seed-w1",
      date: toISODate(addDays(now, 1)),
      services: "Balayage / Airtouch",
      specialistId: "simona",
      name: "Michaela Tóthová",
      phone: "+421907555123",
      email: "michaela.tothova@example.com",
      createdAt: now.getTime() - 5 * 3_600_000,
      status: "waiting",
    },
    {
      id: "seed-w2",
      date: toISODate(addDays(now, 2)),
      services: "Gél lak na ruky",
      specialistId: "any",
      name: "Dominika Šimková",
      phone: "+421918444321",
      email: "dominika.simkova@example.com",
      createdAt: now.getTime() - 26 * 3_600_000,
      status: "waiting",
    },
  );
  db.messages.push(
    {
      id: "seed-m1",
      name: "Alexandra Lukáčová",
      email: "alexandra.l@example.com",
      phone: "+421944222111",
      topic: "Svadba",
      message: "Dobrý deň, budúci rok v júni sa vydávam a hľadám účes aj líčenie pre mňa a dve družičky. Dá sa to spraviť aj u nás v hoteli v Senci?",
      createdAt: now.getTime() - 9 * 3_600_000,
      read: false,
    },
    {
      id: "seed-m2",
      name: "Peter Horváth",
      email: "peter.horvath@example.com",
      topic: "Darček",
      message: "Chcel by som manželke darovať HydraGlow ošetrenie k výročiu. Viem ho zaplatiť vopred a dať jej len kód?",
      createdAt: now.getTime() - 30 * 3_600_000,
      read: true,
    },
  );
  return db;
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === 1) return { ...empty(), ...parsed };
    }
  } catch {
    // Private mode or corrupted data: start fresh.
  }
  return seed();
}

let db: DB = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked: the demo keeps working in memory.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  persist();
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) {
      db = load();
      emit();
    }
  });
}

export const getDB = () => db;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Immutable update: return a new DB from the current one. */
export function updateDB(change: (current: DB) => DB) {
  db = change(db);
  persist();
  emit();
}

export function resetDemo() {
  db = seed();
  persist();
  emit();
}

export function useDB() {
  return useSyncExternalStore(subscribe, getDB);
}

export function useAccount() {
  const current = useDB();
  return current.accounts.find((a) => a.id === current.sessionAccountId) ?? null;
}

export const newId = uid;
