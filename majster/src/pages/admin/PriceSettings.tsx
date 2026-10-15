import { useState } from "react";
import { Link } from "react-router-dom";
import { External, Refresh, Search } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Pill, Switch } from "../../components/ui";
import { saveSettings } from "../../lib/actions";
import { priceOf } from "../../lib/calc";
import { formatPrice } from "../../lib/format";
import { norm } from "../../lib/geo";
import { TRADE } from "../../lib/profile";
import { DEFAULT_SETTINGS, type DB } from "../../lib/store";
import { PageTitle, Panel } from "./AdminUI";

/** Price list and pricing rules. Every change feeds the public price list and the calculator at once. */
export default function PriceSettings({ db }: { db: DB }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const s = db.settings;
  const groups = [...new Set(TRADE.prices.map((p) => p.group))];
  const changed = Object.keys(s.overrides).length;

  const setPrice = (id: string, raw: string) => {
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return;
    const base = TRADE.prices.find((p) => p.id === id)!.price;
    const overrides = { ...s.overrides };
    if (Math.abs(n - base) < 0.005) delete overrides[id];
    else overrides[id] = Math.round(n * 100) / 100;
    saveSettings({ overrides });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Cenník a nastavenia"
        text="Zmeníte cenu tu a kalkulačka aj cenník na webe ju použijú okamžite."
        action={
          <Link to="/kalkulacka" target="_blank" className="btn-outline btn-sm">
            <External size={16} /> Otvoriť kalkulačku
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5">
          <div>
            <p className="font-bold">Platca DPH</p>
            <p className="text-sm text-soft">Ceny na webe {s.vatPayer ? "s DPH 23 %" : "bez DPH"}</p>
          </div>
          <Switch checked={s.vatPayer} onChange={(vatPayer) => saveSettings({ vatPayer })} label="Platca DPH" />
        </div>
        <label className="rounded-2xl border border-line bg-paper p-5">
          <span className="font-bold">Doprava zadarmo do</span>
          <span className="mt-2 flex items-center gap-2">
            <input type="number" min={0} max={60} value={s.freeKm} onChange={(e) => saveSettings({ freeKm: Math.max(0, Number(e.target.value) || 0) })} className="field w-24 py-2" />
            <span className="text-soft">km</span>
          </span>
        </label>
        <label className="rounded-2xl border border-line bg-paper p-5">
          <span className="font-bold">Ďalej za kilometer</span>
          <span className="mt-2 flex items-center gap-2">
            <input type="number" min={0} max={3} step={0.05} value={s.perKm} onChange={(e) => saveSettings({ perKm: Math.max(0, Number(e.target.value) || 0) })} className="field w-24 py-2" />
            <span className="text-soft">€ (tam aj späť)</span>
          </span>
        </label>
      </div>

      <Panel
        title={
          <span className="flex items-center gap-2">
            Cenník bez DPH {changed > 0 && <Pill tone="accent">{changed} upravených</Pill>}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <label className="relative">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-mute" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hľadať" className="field w-40 py-1.5 pl-8 text-sm" aria-label="Hľadať v cenníku" />
            </label>
            {changed > 0 && (
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => {
                  saveSettings({ overrides: DEFAULT_SETTINGS.overrides });
                  toast("Cenník je vrátený na pôvodné ceny.", "info");
                }}
              >
                <Refresh size={15} /> Pôvodné ceny
              </button>
            )}
          </div>
        }
      >
        <div className="divide-y divide-line">
          {groups.map((g) => {
            const items = TRADE.prices.filter((p) => p.group === g && (!query || norm(p.label).includes(norm(query))));
            if (!items.length) return null;
            return (
              <div key={g}>
                <p className="bg-bg px-5 py-2 text-xs font-bold uppercase tracking-wider text-soft">{g}</p>
                <ul className="divide-y divide-line">
                  {items.map((p) => {
                    const current = priceOf(p.id, s.overrides);
                    const edited = p.id in s.overrides;
                    return (
                      <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1 text-sm">
                          {p.label}
                          {edited && <span className="ml-2 text-xs text-mute line-through">{formatPrice(p.price)}</span>}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <input
                            key={`${p.id}-${current}`}
                            defaultValue={String(current).replace(".", ",")}
                            inputMode="decimal"
                            onBlur={(e) => setPrice(p.id, e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                            className={`w-24 rounded-lg border px-2.5 py-1.5 text-right text-sm font-semibold tabular-nums ${edited ? "border-accent bg-accent-soft" : "border-line"}`}
                            aria-label={`Cena: ${p.label}`}
                          />
                          <span className="w-12 text-xs text-mute">€/{p.unit}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
