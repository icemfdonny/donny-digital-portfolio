import { useState } from "react";
import { Card, Lock } from "./icons";
import type { CardErrors, CardState } from "../lib/payment";

const brand = (digits: string) => (/^4/.test(digits) ? "VISA" : /^(5[1-5]|2[2-7])/.test(digits) ? "Mastercard" : "");

/**
 * Simulated card payment fields. Real projects would put a payment provider's hosted fields here (GoPay, Stripe,
 * Global Payments); the demo validates the format and never sends anything.
 */
export function CardForm({ card, onChange, errors }: { card: CardState; onChange: (c: CardState) => void; errors: CardErrors }) {
  const digits = card.number.replace(/\D/g, "");
  const set = (key: keyof CardState, value: string) => onChange({ ...card, [key]: value });
  const [showHint, setShowHint] = useState(true);
  return (
    <div className="rounded-2xl border border-line bg-cream/60 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Lock size={16} className="text-moss" /> Platba kartou
        </p>
        <span className="text-xs text-mute">Zabezpečené 3-D Secure</span>
      </div>
      {showHint && (
        <button
          type="button"
          onClick={() => {
            onChange({ number: "4242 4242 4242 4242", expiry: "12/29", cvc: "123", name: card.name || "Ján Vzorový" });
            setShowHint(false);
          }}
          className="mb-4 w-full rounded-xl border border-dashed border-honey/60 bg-honey-soft/50 px-4 py-2.5 text-left text-sm text-forest hover:bg-honey-soft"
        >
          Ukážka: kliknite a vyplníme testovaciu kartu. Nič sa neúčtuje.
        </button>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="card-number" className="field-label">
            Číslo karty
          </label>
          <div className="relative">
            <Card size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
            <input
              id="card-number"
              className="field pl-11 tabular-nums"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={card.number}
              aria-invalid={!!errors.number}
              onChange={(e) =>
                set(
                  "number",
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 19)
                    .replace(/(\d{4})(?=\d)/g, "$1 "),
                )
              }
            />
            {brand(digits) && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-soft">{brand(digits)}</span>}
          </div>
          {errors.number && <p className="mt-1 text-sm text-danger">{errors.number}</p>}
        </div>
        <div>
          <label htmlFor="card-expiry" className="field-label">
            Platnosť
          </label>
          <input
            id="card-expiry"
            className="field tabular-nums"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/RR"
            value={card.expiry}
            aria-invalid={!!errors.expiry}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              set("expiry", v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
            }}
          />
          {errors.expiry && <p className="mt-1 text-sm text-danger">{errors.expiry}</p>}
        </div>
        <div>
          <label htmlFor="card-cvc" className="field-label">
            CVC
          </label>
          <input
            id="card-cvc"
            className="field tabular-nums"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={card.cvc}
            aria-invalid={!!errors.cvc}
            onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          {errors.cvc && <p className="mt-1 text-sm text-danger">{errors.cvc}</p>}
        </div>
        <div className="col-span-2">
          <label htmlFor="card-name" className="field-label">
            Meno na karte
          </label>
          <input id="card-name" className="field" autoComplete="cc-name" value={card.name} aria-invalid={!!errors.name} onChange={(e) => set("name", e.target.value)} />
          {errors.name && <p className="mt-1 text-sm text-danger">{errors.name}</p>}
        </div>
      </div>
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden="true" />;
}
