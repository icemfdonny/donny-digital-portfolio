import { pad } from "./format";

const stamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

/** Start and end of an arrival window as Date objects. */
export function windowDates(dateISO: string, start: number, end: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return { from: new Date(y, m - 1, d, Math.floor(start / 60), start % 60), to: new Date(y, m - 1, d, Math.floor(end / 60), end % 60) };
}

export function downloadIcs(opts: { uid: string; title: string; description: string; location: string; from: Date; to: Date }) {
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Majster demo//SK",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@majster-demo`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(opts.from)}`,
    `DTEND:${stamp(opts.to)}`,
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    `LOCATION:${esc(opts.location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(opts.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opts.uid}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(opts: { title: string; description: string; location: string; from: Date; to: Date }) {
  const q = new URLSearchParams({ action: "TEMPLATE", text: opts.title, details: opts.description, location: opts.location, dates: `${stamp(opts.from)}/${stamp(opts.to)}` });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
