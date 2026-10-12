import { useSyncExternalStore } from "react";
import { addDays, toISODate } from "./format";
import type { ContactMessage, Inquiry, LunchDay, Order, Reservation, ReservationStatus, TicketPurchase, Voucher } from "./types";

/**
 * The demo's "backend": one JSON document in localStorage. Every page and the admin read it through useDB(), and
 * the storage event keeps open tabs in sync, so a status changed in the admin shows up live on the guest's
 * order-tracking page in another tab.
 */
export type DB = {
  version: 1;
  reservations: Reservation[];
  /** Admin status changes for generated bookings, keyed by booking id. */
  reservationStatus: Record<string, ReservationStatus>;
  orders: Order[];
  vouchers: Voucher[];
  tickets: TicketPurchase[];
  inquiries: Inquiry[];
  messages: ContactMessage[];
  newsletter: string[];
  /** Dish ids marked "sold out today" in the admin. */
  soldOut: string[];
  /** Lunch menus edited in the admin, keyed by YYYY-MM-DD. */
  lunch: Record<string, LunchDay>;
  nextOrderNumber: number;
  /** For the demo badge's checklist. */
  adminVisited: boolean;
};

const KEY = "lipa-demo:v1";

function seed(): DB {
  const now = Date.now();
  const day = 86_400_000;
  const today = new Date();
  const year = 365 * day;
  return {
    version: 1,
    reservations: [],
    reservationStatus: {},
    orders: [],
    vouchers: [
      {
        code: "LIPA-DEMO-0050",
        kind: "value",
        title: "Poukážka v hodnote 50 €",
        amount: 50,
        balance: 50,
        design: "linden",
        to: "Zuzana",
        from: "Peter",
        message: "Všetko najlepšie k narodeninám!",
        delivery: "email",
        buyerEmail: "peter@example.com",
        createdAt: now - 20 * day,
        validUntil: now - 20 * day + year,
      },
      {
        code: "LIPA-DEMO-0100",
        kind: "value",
        title: "Poukážka v hodnote 100 €",
        amount: 100,
        balance: 34.6,
        design: "night",
        to: "Rodina Kováčová",
        from: "Kolegovia z IT",
        message: "Ďakujeme za skvelý rok.",
        delivery: "post",
        buyerEmail: "office@example.com",
        createdAt: now - 64 * day,
        validUntil: now - 64 * day + year,
      },
    ],
    tickets: [],
    inquiries: [
      {
        id: "seed-inq-1",
        ref: "EV-K7M2",
        type: "Firemná večera",
        date: toISODate(addDays(today, 18)),
        guests: 34,
        space: "Celá reštaurácia",
        pkg: "Trojchodová večera",
        wine: true,
        estimate: 34 * (49 + 22),
        name: "Katarína Lukáčová",
        company: "Nordwave s.r.o.",
        email: "k.lukacova@example.com",
        phone: "+421905111222",
        message: "Vianočná večierka, prosíme o vegetariánsku alternatívu pre 6 osôb.",
        status: "offer",
        createdAt: now - 2 * day,
      },
      {
        id: "seed-inq-2",
        ref: "EV-R4TQ",
        type: "Narodeniny",
        date: toISODate(addDays(today, 9)),
        guests: 16,
        space: "Salónik",
        pkg: "Aperitív a malé taniere",
        wine: false,
        estimate: 16 * 32,
        name: "Michal Varga",
        email: "michal.varga@example.com",
        phone: "+421911333444",
        message: "Štyridsiatka manželky, chceli by sme vlastnú tortu.",
        status: "new",
        createdAt: now - 5 * 3_600_000,
      },
      {
        id: "seed-inq-3",
        ref: "EV-9WXP",
        type: "Svadba",
        date: toISODate(addDays(today, 140)),
        guests: 60,
        space: "Celá reštaurácia",
        pkg: "Degustačné menu",
        wine: true,
        estimate: 60 * (75 + 22),
        name: "Lucia Horváthová",
        email: "lucia.h@example.com",
        phone: "+421948555666",
        status: "confirmed",
        createdAt: now - 21 * day,
      },
    ],
    messages: [],
    newsletter: [],
    soldOut: [],
    lunch: {},
    nextOrderNumber: 1042,
    adminVisited: false,
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === 1) return { ...seed(), ...parsed };
    }
  } catch {
    // Private mode or corrupted data: start fresh.
  }
  return seed();
}

let db: DB = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked: the demo keeps working in memory.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) {
      db = load();
      emit();
    }
  });
}

export const getDB = () => db;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Immutable update: return a new DB from the current one. */
export function updateDB(change: (current: DB) => DB) {
  db = change(db);
  persist();
  emit();
}

export function resetDemo() {
  db = seed();
  persist();
  emit();
}

export function useDB() {
  return useSyncExternalStore(subscribe, getDB);
}
