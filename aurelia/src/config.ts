/**
 * Everything that identifies the salon and its house rules lives here, so the demo can be re-skinned for a prospect by
 * editing one file. Aurelia is fictional: the address, phone and e-mail are placeholders.
 */
export const SALON = {
  name: "Aurelia",
  fullName: "Aurelia beauty atelier",
  tagline: "Beauty atelier",
  street: "Palisády 22",
  zip: "811 06",
  city: "Bratislava",
  district: "Staré Mesto",
  phone: "+421 2 9876 5432",
  phoneHref: "tel:+421298765432",
  email: "ahoj@aurelia-atelier.sk",
  instagram: "aurelia.atelier",
  /** Map centre for the contact page. */
  lat: 48.14596,
  lng: 17.10354,
  founded: 2017,
};

/** The studio behind the demo, shown in the demo badge. */
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

export function toMin(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

const h = (open: string, close: string): DayHours => ({ open: toMin(open), close: toMin(close) });

/** Salon opening hours, indexed like Date.getDay(): 0 is Sunday. */
export const WEEK_HOURS: (DayHours | null)[] = [null, h("10:00", "19:00"), h("08:00", "20:00"), h("08:00", "20:00"), h("08:00", "20:00"), h("08:00", "20:00"), h("08:00", "15:00")];

/** Days with different hours, keyed by MM-DD. `null` means closed. */
export const SPECIAL_DAYS: Record<string, { label: string; hours: DayHours | null }> = {
  "01-01": { label: "Deň vzniku SR", hours: null },
  "01-06": { label: "Zjavenie Pána", hours: null },
  "05-01": { label: "Sviatok práce", hours: null },
  "05-08": { label: "Deň víťazstva nad fašizmom", hours: null },
  "07-05": { label: "Sv. Cyril a Metod", hours: null },
  "08-29": { label: "Výročie SNP", hours: null },
  "09-15": { label: "Sedembolestná Panna Mária", hours: null },
  "11-01": { label: "Sviatok všetkých svätých", hours: null },
  "12-23": { label: "Predvianočný deň – dlhšie otvorené", hours: h("08:00", "21:00") },
  "12-24": { label: "Štedrý deň – len dopoludnia", hours: h("08:00", "12:00") },
  "12-25": { label: "1. sviatok vianočný", hours: null },
  "12-26": { label: "2. sviatok vianočný", hours: null },
  "12-31": { label: "Silvester – skrátene", hours: h("08:00", "14:00") },
};

export const BOOKING = {
  /** Start times are offered on this grid. */
  slotStep: 15,
  /** Online bookings must start at least this many minutes from now. */
  leadMinutes: 120,
  /** How far ahead the calendar opens. */
  horizonDays: 60,
  /** Free cancellation or rescheduling up to this many hours before the visit. */
  freeCancelHours: 24,
  /** A deposit is required from this total, or when a service asks for one. */
  depositFrom: 120,
  depositShare: 0.3,
  depositMin: 20,
  /** A day with this few free start times or fewer shows as "posledné termíny". */
  busyThreshold: 6,
};

export type TierId = "rose" | "gold" | "platinum";

export const LOYALTY = {
  pointsPerEuro: 1,
  /** Points earned in the birthday month are doubled. */
  birthdayMultiplier: 2,
  signupBonus: 50,
  /** Points for the referrer when the friend's first visit is completed; the friend gets `referralFriendDiscount` €. */
  referralPoints: 100,
  referralFriendDiscount: 10,
  tiers: [
    { id: "rose" as TierId, name: "Rose", from: 0, discount: 0, perks: ["1 bod za každé 1 €", "Dvojnásobné body v mesiaci narodenín", "Pripomienky termínov a starostlivosti"] },
    { id: "gold" as TierId, name: "Gold", from: 600, discount: 0.05, perks: ["Všetko z Rose", "Zľava 5 % na každú návštevu", "Káva alebo prosecco na privítanie"] },
    {
      id: "platinum" as TierId,
      name: "Platinum",
      from: 1500,
      discount: 0.1,
      perks: ["Všetko z Gold", "Zľava 10 % na každú návštevu", "Prednostné termíny pred sviatkami", "Pozvánky na uzavreté beauty večery"],
    },
  ],
  rewards: [
    { id: "r5", points: 150, title: "Zľava 5 €", text: "Na akúkoľvek službu", value: 5 },
    { id: "r-brow", points: 250, title: "Úprava obočia zadarmo", text: "Pridáme k vašej najbližšej návšteve", value: 15 },
    { id: "r15", points: 400, title: "Zľava 15 €", text: "Na akúkoľvek službu", value: 15 },
    { id: "r-ritual", points: 600, title: "Hĺbková regenerácia vlasov", text: "Olaplex rituál k strihu alebo farbe", value: 30 },
    { id: "r40", points: 900, title: "Zľava 40 €", text: "Na akúkoľvek službu", value: 40 },
  ],
};
