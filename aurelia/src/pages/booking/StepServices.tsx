import { useMemo, useState } from "react";
import { Check, Plus, Search, Shield, Tag } from "../../components/icons";
import { useToast } from "../../components/toast";
import { CategoryIcon } from "../../components/ui";
import { BUNDLES, CATEGORIES, SERVICE_BY_ID, type CategoryId } from "../../data/services";
import { SPECIALIST_BY_ID } from "../../data/team";
import { bundlesFor, fromPrice, liveServices, variantOf, type LiveService } from "../../lib/catalog";
import { durationLabel, formatEuro } from "../../lib/format";
import type { DB } from "../../lib/store";
import { useVisit } from "../../lib/visit";

export default function StepServices({ db, preferred }: { db: DB; preferred: string | null }) {
  const { items, add, remove, update } = useVisit();
  const toast = useToast();
  const [cat, setCat] = useState<CategoryId | "all">(() => (items[0] ? (SERVICE_BY_ID.get(items[0].serviceId)?.cat ?? "all") : "all"));
  const [query, setQuery] = useState("");
  const services = useMemo(() => liveServices(db.serviceOverrides), [db.serviceOverrides]);
  const q = query.trim().toLowerCase();
  const shown = services.filter((s) => (cat === "all" || s.cat === cat) && (!q || `${s.name} ${s.desc}`.toLowerCase().includes(q)));
  const chosenIds = items.map((i) => i.serviceId);
  const suggestions = [...new Set(items.flatMap((i) => SERVICE_BY_ID.get(i.serviceId)?.pairsWith ?? []))].filter((id) => !chosenIds.includes(id)).slice(0, 4);
  const almostBundles = BUNDLES.filter((b) => !bundlesFor(chosenIds).includes(b) && b.groups.some((g) => g.some((id) => chosenIds.includes(id))));

  const addService = (s: LiveService) => {
    const person = preferred && SPECIALIST_BY_ID.get(preferred)?.cats.includes(s.cat) ? preferred : "any";
    add(s.id, s.variants?.[0].id, person);
    toast(<>Pridané: {s.name}</>);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
          <label htmlFor="service-search" className="sr-only">
            Hľadať službu
          </label>
          <input id="service-search" className="field rounded-full pl-11" placeholder="Hľadať, napr. balayage, gél lak…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" className="chip shrink-0" aria-pressed={cat === "all"} onClick={() => setCat("all")}>
          Všetko
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="chip shrink-0" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            <CategoryIcon cat={c.id} size={15} /> {c.short}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-2.5">
        {shown.map((s) => {
          const item = items.find((i) => i.serviceId === s.id);
          const selected = !!item;
          const variant = variantOf(s, item?.variantId);
          const duration = variant?.duration ?? s.duration;
          return (
            <li key={s.id} className={`rounded-2xl border transition-colors ${selected ? "border-plum/50 bg-paper shadow-[0_8px_30px_-18px_rgb(59_41_48/0.45)]" : "border-line bg-paper/70"}`}>
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <span className={`mt-0.5 hidden size-10 shrink-0 place-items-center rounded-full text-plum sm:grid ${CATEGORIES.find((c) => c.id === s.cat)?.tint}`}>
                  <CategoryIcon cat={s.cat} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-ink">
                    {s.name}
                    {s.popular && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-plum">Obľúbené</span>}
                    {s.isNew && <span className="rounded-full bg-mauve/12 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-mauve">Novinka</span>}
                  </p>
                  <p className="mt-1 text-sm font-light leading-relaxed text-soft">{s.desc}</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
                    <span>{durationLabel(duration)}</span>
                    {s.deposit && <span>Záloha pri rezervácii</span>}
                    {s.patchTest && (
                      <span className="inline-flex items-center gap-1">
                        <Shield size={12} /> Test citlivosti pri prvej návšteve
                      </span>
                    )}
                    {!s.online && <span className="text-danger">Len telefonicky</span>}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-[15px] font-medium tabular-nums text-plum">{s.price === 0 ? "zadarmo" : `${s.levelPricing || s.variants ? "od " : ""}${formatEuro(fromPrice(s, db.serviceOverrides))}`}</span>
                  <button
                    type="button"
                    disabled={!s.online}
                    onClick={() => (selected ? remove(item.key) : addService(s))}
                    aria-pressed={selected}
                    aria-label={selected ? `Odobrať ${s.name}` : `Pridať ${s.name}`}
                    className={`grid size-10 place-items-center rounded-full border transition-colors disabled:opacity-30 ${selected ? "border-plum bg-plum text-ivory" : "border-line text-plum hover:border-plum"}`}
                  >
                    {selected ? <Check size={18} /> : <Plus size={18} />}
                  </button>
                </div>
              </div>
              {selected && s.variants && (
                <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3 sm:pl-[4.75rem]" role="radiogroup" aria-label={`Variant: ${s.name}`}>
                  {s.variants.map((v) => (
                    <button key={v.id} type="button" role="radio" aria-checked={variant?.id === v.id} className="chip py-1.5 text-[13px]" onClick={() => update(item.key, { variantId: v.id })}>
                      {v.label} · {durationLabel(v.duration)}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {!shown.length && <li className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-mute">Nič sme nenašli. Skúste iné slovo alebo kategóriu.</li>}
      </ul>

      {(suggestions.length > 0 || almostBundles.length > 0) && (
        <div className="mt-8 rounded-2xl bg-blush/70 p-5">
          <p className="text-sm font-medium text-plum">Klientky k tomu často pridávajú</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((id) => {
              const s = services.find((x) => x.id === id);
              if (!s || !s.online) return null;
              return (
                <button key={id} type="button" className="chip bg-paper" onClick={() => addService(s)}>
                  <Plus size={14} /> {s.name} <span className="text-mute">· {durationLabel(s.duration)}</span>
                </button>
              );
            })}
          </div>
          {almostBundles.map((b) => (
            <p key={b.id} className="mt-3 flex items-center gap-2 text-sm text-soft">
              <Tag size={15} className="text-gold" /> Kombinácia „{b.label}“ ušetrí {formatEuro(b.amount)}.
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
