import { useMemo, useState } from "react";
import { Check, Copy, Eye, External, Pencil, Plus, Printer, Send, Trash } from "../../components/icons";
import { QuoteDocument } from "../../components/QuoteDocument";
import { useToast } from "../../components/toast";
import { Dialog, Segmented } from "../../components/ui";
import { saveQuote, sendQuote, useTownOf } from "../../lib/actions";
import { priceOf, quoteTotals } from "../../lib/calc";
import { formatPrice, uid } from "../../lib/format";
import { norm } from "../../lib/geo";
import { TRADE } from "../../lib/profile";
import type { DB } from "../../lib/store";
import type { Quote, QuoteItem } from "../../lib/types";

const KINDS: { id: QuoteItem["kind"]; label: string }[] = [
  { id: "praca", label: "Práca" },
  { id: "material", label: "Materiál" },
  { id: "zariadenie", label: "Zariadenie" },
];

/** Line-item quote builder with live A4 preview; sending makes it visible on the customer's link. */
export function QuoteEditor({ db, quoteId, onClose }: { db: DB; quoteId: string | null; onClose: () => void }) {
  const stored = db.quotes.find((q) => q.id === quoteId) ?? null;
  return (
    <Dialog open={!!stored} onClose={onClose} size="xl" title={stored ? `Cenová ponuka ${stored.code}` : ""}>
      {stored && <Editor key={stored.id} db={db} stored={stored} onClose={onClose} />}
    </Dialog>
  );
}

