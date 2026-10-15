import { URGENCY, VAT_RATE, type UrgencyId } from "../config";
import type { CalcJob, CalcValues, PriceItem } from "../data/trades";
import { travelFee } from "./geo";
import { TRADE } from "./profile";

export type PricedLine = { item: string; label: string; qty: number; unit: string; price: number; total: number; kind: PriceItem["kind"] };

export type Estimate = {
  lines: PricedLine[];
  /** Sum of the lines, without VAT. */
  subtotal: number;
  urgencyFee: number;
  travelFee: number;
  /** Everything without VAT. */
  net: number;
  vat: number;
  gross: number;
  /** Rounded range shown to the visitor. */
  low: number;
  high: number;
  days: number;
};

export type PriceSettings = { overrides: Record<string, number>; vatPayer: boolean; perKm: number; freeKm: number };

const ITEM_BY_ID = new Map(TRADE.prices.map((p) => [p.id, p]));

export const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function priceItem(id: string) {
  return ITEM_BY_ID.get(id);
}

export function priceOf(id: string, overrides: Record<string, number>) {
  return overrides[id] ?? ITEM_BY_ID.get(id)?.price ?? 0;
}

export function defaultValues(job: CalcJob): CalcValues {
  return Object.fromEntries(job.inputs.map((i) => [i.id, i.default]));
}

export function priceLines(job: CalcJob, values: CalcValues, overrides: Record<string, number>): PricedLine[] {
  return job.lines(values).map((l) => {
    const item = ITEM_BY_ID.get(l.item);
    const price = priceOf(l.item, overrides);
    return { item: l.item, label: l.label ?? item?.label ?? l.item, qty: l.qty, unit: item?.unit ?? "ks", price, total: roundMoney(price * l.qty), kind: item?.kind ?? "praca" };
  });
}

export function estimate(job: CalcJob, values: CalcValues, settings: PriceSettings, opts: { urgency?: UrgencyId; km?: number | null } = {}): Estimate {
  const lines = priceLines(job, values, settings.overrides);
  const subtotal = roundMoney(lines.reduce((s, l) => s + l.total, 0));
  const labour = lines.filter((l) => l.kind === "praca").reduce((s, l) => s + l.total, 0);
  const factor = URGENCY.find((u) => u.id === (opts.urgency ?? "normal"))?.factor ?? 0;
  const urgencyFee = roundMoney(labour * factor);
  const days = Math.max(1, job.days(values));
  const travel = travelFee(opts.km ?? null, days, settings.perKm, settings.freeKm);
  const net = roundMoney(subtotal + urgencyFee + travel);
  const vat = settings.vatPayer ? roundMoney(net * VAT_RATE) : 0;
  const gross = roundMoney(net + vat);
  const step = gross > 3000 ? 50 : 10;
  return { lines, subtotal, urgencyFee, travelFee: travel, net, vat, gross, low: roundTo(gross * 0.93, step), high: roundTo(gross * 1.1, step), days };
}

/** Totals of a quote document from its items. */
export function quoteTotals(items: { qty: number; price: number }[], discountPct: number, vatPayer: boolean) {
  const subtotal = roundMoney(items.reduce((s, i) => s + i.qty * i.price, 0));
  const discount = roundMoney((subtotal * discountPct) / 100);
  const net = roundMoney(subtotal - discount);
  const vat = vatPayer ? roundMoney(net * VAT_RATE) : 0;
  return { subtotal, discount, net, vat, gross: roundMoney(net + vat) };
}

export const jobById = (id: string | undefined | null) => TRADE.jobs.find((j) => j.id === id);
