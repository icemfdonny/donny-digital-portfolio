import { BOOKING, LOYALTY } from "../config";
import { SERVICE_BY_ID } from "../data/services";
import { effectiveStatus } from "./availability";
import { bundlesFor, liveService, priceFor } from "./catalog";
import { fromISODate, pad, roundMoney } from "./format";
import type { DB } from "./store";
import type { Account, Appointment } from "./types";

// ---------------------------------------------------------------------------------------------------------------
// Loyalty: points are derived from completed visits plus the account's ledger, so they can never drift.

const isBirthdayMonth = (account: Pick<Account, "birthday"> | null | undefined, iso: string) => !!account?.birthday && account.birthday.slice(0, 2) === iso.slice(5, 7);

export function visitPoints(total: number, account: Pick<Account, "birthday"> | null | undefined, iso: string) {
  return Math.floor(total) * LOYALTY.pointsPerEuro * (isBirthdayMonth(account, iso) ? LOYALTY.birthdayMultiplier : 1);
}

export function tierFor(lifetime: number) {
  const tiers = LOYALTY.tiers;
  let index = 0;
  for (let i = 0; i < tiers.length; i++) if (lifetime >= tiers[i].from) index = i;
  return { tier: tiers[index], next: tiers[index + 1] ?? null };
}

export type HistoryEntry = { id: string; at: number; points: number; label: string; pending?: boolean };

export function loyaltyState(account: Account, db: DB, now: Date) {
  const mine = db.appointments.filter((a) => a.accountId === account.id);
  const entries: HistoryEntry[] = [];
  let pending = 0;
  for (const a of mine) {
    const status = effectiveStatus(a, now);
    const points = visitPoints(a.total, account, a.date);
    const label = `Návšteva: ${a.items.map((i) => i.name).join(", ")}`;
    if (status === "completed") entries.push({ id: a.id, at: fromISODate(a.date).getTime() + a.end * 60_000, points, label });
    else if (status === "confirmed" || status === "arrived") pending += points;
  }
  // Friends who booked with this account's referral code and finished their first visit.
  for (const a of db.appointments) {
    if (a.referralCode !== account.referralCode || effectiveStatus(a, now) !== "completed") continue;
    entries.push({ id: `ref-${a.id}`, at: fromISODate(a.date).getTime() + a.end * 60_000, points: LOYALTY.referralPoints, label: `Odporúčanie: ${a.clientName.split(" ")[0]}` });
  }
  for (const e of account.ledger) entries.push(e);
  entries.sort((a, b) => b.at - a.at);
  const balance = entries.reduce((s, e) => s + e.points, 0);
  const lifetime = entries.reduce((s, e) => s + Math.max(0, e.points), 0);
  const { tier, next } = tierFor(lifetime);
  const visits = mine.filter((a) => effectiveStatus(a, now) === "completed");
  return { entries, balance, lifetime, pending, tier, next, visits };
}

/** Builds the next reward code; unique enough for a demo and easy to read out over the phone. */
export function rewardCode(rand = Math.random) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += alphabet[Math.floor(rand() * alphabet.length)];
  return `ODM-${code}`;
}

export const referralCodeFor = (name: string, rand = Math.random) =>
  `${name
    .split(" ")[0]
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .slice(0, 8)}${pad(Math.floor(rand() * 90) + 10)}`;

// ---------------------------------------------------------------------------------------------------------------
// Quote

export type QuoteLine = { serviceId: string; variantId?: string; specialistId: string | null };

export type Quote = {
  lines: { serviceId: string; name: string; price: number; approx: boolean }[];
  subtotal: number;
  discounts: { label: string; amount: number }[];
  total: number;
  deposit: number;
  points: number;
  code: { ok: boolean; message: string; kind?: "reward" | "referral" } | null;
};

