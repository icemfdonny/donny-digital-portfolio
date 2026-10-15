import { EMERGENCY_SECONDS_PER_MINUTE } from "../config";
import { isHoliday } from "./availability";
import { TRADE } from "./profile";
import { hashString, seeded } from "./random";
import type { EmergencyCall, EmergencyStatus } from "./types";

export const EMERGENCY_STEPS: { status: EmergencyStatus; label: string; text: string }[] = [
  { status: "prijate", label: "Hlásenie prijaté", text: "Dispečer má vaše hlásenie a hľadá najbližšieho technika." },
  { status: "pridelene", label: "Technik pridelený", text: "Technik potvrdil zásah a pripravuje si materiál." },
  { status: "na-ceste", label: "Na ceste", text: "Technik je na ceste k vám." },
  { status: "na-mieste", label: "Na mieste", text: "Technik je u vás." },
  { status: "vyriesene", label: "Vyriešené", text: "Porucha je odstránená." },
];

export const stepIndex = (s: EmergencyStatus) => EMERGENCY_STEPS.findIndex((x) => x.status === s);

/** Night, weekend or holiday rate applies. */
export function isOffHours(d: Date) {
  const h = d.getHours();
  return h >= 20 || h < 6 || d.getDay() === 0 || d.getDay() === 6 || isHoliday(d);
}

/** Who is on call: two technicians in rotation by ISO week. */
export function onCall(d: Date) {
  const crew = TRADE.crew.filter((c) => c.id !== "t1");
  const week = Math.floor((d.getTime() / 86_400_000 + 3) / 7);
  return [crew[week % crew.length], crew[(week + 1) % crew.length]];
}

/** Minutes until a technician can be at the address: dispatch + driving at the speed of the hour. */
export function etaFor(km: number, now: Date) {
  const h = now.getHours();
  const rush = (h >= 7 && h < 9) || (h >= 15 && h < 18);
  const speed = h >= 21 || h < 6 ? 62 : rush ? 38 : 48;
  const dispatch = 8 + Math.round(seeded(hashString(`${TRADE.id}|${now.toDateString()}|${h}`))() * 7);
  const eta = dispatch + (km / speed) * 60;
  return Math.max(15, Math.round(eta / 5) * 5);
}

/** Demo timeline: seconds after the report when each step happens on its own. */
function autoSchedule(e: EmergencyCall) {
  const assigned = 6;
  const enroute = 14;
  const arrive = enroute + Math.max(20, (e.etaMin - 10) * EMERGENCY_SECONDS_PER_MINUTE);
  return { pridelene: assigned, "na-ceste": enroute, "na-mieste": arrive } as Partial<Record<EmergencyStatus, number>>;
}

/** The status an automatically running emergency should be in now. */
export function autoStatus(e: EmergencyCall, now: number): EmergencyStatus {
  if (!e.auto || e.status === "vyriesene" || e.status === "zrusene") return e.status;
  const elapsed = (now - new Date(e.createdAt).getTime()) / 1000;
  const plan = autoSchedule(e);
  let status: EmergencyStatus = "prijate";
  for (const s of ["pridelene", "na-ceste", "na-mieste"] as const) if (elapsed >= (plan[s] ?? Infinity)) status = s;
  return stepIndex(status) > stepIndex(e.status) ? status : e.status;
}

/** Progress of the drive (0–1) for the map, and minutes left. */
export function driveProgress(e: EmergencyCall, now: number) {
  const enrouteAt = e.timeline.find((t) => t.status === "na-ceste")?.at;
  if (stepIndex(e.status) >= stepIndex("na-mieste")) return { progress: 1, minutesLeft: 0 };
  if (!enrouteAt || e.status !== "na-ceste") return { progress: 0, minutesLeft: e.etaMin };
  const plan = autoSchedule(e);
  const total = ((plan["na-mieste"] ?? 0) - (plan["na-ceste"] ?? 0)) * 1000;
  const progress = e.auto ? Math.min(0.97, (now - new Date(enrouteAt).getTime()) / total) : 0.5;
  const driving = Math.max(1, e.etaMin - 10);
  return { progress, minutesLeft: Math.max(1, Math.ceil(driving * (1 - progress))) };
}

export function emergencyPrice(night: boolean) {
  const em = TRADE.emergency;
  if (!em) return { callout: 0, hourly: 0 };
  const k = night ? 1 + em.nightSurcharge : 1;
  return { callout: Math.round(em.callout * k), hourly: Math.round(em.hourly * k) };
}
