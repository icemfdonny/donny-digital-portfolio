import { useState } from "react";
import { Link } from "react-router-dom";
import { DELIVERY_ZONES, FREE_DELIVERY_FROM, zoneForZip } from "../data/content";
import { useCart } from "../lib/cart";
import { formatPrice } from "../lib/format";
import { ArrowRight, Bag, Check, Gift, Trash, Truck, X } from "./icons";
import { QuantityStepper } from "./ui";

/** Cart contents, delivery zone check, codes and totals. Sits beside the menu on desktop and in a drawer on phones. */
export default function CartPanel({ onCheckout, compact = false, showZip = true }: { onCheckout?: () => void; compact?: boolean; showZip?: boolean }) {
  const { cart, totals, setQty, remove, setZip, applyCode, removeCode } = useCart();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [zipDraft, setZipDraft] = useState(cart.zip ?? "");
  const zipZone = zipDraft.replace(/\s/g, "").length === 5 ? zoneForZip(zipDraft) : undefined;

  // Not a <form>: the panel also sits inside the checkout form, and forms cannot nest.
  const submitCode = () => {
    const error = applyCode(code);
    setCodeError(error);
    if (!error) setCode("");
  };

  if (!cart.lines.length) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-sand text-moss">
          <Bag size={24} />
        </span>
        <p className="mt-4 font-display text-xl text-forest">Košík je zatiaľ prázdny</p>
        <p className="mt-1 max-w-[16rem] text-sm text-soft">Vyberte si z menu. Obedové menu so sebou máme už od 8,90 €.</p>
      </div>
    );
  }

  const blocked = totals.missingForMin > 0 || (cart.mode === "delivery" && cart.zip && !totals.zone);

  return (
    <div className={compact ? "" : "px-6 pb-6"}>
      <ul className="divide-y divide-line">
        {cart.lines.map((line) => (
          <li key={line.key} className="flex gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium leading-snug">{line.name}</p>
              {line.options.length > 0 && <p className="mt-0.5 text-xs leading-relaxed text-mute">{line.options.join(" · ")}</p>}
              {line.note && <p className="mt-0.5 text-xs italic text-mute">„{line.note}“</p>}
              <div className="mt-2 flex items-center gap-3">
                <QuantityStepper size="sm" value={line.qty} min={0} max={20} onChange={(q) => setQty(line.key, q)} label={`Počet: ${line.name}`} />
                <button type="button" onClick={() => remove(line.key)} className="text-mute hover:text-danger" aria-label={`Odstrániť ${line.name}`}>
                  <Trash size={16} />
                </button>
              </div>
            </div>
            <p className="shrink-0 text-[15px] tabular-nums">{formatPrice(line.unitPrice * line.qty)}</p>
          </li>
        ))}
      </ul>

      {cart.mode === "delivery" && showZip && (
        <div className="mt-2 rounded-2xl bg-cream p-4">
          <label htmlFor="cart-zip" className="flex items-center gap-2 text-sm font-medium">
            <Truck size={16} className="text-moss" /> Kam to bude?
          </label>
          <input
            id="cart-zip"
            className="field mt-2 py-2.5 tabular-nums"
            placeholder="PSČ, napr. 811 01"
            inputMode="numeric"
            value={zipDraft}
            onChange={(e) => {
              setZipDraft(e.target.value);
              const z = e.target.value.replace(/\s/g, "");
              if (z.length === 5) setZip(e.target.value);
            }}
          />
          {zipZone ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ok">
              <Check size={15} /> {zipZone.name}: doprava {formatPrice(zipZone.fee)}, min. {formatPrice(zipZone.min)}, ~{zipZone.minutes} min
            </p>
          ) : zipZone === null ? (
            <p className="mt-2 text-sm text-danger">Na toto PSČ zatiaľ nevozíme. Môžete si jedlo vyzdvihnúť u nás.</p>
          ) : (
            <p className="mt-2 text-xs text-mute">
              Vozíme po Bratislave: {DELIVERY_ZONES.map((z) => `${z.name} ${formatPrice(z.fee)}`).join(" · ")}
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        <label htmlFor="cart-code" className="sr-only">
          Zľavový kód alebo poukážka
        </label>
        <div className="flex gap-2">
          <input
            id="cart-code"
            className="field py-2.5 uppercase placeholder:normal-case"
            placeholder="Zľavový kód alebo poukážka"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeError(null);
            }}
            aria-invalid={!!codeError}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitCode();
              }
            }}
          />
          <button type="button" className="btn-outline shrink-0 py-2.5" onClick={submitCode}>
            Použiť
          </button>
        </div>
        {codeError && <p className="mt-1.5 text-sm text-danger">{codeError}</p>}
      </div>
      {(cart.promo || cart.voucher) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {cart.promo && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-honey-soft py-1 pl-3 pr-1.5 text-xs font-medium text-forest">
              {cart.promo}: {totals.promo?.label}
              <button type="button" onClick={() => removeCode("promo")} className="rounded-full p-0.5 hover:bg-forest/10" aria-label="Odstrániť kód">
                <X size={13} />
              </button>
            </span>
          )}
          {cart.voucher && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moss/12 py-1 pl-3 pr-1.5 text-xs font-medium text-moss">
              <Gift size={13} /> {cart.voucher} (zostatok {formatPrice(totals.voucher?.balance ?? 0)})
              <button type="button" onClick={() => removeCode("voucher")} className="rounded-full p-0.5 hover:bg-forest/10" aria-label="Odstrániť poukážku">
                <X size={13} />
              </button>
            </span>
          )}
        </div>
      )}
      {totals.promoBlocked && <p className="mt-2 text-xs text-danger">Kód {cart.promo} platí pri nákupe jedla nad {formatPrice(totals.promo!.minSubtotal!)}.</p>}

      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
        <Row label="Jedlo" value={formatPrice(totals.subtotal)} />
        <Row label="Obaly" value={formatPrice(totals.packaging)} />
        {cart.mode === "delivery" && <Row label="Doprava" value={totals.deliveryFee ? formatPrice(totals.deliveryFee) : "zadarmo"} />}
        {totals.discount > 0 && <Row label="Zľava" value={`−${formatPrice(totals.discount)}`} accent />}
        {totals.voucherUsed > 0 && <Row label="Poukážka" value={`−${formatPrice(totals.voucherUsed)}`} accent />}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-medium">Spolu</dt>
          <dd className="font-display text-2xl tabular-nums text-forest">{formatPrice(totals.total)}</dd>
        </div>
      </dl>

      {cart.mode === "delivery" && totals.missingForFree > 0 && (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full bg-moss transition-[width] duration-500" style={{ width: `${Math.min(100, (totals.subtotal / FREE_DELIVERY_FROM) * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-soft">Do dopravy zadarmo chýba {formatPrice(totals.missingForFree)}</p>
        </div>
      )}
      {totals.missingForMin > 0 && <p className="mt-3 rounded-xl bg-honey-soft/60 px-3 py-2 text-sm text-forest">Minimálna objednávka na rozvoz je {formatPrice(totals.minOrder)}. Pridajte ešte za {formatPrice(totals.missingForMin)}.</p>}

      {onCheckout ? (
        <button type="button" className="btn-primary mt-5 w-full justify-between py-3.5" onClick={onCheckout} disabled={!!blocked}>
          <span>Pokračovať k objednávke</span> <ArrowRight size={17} />
        </button>
      ) : null}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-soft">{label}</dt>
      <dd className={`tabular-nums ${accent ? "text-moss" : ""}`}>{value}</dd>
    </div>
  );
}

export function CartLink() {
  return (
    <Link to="/objednavka" className="text-sm font-medium text-moss underline underline-offset-2">
      Upraviť košík
    </Link>
  );
}
