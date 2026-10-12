import { useState, type ReactNode } from "react";
import { Plus, Refresh, Trash } from "../../components/icons";
import { useToast } from "../../components/toast";
import { lunchFor, lunchWeek } from "../../data/lunch";
import { CATEGORIES, DISHES } from "../../data/menu";
import { WEEKDAYS_SHORT, formatDateShort, formatPrice, plural, roundMoney, toISODate } from "../../lib/format";
import { updateDB, type DB } from "../../lib/store";
import type { LunchDay } from "../../lib/types";
import { Panel, Pill, Switch } from "./AdminUI";

function toggleSoldOut(id: string, out: boolean) {
  updateDB((db) => ({ ...db, soldOut: out ? [...new Set([...db.soldOut, id])] : db.soldOut.filter((x) => x !== id) }));
}

export default function MenuAdmin({ db, now }: { db: DB; now: Date }) {
  const todayLunch = lunchFor(now, db.lunch);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <Panel title="Dostupnosť dnes" action={<Pill tone={db.soldOut.length ? "bad" : "off"}>
            {db.soldOut.length} {plural(db.soldOut.length, ["vypredané", "vypredané", "vypredaných"])}
          </Pill>}>
        <p className="border-b border-line px-5 py-3 text-xs text-mute">Vypnuté jedlo sa okamžite označí na webe ako vypredané a nedá sa objednať.</p>
        <div className="max-h-[70vh] overflow-y-auto">
          {todayLunch && (
            <Group title="Obedové menu dnes">
              {todayLunch.dishes.map((d) => (
                <Row key={d.id} name={d.name} price={d.price} on={!db.soldOut.includes(d.id)} onChange={(v) => toggleSoldOut(d.id, !v)} />
              ))}
            </Group>
          )}
          {CATEGORIES.map((c) => (
            <Group key={c.id} title={c.name}>
              {DISHES.filter((d) => d.category === c.id).map((d) => (
                <Row key={d.id} name={d.name} price={d.price} on={!db.soldOut.includes(d.id)} onChange={(v) => toggleSoldOut(d.id, !v)} />
              ))}
            </Group>
          ))}
        </div>
      </Panel>
      <LunchEditor db={db} now={now} />
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="sticky top-0 z-10 bg-paper/95 px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-mute backdrop-blur">{title}</p>
      <ul className="divide-y divide-line">{children}</ul>
    </div>
  );
}

function Row({ name, price, on, onChange }: { name: string; price: number; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center gap-4 px-5 py-2.5 text-sm">
      <span className={`min-w-0 flex-1 truncate ${on ? "" : "text-mute line-through"}`}>{name}</span>
      <span className="tabular-nums text-soft">{formatPrice(price)}</span>
      <Switch checked={on} onChange={onChange} label={`${name}: ${on ? "dostupné" : "vypredané"}`} />
    </li>
  );
}

