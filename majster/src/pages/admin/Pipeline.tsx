import { useMemo, useState } from "react";
import { Calendar, Camera, Copy, Download, External, FileText, Grip, MapPin, Phone, Search, Send } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Dialog, Pill } from "../../components/ui";
import { URGENCY } from "../../config";
import { ensureQuote, moveStage, SOURCE_LABEL, STAGES, stageLabel, updateLead, useTownOf } from "../../lib/actions";
import { windowLabel, windowOf } from "../../lib/availability";
import { quoteTotals } from "../../lib/calc";
import { capitalize, formatDateLong, formatDateNumeric, formatEuro, formatPhone, formatPrice, fromISODate } from "../../lib/format";
import { norm } from "../../lib/geo";
import { useNow } from "../../lib/hooks";
import { TRADE } from "../../lib/profile";
import type { DB } from "../../lib/store";
import type { Lead, Stage } from "../../lib/types";
import { PageTitle } from "./AdminUI";
import { QuoteEditor } from "./QuoteEditor";

const QUOTE_LABEL = { koncept: "koncept", odoslana: "odoslaná", zobrazena: "videná", prijata: "prijatá", odmietnuta: "odmietnutá" } as const;
const LOST = ["Vybral si lacnejšiu ponuku", "Projekt odložil", "Nereaguje", "Termín mu nevyhovoval", "Mimo našej oblasti"];

export default function Pipeline({ db, initialLead }: { db: DB; initialLead: string | null }) {
  const townOf = useTownOf();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [showLost, setShowLost] = useState(false);
  const [openId, setOpenId] = useState<string | null>(() => db.leads.find((l) => l.code === initialLead)?.id ?? null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  const leads = useMemo(() => {
    const q = norm(query);
    return db.leads.filter((l) => !q || norm(`${l.name} ${l.jobTitle} ${townOf(l)} ${l.code}`).includes(q)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db.leads, query, townOf]);
  const columns = showLost ? [...STAGES, { id: "strateny" as Stage, label: "Stratené", short: "Stratené", tone: "bg-mute" }] : STAGES;
  const open = db.leads.find((l) => l.id === openId) ?? null;

  const exportCsv = () => {
    const rows = [["kód", "vytvorené", "zákazník", "telefón", "e-mail", "obec", "práca", "fáza", "zdroj", "odhad", "hodnota"], ...db.leads.map((l) => [l.code, formatDateNumeric(new Date(l.createdAt)), l.name, l.phone, l.email, townOf(l), l.jobTitle, stageLabel(l.stage), SOURCE_LABEL[l.source], l.estimate ? String(l.estimate.gross) : "", l.value ? String(l.value) : ""])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    a.download = "zakazky.csv";
    a.click();
    toast("Export zákaziek stiahnutý.");
  };

  return (
    <div>
      <PageTitle
        title="Zákazky"
        text="Potiahnite kartu do ďalšieho stĺpca. Dopyty z webu sa tu objavia samy."
        action={
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hľadať" className="field w-48 py-2 pl-9 text-sm" aria-label="Hľadať v zákazkách" />
            </label>
            <button type="button" className="chip" aria-pressed={showLost} onClick={() => setShowLost(!showLost)}>
              Stratené
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={exportCsv}>
              <Download size={16} /> CSV
            </button>
          </div>
        }
      />
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        {columns.map((col) => {
          const items = leads.filter((l) => l.stage === col.id);
          const shown = col.id === "hotovo" || col.id === "strateny" ? items.slice(0, 8) : items;
          const sum = items.reduce((s, l) => s + (l.value ?? l.estimate?.gross ?? 0), 0);
          return (
            <section
              key={col.id}
              aria-label={col.label}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col.id);
              }}
              onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
              onDrop={() => {
                if (drag) moveStage(drag, col.id);
                setDrag(null);
                setOver(null);
              }}
              className={`flex w-[272px] shrink-0 snap-start flex-col rounded-2xl p-2 transition-colors ${over === col.id ? "bg-accent-soft ring-2 ring-accent" : "bg-sand/70"}`}
            >
              <header className="flex items-center justify-between px-2 pb-2 pt-1">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span className={`size-2.5 rounded-full ${col.tone}`} /> {col.label}
                  <span className="rounded-full bg-paper px-1.5 text-xs tabular-nums text-soft">{items.length}</span>
                </span>
                <span className="text-xs font-semibold tabular-nums text-mute">{formatEuro(Math.round(sum / 10) * 10)}</span>
              </header>
              <div className="flex min-h-24 flex-col gap-2">
                {shown.map((l) => (
                  <LeadCard key={l.id} lead={l} db={db} town={townOf(l)} onOpen={() => setOpenId(l.id)} onDrag={() => setDrag(l.id)} dragging={drag === l.id} />
                ))}
                {items.length > shown.length && <p className="px-2 py-1 text-xs text-mute">+ ďalších {items.length - shown.length}</p>}
              </div>
            </section>
          );
        })}
      </div>
      <LeadDrawer lead={open} db={db} town={open ? townOf(open) : ""} onClose={() => setOpenId(null)} onQuote={(id) => setQuoteId(id)} />
      <QuoteEditor db={db} quoteId={quoteId} onClose={() => setQuoteId(null)} />
    </div>
  );
}

