import { useSyncExternalStore } from "react";
import { TRAVEL } from "../config";
import type { CalcValues } from "../data/trades";
import { slotsFor } from "./availability";
import { defaultValues, estimate } from "./calc";
import { addDays, makeCode, toISODate, uid } from "./format";
import { TRADE } from "./profile";
import { pick, seeded, slovakName } from "./random";
import type { EmergencyCall, Lead, LeadSource, Quote, Settings, Stage, Visit } from "./types";

/**
 * The demo's "backend": one JSON document per trade in localStorage. Every page and the admin read it through
 * useDB(), and the storage event keeps open tabs in sync, so a request sent from the website pops up in the admin
 * in another tab, and a quote sent from the admin can be accepted on the customer's page.
 */
export type DB = {
  version: 1;
  leads: (Lead & { place?: number })[];
  visits: Visit[];
  emergencies: EmergencyCall[];
  quotes: Quote[];
  settings: Settings;
  adminVisited: boolean;
  quoteSeq: number;
  /** What the visitor has tried, for the checklist in the demo badge. */
  progress: Partial<Record<DemoTask, boolean>>;
};

export type DemoTask = "kalkulacka" | "obhliadka" | "havaria" | "admin" | "ponuka";

const KEY = `majster-demo:v1:${TRADE.id}`;
const DAY = 86_400_000;

export const DEFAULT_SETTINGS: Settings = { overrides: {}, vatPayer: true, emergencyOn: true, freeKm: TRAVEL.freeKm, perKm: TRAVEL.perKm };

function randomValues(rand: () => number, inputs: (typeof TRADE.jobs)[number]["inputs"]): CalcValues {
  const v: CalcValues = {};
  for (const i of inputs) {
    if (i.kind === "number") {
      const span = (i.max - i.min) * 0.45;
      const raw = i.default + (rand() - 0.4) * span;
      v[i.id] = Math.min(i.max, Math.max(i.min, Math.round(raw / i.step) * i.step));
      v[i.id] = Math.round(Number(v[i.id]) * 100) / 100;
    } else if (i.kind === "count") v[i.id] = Math.min(i.max, Math.max(i.min, Math.round(i.default + (rand() - 0.4) * 4)));
    else if (i.kind === "choice") v[i.id] = rand() < 0.55 ? i.default : pick(rand, i.options).id;
    else v[i.id] = rand() < 0.75 ? i.default : !i.default;
  }
  return v;
}

const emailOf = (name: string) =>
  `${name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, ".")}@example.com`;

const phoneOf = (rand: () => number) => `+4219${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`;

const LOST_REASONS = ["Vybral si lacnejšiu ponuku", "Projekt odložil na budúci rok", "Nereaguje na telefón", "Termín mu nevyhovoval", "Rozhodol sa robiť svojpomocne"];

/** Pipeline the admin opens to: a believable mix of fresh, active and finished requests. */
const PLAN: { stage: Stage; ages: number[] }[] = [
  { stage: "novy", ages: [0.04, 0.35, 0.9, 1.7] },
  { stage: "obhliadka", ages: [2.2, 3.1, 4.4] },
  { stage: "ponuka", ages: [5.2, 7.5, 9.1, 12.3] },
  { stage: "prijata", ages: [14, 17.5] },
  { stage: "realizacia", ages: [21, 25] },
  { stage: "hotovo", ages: [28, 30, 34, 36.5, 41, 42, 47, 52, 53, 55, 60, 64, 65, 66.5, 72, 78, 79, 83, 86] },
  { stage: "strateny", ages: [11, 26, 39, 44, 61, 69, 73] },
];

