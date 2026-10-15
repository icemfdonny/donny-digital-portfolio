import { DEFAULT_TRADE, isTradeId, TRADES, type Trade, type TradeId } from "../data/trades";
import { formatPhone, normalizePhone } from "./format";

/**
 * Who the site is for. A cold e-mail link like
 *   /?remeslo=instalater&firma=Novák%20Inštalácie&mesto=Žilina&tel=0905123456&meno=Peter
 * turns the demo into "their" website. The profile is remembered, so links inside the site stay clean, and it is
 * read once before the first render. Switching trade reloads the page.
 *
 * The trade can also come from the address: one deployment can serve elektro.donny-digital.com,
 * stolar.donny-digital.com and so on (see TRADE_HOSTS), so each trade has its own clean link.
 */
export type Profile = { trade: TradeId; name: string; city: string; phone: string; owner: string; personalized: boolean };

const KEY = "majster-profile";

/** URL parameters, with short aliases for hand-typed links. */
const PARAMS = { trade: ["remeslo", "r"], name: ["firma", "f"], city: ["mesto", "m"], phone: ["tel", "t"], owner: ["meno", "o"] } as const;

/** Subdomains that select a trade. The first one of each is used when the site builds links. */
export const TRADE_HOSTS: Record<TradeId, string[]> = {
  elektrikar: ["elektro", "elektrikar"],
  instalater: ["instalater", "voda", "kurenie"],
  stolar: ["stolar", "drevo"],
  obkladac: ["obklady", "obkladac"],
  maliar: ["maliar", "malovanie"],
};

/** The trade named by the first label of the host name, e.g. "stolar" in stolar.donny-digital.com. */
function hostTrade(): TradeId | null {
  const labels = window.location.hostname.toLowerCase().split(".");
  if (labels.length < 3) return null;
  return (Object.keys(TRADE_HOSTS) as TradeId[]).find((t) => TRADE_HOSTS[t].includes(labels[0])) ?? null;
}

/** Where a trade lives: its own subdomain when the site runs on trade subdomains, otherwise this origin. */
export function tradeOrigin(trade: TradeId) {
  const { protocol, hostname, port } = window.location;
  if (!hostTrade()) return window.location.origin;
  const rest = hostname.split(".").slice(1).join(".");
  return `${protocol}//${TRADE_HOSTS[trade][0]}.${rest}${port ? `:${port}` : ""}`;
}

/** Link that opens a trade's sample business (used by the trade switcher in the demo badge). */
export const tradeSampleLink = (trade: TradeId) => `${tradeOrigin(trade)}/?remeslo=${trade}`;

const clean = (value: string | null, max: number) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function read(): Profile {
  let stored: Partial<Profile> = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Profile>;
  } catch {
    // Storage blocked: fall back to the URL and defaults.
  }
  const url = new URLSearchParams(window.location.search);
  const get = (keys: readonly string[]) => keys.map((k) => url.get(k)).find((v) => v !== null) ?? null;
  const urlTrade = get(PARAMS.trade);
  const urlName = clean(get(PARAMS.name), 48);
  const urlCity = clean(get(PARAMS.city), 40);
  const urlPhone = clean(get(PARAMS.phone), 20);
  const urlOwner = clean(get(PARAMS.owner), 24);
  const fromUrl = urlTrade !== null || urlName || urlCity || urlPhone || urlOwner;
  const host = hostTrade();

  let profile: Profile;
  if (fromUrl) {
    const trade = isTradeId(urlTrade) ? urlTrade : (host ?? (isTradeId(stored.trade) ? stored.trade : DEFAULT_TRADE));
    // A link that only switches the trade shows that trade's own sample business.
    const personalized = !!(urlName || urlCity || urlPhone);
    const sameTrade = trade === stored.trade && stored.personalized;
    profile = {
      trade,
      name: urlName || (personalized && sameTrade ? (stored.name ?? "") : ""),
      city: urlCity || (personalized && sameTrade ? (stored.city ?? "") : ""),
      phone: urlPhone ? (normalizePhone(urlPhone) ?? "") : "",
      owner: urlOwner,
      personalized,
    };
    // Keep the address bar tidy once the profile is stored; the rest of the query (e.g. ?karta=) stays.
    for (const keys of Object.values(PARAMS)) for (const k of keys) url.delete(k);
    const rest = url.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
  } else if (host && stored.trade !== host) {
    // On a trade subdomain the address decides; show that trade's sample business.
    profile = { trade: host, name: "", city: "", phone: "", owner: "", personalized: false };
  } else {
    profile = {
      trade: isTradeId(stored.trade) ? stored.trade : DEFAULT_TRADE,
      name: stored.name ?? "",
      city: stored.city ?? "",
      phone: stored.phone ?? "",
      owner: stored.owner ?? "",
      personalized: !!stored.personalized,
    };
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
  return profile;
}

export const PROFILE = read();
export const TRADE: Trade = TRADES[PROFILE.trade];

/** "Novák Elektro" → "novak-elektro" */
export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const name = PROFILE.name || TRADE.defaults.name;
const slug = slugify(name) || "firma";
/** Placeholder number for the sample businesses; calls to it are intercepted (see ContactLink). */
const SAMPLE_PHONE = "+421948123456";
const phone = PROFILE.phone || SAMPLE_PHONE;

/** The business as the site presents it. */
export const BIZ = {
  name,
  city: PROFILE.city || TRADE.defaults.city,
  owner: PROFILE.owner || TRADE.defaults.owner,
  phone,
  phoneLabel: formatPhone(phone),
  phoneHref: `tel:${phone}`,
  /** True when the phone number is the prospect's own, so call links really dial. */
  realPhone: !!PROFILE.phone,
  email: `info@${slug}.sk`,
  web: `www.${slug}.sk`,
  street: "Priemyselná 14",
  ico: "54 321 987",
  dic: "2121 456 789",
  since: TRADE.stats.since,
  initials: name
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase("sk"))
    .join(""),
};

/** Applies the trade's colours before the first paint. */
export function applyTheme() {
  const root = document.documentElement.style;
  root.setProperty("--color-accent", TRADE.colors.accent);
  root.setProperty("--color-accent-ink", TRADE.colors.ink);
  root.setProperty("--color-accent-deep", TRADE.colors.deep);
  root.setProperty("--color-accent-soft", TRADE.colors.soft);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#14171c");
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon) icon.href = faviconFor(TRADE.colors.accent, TRADE.colors.ink, BIZ.initials);
}

function faviconFor(bg: string, fg: string, letters: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><text x="32" y="43" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${letters.length > 1 ? 28 : 34}" fill="${fg}">${letters.replace(/[<&>]/g, "")}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Builds a personalised link for a prospect (used by the /generator page). On trade subdomains the subdomain
 * carries the trade, so the link stays short: stolar.donny-digital.com/?firma=…
 */
export function buildLink(p: { trade: TradeId; name?: string; city?: string; phone?: string; owner?: string }) {
  const origin = tradeOrigin(p.trade);
  const q = new URLSearchParams();
  if (!hostTrade()) q.set("remeslo", p.trade);
  if (p.name?.trim()) q.set("firma", p.name.trim());
  if (p.city?.trim()) q.set("mesto", p.city.trim());
  if (p.phone?.trim()) q.set("tel", p.phone.replace(/\s+/g, ""));
  if (p.owner?.trim()) q.set("meno", p.owner.trim());
  const query = q.toString().replace(/\+/g, "%20");
  return `${origin}/${query ? `?${query}` : ""}`;
}
