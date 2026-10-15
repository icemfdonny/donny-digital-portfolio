import { SALON } from "../config";
import { fromISODate } from "./format";
import type { Appointment, ApptStatus } from "./types";

export const STATUS_LABEL: Record<ApptStatus, string> = {
  confirmed: "Potvrdené",
  arrived: "Prebieha",
  completed: "Dokončené",
  noshow: "Neprišla",
  cancelled: "Zrušené",
};

export function calendarEvent(a: Appointment) {
  const start = fromISODate(a.date);
  start.setMinutes(a.start);
  return {
    title: `${SALON.name}: ${a.items.map((i) => i.name).join(", ")}`,
    start,
    minutes: a.end - a.start,
    description: `Rezervácia ${a.code}. Zmena alebo zrušenie: ${window.location.origin}/rezervacia/${a.code}`,
    uid: a.code,
  };
}