function seed(): DB {
  const now = Date.now();
  const today = new Date();
  const rand = seeded(`${TRADE.id}|seed`);
  const db: DB = { version: 1, leads: [], visits: [], emergencies: [], quotes: [], settings: { ...DEFAULT_SETTINGS }, adminVisited: false, quoteSeq: 40, progress: {} };
  const sources: LeadSource[] = TRADE.emergency
    ? ["kalkulacka", "kalkulacka", "kalkulacka", "obhliadka", "obhliadka", "telefon", "telefon", "kontakt"]
    : ["kalkulacka", "kalkulacka", "kalkulacka", "obhliadka", "obhliadka", "telefon", "kontakt"];

  for (const { stage, ages } of PLAN) {
    for (const age of ages) {
      const job = pick(rand, TRADE.jobs);
      const values = randomValues(rand, job.inputs);
      const place = rand() < 0.35 ? 0 : 1 + Math.floor(rand() * 7);
      const km = place === 0 ? 4 + Math.round(rand() * 6) : 10 + Math.round(rand() * 26);
      const est = estimate(job, values, DEFAULT_SETTINGS, { km });
      const name = slovakName(rand, 0.45);
      const jitter = age > 6 ? (rand() - 0.5) * 2.5 : 0;
      const createdAt = new Date(now - (age + jitter) * DAY - Math.floor(rand() * 5) * 3_600_000);
      const at = (days: number, hour = 10) => {
        const d = new Date(createdAt.getTime() + days * DAY);
        d.setHours(hour, Math.floor(rand() * 4) * 15, 0, 0);
        return d.toISOString();
      };
      const source = pick(rand, sources);
      const lead: DB["leads"][number] = {
        id: uid(),
        code: makeCode("DP", 4, rand),
        createdAt: createdAt.toISOString(),
        source,
        stage,
        name,
        phone: phoneOf(rand),
        email: emailOf(name),
        town: "",
        place,
        km,
        jobId: job.id,
        jobTitle: job.title,
        values,
        lines: source === "kalkulacka" ? est.lines : undefined,
        estimate: { low: est.low, high: est.high, gross: est.gross, days: est.days },
        note: pick(rand, TRADE.sampleNotes),
        photos: [],
        contactPref: rand() < 0.7 ? "telefon" : "email",
        log: [{ at: createdAt.toISOString(), text: source === "telefon" ? "Dopyt zapísaný z telefonátu" : source === "kalkulacka" ? "Dopyt z online kalkulačky" : source === "kontakt" ? "Správa z kontaktného formulára" : "Objednaná obhliadka cez web" }],
      };

      const after = ["ponuka", "prijata", "realizacia", "hotovo", "strateny"].includes(stage);
      if (stage === "obhliadka") {
        // A real future visit, placed into a window that is actually free.
        for (let d = 1; d < 10 && !lead.visitId; d++) {
          const slots = slotsFor(addDays(today, d + Math.floor(rand() * 3)), db, today).filter((s) => s.free.length);
          if (!slots.length) continue;
          const s = pick(rand, slots);
          const visit: Visit = {
            id: uid(),
            code: makeCode("OB", 4, rand),
            createdAt: lead.createdAt,
            leadId: lead.id,
            typeId: TRADE.visitTypes[0].id,
            date: s.date,
            window: s.index,
            techId: s.free.includes("t1") ? "t1" : s.free[0],
            name,
            phone: lead.phone,
            email: lead.email,
            town: "",
            place,
            street: `${pick(rand, ["Hlavná", "Školská", "Záhradná", "Lipová", "Krátka", "Poľná", "Sadová"])} ${1 + Math.floor(rand() * 60)}`,
            note: lead.note,
            status: "planned",
            log: [{ at: lead.createdAt, text: "Objednané" }],
          };
          db.visits.push(visit);
          lead.visitId = visit.id;
          lead.log.push({ at: at(0.1), text: "Naplánovaná obhliadka" });
        }
      }
      if (after) lead.log.push({ at: at(1, 9), text: "Obhliadka u zákazníka" });
      if (after && stage !== "strateny") {
        const quote = quoteFromLead(db, lead, est.lines);
        quote.createdAt = at(2, 14);
        quote.status = stage === "ponuka" ? (rand() < 0.5 ? "zobrazena" : "odoslana") : "prijata";
        quote.sentAt = at(2, 15);
        if (quote.status !== "odoslana") quote.viewedAt = at(2.4, 19);
        if (quote.status === "prijata") {
          quote.decidedAt = at(3.5, 20);
          quote.acceptedBy = name;
          lead.value = Math.round(est.gross * (0.94 + rand() * 0.1));
        }
        db.quotes.push(quote);
        lead.quoteId = quote.id;
        lead.log.push({ at: quote.sentAt, text: `Odoslaná cenová ponuka ${quote.code}` });
        if (quote.status === "prijata") lead.log.push({ at: quote.decidedAt!, text: "Zákazník prijal ponuku online" });
      }
      if (stage === "prijata") lead.startDate = toISODate(addDays(today, 4 + Math.floor(rand() * 10)));
      if (stage === "realizacia") lead.startDate = toISODate(addDays(today, -1 - Math.floor(rand() * 3)));
      if (stage === "hotovo") {
        lead.startDate = toISODate(new Date(createdAt.getTime() + 9 * DAY));
        lead.log.push({ at: at(9 + est.days, 16), text: "Zákazka odovzdaná" });
      }
      if (stage === "strateny") {
        lead.lostReason = pick(rand, LOST_REASONS);
        lead.log.push({ at: at(4, 11), text: `Stratený: ${lead.lostReason}` });
      }
      db.leads.push(lead);
    }
  }

  if (TRADE.emergency) {
    for (const [i, age] of [1.4, 6.2, 13.8].entries()) {
      const created = new Date(now - age * DAY);
      const issue = TRADE.emergency.issues[i % (TRADE.emergency.issues.length - 1)];
      const eta = 25 + Math.floor(rand() * 5) * 5;
      const t = (min: number) => new Date(created.getTime() + min * 60_000).toISOString();
      db.emergencies.push({
        id: uid(),
        code: makeCode("HV", 4, rand),
        createdAt: created.toISOString(),
        issueId: issue.id,
        name: slovakName(rand, 0.45),
        phone: phoneOf(rand),
        town: "",
        street: `${pick(rand, ["Hlavná", "Mierová", "Športová", "Jarná"])} ${1 + Math.floor(rand() * 40)}`,
        note: "",
        km: 6 + Math.floor(rand() * 20),
        etaMin: eta,
        night: i === 0,
        techId: TRADE.crew[2].id,
        status: "vyriesene",
        auto: false,
        rating: 5,
        timeline: [
          { status: "prijate", at: t(0) },
          { status: "pridelene", at: t(2) },
          { status: "na-ceste", at: t(6) },
          { status: "na-mieste", at: t(eta - 3) },
          { status: "vyriesene", at: t(eta + 55) },
        ],
      });
    }
  }
  return db;
}

