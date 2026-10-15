import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** A service the client is putting together for one visit, before choosing a time. */
export type VisitItem = { key: string; serviceId: string; variantId?: string; specialistId: string };

type VisitApi = {
  items: VisitItem[];
  add: (serviceId: string, variantId?: string, specialistId?: string) => void;
  remove: (key: string) => void;
  update: (key: string, patch: Partial<Omit<VisitItem, "key">>) => void;
  replace: (items: Omit<VisitItem, "key">[]) => void;
  clear: () => void;
  has: (serviceId: string) => boolean;
};

const VisitContext = createContext<VisitApi | null>(null);
const KEY = "aurelia-visit";
const newKey = () => Math.random().toString(36).slice(2, 9);

export function VisitProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<VisitItem[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as VisitItem[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const add = useCallback((serviceId: string, variantId?: string, specialistId = "any") => {
    setItems((list) =>
      list.some((i) => i.serviceId === serviceId)
        ? // Already in the visit: a link naming a variant or a specialist updates it.
          list.map((i) => (i.serviceId === serviceId ? { ...i, variantId: variantId ?? i.variantId, specialistId: specialistId !== "any" ? specialistId : i.specialistId } : i))
        : [...list, { key: newKey(), serviceId, variantId, specialistId }],
    );
  }, []);
  const remove = useCallback((key: string) => setItems((list) => list.filter((i) => i.key !== key)), []);
  const update = useCallback((key: string, patch: Partial<Omit<VisitItem, "key">>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i))), []);
  const replace = useCallback((next: Omit<VisitItem, "key">[]) => setItems(next.map((i) => ({ ...i, key: newKey() }))), []);
  const clear = useCallback(() => setItems([]), []);

  const api = useMemo<VisitApi>(() => ({ items, add, remove, update, replace, clear, has: (id) => items.some((i) => i.serviceId === id) }), [items, add, remove, update, replace, clear]);
  return <VisitContext.Provider value={api}>{children}</VisitContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useVisit() {
  const ctx = useContext(VisitContext);
  if (!ctx) throw new Error("useVisit outside VisitProvider");
  return ctx;
}
