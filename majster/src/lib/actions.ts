import { useCallback } from "react";
import { etaFor, isOffHours, onCall } from "./emergency";
import { makeCode, uid } from "./format";
import { placeName, useGeo } from "./geo";
import { getDB, quoteFromLead, updateDB, type DB } from "./store";
import type { EmergencyCall, EmergencyStatus, Lead, Quote, Settings, Stage, Visit } from "./types";

const nowISO = () => new Date().toISOString();

export const STAGES: { id: Stage; label: string; short: string; tone: string }[] = [
  { id: "novy", label: "Nový dopyt", short: "Nový", tone: "bg-accent" },
  { id: "obhliadka", label: "Obhliadka", short: "Obhliadka", tone: "bg-[#60a5fa]" },
  { id: "ponuka", label: "Ponuka odoslaná", short: "Ponuka", tone: "bg-[#a78bfa]" },
  { id: "prijata", label: "Prijatá", short: "Prijatá", tone: "bg-[#34d399]" },
  { id: "realizacia", label: "V realizácii", short: "Realizácia", tone: "bg-[#fb923c]" },
  { id: "hotovo", label: "Dokončené", short: "Hotovo", tone: "bg-ok" },
];

export const stageLabel = (s: Stage) => (s === "strateny" ? "Stratený" : (STAGES.find((x) => x.id === s)?.label ?? s));

export const SOURCE_LABEL: Record<Lead["source"], string> = {
  kalkulacka: "Kalkulačka",
  obhliadka: "Rezervácia",
  havaria: "Havária",
  telefon: "Telefón",
  kontakt: "Kontaktný formulár",
};

/** Town of a lead, also for generated leads that only store a place index. */
export function useTownOf() {
  const geo = useGeo();
  return useCallback((x: { town: string; place?: number }) => x.town || placeName(x.place ?? 0, geo), [geo]);
}

type NewLead = Omit<Lead, "id" | "code" | "createdAt" | "stage" | "log"> & { stage?: Stage; logText: string };

export function createLead(data: NewLead) {
  const { logText, stage = "novy", ...rest } = data;
  const lead: Lead = { ...rest, id: uid(), code: makeCode("DP"), createdAt: nowISO(), stage, log: [{ at: nowISO(), text: logText }] };
  updateDB((db) => {
    db.leads.unshift(lead);
  });
  return lead;
}

export function updateLead(id: string, patch: Partial<Lead>, logText?: string) {
  updateDB((db) => {
    const lead = db.leads.find((l) => l.id === id);
    if (!lead) return;
    Object.assign(lead, patch);
    if (logText) lead.log.push({ at: nowISO(), text: logText });
  });
}

export function moveStage(id: string, stage: Stage, extra: Partial<Lead> = {}) {
  const lead = getDB().leads.find((l) => l.id === id);
  if (!lead || lead.stage === stage) return;
  updateLead(id, { ...extra, stage }, stage === "strateny" ? `Stratený${extra.lostReason ? `: ${extra.lostReason}` : ""}` : `Presunuté do „${stageLabel(stage)}“`);
}

export function bookVisit(data: Omit<Visit, "id" | "code" | "createdAt" | "status" | "log">) {
  const visit: Visit = { ...data, id: uid(), code: makeCode("OB"), createdAt: nowISO(), status: "planned", log: [{ at: nowISO(), text: "Objednané cez web" }] };
  updateDB((db) => {
    db.visits.push(visit);
    const lead = db.leads.find((l) => l.id === data.leadId);
    if (lead) {
      lead.visitId = visit.id;
      if (lead.stage === "novy") lead.stage = "obhliadka";
      lead.log.push({ at: nowISO(), text: `Zákazník si objednal termín ${visit.code}` });
    }
  });
  return visit;
}

export function updateVisit(id: string, patch: Partial<Visit>, logText: string) {
  updateDB((db) => {
    const v = db.visits.find((x) => x.id === id);
    if (!v) return;
    Object.assign(v, patch);
    v.log.push({ at: nowISO(), text: logText });
    const lead = db.leads.find((l) => l.id === v.leadId);
    if (lead) lead.log.push({ at: nowISO(), text: `${logText} (${v.code})` });
  });
}

