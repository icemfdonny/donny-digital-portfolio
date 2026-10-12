import { roundMoney, toISODate } from "../../lib/format";
import { dayInfo } from "../../lib/hours";
import { historyAt } from "../../lib/orders";
import { seeded, slovakName } from "../../lib/random";
import type { Order, OrderStatus } from "../../lib/types";
import { updateDB } from "../../lib/store";

/** Chart colours, checked with the dataviz palette validator against the paper surface. */
export const CHART = { bar: "#2f7a4a", now: "#b47d1f", grid: "#e6dfd1" };

export type PastOrder = { id: string; number: number; at: number; total: number; mode: Order["mode"]; name: string; items: number };

/**
 * Online orders other guests placed earlier today, so the dashboard has a believable day behind it. Deterministic
 * per date and only up to the current time.
 */
export function pastOrdersToday(now: Date): PastOrder[] {
  const iso = toISODate(now);
  const { hours } = dayInfo(now);
  if (!hours) return [];
  const rand = seeded(`orders:${iso}`);
  const count = 14 + Math.floor(rand() * 12);
  const out: PastOrder[] = [];
  for (let i = 0; i < count; i++) {
    // Most orders cluster around lunch, some in the evening.
    const lunch = rand() < 0.62;
    const minute = lunch ? 11 * 60 + 15 + Math.floor(rand() * 180) : 17 * 60 + Math.floor(rand() * 240);
    const at = new Date(now);
    at.setHours(0, minute, 0, 0);
    if (at.getTime() > now.getTime() - 25 * 60_000 || minute > hours.kitchen) continue;
    out.push({
      id: `past-${iso}-${i}`,
      number: 0,
      at: at.getTime(),
      total: roundMoney(lunch ? 9 + rand() * 22 : 24 + rand() * 70),
      mode: rand() < 0.55 ? "delivery" : "pickup",
      name: slovakName(rand),
      items: lunch ? 1 + Math.floor(rand() * 3) : 2 + Math.floor(rand() * 4),
    });
  }
  out.sort((a, b) => a.at - b.at);
  out.forEach((o, i) => (o.number = 1000 + i));
  return out;
}

const NEXT: Record<Order["mode"], OrderStatus[]> = {
  pickup: ["received", "accepted", "preparing", "ready", "completed"],
  delivery: ["received", "accepted", "preparing", "delivering", "completed"],
};

export const nextStatusOf = (order: Order, status: OrderStatus) => {
  const steps = NEXT[order.mode];
  const i = steps.indexOf(status);
  return i >= 0 && i < steps.length - 1 ? steps[i + 1] : null;
};

/** Staff override: freezes the demo timeline and records the new step. */
export function setOrderStatus(order: Order, status: OrderStatus) {
  const now = Date.now();
  updateDB((db) => ({
    ...db,
    orders: db.orders.map((o) => (o.id === order.id ? { ...o, auto: false, history: [...historyAt(o, now), { status, at: now }] } : o)),
  }));
}

export function greeting(now: Date) {
  const h = now.getHours();
  return h < 10 ? "Dobré ráno" : h < 18 ? "Dobrý deň" : "Dobrý večer";
}
