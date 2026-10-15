import type { IconName } from "../../components/icons";

export type TradeId = "elektrikar" | "instalater" | "stolar" | "obkladac" | "maliar";

/** One row of the price list. Prices are without VAT; the admin can override them and the calculator follows. */
export type PriceItem = { id: string; group: string; label: string; unit: string; price: number; kind: "praca" | "material" | "zariadenie" };

export type CalcInput =
  | { kind: "number"; id: string; label: string; unit: string; min: number; max: number; step: number; default: number; hint?: string }
  | { kind: "count"; id: string; label: string; min: number; max: number; default: number; hint?: string }
  | { kind: "choice"; id: string; label: string; options: { id: string; label: string; hint?: string }[]; default: string; hint?: string }
  | { kind: "toggle"; id: string; label: string; default: boolean; hint?: string };

export type CalcValues = Record<string, number | string | boolean>;

/** A line the calculator produces: a price list item (by id) times a quantity, optionally relabelled. */
export type CalcLine = { item: string; qty: number; label?: string };

/** A job the online calculator can price. `lines` turns the visitor's answers into price list lines. */
export type CalcJob = {
  id: string;
  title: string;
  text: string;
  icon: IconName;
  photo: string;
  inputs: CalcInput[];
  lines: (v: CalcValues) => CalcLine[];
  /** Working days on site, used for travel and the schedule. */
  days: (v: CalcValues) => number;
  /** Shown under the result: what the estimate assumes. */
  assumptions: string[];
  /** The input whose value goes into the quick estimate on the home page. */
  quick: string;
};

export type Service = {
  id: string;
  title: string;
  text: string;
  icon: IconName;
  photo: string;
  /** "od 45 €/m²" style starting price. */
  from: string;
  bullets: string[];
  /** Calculator job that prices this service, if any. */
  job?: string;
};

export type VisitType = {
  id: string;
  title: string;
  text: string;
  price: string;
  /** Takes place at the workshop or showroom, so no address is needed. */
  atBase?: boolean;
};

export type EmergencyIssue = { id: string; title: string; icon: IconName; safety: string[]; urgent?: boolean };

export type Emergency = {
  title: string;
  issues: EmergencyIssue[];
  callout: number;
  hourly: number;
  /** Surcharge at night (20:00–6:00), weekends and holidays. */
  nightSurcharge: number;
};

export type Project = {
  id: string;
  title: string;
  photo: string;
  service: string;
  /** 0 is the firm's own town, 1+ the nearby towns in order of size. */
  place: number;
  monthsAgo: number;
  days: number;
  price: number;
  text: string;
  scope: string[];
  review?: { name: string; text: string };
};

export type Review = { name: string; place: number; rating: number; text: string; service: string; monthsAgo: number };

export type CrewMember = { id: string; name: string; role: string; since: number };

export type Trade = {
  id: TradeId;
  /** "Elektrikár" */
  label: string;
  /** Short description under the logo. */
  tagline: string;
  icon: IconName;
  defaults: { name: string; city: string; owner: string };
  colors: { accent: string; ink: string; deep: string; soft: string };
  /** Used in the cold-mail generator and the demo badge: "elektrikárov" (genitive plural). */
  plural: string;
  hero: { title: string; highlight: string; text: string; photo: string };
  aboutPhoto: string;
  about: string;
  stats: { since: number; jobs: number; rating: number; reviews: number; warranty: number };
  usps: { icon: IconName; title: string; text: string }[];
  certs: string[];
  services: Service[];
  prices: PriceItem[];
  jobs: CalcJob[];
  visitTypes: VisitType[];
  emergency: Emergency | null;
  projects: Project[];
  reviews: Review[];
  faq: { q: string; a: string }[];
  crew: CrewMember[];
  /** Sample notes customers leave with a request, for the generated admin data. */
  sampleNotes: string[];
};
