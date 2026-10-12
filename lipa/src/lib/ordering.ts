import { ORDERING } from "../config";
import { addDays, minutesOfDay, startOfDay } from "./format";
import { dayInfo } from "./hours";

export type OrderWindow = {
  /** Orders can be placed for as soon as possible right now. */
  asap: boolean;
  /** Day the offered times belong to (today, or the next day the kitchen cooks). */
  day: Date;
  /** Offered pickup or delivery times, every 15 minutes. */
  times: Date[];
};

/**
 * When an online order can be ready. During kitchen hours that is "as soon as possible" plus later times today;
 * otherwise the guest can pre-order for the next day the kitchen is open.
 */
export function orderWindow(now: Date, mode: "pickup" | "delivery"): OrderWindow {
  const lead = mode === "pickup" ? ORDERING.pickupMinutes : ORDERING.deliveryMinutes;
  for (let i = 0; i < 10; i++) {
    const day = addDays(startOfDay(now), i);
    const { hours } = dayInfo(day);
    if (!hours) continue;
    const lastOrder = hours.kitchen - ORDERING.lastOrderBeforeKitchen;
    const earliestToday = i === 0 ? minutesOfDay(now) + lead : 0;
    const first = Math.ceil(Math.max(hours.open + 30, earliestToday) / 15) * 15;
    const times: Date[] = [];
    for (let m = first; m <= lastOrder + lead; m += 15) {
      const t = new Date(day);
      t.setMinutes(m);
      times.push(t);
    }
    if (!times.length) continue;
    const nowMin = minutesOfDay(now);
    const asap = i === 0 && nowMin >= hours.open && nowMin <= lastOrder;
    return { asap, day, times };
  }
  return { asap: false, day: startOfDay(now), times: [] };
}
