import { ORDERING } from "../config";
import type { Order, OrderStatus } from "./types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Prijatá",
  accepted: "Potvrdená",
  preparing: "Pripravuje sa",
  ready: "Pripravená na vyzdvihnutie",
  delivering: "Kuriér je na ceste",
  completed: "Hotovo",
  cancelled: "Zrušená",
};

export const STATUS_HINT: Record<OrderStatus, string> = {
  received: "Objednávku sme prijali a kuchyňa ju práve potvrdzuje.",
  accepted: "Kuchyňa potvrdila objednávku a chystá suroviny.",
  preparing: "Jedlo sa práve varí. Balíme ho do kompostovateľných obalov.",
  ready: "Všetko je zabalené a čaká na vás pri bare.",
  delivering: "Kuriér má vašu objednávku a smeruje k vám.",
  completed: "Dobrú chuť! Budeme radi za vaše hodnotenie.",
  cancelled: "Objednávka bola zrušená. Ak ste platili kartou, peniaze vrátime do 3 pracovných dní.",
};

export const stepsFor = (mode: Order["mode"]): OrderStatus[] =>
  mode === "pickup" ? ["received", "accepted", "preparing", "ready", "completed"] : ["received", "accepted", "preparing", "delivering", "completed"];

/** The promised time: the scheduled one, or now plus typical prep (and ride) time. */
export const etaOf = (order: Order) =>
  order.scheduledFor ?? order.createdAt + (order.mode === "pickup" ? ORDERING.pickupMinutes : ORDERING.deliveryMinutes) * 60_000;

/**
 * Demo timeline, sped up so a visitor sees the whole journey in a few minutes. Scheduled orders wait and start
 * cooking shortly before their time, as a real kitchen would.
 */
function autoTimeline(order: Order): { status: OrderStatus; at: number }[] {
  const t0 = order.createdAt;
  const s = 1000;
  const steps: { status: OrderStatus; at: number }[] = [
    { status: "received", at: t0 },
    { status: "accepted", at: t0 + 15 * s },
  ];
  if (order.scheduledFor) {
    const lead = order.mode === "pickup" ? 15 * 60 * s : 30 * 60 * s;
    const prep = Math.max(t0 + 45 * s, order.scheduledFor - lead);
    steps.push({ status: "preparing", at: prep });
    if (order.mode === "pickup") steps.push({ status: "ready", at: Math.max(prep + 120 * s, order.scheduledFor - 2 * 60 * s) });
    else {
      const out = Math.max(prep + 120 * s, order.scheduledFor - 15 * 60 * s);
      steps.push({ status: "delivering", at: out }, { status: "completed", at: Math.max(out + 240 * s, order.scheduledFor) });
    }
    return steps;
  }
  steps.push({ status: "preparing", at: t0 + 45 * s });
  if (order.mode === "pickup") steps.push({ status: "ready", at: t0 + 180 * s });
  else steps.push({ status: "delivering", at: t0 + 180 * s }, { status: "completed", at: t0 + 420 * s });
  return steps;
}

export function historyAt(order: Order, now: number) {
  if (!order.auto) return order.history;
  return autoTimeline(order).filter((step) => step.at <= now);
}

export function statusAt(order: Order, now: number): OrderStatus {
  const history = historyAt(order, now);
  return history[history.length - 1]?.status ?? "received";
}

/** When the next automatic step happens, for scheduling a re-render. */
export function nextChangeAt(order: Order, now: number) {
  if (!order.auto) return null;
  return autoTimeline(order).find((step) => step.at > now)?.at ?? null;
}

export const isActiveStatus = (status: OrderStatus) => status !== "completed" && status !== "cancelled";
