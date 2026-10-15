import { useMemo, useState } from "react";
import { STATUS_LABEL } from "../../lib/labels";
import { ChevronLeft, ChevronRight, Phone, Plus, Send, Trash, Users } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Avatar, Dialog, Segmented, SelectField, TextArea, TextField } from "../../components/ui";
import { CATEGORIES, CATEGORY_BY_ID, SERVICES } from "../../data/services";
import { SPECIALIST_BY_ID, TEAM } from "../../data/team";
import { cancelAppointment, createAppointment } from "../../lib/actions";
import { appointmentsOn, findSlots, shiftFor, utilisation, type Req } from "../../lib/availability";
import { liveService, priceFor } from "../../lib/catalog";
import { addDays, capitalize, durationLabel, formatDateLong, formatEuro, formatPhone, formatPrice, fromISODate, minutesOfDay, minutesToTime, normalizePhone, toISODate, uid } from "../../lib/format";
import { dayInfo } from "../../lib/hours";
import { updateDB, type DB } from "../../lib/store";
import type { ApptStatus, Block } from "../../lib/types";
import { dayRevenue, dayUtilisation, type DayAppt } from "./adminData";
import type { Tab } from "./AdminPage";
import { Pill } from "./AdminUI";

const PX = 1.25; // pixels per minute
const HOUR = 60 * PX;

