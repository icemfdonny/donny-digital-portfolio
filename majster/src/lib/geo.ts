import { useSyncExternalStore } from "react";
import { TRAVEL } from "../config";
import { BIZ, TRADE } from "./profile";

/**
 * Slovak towns and villages with coordinates (OpenStreetMap data, ODbL), used for the service-area check, travel
 * costs, emergency arrival times and the names of nearby towns in references. Loaded once, lazily, as its own chunk.
 */
export type Town = { name: string; district: string; lat: number; lng: number; rank: number; key: string };

/** Lowercase without diacritics, for matching typed input. */
export const norm = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

type GeoState = { towns: Town[]; base: Town | null; nearby: Town[] } | null;

let state: GeoState = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function loadTowns() {
  loading ??= import("../data/towns.json").then((mod) => {
    const rows = (mod.default ?? mod) as [string, string, number, number, number][];
    const towns = rows.map(([name, district, lat, lng, rank]) => ({ name, district, lat, lng, rank, key: norm(name) }));
    const base = findTown(BIZ.city, towns) ?? findTown(TRADE.defaults.city, towns);
    const nearby = base
      ? towns
          .filter((t) => t.rank >= 1 && t !== base && t.name !== base.name)
          .map((t) => ({ t, d: straightKm(base, t) }))
          .filter(({ d }) => d >= 5 && d <= 38)
          .sort((a, b) => b.t.rank - a.t.rank || a.d - b.d)
          .slice(0, 10)
          .map(({ t }) => t)
      : [];
    state = { towns, base, nearby };
    listeners.forEach((l) => l());
  });
  return loading;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  void loadTowns();
  return () => listeners.delete(listener);
};

/** The towns list once loaded, or null while loading. */
export function useGeo() {
  return useSyncExternalStore(subscribe, () => state);
}

/** Best match for a typed or stored town name: exact name first, larger places preferred. */
export function findTown(name: string, towns: Town[]) {
  const key = norm(name);
  if (!key) return null;
  let best: Town | null = null;
  for (const t of towns) if (t.key === key && (!best || t.rank > best.rank)) best = t;
  return best;
}

export function searchTowns(query: string, towns: Town[], limit = 7) {
  const q = norm(query);
  if (!q) return [];
  const starts: Town[] = [];
  const contains: Town[] = [];
  for (const t of towns) {
    if (t.key.startsWith(q)) starts.push(t);
    else if (t.key.includes(q)) contains.push(t);
  }
  const byRank = (a: Town, b: Town) => b.rank - a.rank || a.name.localeCompare(b.name, "sk");
  return [...starts.sort(byRank), ...contains.sort(byRank)].slice(0, limit);
}

function straightKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Approximate road distance: straight line times a detour factor, at least 2 km within the same town. */
export function roadKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return Math.max(2, Math.round(straightKm(a, b) * 1.3));
}

/** Travel cost for a job: free within TRAVEL.freeKm, then per km there and back, per trip. */
export function travelFee(km: number | null, trips = 1, perKm = TRAVEL.perKm, freeKm = TRAVEL.freeKm) {
  if (km === null) return 0;
  return Math.round(Math.max(0, km - freeKm) * 2 * perKm * trips);
}

/** Name for a "place index" in the trade data: 0 is the firm's town, 1+ nearby towns. */
export function placeName(index: number, geo: GeoState) {
  if (index <= 0 || !geo?.nearby.length) return BIZ.city;
  return geo.nearby[(index - 1) % geo.nearby.length].name;
}
