import type { UrgencyId } from "../config";
import type { CalcValues } from "../data/trades";
import type { PricedLine } from "./calc";

export type Stage = "novy" | "obhliadka" | "ponuka" | "prijata" | "realizacia" | "hotovo" | "strateny";
export type LeadSource = "kalkulacka" | "obhliadka" | "havaria" | "telefon" | "kontakt";

export type LogEntry = { at: string; text: string };

/** A customer request moving through the sales pipeline. */
export type Lead = {
  id: string;
  code: string;
  createdAt: string;
  source: LeadSource;
  stage: Stage;
  name: string;
  phone: string;
  email: string;
  town: string;
  street?: string;
  km: number | null;
  jobId?: string;
  jobTitle: string;
  values?: CalcValues;
  lines?: PricedLine[];
  estimate?: { low: number; high: number; gross: number; days: number };
  urgency?: UrgencyId;
  note: string;
  photos: string[];
  contactPref?: "telefon" | "email" | "whatsapp";
  visitId?: string;
  quoteId?: string;
  /** Agreed price once the quote is accepted. */
  value?: number;
  /** Start date of the job (YYYY-MM-DD) once scheduled. */
  startDate?: string;
  lostReason?: string;
  log: LogEntry[];
};

export type VisitStatus = "planned" | "done" | "cancelled";

/** A booked arrival window: survey, service call or inspection. */
export type Visit = {
  id: string;
  code: string;
  createdAt: string;
  leadId: string;
  typeId: string;
  date: string;
  window: number;
  techId: string;
  name: string;
  phone: string;
  email: string;
  town: string;
  street: string;
  /** Generated visits store a place index instead of a town name (see geo.placeName). */
  place?: number;
  note: string;
  status: VisitStatus;
  log: LogEntry[];
};

export type EmergencyStatus = "prijate" | "pridelene" | "na-ceste" | "na-mieste" | "vyriesene" | "zrusene";

export type EmergencyCall = {
  id: string;
  code: string;
  createdAt: string;
  issueId: string;
  name: string;
  phone: string;
  town: string;
  street: string;
  note: string;
  km: number;
  etaMin: number;
  night: boolean;
  techId: string;
  status: EmergencyStatus;
  /** When true the demo advances the status on its own; an admin action takes over. */
  auto: boolean;
  timeline: { status: EmergencyStatus; at: string }[];
  rating?: number;
};

export type QuoteItem = { id: string; label: string; qty: number; unit: string; price: number; kind: PricedLine["kind"] };
export type QuoteStatus = "koncept" | "odoslana" | "zobrazena" | "prijata" | "odmietnuta";

export type Quote = {
  id: string;
  code: string;
  leadId: string;
  createdAt: string;
  items: QuoteItem[];
  discountPct: number;
  validDays: number;
  note: string;
  status: QuoteStatus;
  sentAt?: string;
  viewedAt?: string;
  decidedAt?: string;
  acceptedBy?: string;
  declineReason?: string;
  /** Proposed start date shown on the quote. */
  startDate?: string;
};

export type Settings = {
  overrides: Record<string, number>;
  vatPayer: boolean;
  emergencyOn: boolean;
  freeKm: number;
  perKm: number;
};