function LunchEditor({ db, now }: { db: DB; now: Date }) {
  const toast = useToast();
  const week = lunchWeek(now, db.lunch);
  const todayIdx = week.findIndex((d) => toISODate(d.date) === toISODate(now));
  const [active, setActive] = useState(Math.max(0, todayIdx));
  const day = week[active];
  const iso = toISODate(day.date);
  const [draft, setDraft] = useState<LunchDay | null>(day.menu);
  const [draftFor, setDraftFor] = useState(iso);
  // Reset the draft when switching days, or when the saved menu changes elsewhere.
  if (draftFor !== iso) {
    setDraftFor(iso);
    setDraft(day.menu);
  }
  const edited = !!db.lunch[iso];

  if (!draft) return <Panel title="Obedové menu">{null}</Panel>;

  const setDish = (i: number, patch: Partial<LunchDay["dishes"][number]>) =>
    setDraft({ ...draft, dishes: draft.dishes.map((d, n) => (n === i ? { ...d, ...patch } : d)) });

  return (
    <Panel title="Obedové menu na týždeň" action={edited ? <Pill tone="warn">upravené</Pill> : <Pill tone="off">automaticky</Pill>}>
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4 py-3">
        {week.map((d, i) => (
          <button
            key={toISODate(d.date)}
            type="button"
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${active === i ? "bg-forest text-cream" : "text-soft hover:bg-sand"}`}
          >
            {WEEKDAYS_SHORT[d.date.getDay()]} {formatDateShort(d.date)}
            {db.lunch[toISODate(d.date)] ? " •" : ""}
          </button>
        ))}
      </div>
      <div className="space-y-4 px-5 py-5">
        <div>
          <label htmlFor="lunch-soup" className="field-label">
            Polievka
          </label>
          <input id="lunch-soup" className="field py-2.5" value={draft.soup.name} onChange={(e) => setDraft({ ...draft, soup: { ...draft.soup, name: e.target.value } })} />
        </div>
        {draft.dishes.map((d, i) => (
          <div key={d.id} className="grid grid-cols-[auto_1fr_90px_auto] items-end gap-2">
            <span className="pb-2.5 font-display text-xl text-moss">{i + 1}.</span>
            <div>
              <label htmlFor={`lunch-${i}`} className="sr-only">
                Jedlo {i + 1}
              </label>
              <input id={`lunch-${i}`} className="field py-2.5" value={d.name} onChange={(e) => setDish(i, { name: e.target.value })} />
            </div>
            <div>
              <label htmlFor={`lunch-price-${i}`} className="sr-only">
                Cena jedla {i + 1}
              </label>
<PriceInput id={`lunch-price-${i}`} value={d.price} onChange={(price) => setDish(i, { price })} />
            </div>
            <button
              type="button"
              className="mb-1 grid size-9 place-items-center rounded-full text-mute hover:bg-sand hover:text-danger disabled:opacity-30"
              onClick={() => setDraft({ ...draft, dishes: draft.dishes.filter((_, n) => n !== i) })}
              disabled={draft.dishes.length <= 1}
              aria-label={`Odstrániť jedlo ${i + 1}`}
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
        {draft.dishes.length < 6 && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-moss"
            onClick={() =>
              setDraft({
                ...draft,
                dishes: [...draft.dishes, { id: `lunch-${iso}-${Date.now()}`, name: "Nové jedlo", detail: "150 g", allergens: [], price: 9.5 }],
              })
            }
          >
            <Plus size={16} /> Pridať jedlo
          </button>
        )}
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              updateDB((x) => ({ ...x, lunch: { ...x.lunch, [iso]: draft } }));
              toast("Obedové menu je zverejnené na webe.");
            }}
          >
            Uložiť a zverejniť
          </button>
          {edited && (
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                updateDB((x) => {
                  const lunch = { ...x.lunch };
                  delete lunch[iso];
                  return { ...x, lunch };
                });
                setDraftFor("");
                toast("Vrátené na pôvodné menu.", "info");
              }}
            >
              <Refresh size={16} /> Pôvodné
            </button>
          )}
        </div>
        <p className="text-xs text-mute">Ukážka: menu sa mení automaticky každý týždeň, úpravy tu ho prepíšu len pre vybraný deň.</p>
      </div>
    </Panel>
  );
}

/** Euro amount typed the Slovak way ("9,50"); committed when the field loses focus. */
function PriceInput({ id, value, onChange }: { id: string; value: number; onChange: (v: number) => void }) {
  const format = (v: number) => v.toFixed(2).replace(".", ",");
  const [text, setText] = useState(format(value));
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setText(format(value));
  }
  return (
    <input
      id={id}
      className="field py-2.5 text-right tabular-nums"
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^\d,.]/g, ""))}
      onBlur={() => {
        const v = Number(text.replace(",", "."));
        if (Number.isFinite(v) && v > 0) {
          onChange(roundMoney(v));
          setText(format(roundMoney(v)));
        } else setText(format(value));
      }}
    />
  );
}
