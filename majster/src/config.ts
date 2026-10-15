/**
 * House rules shared by every trade. Everything that identifies the business (name, town, phone, colours, services)
 * comes from the trade file and the personalised link, see lib/profile.ts.
 */

/** The studio behind the demo, shown in the demo badge and the footer credit. */
export const STUDIO = {
  name: "Donny Digital",
  /** Credited as designer and developer in the demo badge. */
  author: "Darien Ďalog",
  email: "donnydigital.darien@gmail.com",
  /** Portfolio address; leave empty to link to e-mail only. */
  url: "",
};

/** Minutes after midnight. */
export type DayHours = { open: number; close: number };

const t = (time: string) => {
  const [hh, mm] = time.split(":").map(Number);
  return hh * 60 + mm;
};
const h = (open: string, close: string): DayHours => ({ open: t(open), close: t(close) });

/** Office hours, indexed like Date.getDay(): 0 is Sunday. The emergency line runs around the clock. */
export const WEEK_HOURS: (DayHours | null)[] = [null, h("07:00", "17:00"), h("07:00", "17:00"), h("07:00", "17:00"), h("07:00", "17:00"), h("07:00", "16:00"), h("08:00", "12:00")];

/** Slovak public holidays (MM-DD). The office is closed; the emergency line is not. */
export const HOLIDAYS: Record<string, string> = {
  "01-01": "Deň vzniku SR",
  "01-06": "Zjavenie Pána",
  "05-01": "Sviatok práce",
  "05-08": "Deň víťazstva nad fašizmom",
  "07-05": "Sv. Cyril a Metod",
  "08-29": "Výročie SNP",
  "09-15": "Sedembolestná Panna Mária",
  "11-01": "Sviatok všetkých svätých",
  "11-17": "Deň boja za slobodu a demokraciu",
  "12-24": "Štedrý deň",
  "12-25": "1. sviatok vianočný",
  "12-26": "2. sviatok vianočný",
};

export const BOOKING = {
  /** Arrival windows for site visits, minutes after midnight. */
  weekdayWindows: [
    [450, 570],
    [570, 690],
    [750, 870],
    [870, 990],
  ] as [number, number][],
  saturdayWindows: [
    [480, 600],
    [600, 720],
  ] as [number, number][],
  /** A window can be booked online when it starts at least this many minutes from now. */
  leadMinutes: 180,
  horizonDays: 28,
  /** Free cancellation or rescheduling up to this many hours before the visit. */
  freeChangeHours: 12,
};

export const TRAVEL = {
  /** Travel is free up to this distance (one way, by road). */
  freeKm: 15,
  /** Per km beyond the free distance, there and back. */
  perKm: 0.5,
  /** The usual service area. Further away the request still goes through, with a note. */
  radiusKm: 50,
};

export const VAT_RATE = 0.23;

export const URGENCY = [
  { id: "normal", label: "Bežný termín", hint: "do 3 – 4 týždňov", factor: 0 },
  { id: "soon", label: "Do 2 týždňov", hint: "+8 % na prácu", factor: 0.08 },
  { id: "express", label: "Expres do 5 dní", hint: "+20 % na prácu", factor: 0.2 },
] as const;

export type UrgencyId = (typeof URGENCY)[number]["id"];

/** Demo speed for the emergency tracker: real seconds per simulated minute of driving. */
export const EMERGENCY_SECONDS_PER_MINUTE = 2;