export default function CalendarView({ db, now, initialDate, go }: { db: DB; now: Date; initialDate: string | null; go: (t: Tab, extra?: Record<string, string>) => void }) {
  const [iso, setIso] = useState(initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : toISODate(now));
  const [showCancelled, setShowCancelled] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ specialistId: string; start: number } | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const toast = useToast();

  const date = fromISODate(iso);
  const info = dayInfo(date);
  const dayStart = info.hours?.open ?? 8 * 60;
  const dayEnd = info.hours?.close ?? 20 * 60;
  const all = useMemo(() => appointmentsOn(iso, db, now), [iso, db, now]);
  const list = all.filter((a) => showCancelled || a.status !== "cancelled");
  const blocks = db.blocks.filter((b) => b.date === iso);
  const isToday = iso === toISODate(now);
  const nowMin = minutesOfDay(now);
  const current = selected ? all.find((a) => a.id === selected) : null;
  const shift = (d: number) => setIso(toISODate(addDays(date, d)));

  const openNew = (specialistId?: string, start?: number) => {
    const person = specialistId ?? TEAM.find((p) => shiftFor(p, iso, db))?.id ?? TEAM[0].id;
    setDraft({ specialistId: person, start: start ?? Math.max(dayStart, isToday ? Math.ceil(nowMin / 15) * 15 : dayStart) });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="grid size-10 place-items-center rounded-full border border-line bg-paper hover:border-ink/30" aria-label="Predchádzajúci deň">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => shift(1)} className="grid size-10 place-items-center rounded-full border border-line bg-paper hover:border-ink/30" aria-label="Nasledujúci deň">
            <ChevronRight size={18} />
          </button>
          <div className="ml-2">
            <h1 className="font-display text-3xl font-medium leading-none text-plum sm:text-4xl">{capitalize(formatDateLong(date))}</h1>
            <p className="mt-1 text-sm text-mute">{info.special ? info.special : info.hours ? `Otvorené ${minutesToTime(info.hours.open)} – ${minutesToTime(info.hours.close)}` : "Zatvorené"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isToday && (
            <button type="button" className="btn-outline py-2 text-sm" onClick={() => setIso(toISODate(now))}>
              Dnes
            </button>
          )}
          <label htmlFor="cal-date" className="sr-only">
            Dátum
          </label>
          <input id="cal-date" type="date" value={iso} onChange={(e) => e.target.value && setIso(e.target.value)} className="field w-auto py-2 text-sm" />
          <button type="button" className="btn-primary py-2.5 text-sm" onClick={() => openNew()} disabled={!info.hours}>
            <Plus size={16} /> Nový termín
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-line bg-paper px-5 py-3 text-sm">
        <span>
          <strong className="font-medium">{list.filter((a) => a.status !== "cancelled").length}</strong> <span className="text-mute">termínov</span>
        </span>
        <span>
          <strong className="font-medium">{formatEuro(Math.round(dayRevenue(all)))}</strong> <span className="text-mute">tržby</span>
        </span>
        <span>
          <strong className="font-medium">{Math.round(dayUtilisation(iso, db, now) * 100)} %</strong> <span className="text-mute">vyťaženosť</span>
        </span>
        <span>
          <strong className="font-medium">{all.filter((a) => a.source === "web").length}</strong> <span className="text-mute">z webu</span>
        </span>
        <label className="ml-auto flex items-center gap-2 text-soft">
          <input type="checkbox" className="size-4 accent-plum" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Zobraziť zrušené
        </label>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-soft">
        {CATEGORIES.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span className={`size-3 rounded ${c.tint}`} /> {c.short}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-dashed border-mute bg-[repeating-linear-gradient(135deg,var(--color-line)_0_4px,transparent_4px_8px)]" /> blokácia / mimo smeny
        </span>
      </div>

      {!info.hours ? (
        <p className="rounded-2xl border border-dashed border-line p-12 text-center text-soft">V tento deň je salón zatvorený{info.special ? ` (${info.special})` : ""}.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
          <div className="flex min-w-max">
            {/* Time ruler */}
            <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-line bg-paper">
              <div className="h-[68px] border-b border-line" />
              <div className="relative" style={{ height: (dayEnd - dayStart) * PX }}>
                {Array.from({ length: Math.floor((dayEnd - dayStart) / 60) + 1 }, (_, i) => dayStart + i * 60)
                  .filter((m) => m < dayEnd)
                  .map((m) => (
                    <span key={m} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-mute" style={{ top: (m - dayStart) * PX }}>
                      {minutesToTime(m)}
                    </span>
                  ))}
              </div>
            </div>
            {TEAM.map((p) => {
              const s = shiftFor(p, iso, db);
              const absent = db.absences.includes(`${p.id}|${iso}`);
              const items = list.flatMap((a) => a.items.filter((i) => i.specialistId === p.id).map((item) => ({ a, item })));
              const u = Math.round(utilisation(p.id, iso, db, now) * 100);
              return (
                <div key={p.id} className="w-[150px] shrink-0 border-r border-line last:border-r-0 sm:w-[168px]">
                  <div className="flex h-[68px] items-center gap-2 border-b border-line px-3">
                    <Avatar id={p.id} size={32} />
                    <div className="min-w-0 text-xs">
                      <p className="truncate text-sm font-medium text-ink">{p.firstName}</p>
                      <p className="text-mute">{s ? `${minutesToTime(s.start)}–${minutesToTime(s.end)} · ${u} %` : absent ? "dovolenka" : "voľno"}</p>
                    </div>
                  </div>
                  <div
                    className="cal-grid relative cursor-copy"
                    style={{ height: (dayEnd - dayStart) * PX, ["--hour" as string]: `${HOUR}px` }}
                    onClick={(e) => {
                      if (!s) return;
                      const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                      const m = dayStart + Math.floor(y / PX / 15) * 15;
                      if (m < s.start || m >= s.end) return;
                      openNew(p.id, m);
                    }}
                  >
                    {/* Outside the shift */}
                    {(!s ? [[dayStart, dayEnd]] : [[dayStart, s.start], [s.end, dayEnd]]).map(([a, b], i) =>
                      b > a ? (
                        <div
                          key={i}
                          className="absolute inset-x-0 cursor-default bg-[repeating-linear-gradient(135deg,rgb(235_223_214/0.7)_0_6px,transparent_6px_12px)]"
                          style={{ top: (a - dayStart) * PX, height: (b - a) * PX }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null,
                    )}
                    {blocks
                      .filter((b) => b.specialistId === p.id)
                      .map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBlock(b);
                          }}
                          className="absolute inset-x-1 overflow-hidden rounded-lg border border-dashed border-mute/60 bg-[repeating-linear-gradient(135deg,var(--color-blush)_0_6px,var(--color-paper)_6px_12px)] p-1.5 text-left text-[11px] text-soft"
                          style={{ top: (b.start - dayStart) * PX + 1, height: (b.end - b.start) * PX - 2 }}
                        >
                          <span className="block font-medium text-ink">{b.label}</span>
                          {minutesToTime(b.start)}–{minutesToTime(b.end)}
                        </button>
                      ))}
                    {items.map(({ a, item }) => (
                      <ApptBlock key={`${a.id}-${item.serviceId}`} a={a} item={item} dayStart={dayStart} onClick={() => setSelected(a.id)} />
                    ))}
                    {isToday && nowMin >= dayStart && nowMin <= dayEnd && (
                      <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-danger" style={{ top: (nowMin - dayStart) * PX }}>
                        {p.id === TEAM[0].id && <span className="absolute -left-1 -top-1.5 size-3 rounded-full bg-danger" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ApptDrawer
        appt={current ?? null}
        db={db}
        now={now}
        onClose={() => setSelected(null)}
        onClient={(email) => go("klienti", { klientka: email })}
        onWaitlist={() => go("spravy")}
      />
      <NewDialog
        key={draft ? `${draft.specialistId}-${draft.start}-${iso}` : "closed"}
        draft={draft}
        iso={iso}
        db={db}
        now={now}
        onClose={() => setDraft(null)}
        onDone={(msg) => {
          setDraft(null);
          toast(msg);
        }}
      />
      <Dialog
        open={!!block}
        onClose={() => setBlock(null)}
        title={block?.label}
        size="sm"
        footer={
          <button
            type="button"
            className="btn w-full bg-danger text-white hover:bg-danger/90"
            onClick={() => {
              updateDB((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== block?.id) }));
              setBlock(null);
              toast("Blokácia je zrušená, čas je znova voľný online.", "info");
            }}
          >
            <Trash size={16} /> Zrušiť blokáciu
          </button>
        }
      >
        {block && (
          <p className="p-6 text-sm text-soft">
            {SPECIALIST_BY_ID.get(block.specialistId)?.name}, {minutesToTime(block.start)} – {minutesToTime(block.end)}. Počas blokácie sa online nedá rezervovať.
          </p>
        )}
      </Dialog>
    </div>
  );
}

function ApptBlock({ a, item, dayStart, onClick }: { a: DayAppt; item: DayAppt["items"][number]; dayStart: number; onClick: () => void }) {
  const cat = liveService(item.serviceId, {}).cat;
  const tint = CATEGORY_BY_ID.get(cat)?.tint ?? "bg-blush";
  const height = (item.end - item.start) * PX - 2;
  const style =
    a.status === "cancelled"
      ? "opacity-50 line-through border-dashed"
      : a.status === "noshow"
        ? "!bg-danger/10 text-danger"
        : a.status === "completed"
          ? "opacity-70"
          : a.status === "arrived"
            ? "ring-2 ring-ok"
            : "";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute inset-x-1 z-[5] overflow-hidden rounded-lg border border-black/5 p-1.5 text-left text-[11px] leading-tight text-ink shadow-sm transition-shadow hover:z-[6] hover:shadow-md ${tint} ${style}`}
      style={{ top: (item.start - dayStart) * PX + 1, height }}
      title={`${a.clientName} · ${item.name} · ${minutesToTime(item.start)}–${minutesToTime(item.end)}`}
    >
      <span className="flex items-center gap-1 font-semibold tabular-nums">
        {minutesToTime(item.start)}
        {!a.generated && <span className="rounded bg-plum px-1 text-[9px] font-semibold uppercase tracking-wide text-ivory">{a.source === "web" ? "web" : "tel"}</span>}
      </span>
      {height > 26 && <span className="block truncate font-medium">{a.clientName}</span>}
      {height > 42 && <span className="block truncate text-soft">{item.name}</span>}
    </button>
  );
}

const STATUS_ACTIONS: { status: ApptStatus; label: string }[] = [
  { status: "confirmed", label: "Potvrdené" },
  { status: "arrived", label: "Prišla" },
  { status: "completed", label: "Dokončené" },
  { status: "noshow", label: "Neprišla" },
];

function ApptDrawer({ appt, db, now, onClose, onClient, onWaitlist }: { appt: DayAppt | null; db: DB; now: Date; onClose: () => void; onClient: (email: string) => void; onWaitlist: () => void }) {
  const toast = useToast();
  const [stylistNote, setStylistNote] = useState("");
  const [forId, setForId] = useState<string | null>(null);
  if (appt && forId !== appt.id) {
    setForId(appt.id);
    setStylistNote(appt.stylistNote ?? "");
  }
  const account = appt?.accountId ? db.accounts.find((a) => a.id === appt.accountId) : null;
  const waiting = appt ? db.waitlist.filter((w) => w.date === appt.date && w.status === "waiting").length : 0;

  const setStatus = (status: ApptStatus) => {
    if (!appt) return;
    if (status === "cancelled") {
      if (appt.generated) updateDB((d) => ({ ...d, generatedStatus: { ...d.generatedStatus, [appt.id]: "cancelled" } }));
      else {
        const original = db.appointments.find((a) => a.id === appt.id);
        if (original) cancelAppointment(original, now, "salon");
      }
      toast("Termín je zrušený a čas je znova voľný online.", "info");
      return;
    }
    if (appt.generated) updateDB((d) => ({ ...d, generatedStatus: { ...d.generatedStatus, [appt.id]: status } }));
    else
      updateDB((d) => ({
        ...d,
        appointments: d.appointments.map((a) => (a.id === appt.id ? { ...a, status, log: [...a.log, { at: now.getTime(), text: `V salóne: ${STATUS_LABEL[status].toLowerCase()}` }] } : a)),
      }));
    toast(`Stav: ${STATUS_LABEL[status]}`);
  };

  return (
    <Dialog open={!!appt} onClose={onClose} variant="drawer" title={appt?.clientName}>
      {appt && (
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={appt.status === "completed" ? "ok" : appt.status === "cancelled" || appt.status === "noshow" ? "bad" : appt.status === "arrived" ? "info" : "warn"}>{STATUS_LABEL[appt.status]}</Pill>
            <Pill tone="off">{appt.source === "web" ? "Online rezervácia" : "Telefonicky"}</Pill>
            {appt.firstVisit && <Pill tone="info">Prvá návšteva</Pill>}
            {account && <Pill tone="ok">Vernostný účet</Pill>}
            <span className="ml-auto text-xs text-mute">{appt.code}</span>
          </div>

          <div className="space-y-1 text-sm">
            <a href={`tel:${appt.phone}`} className="flex items-center gap-2 text-ink hover:underline">
              <Phone size={15} className="text-mute" /> {formatPhone(appt.phone)}
            </a>
            {appt.email && <p className="text-soft">{appt.email}</p>}
          </div>

          <ul className="divide-y divide-line rounded-2xl border border-line">
            {appt.items.map((i, k) => (
              <li key={k} className="flex items-center gap-3 px-4 py-3 text-sm">
                <Avatar id={i.specialistId} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-mute">
                    {SPECIALIST_BY_ID.get(i.specialistId)?.firstName} · {minutesToTime(i.start)} – {minutesToTime(i.end)}
                  </p>
                </div>
                <span className="tabular-nums">{formatPrice(i.price)}</span>
              </li>
            ))}
            <li className="flex justify-between px-4 py-3 text-sm">
              <span className="text-soft">{appt.discounts.length ? appt.discounts.map((d) => d.label).join(", ") : "Spolu"}</span>
              <span className="font-semibold tabular-nums">{formatPrice(appt.total)}</span>
            </li>
            {appt.deposit > 0 && (
              <li className="flex justify-between px-4 py-3 text-sm text-soft">
                <span>Záloha {appt.depositPaid ? "zaplatená" : "nezaplatená"}</span>
                <span className="tabular-nums">{formatPrice(appt.deposit)}</span>
              </li>
            )}
          </ul>

          {appt.note && (
            <div className="rounded-2xl bg-gold-soft/50 p-4 text-sm">
              <p className="font-medium text-plum">Poznámka klientky</p>
              <p className="mt-1 text-soft">{appt.note}</p>
            </div>
          )}
          {account?.careNotes && (
            <div className="rounded-2xl bg-blush p-4 text-sm">
              <p className="font-medium text-plum">Z profilu: starostlivosť</p>
              <p className="mt-1 text-soft">{account.careNotes}</p>
            </div>
          )}

          <div>
            <p className="field-label">Zmeniť stav</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_ACTIONS.map((s) => (
                <button key={s.status} type="button" className="chip py-1.5" aria-pressed={appt.status === s.status} onClick={() => setStatus(s.status)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {!appt.generated && (
            <div className="space-y-2">
              <TextArea label="Poznámka pre klientku (receptúra, odporúčanie)" rows={3} value={stylistNote} onChange={(e) => setStylistNote(e.target.value)} hint="Klientka ju uvidí vo svojej histórii." />
              <button
                type="button"
                className="btn-outline py-2 text-sm"
                onClick={() => {
                  updateDB((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === appt.id ? { ...a, stylistNote: stylistNote.trim() || undefined } : a)) }));
                  toast("Poznámka je uložená a klientka ju vidí v účte.");
                }}
              >
                Uložiť poznámku
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-line pt-5">
            <button type="button" className="btn-outline py-2 text-sm" onClick={() => toast(`SMS pripomienka odoslaná na ${formatPhone(appt.phone)} (simulácia).`)}>
              <Send size={15} /> SMS pripomienka
            </button>
            <button type="button" className="btn-outline py-2 text-sm" onClick={() => onClient(appt.email || appt.phone)}>
              <Users size={15} /> Karta klientky
            </button>
            {appt.status !== "cancelled" && (
              <button type="button" className="btn py-2 text-sm text-danger hover:bg-danger/5" onClick={() => setStatus("cancelled")}>
                <Trash size={15} /> Zrušiť termín
              </button>
            )}
          </div>
          {appt.status === "cancelled" && waiting > 0 && (
            <button type="button" onClick={onWaitlist} className="w-full rounded-2xl bg-gold-soft/60 p-4 text-left text-sm text-plum">
              Na tento deň čaká {waiting} {waiting === 1 ? "klientka" : "klientky"} na čakacej listine. Ponúknuť uvoľnený čas →
            </button>
          )}
          {!appt.generated && appt.log.length > 0 && (
            <ol className="space-y-1.5 border-l border-line pl-4 text-xs text-mute">
              {appt.log.map((l, i) => (
                <li key={i}>
                  <span className="text-soft">{l.text}</span> · {formatDateLong(new Date(l.at))}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </Dialog>
  );
}

const BLOCK_PRESETS = ["Obed", "Školenie", "Lekár", "Upratovanie a sterilizácia", "Súkromné"];

function NewDialog({ draft, iso, db, now, onClose, onDone }: { draft: { specialistId: string; start: number } | null; iso: string; db: DB; now: Date; onClose: () => void; onDone: (msg: string) => void }) {
  const [mode, setMode] = useState<"appt" | "block">("appt");
  const [specialistId, setSpecialistId] = useState(draft?.specialistId ?? TEAM[0].id);
  const person = SPECIALIST_BY_ID.get(specialistId)!;
  const theirs = SERVICES.filter((s) => person.cats.includes(s.cat));
  const [serviceId, setServiceId] = useState(theirs[0]?.id ?? "");
  const service = liveService(theirs.some((s) => s.id === serviceId) ? serviceId : theirs[0].id, db.serviceOverrides);
  const [variantId, setVariantId] = useState<string | undefined>(service.variants?.[0].id);
  const variant = service.variants?.find((v) => v.id === variantId) ?? service.variants?.[0];
  const reqs: Req[] = [{ serviceId: service.id, variantId: variant?.id, specialistId }];
  const slots = draft ? findSlots(iso, reqs, db, now, { staff: true }) : [];
  const [start, setStart] = useState<number | null>(draft?.start ?? null);
  const chosen = slots.find((s) => s.start === start) ?? null;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Block
  const s = shiftFor(person, iso, db);
  const [blockFrom, setBlockFrom] = useState(draft?.start ?? s?.start ?? 600);
  const [blockTo, setBlockTo] = useState((draft?.start ?? s?.start ?? 600) + 60);
  const [label, setLabel] = useState(BLOCK_PRESETS[0]);
  const quarterHours = s ? Array.from({ length: (s.end - s.start) / 15 + 1 }, (_, i) => s.start + i * 15) : [];

  const saveAppt = () => {
    if (!chosen) return setError("Vyberte voľný čas.");
    if (name.trim().length < 3) return setError("Zadajte meno klientky.");
    const normalized = normalizePhone(phone);
    if (!normalized) return setError("Zadajte telefón.");
    createAppointment({ reqs, date: iso, slot: chosen, details: { name, phone: normalized, email, note, firstVisit: false }, account: db.accounts.find((a) => a.email === email.trim().toLowerCase()) ?? null, now, source: "phone" });
    onDone(`Zapísané: ${name.trim()}, ${minutesToTime(chosen.start)} u ${person.genitive}`);
  };

  const saveBlock = () => {
    if (blockTo <= blockFrom) return setError("Koniec musí byť po začiatku.");
    const clash = appointmentsOn(iso, db, now).some((a) => a.status !== "cancelled" && a.items.some((i) => i.specialistId === specialistId && i.start < blockTo && blockFrom < i.end));
    if (clash) return setError("V tomto čase už má klientku. Najprv termín presuňte.");
    updateDB((d) => ({ ...d, blocks: [...d.blocks, { id: uid(), specialistId, date: iso, start: blockFrom, end: blockTo, label }] }));
    onDone(`Blokované: ${person.firstName}, ${minutesToTime(blockFrom)} – ${minutesToTime(blockTo)}`);
  };

  return (
    <Dialog
      open={!!draft}
      onClose={onClose}
      title={`Nový záznam · ${formatDateLong(fromISODate(iso))}`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-danger">{error}</p>
          <button type="button" className="btn-primary" onClick={mode === "appt" ? saveAppt : saveBlock}>
            {mode === "appt" ? "Zapísať termín" : "Blokovať čas"}
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <Segmented
          label="Typ záznamu"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setError(null);
          }}
          options={[
            { value: "appt", label: "Termín (telefonicky)" },
            { value: "block", label: "Blokovať čas" },
          ]}
        />
        <SelectField label="Špecialistka" value={specialistId} onChange={(e) => setSpecialistId(e.target.value)}>
          {TEAM.map((p) => (
            <option key={p.id} value={p.id} disabled={!shiftFor(p, iso, db)}>
              {p.name}
              {!shiftFor(p, iso, db) ? " (nepracuje)" : ""}
            </option>
          ))}
        </SelectField>
        {mode === "appt" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Služba"
                value={service.id}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setVariantId(liveService(e.target.value, db.serviceOverrides).variants?.[0].id);
                }}
              >
                {theirs.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </SelectField>
              {service.variants ? (
                <SelectField label="Variant" value={variant?.id} onChange={(e) => setVariantId(e.target.value)}>
                  {service.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} · {durationLabel(v.duration)}
                    </option>
                  ))}
                </SelectField>
              ) : (
                <div className="flex items-end pb-3 text-sm text-soft">{durationLabel(service.duration)}</div>
              )}
            </div>
            <SelectField label="Začiatok" value={start ?? ""} onChange={(e) => setStart(Number(e.target.value))} hint={`${slots.length} voľných začiatkov · cena ${formatPrice(priceFor(service.id, variant?.id, specialistId, db.serviceOverrides))}`}>
              {!chosen && <option value="">Vyberte čas</option>}
              {slots.map((x) => (
                <option key={x.start} value={x.start}>
                  {minutesToTime(x.start)} – {minutesToTime(x.end)}
                </option>
              ))}
            </SelectField>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Meno klientky" value={name} onChange={(e) => setName(e.target.value)} />
              <TextField label="Telefón" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <TextField label="E-mail (nepovinný)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} hint="S e-mailom sa termín pripíše k jej účtu a pošleme potvrdenie." />
            <TextArea label="Poznámka" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {BLOCK_PRESETS.map((p) => (
                <button key={p} type="button" className="chip py-1.5 text-[13px]" aria-pressed={label === p} onClick={() => setLabel(p)}>
                  {p}
                </button>
              ))}
            </div>
            <TextField label="Popis" value={label} onChange={(e) => setLabel(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Od" value={blockFrom} onChange={(e) => setBlockFrom(Number(e.target.value))}>
                {quarterHours.slice(0, -1).map((m) => (
                  <option key={m} value={m}>
                    {minutesToTime(m)}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Do" value={blockTo} onChange={(e) => setBlockTo(Number(e.target.value))}>
                {quarterHours.slice(1).map((m) => (
                  <option key={m} value={m}>
                    {minutesToTime(m)}
                  </option>
                ))}
              </SelectField>
            </div>
            <p className="text-sm text-soft">Blokovaný čas sa okamžite prestane ponúkať v online rezervácii.</p>
          </>
        )}
      </div>
    </Dialog>
  );
}
