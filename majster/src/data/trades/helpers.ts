import type { CalcLine, CalcValues } from "./types";

/** Typed readers for calculator answers. */
export const num = (v: CalcValues, id: string) => Number(v[id] ?? 0);
export const on = (v: CalcValues, id: string) => v[id] === true;
export const pick = (v: CalcValues, id: string) => String(v[id] ?? "");

/** Builds the line list, dropping zero quantities and `false` entries so jobs can use `cond && line(...)`. */
export function lines(...items: (CalcLine | false | null | undefined)[]): CalcLine[] {
  return items.filter((l): l is CalcLine => !!l && l.qty > 0);
}

export const line = (item: string, qty: number, label?: string): CalcLine => ({ item, qty: Math.round(qty * 100) / 100, label });

export const photo = (trade: string, name: string) => `/images/${trade}/${name}.jpg`;
