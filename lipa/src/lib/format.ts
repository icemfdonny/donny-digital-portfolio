const priceFormat = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" });

/** 14.9 → "14,90 €" */
export const formatPrice = (value: number) => priceFormat.format(value);

/** Rounds money to cents, avoiding 0.1 + 0.2 drift. */
export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD (not UTC, unlike toISOString). */
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isSameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b);

/** Minutes after midnight → "19:30". 1440 → "24:00". */
export const minutesToTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

export function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

export const WEEKDAYS = ["nedeľa", "pondelok", "utorok", "streda", "štvrtok", "piatok", "sobota"];
export const WEEKDAYS_SHORT = ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"];
/** "v pondelok", "v stredu", ... */
export const WEEKDAYS_ON = ["v nedeľu", "v pondelok", "v utorok", "v stredu", "vo štvrtok", "v piatok", "v sobotu"];
export const MONTHS = ["január", "február", "marec", "apríl", "máj", "jún", "júl", "august", "september", "október", "november", "december"];
const MONTHS_GENITIVE = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
export const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "máj", "jún", "júl", "aug", "sep", "okt", "nov", "dec"];

/** Upper-cases the first letter only (CSS capitalize would do every word). */
export const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase("sk") + text.slice(1);

/** "+421905123456" → "+421 905 123 456" */
export function formatPhone(phone: string) {
  const m = phone.match(/^\+421(\d{3})(\d{3})(\d{3})$/);
  return m ? `+421 ${m[1]} ${m[2]} ${m[3]}` : phone;
}

/** "piatok 16. októbra" */
export const formatDateLong = (d: Date) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}. ${MONTHS_GENITIVE[d.getMonth()]}`;

/** "16. októbra 2026" */
export const formatDateFull = (d: Date) => `${d.getDate()}. ${MONTHS_GENITIVE[d.getMonth()]} ${d.getFullYear()}`;

/** "16. 10." */
export const formatDateShort = (d: Date) => `${d.getDate()}. ${d.getMonth() + 1}.`;

/** "16. 10. 2026" */
export const formatDateNumeric = (d: Date) => `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;

export const formatClock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Slovak plurals: 1 hosť, 2–4 hostia, 0 or 5+ hostí.
 * `forms` is [one, few, many].
 */
export function plural(n: number, forms: [string, string, string]) {
  if (n === 1) return forms[0];
  if (n >= 2 && n <= 4) return forms[1];
  return forms[2];
}

export const guestsLabel = (n: number) => `${n} ${plural(n, ["hosť", "hostia", "hostí"])}`;

/** "+421 905 123 456" → digits only with leading +, or null when it does not look like a phone number. */
export function normalizePhone(value: string) {
  const compact = value.replace(/[\s()/-]/g, "");
  const local = compact.startsWith("00") ? `+${compact.slice(2)}` : compact.startsWith("0") ? `+421${compact.slice(1)}` : compact;
  return /^\+\d{9,14}$/.test(local) ? local : null;
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/** Reads like a booking code: no 0/O or 1/I confusion. */
export function makeCode(prefix: string, length = 4, rand: () => number = Math.random) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) code += alphabet[Math.floor(rand() * alphabet.length)];
  return `${prefix}-${code}`;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