function Editor({ db, stored, onClose }: { db: DB; stored: Quote; onClose: () => void }) {
  const toast = useToast();
  const townOf = useTownOf();
  const lead = db.leads.find((l) => l.id === stored.leadId)!;
  const [q, setQ] = useState<Quote>(stored);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [search, setSearch] = useState("");
  const totals = quoteTotals(q.items, q.discountPct, db.settings.vatPayer);
  const dirty = JSON.stringify(editable(q)) !== JSON.stringify(editable(stored));
  const merged = () => ({ ...stored, ...editable(q) });
  const link = `${window.location.origin}/ponuka/${q.code}`;
  const sent = stored.status !== "koncept";

  const matches = useMemo(() => {
    const s = norm(search);
    return s.length < 2 ? [] : TRADE.prices.filter((p) => norm(`${p.label} ${p.group}`).includes(s)).slice(0, 6);
  }, [search]);

  const setItem = (id: string, patch: Partial<QuoteItem>) => setQ({ ...q, items: q.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const add = (item: Omit<QuoteItem, "id">) => {
    setQ({ ...q, items: [...q.items, { ...item, id: uid() }] });
    setSearch("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg px-5 py-3 sm:px-6">
        <Segmented
          label="Zobrazenie"
          value={view}
          onChange={setView}
          options={[
            { value: "edit", label: (<><Pencil size={15} /> Úpravy</>) },
            { value: "preview", label: (<><Eye size={15} /> Náhľad</>) },
          ]}
        />
        <p className="text-sm">
          Spolu <strong className="text-lg tabular-nums">{formatPrice(totals.gross)}</strong> {db.settings.vatPayer ? "s DPH" : ""}
        </p>
      </div>

      {view === "edit" ? (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-bg text-left text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="px-3 py-2 font-semibold">Položka</th>
                  <th className="w-28 px-2 py-2 font-semibold">Druh</th>
                  <th className="w-20 px-2 py-2 text-right font-semibold">Množ.</th>
                  <th className="w-14 px-2 py-2 font-semibold">J.</th>
                  <th className="w-24 px-2 py-2 text-right font-semibold">Cena/j.</th>
                  <th className="w-24 px-2 py-2 text-right font-semibold">Spolu</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {q.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-2 py-1.5">
                      <input value={i.label} onChange={(e) => setItem(i.id, { label: e.target.value })} className="w-full rounded-lg px-2 py-1.5 hover:bg-bg focus:bg-paper focus:outline-1 focus:outline-ink/30" aria-label="Názov položky" />
                    </td>
                    <td className="px-1 py-1.5">
                      <select value={i.kind} onChange={(e) => setItem(i.id, { kind: e.target.value as QuoteItem["kind"] })} className="w-full rounded-lg bg-transparent px-1 py-1.5 hover:bg-bg" aria-label="Druh">
                        {KINDS.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1.5">
                      <NumberCell value={i.qty} onChange={(qty) => setItem(i.id, { qty })} label="Množstvo" />
                    </td>
                    <td className="px-1 py-1.5">
                      <input value={i.unit} onChange={(e) => setItem(i.id, { unit: e.target.value })} className="w-full rounded-lg px-1 py-1.5 hover:bg-bg" aria-label="Jednotka" />
                    </td>
                    <td className="px-1 py-1.5">
                      <NumberCell value={i.price} onChange={(price) => setItem(i.id, { price })} label="Cena za jednotku" />
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right font-semibold tabular-nums">{formatPrice(i.qty * i.price)}</td>
                    <td className="px-1">
                      <button type="button" onClick={() => setQ({ ...q, items: q.items.filter((x) => x.id !== i.id) })} className="grid size-8 place-items-center rounded-lg text-mute hover:bg-danger-soft hover:text-danger" aria-label="Odstrániť položku">
                        <Trash size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <div className="relative min-w-64 flex-1">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pridať z cenníka – napíšte názov…" className="field py-2.5" aria-label="Hľadať v cenníku" />
              {matches.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 rounded-xl border border-line bg-paper py-1 shadow-xl">
                  {matches.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="flex w-full justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-bg" onClick={() => add({ label: p.label, qty: 1, unit: p.unit, price: priceOf(p.id, db.settings.overrides), kind: p.kind })}>
                        <span>{p.label}</span>
                        <span className="shrink-0 text-mute">
                          {formatPrice(priceOf(p.id, db.settings.overrides))}/{p.unit}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" className="btn-outline btn-sm py-2.5" onClick={() => add({ label: "Vlastná položka", qty: 1, unit: "ks", price: 0, kind: "praca" })}>
              <Plus size={16} /> Vlastná položka
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <label className="text-sm">
              <span className="field-label">Zľava %</span>
              <input type="number" min={0} max={50} value={q.discountPct} onChange={(e) => setQ({ ...q, discountPct: Math.min(50, Math.max(0, Number(e.target.value) || 0)) })} className="field py-2.5" />
            </label>
            <label className="text-sm">
              <span className="field-label">Platnosť (dní)</span>
              <input type="number" min={7} max={90} value={q.validDays} onChange={(e) => setQ({ ...q, validDays: Number(e.target.value) || 30 })} className="field py-2.5" />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="field-label">Navrhovaný začiatok prác</span>
              <input type="date" value={q.startDate ?? ""} onChange={(e) => setQ({ ...q, startDate: e.target.value || undefined })} className="field py-2.5" />
            </label>
            <label className="text-sm sm:col-span-4">
              <span className="field-label">Poznámka pre zákazníka</span>
              <textarea value={q.note} onChange={(e) => setQ({ ...q, note: e.target.value })} className="field min-h-20" placeholder="Napr. čo ponuka nezahŕňa, harmonogram, materiál na výber…" />
            </label>
          </div>
        </div>
      ) : (
        <div className="bg-sand p-3 sm:p-6">
          <div className="print-area mx-auto max-w-3xl shadow-xl">
            <QuoteDocument quote={q} lead={lead} vatPayer={db.settings.vatPayer} town={townOf(lead)} />
          </div>
        </div>
      )}

      {sent && (
        <div className="mx-5 mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-ok-soft px-4 py-3 text-sm sm:mx-6">
          <Check size={18} className="text-ok" />
          <span className="flex-1">
            Odoslané zákazníkovi · stav: <strong>{{ odoslana: "čaká na otvorenie", zobrazena: "zákazník ju videl", prijata: "prijatá", odmietnuta: "odmietnutá", koncept: "koncept" }[stored.status]}</strong>
          </span>
          <button type="button" className="font-semibold text-ok hover:underline" onClick={() => void navigator.clipboard?.writeText(link).then(() => toast("Odkaz skopírovaný."))}>
            <Copy size={14} className="mr-1 inline" /> Kopírovať odkaz
          </button>
          <a href={`/ponuka/${q.code}`} target="_blank" rel="noreferrer" className="font-semibold text-ok hover:underline">
            <External size={14} className="mr-1 inline" /> Otvoriť ako zákazník
          </a>
        </div>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper px-5 py-4 sm:px-6">
        <button type="button" className="btn-ghost btn-sm mr-auto" onClick={onClose}>
          Zavrieť
        </button>
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() => {
            setView("preview");
            setTimeout(() => window.print(), 100);
          }}
        >
          <Printer size={16} /> PDF
        </button>
        <button
          type="button"
          className="btn-outline btn-sm"
          disabled={!dirty}
          onClick={() => {
            saveQuote(merged());
            toast("Ponuka uložená.");
          }}
        >
          Uložiť
        </button>
        <button
          type="button"
          className="btn-accent btn-sm"
          disabled={!q.items.length}
          onClick={() => {
            sendQuote(merged());
            toast(`Ponuka odoslaná na ${lead.email || lead.phone}. Otvorte si ju ako zákazník.`);
          }}
        >
          <Send size={16} /> {sent ? "Odoslať znova" : "Odoslať zákazníkovi"}
        </button>
      </div>
    </div>
  );
}

/** The fields the editor changes; status and dates stay as the store has them. */
const editable = (x: Quote) => ({ items: x.items, discountPct: x.discountPct, validDays: x.validDays, note: x.note, startDate: x.startDate });

function NumberCell({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      inputMode="decimal"
      aria-label={label}
      value={draft ?? String(value).replace(".", ",")}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = Number((draft ?? "").replace(",", "."));
        if (draft !== null && Number.isFinite(n)) onChange(Math.max(0, Math.round(n * 100) / 100));
        setDraft(null);
      }}
      className="w-full rounded-lg px-2 py-1.5 text-right tabular-nums hover:bg-bg"
    />
  );
}
