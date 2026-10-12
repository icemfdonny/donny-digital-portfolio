/**
 * Everything that identifies the restaurant lives here, so the demo can be re-skinned for a prospect by editing one
 * file. Lipa is fictional: the address, phone and e-mail are placeholders.
 */
export const RESTAURANT = {
  name: "Lipa",
  fullName: "Lipa – kuchyňa & vínny bar",
  tagline: "Kuchyňa & vínny bar",
  street: "Lipová 7",
  zip: "811 01",
  city: "Bratislava",
  district: "Staré Mesto",
  phone: "+421 2 1234 5678",
  phoneHref: "tel:+421212345678",
  email: "dobryden@lipa-bistro.sk",
  instagram: "lipa.bratislava",
  /** Map centre for the contact page. */
  lat: 48.14385,
  lng: 17.10972,
  founded: 2019,
  seats: 94,
};

/** The studio behind the demo, shown in the demo badge and footer. */
export const STUDIO = {
  name: "Donny Digital",
  email: "donnydigital.darien@gmail.com",
  /** Portfolio address; leave empty to link to e-mail only. */
  url: "",
};

/** Minutes after midnight. 24:00 is written as 1440. */
export type DayHours = { open: number; close: number; kitchen: number };

const h = (open: string, close: string, kitchen: string): DayHours => ({ open: toMin(open), close: toMin(close), kitchen: toMin(kitchen) });

function toMin(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

/** Regular hours, indexed like Date.getDay(): 0 is Sunday. */
export const WEEK_HOURS: (DayHours | null)[] = [
  h("12:00", "21:00", "20:00"),
  h("11:00", "23:00", "22:00"),
  h("11:00", "23:00", "22:00"),
  h("11:00", "23:00", "22:00"),
  h("11:00", "23:00", "22:00"),
  h("11:00", "24:00", "22:30"),
  h("12:00", "24:00", "22:30"),
];

/** Days with different hours, keyed by MM-DD. `null` means closed. */
export const SPECIAL_DAYS: Record<string, { label: string; hours: DayHours | null }> = {
  "12-24": { label: "Štedrý deň", hours: null },
  "12-25": { label: "1. sviatok vianočný", hours: null },
  "12-26": { label: "2. sviatok vianočný", hours: h("14:00", "22:00", "21:00") },
  "12-31": { label: "Silvester – iba slávnostné menu", hours: h("18:00", "24:00", "22:00") },
  "01-01": { label: "Nový rok", hours: null },
};

/** Weekday lunch menu (obedové menu). */
export const LUNCH = { days: [1, 2, 3, 4, 5], from: toMin("11:00"), to: toMin("14:30"), box: 0.4 };

/** Online ordering. */
export const ORDERING = {
  /** Packaging fee per dish (obal). */
  packaging: 0.3,
  /** Last online order this many minutes before the kitchen closes. */
  lastOrderBeforeKitchen: 15,
  pickupMinutes: 20,
  deliveryMinutes: 40,
};

export const PROMO_CODES: Record<string, { label: string; percent?: number; freeDelivery?: boolean; minSubtotal?: number }> = {
  LIPA10: { label: "10 % zľava na jedlo", percent: 10, minSubtotal: 20 },
  VITAJTE: { label: "Doprava zadarmo", freeDelivery: true },
};
