import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { PROMO_CODES } from "../config";
import { cartTotals, type CartLine, type CartState } from "./cartTotals";
import { usePersistentState } from "./hooks";
import { useDB } from "./store";

export type { CartLine, CartState };

type CartApi = {
  cart: CartState;
  totals: ReturnType<typeof cartTotals>;
  add: (line: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setMode: (mode: CartState["mode"]) => void;
  setZip: (zip: string) => void;
  /** Applies a promo or gift-voucher code. Returns an error message, or null on success. */
  applyCode: (code: string) => string | null;
  removeCode: (kind: "promo" | "voucher") => void;
};

const CartContext = createContext<CartApi | null>(null);

const lineKey = (line: Omit<CartLine, "key">) => [line.itemId, ...line.options, line.note ?? ""].join("|");

export function CartProvider({ children }: { children: ReactNode }) {
  const db = useDB();
  const [cart, setCart] = usePersistentState<CartState>("lipa-cart:v1", { lines: [], mode: "pickup" });

  const add = useCallback(
    (line: Omit<CartLine, "key">) =>
      setCart((c) => {
        const key = lineKey(line);
        const existing = c.lines.find((l) => l.key === key);
        const lines = existing ? c.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l)) : [...c.lines, { ...line, key }];
        return { ...c, lines };
      }),
    [setCart],
  );

  const api = useMemo<CartApi>(
    () => ({
      cart,
      totals: cartTotals(cart, db),
      add,
      setQty: (key, qty) => setCart((c) => ({ ...c, lines: qty <= 0 ? c.lines.filter((l) => l.key !== key) : c.lines.map((l) => (l.key === key ? { ...l, qty } : l)) })),
      remove: (key) => setCart((c) => ({ ...c, lines: c.lines.filter((l) => l.key !== key) })),
      clear: () => setCart((c) => ({ lines: [], mode: c.mode, zip: c.zip })),
      setMode: (mode) => setCart((c) => ({ ...c, mode })),
      setZip: (zip) => setCart((c) => ({ ...c, zip })),
      applyCode: (raw) => {
        const code = raw.trim().toUpperCase();
        if (!code) return "Zadajte kód.";
        if (PROMO_CODES[code]) {
          setCart((c) => ({ ...c, promo: code }));
          return null;
        }
        const voucher = db.vouchers.find((v) => v.code === code);
        if (voucher) {
          if (voucher.validUntil < Date.now()) return "Platnosť tejto poukážky už vypršala.";
          if (voucher.balance <= 0) return "Na poukážke už nezostal žiadny zostatok.";
          if (voucher.kind === "experience") return "Zážitkovú poukážku uplatníte pri rezervácii, nie pri objednávke.";
          setCart((c) => ({ ...c, voucher: code }));
          return null;
        }
        return "Tento kód nepoznáme. Skontrolujte, prosím, preklepy.";
      },
      removeCode: (kind) => setCart((c) => ({ ...c, [kind]: undefined })),
    }),
    [cart, db, add, setCart],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useCart() {
  const api = useContext(CartContext);
  if (!api) throw new Error("useCart must be used inside CartProvider");
  return api;
}