/** Draft quote with the lead's calculator lines (or a sensible default for the job). */
export function quoteFromLead(db: DB, lead: Lead, lines = lead.lines): Quote {
  const job = TRADE.jobs.find((j) => j.id === lead.jobId) ?? TRADE.jobs[0];
  const items = (lines ?? estimate(job, lead.values ?? defaultValues(job), db.settings).lines).map((l) => ({ id: uid(), label: l.label, qty: l.qty, unit: l.unit, price: l.price, kind: l.kind }));
  const extraKm = Math.max(0, (lead.km ?? 0) - db.settings.freeKm);
  if (extraKm > 0) items.push({ id: uid(), label: `Doprava (${lead.km} km, tam a späť)`, qty: extraKm * 2 * (lead.estimate?.days ?? 1), unit: "km", price: db.settings.perKm, kind: "praca" });
  db.quoteSeq += 1;
  return {
    id: uid(),
    code: `CP-${new Date().getFullYear()}-${String(db.quoteSeq).padStart(4, "0")}`,
    leadId: lead.id,
    createdAt: new Date().toISOString(),
    items,
    discountPct: 0,
    validDays: 30,
    note: "",
    status: "koncept",
  };
}

let cache: DB | null = null;
const listeners = new Set<() => void>();

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === 1) return { ...parsed, progress: parsed.progress ?? {}, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
    }
  } catch {
    // fall through to a fresh seed
  }
  const fresh = seed();
  persist(fresh);
  return fresh;
}

function persist(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Quota (large photos) or blocked storage: keep working in memory.
  }
}

export function getDB() {
  cache ??= load();
  return cache;
}

export function updateDB(fn: (db: DB) => DB | void) {
  const draft = structuredClone(getDB());
  const next = fn(draft) ?? draft;
  cache = next;
  persist(next);
  listeners.forEach((l) => l());
}

export function markProgress(task: DemoTask) {
  if (getDB().progress[task]) return;
  updateDB((db) => {
    db.progress[task] = true;
  });
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  cache = null;
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    cache = null;
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDB() {
  return useSyncExternalStore(subscribe, getDB);
}
