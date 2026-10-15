import { useState } from "react";
import { External, Refresh } from "../../components/icons";
import { useToast } from "../../components/toast";
import { CategoryIcon } from "../../components/ui";
import { CATEGORIES, SERVICES } from "../../data/services";
import { liveService } from "../../lib/catalog";
import { durationLabel } from "../../lib/format";
import { updateDB, type DB } from "../../lib/store";
import type { ServiceOverride } from "../../lib/types";
import { Pill, Switch } from "./AdminUI";

export default function ServicesAdmin({ db }: { db: DB }) {
  const toast = useToast();
  const changed = Object.keys(db.serviceOverrides).length;
  const set = (id: string, patch: ServiceOverride) =>
    updateDB((d) => {
      const base = SERVICES.find((s) => s.id === id)!;
      const next = { ...d.serviceOverrides[id], ...patch };
      // Drop values equal to the default so "upravené" means something.
      if (next.price === base.price) delete next.price;
      if (next.duration === base.duration) delete next.duration;
      if (next.online === true) delete next.online;
      const overrides = { ...d.serviceOverrides, [id]: next };
      if (!Object.keys(next).length) delete overrides[id];
      return { ...d, serviceOverrides: overrides };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium text-plum sm:text-5xl">Služby a ceny</h1>
          <p className="mt-1 max-w-xl text-sm text-mute">Zmeny sa hneď prejavia v cenníku, pri rezervácii aj vo voľných termínoch. Cena je pre seniorku, junior a art director sa prepočítajú.</p>
        </div>
        <div className="flex gap-2">
          <a href="/sluzby" target="_blank" rel="noreferrer" className="btn-outline py-2.5 text-sm">
            <External size={15} /> Cenník na webe
          </a>
          {changed > 0 && (
            <button
              type="button"
              className="btn-outline py-2.5 text-sm"
              onClick={() => {
                updateDB((d) => ({ ...d, serviceOverrides: {} }));
                toast("Pôvodné ceny a časy sú obnovené.", "info");
              }}
            >
              <Refresh size={15} /> Obnoviť pôvodné ({changed})
            </button>
          )}
        </div>
      </div>

      {CATEGORIES.map((c) => (
        <section key={c.id} className="overflow-hidden rounded-2xl border border-line bg-paper">
          <h2 className="flex items-center gap-2.5 border-b border-line px-5 py-3.5 font-medium text-ink">
            <span className={`grid size-8 place-items-center rounded-full ${c.tint}`}>
              <CategoryIcon cat={c.id} size={15} />
            </span>
            {c.name}
          </h2>
          <ul className="divide-y divide-line">
            {SERVICES.filter((s) => s.cat === c.id).map((s) => (
              <Row key={s.id} id={s.id} db={db} onChange={(patch) => set(s.id, patch)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ id, db, onChange }: { id: string; db: DB; onChange: (patch: ServiceOverride) => void }) {
  const toast = useToast();
  const s = liveService(id, db.serviceOverrides);
  const edited = !!db.serviceOverrides[id];
  const [price, setPrice] = useState(String(s.price));
  const [duration, setDuration] = useState(String(s.duration));
  // Keep the inputs in step when the values change elsewhere (reset, another tab).
  const [seen, setSeen] = useState(`${s.price}|${s.duration}`);
  if (seen !== `${s.price}|${s.duration}`) {
    setSeen(`${s.price}|${s.duration}`);
    setPrice(String(s.price));
    setDuration(String(s.duration));
  }
  const commit = () => {
    const p = Math.max(0, Math.round(Number(price.replace(",", "."))));
    const d = Math.max(15, Math.round(Number(duration) / 5) * 5);
    if (Number.isNaN(p) || Number.isNaN(d)) return;
    if (p !== s.price || d !== s.duration) {
      onChange({ price: p, duration: d });
      toast(`${s.name}: ${p} € · ${durationLabel(d)}`);
    }
  };
  return (
    <li className={`flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3.5 ${s.online ? "" : "bg-blush/40"}`}>
      <div className="min-w-0 flex-1 basis-56">
        <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
          {s.name}
          {edited && <Pill tone="warn">upravené</Pill>}
          {!s.online && <Pill tone="off">len telefonicky</Pill>}
        </p>
        <p className="text-xs text-mute">
          {s.variants ? `${s.variants.length} varianty · ` : ""}
          {s.levelPricing ? "cena podľa úrovne · " : ""}
          pôvodne {s.basePrice} € / {durationLabel(s.baseDuration)}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-soft">
        <span className="sr-only">Cena {s.name}</span>
        <input className="field w-20 py-2 text-right tabular-nums" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />€
      </label>
      <label className="flex items-center gap-2 text-sm text-soft">
        <span className="sr-only">Trvanie {s.name}</span>
        <input className="field w-20 py-2 text-right tabular-nums" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
        min
      </label>
      <label className="flex items-center gap-2 text-sm text-soft">
        Online
        <Switch
          checked={s.online}
          label={`Online rezervácia: ${s.name}`}
          onChange={(v) => {
            onChange({ online: v });
            toast(v ? `${s.name} je znova v online rezervácii.` : `${s.name} sa už nedá rezervovať online.`, "info");
          }}
        />
      </label>
    </li>
  );
}
