import { useMemo, useState, type FormEvent } from "react";
import { Accessible, Baby, ChevronLeft, ChevronRight, Dog, Phone, Plus } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Dialog, TextField } from "../../components/ui";
import { AREAS, areaById, durationAt, reservationsForDate, slotsForDate } from "../../lib/availability";
import { addDays, capitalize, formatDateLong, formatPhone, fromISODate, makeCode, minutesToTime, normalizePhone, timeToMinutes, toISODate, uid } from "../../lib/format";
import { RESERVATION_STATUS } from "../../lib/labels";
import { updateDB, type DB } from "../../lib/store";
import type { AreaId, Reservation, ReservationStatus } from "../../lib/types";
import { Panel, Pill } from "./AdminUI";

const STATUS_TONE: Record<ReservationStatus, "ok" | "warn" | "off" | "bad" | "info"> = {
  confirmed: "info",
  seated: "ok",
  completed: "off",
  noshow: "bad",
  cancelled: "bad",
};

function setStatus(r: Reservation, status: ReservationStatus) {
  updateDB((db) =>
    r.generated
      ? { ...db, reservationStatus: { ...db.reservationStatus, [r.id]: status } }
      : { ...db, reservations: db.reservations.map((x) => (x.id === r.id ? { ...x, status } : x)) },
  );
}