export function quote({
  lines,
  account,
  code,
  db,
  now,
  date,
}: {
  lines: QuoteLine[];
  account?: Account | null;
  code?: string;
  db: DB;
  now: Date;
  date?: string;
}): Quote {
  const priced = lines.map((l) => {
    const s = liveService(l.serviceId, db.serviceOverrides);
    // Without a chosen specialist the senior price is a fair estimate; the exact one comes with the time slot.
    const approx = !l.specialistId && !!s.levelPricing;
    return { serviceId: l.serviceId, name: s.name, price: priceFor(l.serviceId, l.variantId, l.specialistId, db.serviceOverrides), approx };
  });
  const subtotal = roundMoney(priced.reduce((s, l) => s + l.price, 0));
  const discounts: { label: string; amount: number }[] = [];

  for (const b of bundlesFor(lines.map((l) => l.serviceId))) discounts.push({ label: `Kombinácia: ${b.label}`, amount: b.amount });

  if (account) {
    const { tier } = loyaltyState(account, db, now);
    if (tier.discount) {
      const base = subtotal - discounts.reduce((s, d) => s + d.amount, 0);
      discounts.push({ label: `Vernostná zľava ${tier.name} ${Math.round(tier.discount * 100)} %`, amount: roundMoney(Math.max(0, base) * tier.discount) });
    }
  }

  let codeResult: Quote["code"] = null;
  const normalized = code?.trim().toUpperCase();
  if (normalized) {
    const reward = account?.rewards.find((r) => r.code === normalized);
    const otherReward = db.accounts.some((a) => a.id !== account?.id && a.rewards.some((r) => r.code === normalized));
    const referrer = db.accounts.find((a) => a.referralCode === normalized);
    if (reward) {
      const def = LOYALTY.rewards.find((r) => r.id === reward.rewardId);
      if (reward.usedAt) codeResult = { ok: false, message: "Táto odmena už bola použitá." };
      else if (def) {
        discounts.push({ label: `Odmena: ${def.title}`, amount: def.value });
        codeResult = { ok: true, message: `Odmena „${def.title}“ uplatnená.`, kind: "reward" };
      }
    } else if (otherReward) {
      codeResult = { ok: false, message: "Odmena patrí inému účtu. Prihláste sa, prosím." };
    } else if (referrer) {
      const hasVisits = account && db.appointments.some((a) => a.accountId === account.id && a.status !== "cancelled");
      if (referrer.id === account?.id) codeResult = { ok: false, message: "Vlastný kód odporúčania pošlite kamarátke." };
      else if (hasVisits) codeResult = { ok: false, message: "Kód odporúčania platí len na prvú návštevu." };
      else {
        discounts.push({ label: `Odporúčanie od ${referrer.name.split(" ")[0]}`, amount: LOYALTY.referralFriendDiscount });
        codeResult = { ok: true, message: `Vitajte! Zľava ${LOYALTY.referralFriendDiscount} € na prvú návštevu.`, kind: "referral" };
      }
    } else {
      codeResult = { ok: false, message: "Tento kód nepoznáme." };
    }
  }

  const discountTotal = roundMoney(discounts.reduce((s, d) => s + d.amount, 0));
  const total = roundMoney(Math.max(0, subtotal - discountTotal));
  const needsDeposit = lines.some((l) => SERVICE_BY_ID.get(l.serviceId)?.deposit) || total >= BOOKING.depositFrom;
  const deposit = needsDeposit && total > 0 ? Math.min(total, Math.max(BOOKING.depositMin, Math.round(total * BOOKING.depositShare))) : 0;
  return { lines: priced, subtotal, discounts, total, deposit, points: visitPoints(total, account, date ?? ""), code: codeResult };
}

/** Hours left before free cancellation ends; negative once it has. */
export function hoursUntil(a: Pick<Appointment, "date" | "start">, now: Date) {
  const start = fromISODate(a.date);
  start.setMinutes(a.start);
  return (start.getTime() - now.getTime()) / 3_600_000;
}

export const canCancelFree = (a: Pick<Appointment, "date" | "start">, now: Date) => hoursUntil(a, now) >= BOOKING.freeCancelHours;
