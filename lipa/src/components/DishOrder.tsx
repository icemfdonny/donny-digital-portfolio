import { useState } from "react";
import { ORDERING } from "../config";
import type { OptionGroup } from "../data/menu";
import { useCart } from "../lib/cart";
import { formatPrice, roundMoney } from "../lib/format";
import { Bag } from "./icons";
import { useToast } from "./toast";
import { QuantityStepper } from "./ui";

export type OrderableItem = {
  id: string;
  name: string;
  price: number;
  options?: OptionGroup[];
  /** Packaging fee per portion; dishes default to the standard box. */
  packaging?: number;
};

/** Options, quantity and a note for one dish, then into the cart. Used on the order page and in the menu. */
export default function DishOrderForm({ item, onDone, disabled }: { item: OrderableItem; onDone: () => void; disabled?: string | null }) {
  const cart = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [showErrors, setShowErrors] = useState(false);

  const missing = (item.options ?? []).filter((g) => g.required && !picked[g.id]?.length);
  const extras = (item.options ?? []).flatMap((g) => g.choices.filter((c) => picked[g.id]?.includes(c.id)));
  const unitPrice = roundMoney(item.price + extras.reduce((sum, c) => sum + (c.price ?? 0), 0));

  const toggle = (group: OptionGroup, choice: string) =>
    setPicked((p) => {
      const current = p[group.id] ?? [];
      if (group.type === "single") return { ...p, [group.id]: [choice] };
      return { ...p, [group.id]: current.includes(choice) ? current.filter((c) => c !== choice) : [...current, choice] };
    });

  const add = () => {
    if (missing.length) {
      setShowErrors(true);
      document.getElementById(`group-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    cart.add({
      itemId: item.id,
      name: item.name,
      qty,
      unitPrice,
      options: extras.map((c) => (c.price ? `${c.label} (+${formatPrice(c.price)})` : c.label)),
      note: note.trim() || undefined,
      packaging: item.packaging ?? ORDERING.packaging,
    });
    toast(
      <>
        {qty}× {item.name} v košíku
      </>,
    );
    onDone();
  };

  return (
    <div>
      <div className="space-y-6 px-6 py-5">
        {(item.options ?? []).map((group) => {
          const error = showErrors && group.required && !picked[group.id]?.length;
          return (
            <fieldset key={group.id} id={`group-${group.id}`}>
              <legend className="mb-3 flex w-full items-center justify-between text-sm font-medium">
                <span>{group.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${error ? "bg-danger/10 text-danger" : "bg-sand text-soft"}`}>
                  {group.required ? "Povinné" : "Voliteľné"}
                </span>
              </legend>
              <div className="space-y-2">
                {group.choices.map((choice) => {
                  const on = picked[group.id]?.includes(choice.id) ?? false;
                  return (
                    <label
                      key={choice.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors ${
                        on ? "border-forest bg-forest/[0.04]" : error ? "border-danger/50" : "border-line hover:border-ink/30"
                      }`}
                    >
                      <input
                        type={group.type === "single" ? "radio" : "checkbox"}
                        name={`${item.id}-${group.id}`}
                        checked={on}
                        onChange={() => toggle(group, choice.id)}
                        className="size-4 accent-forest"
                      />
                      <span className="flex-1">{choice.label}</span>
                      {choice.price ? <span className="text-sm tabular-nums text-soft">+{formatPrice(choice.price)}</span> : null}
                    </label>
                  );
                })}
              </div>
              {error && <p className="mt-2 text-sm text-danger">Vyberte, prosím, jednu možnosť.</p>}
            </fieldset>
          );
        })}
        <div>
          <label htmlFor={`note-${item.id}`} className="field-label">
            Poznámka pre kuchyňu
          </label>
          <input id={`note-${item.id}`} className="field" placeholder="Napr. bez cibule, omáčku zvlášť" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
        </div>
      </div>
      <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-paper px-6 py-4">
        <QuantityStepper value={qty} onChange={setQty} min={1} max={20} label="Počet porcií" />
        <button type="button" className="btn-primary flex-1 justify-between" onClick={add} disabled={!!disabled}>
          {disabled ? (
            <span>{disabled}</span>
          ) : (
            <>
              <span className="inline-flex items-center gap-2">
                <Bag size={17} /> Pridať do košíka
              </span>
              <span className="tabular-nums">{formatPrice(unitPrice * qty)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
