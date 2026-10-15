import { BUNDLES, SERVICE_BY_ID, SERVICES, type Service, type Variant } from "../data/services";
import { LEVELS, SPECIALIST_BY_ID, TEAM, type Specialist } from "../data/team";
import type { ServiceOverride } from "./types";

/**
 * Service lookups with the admin's price, duration and "online" changes applied. Every page reads services through
 * here, so a price changed in the admin shows up on the price list and in booking at once.
 */
export type Overrides = Record<string, ServiceOverride>;

export type LiveService = Service & { online: boolean; basePrice: number; baseDuration: number };

export function liveService(id: string, overrides: Overrides): LiveService {
  const s = SERVICE_BY_ID.get(id);
  if (!s) throw new Error(`Unknown service ${id}`);
  const o = overrides[id] ?? {};
  const priceFactor = o.price !== undefined && s.price > 0 ? o.price / s.price : 1;
  const durationDelta = o.duration !== undefined ? o.duration - s.duration : 0;
  return {
    ...s,
    price: o.price ?? s.price,
    duration: o.duration ?? s.duration,
    variants: s.variants?.map((v) => ({ ...v, price: Math.round(v.price * priceFactor), duration: Math.max(15, v.duration + durationDelta) })),
    online: o.online ?? true,
    basePrice: s.price,
    baseDuration: s.duration,
  };
}

export const liveServices = (overrides: Overrides) => SERVICES.map((s) => liveService(s.id, overrides));

export function variantOf(service: Service, variantId?: string): Variant | undefined {
  if (!service.variants) return undefined;
  return service.variants.find((v) => v.id === variantId) ?? service.variants[0];
}

export function durationOf(serviceId: string, variantId: string | undefined, overrides: Overrides) {
  const s = liveService(serviceId, overrides);
  return variantOf(s, variantId)?.duration ?? s.duration;
}

export function qualified(service: Service): Specialist[] {
  return TEAM.filter((p) => p.cats.includes(service.cat));
}

/** The price a given specialist charges; level pricing rounds to whole euros. */
export function priceFor(serviceId: string, variantId: string | undefined, specialistId: string | null, overrides: Overrides) {
  const s = liveService(serviceId, overrides);
  const base = variantOf(s, variantId)?.price ?? s.price;
  const person = specialistId ? SPECIALIST_BY_ID.get(specialistId) : undefined;
  if (!s.levelPricing || !person) return base;
  return Math.round(base * LEVELS[person.level].multiplier);
}

/** Cheapest and dearest price across everyone who does the service. */
export function priceRange(serviceId: string, variantId: string | undefined, overrides: Overrides) {
  const s = liveService(serviceId, overrides);
  const prices = qualified(s).map((p) => priceFor(serviceId, variantId, p.id, overrides));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Lowest price across variants and levels, for "od 42 €" on the price list. */
export function fromPrice(service: LiveService, overrides: Overrides) {
  const variants = service.variants?.map((v) => v.id) ?? [undefined];
  return Math.min(...variants.map((v) => priceRange(service.id, v, overrides).min));
}

export function bundlesFor(serviceIds: string[]) {
  return BUNDLES.filter((b) => b.groups.every((g) => g.some((id) => serviceIds.includes(id))));
}
