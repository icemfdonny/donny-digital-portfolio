import { SERVICE_BY_ID } from "../data/services";
import { effectiveStatus } from "./availability";
import { fromISODate } from "./format";
import type { Appointment } from "./types";

/** How many days a result lasts before it is worth a nudge. */
const REFRESH_DAYS: Record<string, { days: number; text: string }> = {
  "farbenie-odrastov": { days: 42, text: "Odrasty bývajú viditeľné po šiestich týždňoch." },
  "farbenie-celych": { days: 49, text: "Farba začína strácať lesk zhruba po siedmich týždňoch." },
  balayage: { days: 90, text: "Balayage je ideálne osviežiť tónovaním po troch mesiacoch." },
  melir: { days: 70, text: "Melír je čas osviežiť po desiatich týždňoch." },
  "damsky-strih": { days: 56, text: "Končeky sa radi štiepia po ôsmich týždňoch." },
  "pansky-strih": { days: 35, text: "Pánsky strih drží tvar asi päť týždňov." },
  "gel-lak": { days: 21, text: "Gél lak sa odporúča obnoviť po troch týždňoch." },
  "doplnenie-nechtov": { days: 28, text: "Gélové nechty potrebujú doplnenie po štyroch týždňoch." },
  pedikura: { days: 35, text: "Pedikúra s gél lakom vydrží asi päť týždňov." },
  "lash-lift": { days: 49, text: "Lash lifting pomaly povoľuje po siedmich týždňoch." },
  "laminacia-obocia": { days: 42, text: "Laminácia obočia drží asi šesť týždňov." },
  hydraglow: { days: 42, text: "Pre trvalý efekt odporúčame HydraGlow raz za šesť týždňov." },
};

export type Reminder = { serviceId: string; name: string; specialistId: string; variantId?: string; daysAgo: number; text: string };

/**
 * Services the client is due for: done before, past their refresh interval, and not already booked again.
 * Sorted by how overdue they are.
 */
export function dueReminders(appointments: Appointment[], now: Date): Reminder[] {
  const upcoming = new Set(appointments.filter((a) => effectiveStatus(a, now) === "confirmed").flatMap((a) => a.items.map((i) => i.serviceId)));
  const last = new Map<string, { date: string; item: Appointment["items"][number] }>();
  for (const a of appointments) {
    if (effectiveStatus(a, now) !== "completed") continue;
    for (const item of a.items) {
      const prev = last.get(item.serviceId);
      if (!prev || prev.date < a.date) last.set(item.serviceId, { date: a.date, item });
    }
  }
  const out: (Reminder & { overdue: number })[] = [];
  for (const [serviceId, { date, item }] of last) {
    const rule = REFRESH_DAYS[serviceId];
    if (!rule || upcoming.has(serviceId)) continue;
    const daysAgo = Math.floor((now.getTime() - fromISODate(date).getTime()) / 86_400_000);
    if (daysAgo < rule.days) continue;
    out.push({ serviceId, name: SERVICE_BY_ID.get(serviceId)?.name ?? item.name, specialistId: item.specialistId, variantId: item.variantId, daysAgo, text: rule.text, overdue: daysAgo / rule.days });
  }
  return out.sort((a, b) => b.overdue - a.overdue);
}

export const weeksAgo = (days: number) => {
  const w = Math.round(days / 7);
  return w <= 1 ? "pred týždňom" : w < 5 ? `pred ${w} týždňami` : `pred ${Math.round(days / 30)} ${Math.round(days / 30) === 1 ? "mesiacom" : "mesiacmi"}`;
};