export default function Reservations({ db, now }: { db: DB; now: Date }) {
  const [date, setDate] = useState(toISODate(now));
  const [area, setArea] = useState<AreaId | "all">("all");
  const [adding, setAdding] = useState(false);
  const all = useMemo(() => reservationsForDate(date, db, now), [date, db, now]);
  const list = all.filter((r) => area === "all" || r.area === area);
  const live = all.filter((r) => r.status !== "cancelled" && r.status !== "noshow");
  const day = fromISODate(date);

  const byArea = AREAS.map((a) => {
    const peak = Math.max(
      0,
      ...slotsForDate(day).map((m) =>
        live
          .filter((r) => r.area === a.id)
          .filter((r) => {
            const s = timeToMinutes(r.time);
            return s <= m && m < s + durationAt(s);
          })
          .reduce((sum, r) => sum + r.guests, 0),
      ),
    );
    return { area: a, peak };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button type="button" className="grid size-10 place-items-center rounded-full border border-line bg-paper hover:border-ink/30" onClick={() => setDate(toISODate(addDays(day, -1)))} aria-label="Predchádzajúci deň">
            <ChevronLeft size={18} />
          </button>
          <input type="date" className="field w-auto py-2" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Dátum" />
          <button type="button" className="grid size-10 place-items-center rounded-full border border-line bg-paper hover:border-ink/30" onClick={() => setDate(toISODate(addDays(day, 1)))} aria-label="Nasledujúci deň">
            <ChevronRight size={18} />
          </button>
          {date !== toISODate(now) && (
            <button type="button" className="btn-outline py-2" onClick={() => setDate(toISODate(now))}>
              Dnes
            </button>
          )}
        </div>
        <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
          <Plus size={17} /> Telefonická rezervácia
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {byArea.map(({ area: a, peak }) => (
          <div key={a.id} className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-sm text-soft">{a.name}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {peak}
              <span className="text-sm font-normal text-mute"> / {a.capacity}</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-[#2f7a4a]" style={{ width: `${Math.min(100, (peak / a.capacity) * 100)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-mute">najvyššia obsadenosť v deň</p>
          </div>
        ))}
      </div>

      <Panel
        title={
          <>
            {capitalize(formatDateLong(day))} · {live.length} rezervácií · {live.reduce((s, r) => s + r.guests, 0)} hostí
          </>
        }
        action={
          <select className="field w-auto py-1.5 text-sm" value={area} onChange={(e) => setArea(e.target.value as AreaId | "all")} aria-label="Priestor">
            <option value="all">Všetky priestory</option>
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        }
      >
        {list.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
                  <th className="px-5 py-3 font-medium">Čas</th>
                  <th className="px-3 py-3 font-medium">Hosť</th>
                  <th className="px-3 py-3 font-medium">Os.</th>
                  <th className="px-3 py-3 font-medium">Priestor</th>
                  <th className="px-3 py-3 font-medium">Poznámka</th>
                  <th className="px-5 py-3 text-right font-medium">Stav</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((r) => (
                  <tr key={r.id} className={`${r.status === "cancelled" || r.status === "noshow" ? "text-mute" : ""} ${!r.generated ? "bg-honey-soft/25" : ""}`}>
                    <td className="px-5 py-3 font-semibold tabular-nums">{r.time}</td>
                    <td className="px-3 py-3">
                      <span className="block font-medium">{r.name}</span>
                      <span className="flex items-center gap-1 text-xs text-mute">
                        {r.source === "phone" && <Phone size={11} />} {formatPhone(r.phone)} · {r.code}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{r.guests}</td>
                    <td className="px-3 py-3">{areaById(r.area).name}</td>
                    <td className="max-w-[240px] px-3 py-3 text-xs text-soft">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {r.occasion && <Pill tone="warn">{r.occasion}</Pill>}
                        {r.extras.includes("Detská stolička") && <Baby size={14} aria-label="Detská stolička" />}
                        {r.extras.includes("Bezbariérový prístup") && <Accessible size={14} aria-label="Bezbariérový prístup" />}
                        {r.extras.includes("Prídeme so psom") && <Dog size={14} aria-label="So psom" />}
                        {r.note && <span className="w-full">{r.note}</span>}
                        {r.deposit ? <span className="w-full">Záloha {r.deposit} € zaplatená</span> : null}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <select
                        value={r.status}
                        onChange={(e) => setStatus(r, e.target.value as ReservationStatus)}
                        aria-label={`Stav rezervácie ${r.name}`}
                        className={`rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-semibold ${
                          { info: "bg-moss/12 text-moss", ok: "bg-[#4cbf7a]/15 text-ok", off: "bg-sand text-soft", bad: "bg-danger/10 text-danger", warn: "" }[STATUS_TONE[r.status]]
                        }`}
                      >
                        {(Object.keys(RESERVATION_STATUS) as ReservationStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {RESERVATION_STATUS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-mute">Na tento deň nie sú žiadne rezervácie.</p>
        )}
        <p className="border-t border-line px-5 py-3 text-xs text-mute">Zvýraznené riadky sú rezervácie vytvorené v tomto prehliadači. Ostatné sú ukážkové.</p>
      </Panel>

      <AddReservation open={adding} onClose={() => setAdding(false)} date={date} />
    </div>
  );
}

function AddReservation({ open, onClose, date }: { open: boolean; onClose: () => void; date: string }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", phone: "", guests: "2", time: "19:00", area: "interier" as AreaId, note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const slots = slotsForDate(fromISODate(date));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (form.name.trim().length < 2) found.name = "Meno hosťa";
    if (!normalizePhone(form.phone)) found.phone = "Telefón";
    setErrors(found);
    if (Object.keys(found).length) return;
    const r: Reservation = {
      id: uid(),
      code: makeCode("LP"),
      date,
      time: form.time,
      guests: Number(form.guests),
      area: form.area,
      name: form.name.trim(),
      email: "",
      phone: normalizePhone(form.phone)!,
      note: form.note.trim() || undefined,
      extras: [],
      status: "confirmed",
      source: "phone",
      createdAt: Date.now(),
    };
    updateDB((db) => ({ ...db, reservations: [...db.reservations, r] }));
    toast(`Rezervácia ${r.code} uložená.`);
    setForm({ ...form, name: "", phone: "", note: "" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Telefonická rezervácia" size="sm">
      <form onSubmit={submit} noValidate className="space-y-4 px-6 py-5">
        <TextField label="Meno hosťa" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label="Telefón" required type="tel" value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="add-guests" className="field-label">
              Hostia
            </label>
            <select id="add-guests" className="field" value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="add-time" className="field-label">
              Čas
            </label>
            <select id="add-time" className="field" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
              {slots.map((m) => (
                <option key={m}>{minutesToTime(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="add-area" className="field-label">
              Priestor
            </label>
            <select id="add-area" className="field" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as AreaId })}>
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <TextField label="Poznámka" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button type="submit" className="btn-primary w-full" disabled={!slots.length}>
          Uložiť rezerváciu
        </button>
      </form>
    </Dialog>
  );
}