function age(iso: string, now: number) {
  const h = (now - new Date(iso).getTime()) / 3_600_000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 24) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} d`;
}

function LeadCard({ lead, db, town, onOpen, onDrag, dragging }: { lead: Lead; db: DB; town: string; onOpen: () => void; onDrag: () => void; dragging: boolean }) {
  const now = useNow(60_000).getTime();
  const quote = db.quotes.find((q) => q.id === lead.quoteId);
  const visit = db.visits.find((v) => v.id === lead.visitId && v.status === "planned");
  const value = lead.value ?? (quote ? quoteTotals(quote.items, quote.discountPct, db.settings.vatPayer).gross : lead.estimate?.gross);
  const fresh = lead.stage === "novy" && now - new Date(lead.createdAt).getTime() < 2 * 3_600_000;
  return (
    <article
      draggable
      onDragStart={onDrag}
      className={`group cursor-grab rounded-xl border bg-paper p-3 shadow-sm transition-[opacity,box-shadow] hover:shadow-md active:cursor-grabbing ${dragging ? "opacity-40" : ""} ${fresh ? "border-accent" : "border-line"}`}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold">{lead.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-mute">
            <Grip size={12} className="opacity-0 group-hover:opacity-100" /> {age(lead.createdAt, now)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-soft">{lead.jobTitle}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-mute">
          <MapPin size={12} /> {town}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {value ? <span className="text-sm font-bold tabular-nums">{formatEuro(Math.round(value))}</span> : null}
          {fresh && <Pill tone="accent">NOVÉ</Pill>}
          {lead.source === "kalkulacka" && <Pill tone="off">kalkulačka</Pill>}
          {quote && <Pill tone={quote.status === "prijata" ? "ok" : quote.status === "odmietnuta" ? "bad" : quote.status === "zobrazena" ? "info" : "off"}>ponuka {QUOTE_LABEL[quote.status]}</Pill>}
          {visit && (
            <Pill tone="info">
              <Calendar size={11} /> {formatDateNumeric(fromISODate(visit.date)).slice(0, -5)}
            </Pill>
          )}
          {lead.photos.length > 0 && (
            <Pill tone="off">
              <Camera size={11} /> {lead.photos.length}
            </Pill>
          )}
        </div>
      </button>
    </article>
  );
}

function LeadDrawer({ lead, db, town, onClose, onQuote }: { lead: Lead | null; db: DB; town: string; onClose: () => void; onQuote: (id: string) => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [lost, setLost] = useState(false);
  const quote = lead ? db.quotes.find((q) => q.id === lead.quoteId) : undefined;
  const visit = lead ? db.visits.find((v) => v.id === lead.visitId) : undefined;
  const fakeContact = () => toast("Ukážka: tu by sa vytočilo číslo alebo otvoril e-mail zákazníka.", "info");

  return (
    <Dialog open={!!lead} onClose={onClose} variant="drawer" size="lg" title={lead ? lead.name : ""}>
      {lead && (
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono text-mute">{lead.code}</span>
            <Pill tone="off">{SOURCE_LABEL[lead.source]}</Pill>
            <span className="text-mute">{formatDateNumeric(new Date(lead.createdAt))}</span>
            <select
              value={lead.stage}
              onChange={(e) => (e.target.value === "strateny" ? setLost(true) : moveStage(lead.id, e.target.value as Stage))}
              className="ml-auto rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm font-semibold"
              aria-label="Fáza"
            >
              {[...STAGES.map((s) => s.id), "strateny" as const].map((s) => (
                <option key={s} value={s}>
                  {stageLabel(s)}
                </option>
              ))}
            </select>
          </div>
          {lost && (
            <div className="rounded-xl border border-line p-4">
              <p className="text-sm font-bold">Prečo sme zákazku stratili?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {LOST.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="chip"
                    onClick={() => {
                      moveStage(lead.id, "strateny", { lostReason: r });
                      setLost(false);
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={fakeContact} className="btn-dark btn-sm">
              <Phone size={16} /> {formatPhone(lead.phone) || "—"}
            </button>
            <button type="button" onClick={fakeContact} className="btn-outline btn-sm truncate">
              <Send size={16} /> E-mail
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={() => void navigator.clipboard?.writeText(`${lead.name}, ${formatPhone(lead.phone)}, ${lead.street ? `${lead.street}, ` : ""}${town}`).then(() => toast("Kontakt skopírovaný."))}>
              <Copy size={16} /> Kopírovať
            </button>
          </div>

          <section className="rounded-2xl bg-bg p-4">
            <h3 className="font-bold">{lead.jobTitle}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-mute">Miesto</dt>
              <dd className="font-semibold">
                {[lead.street, town].filter(Boolean).join(", ")}
                {lead.km !== null && ` · ${lead.km} km`}
              </dd>
              {lead.urgency && (
                <>
                  <dt className="text-mute">Termín</dt>
                  <dd className="font-semibold">{URGENCY.find((u) => u.id === lead.urgency)?.label}</dd>
                </>
              )}
              {lead.estimate && (
                <>
                  <dt className="text-mute">Odhad z kalkulačky</dt>
                  <dd className="font-semibold">
                    {formatEuro(lead.estimate.low)} – {formatEuro(lead.estimate.high)}
                  </dd>
                </>
              )}
              {lead.value && (
                <>
                  <dt className="text-mute">Dohodnutá cena</dt>
                  <dd className="font-bold text-ok">{formatPrice(lead.value)}</dd>
                </>
              )}
              <dt className="text-mute">Kontakt</dt>
              <dd className="font-semibold">{{ telefon: "telefonicky", email: "e-mailom", whatsapp: "WhatsApp" }[lead.contactPref ?? "telefon"]}</dd>
            </dl>
            {lead.note && <p className="mt-3 rounded-xl bg-paper p-3 text-sm italic">„{lead.note}“</p>}
            {lead.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {lead.photos.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt={`Fotka od zákazníka ${i + 1}`} className="aspect-square rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}
            {lead.lines && (
              <details className="mt-3 text-sm">
                <summary className="font-semibold text-accent-deep">Položky z kalkulačky ({lead.lines.length})</summary>
                <ul className="mt-2 space-y-1">
                  {lead.lines.map((l, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="text-soft">
                        {l.label} · {l.qty.toLocaleString("sk-SK")} {l.unit}
                      </span>
                      <span className="tabular-nums">{formatPrice(l.total)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {visit && (
            <section className="flex items-center gap-3 rounded-2xl border border-line p-4">
              <Calendar size={20} className="text-mute" />
              <div className="text-sm">
                <p className="font-bold">
                  {visit.status === "cancelled" ? "Zrušená obhliadka" : "Obhliadka"} · {capitalize(formatDateLong(fromISODate(visit.date)))}
                </p>
                <p className="text-soft">
                  {windowLabel(windowOf(visit.date, visit.window) ?? { start: 0, end: 0 })} · {TRADE.crew.find((c) => c.id === visit.techId)?.name}
                </p>
              </div>
              <a href={`/termin/${visit.code}`} target="_blank" rel="noreferrer" className="ml-auto text-mute hover:text-ink" aria-label="Otvoriť termín">
                <External size={18} />
              </a>
            </section>
          )}

          <section className="rounded-2xl border-2 border-ink p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-bold">
                  <FileText size={18} /> Cenová ponuka
                </p>
                <p className="text-sm text-soft">
                  {quote
                    ? `${quote.code} · ${QUOTE_LABEL[quote.status]} · ${formatPrice(quoteTotals(quote.items, quote.discountPct, db.settings.vatPayer).gross)}`
                    : "Z položiek kalkulačky vytvoríme návrh za pár sekúnd."}
                </p>
              </div>
              <div className="flex gap-2">
                {quote && quote.status !== "koncept" && (
                  <a href={`/ponuka/${quote.code}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                    <External size={15} /> Ako zákazník
                  </a>
                )}
                <button type="button" className="btn-accent btn-sm" onClick={() => onQuote(ensureQuote(lead.id)!)}>
                  {quote ? "Upraviť" : "Vytvoriť ponuku"}
                </button>
              </div>
            </div>
            {(lead.stage === "prijata" || lead.stage === "realizacia") && (
              <label className="mt-4 flex items-center gap-3 text-sm">
                <span className="font-semibold">Začiatok prác</span>
                <input type="date" value={lead.startDate ?? ""} onChange={(e) => updateLead(lead.id, { startDate: e.target.value }, `Začiatok prác: ${e.target.value ? formatDateNumeric(fromISODate(e.target.value)) : "–"}`)} className="field w-auto py-2" />
              </label>
            )}
          </section>

          <section>
            <h3 className="font-bold">História</h3>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                updateLead(lead.id, {}, `Poznámka: ${note.trim()}`);
                setNote("");
              }}
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pridať poznámku, napr. ozve sa v piatok" className="field py-2 text-sm" aria-label="Poznámka" />
              <button type="submit" className="btn-dark btn-sm">
                Pridať
              </button>
            </form>
            <ol className="mt-4 space-y-3 border-l-2 border-line pl-4">
              {[...lead.log].reverse().map((e, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-paper bg-ink" />
                  <p>{e.text}</p>
                  <p className="text-xs text-mute">
                    {formatDateNumeric(new Date(e.at))} {new Date(e.at).toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Dialog>
  );
}
