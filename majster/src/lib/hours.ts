import { WEEK_HOURS } from "../config";
import { holidayName } from "./availability";
import { WEEKDAYS_ON, minutesToTime } from "./format";

/** Office open/closed state for the header and contact page. */
export function officeStatus(now: Date) {
  const holiday = holidayName(now);
  const hours = holiday ? null : WEEK_HOURS[now.getDay()];
  const m = now.getHours() * 60 + now.getMinutes();
  if (hours && m >= hours.open && m < hours.close) return { open: true, text: `Otvorené do ${minutesToTime(hours.close)}` };
  // Find the next opening.
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const h = holidayName(d) ? null : WEEK_HOURS[d.getDay()];
    if (!h || (i === 0 && m >= h.open)) continue;
    const when = i === 0 ? "dnes" : i === 1 ? "zajtra" : WEEKDAYS_ON[d.getDay()];
    return { open: false, text: `Zatvorené · otvárame ${when} o ${minutesToTime(h.open)}` };
  }
  return { open: false, text: "Zatvorené" };
}

export const HOURS_ROWS = [
  { label: "Po – Št", hours: WEEK_HOURS[1] },
  { label: "Piatok", hours: WEEK_HOURS[5] },
  { label: "Sobota", hours: WEEK_HOURS[6] },
  { label: "Ne a sviatky", hours: null },
];