export function reportEmergency(data: Pick<EmergencyCall, "issueId" | "name" | "phone" | "town" | "street" | "note" | "km">) {
  const now = new Date();
  const crew = onCall(now);
  const e: EmergencyCall = {
    ...data,
    id: uid(),
    code: makeCode("HV"),
    createdAt: now.toISOString(),
    etaMin: etaFor(data.km, now),
    night: isOffHours(now),
    techId: crew[0]?.id ?? "t2",
    status: "prijate",
    auto: true,
    timeline: [{ status: "prijate", at: now.toISOString() }],
  };
  updateDB((db) => {
    db.emergencies.unshift(e);
  });
  return e;
}

export function setEmergencyStatus(id: string, status: EmergencyStatus, opts: { manual?: boolean; techId?: string } = {}) {
  updateDB((db) => {
    const e = db.emergencies.find((x) => x.id === id);
    if (!e || e.status === status) return;
    e.status = status;
    if (opts.techId) e.techId = opts.techId;
    if (opts.manual) e.auto = false;
    e.timeline = e.timeline.filter((t) => t.status !== status);
    e.timeline.push({ status, at: nowISO() });
  });
}

export function rateEmergency(id: string, rating: number) {
  updateDB((db) => {
    const e = db.emergencies.find((x) => x.id === id);
    if (e) e.rating = rating;
  });
}

/** Opens the lead's quote, creating a draft from its calculator lines the first time. */
export function ensureQuote(leadId: string) {
  let id = getDB().leads.find((l) => l.id === leadId)?.quoteId;
  if (id && getDB().quotes.some((q) => q.id === id)) return id;
  updateDB((db: DB) => {
    const lead = db.leads.find((l) => l.id === leadId);
    if (!lead) return;
    const quote = quoteFromLead(db, lead);
    db.quotes.push(quote);
    lead.quoteId = quote.id;
    lead.log.push({ at: nowISO(), text: `Vytvorený koncept ponuky ${quote.code}` });
    id = quote.id;
  });
  return id;
}

export function saveQuote(quote: Quote) {
  updateDB((db) => {
    const i = db.quotes.findIndex((q) => q.id === quote.id);
    if (i >= 0) db.quotes[i] = quote;
  });
}

export function sendQuote(quote: Quote) {
  updateDB((db) => {
    const i = db.quotes.findIndex((q) => q.id === quote.id);
    if (i < 0) return;
    db.quotes[i] = { ...quote, status: "odoslana", sentAt: nowISO(), viewedAt: undefined, decidedAt: undefined, acceptedBy: undefined, declineReason: undefined };
    const lead = db.leads.find((l) => l.id === quote.leadId);
    if (lead) {
      if (["novy", "obhliadka"].includes(lead.stage)) lead.stage = "ponuka";
      lead.log.push({ at: nowISO(), text: `Odoslaná cenová ponuka ${quote.code}` });
    }
  });
}

export function markQuoteViewed(id: string) {
  const q = getDB().quotes.find((x) => x.id === id);
  if (!q || q.status !== "odoslana") return;
  updateDB((db) => {
    const quote = db.quotes.find((x) => x.id === id)!;
    quote.status = "zobrazena";
    quote.viewedAt = nowISO();
    db.leads.find((l) => l.id === quote.leadId)?.log.push({ at: nowISO(), text: "Zákazník si otvoril ponuku" });
  });
}

export function decideQuote(id: string, accepted: boolean, by: string, reason?: string, gross?: number) {
  updateDB((db) => {
    const quote = db.quotes.find((x) => x.id === id);
    if (!quote) return;
    quote.status = accepted ? "prijata" : "odmietnuta";
    quote.decidedAt = nowISO();
    quote.acceptedBy = accepted ? by : undefined;
    quote.declineReason = accepted ? undefined : reason;
    const lead = db.leads.find((l) => l.id === quote.leadId);
    if (!lead) return;
    if (accepted) {
      lead.stage = "prijata";
      lead.value = gross;
      lead.startDate = quote.startDate;
      lead.log.push({ at: nowISO(), text: `Zákazník prijal ponuku online (${by})` });
    } else lead.log.push({ at: nowISO(), text: `Zákazník odmietol ponuku${reason ? `: ${reason}` : ""}` });
  });
}

export function saveSettings(patch: Partial<Settings>) {
  updateDB((db) => {
    db.settings = { ...db.settings, ...patch };
  });
}
