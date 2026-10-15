import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, Siren } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Dialog, Initials, Pill } from "../../components/ui";
import { updateVisit, useTownOf } from "../../lib/actions";
import { generatedDay, holidayName, windowLabel, windowsOf } from "../../lib/availability";
import { addDays, formatDateShort, formatPhone, fromISODate, toISODate, WEEKDAYS_SHORT } from "../../lib/format";
import { placeName, useGeo } from "../../lib/geo";
import { useNow } from "../../lib/hooks";
import { TRADE } from "../../lib/profile";
import type { DB } from "../../lib/store";
import type { Visit } from "../../lib/types";
import { PageTitle } from "./AdminUI";

type Item = { key: string; time: string; title: string; who: string; place: string; kind: "web" | "visit" | "job" | "off" | "emergency"; visit?: Visit };

/** Who is where this week: one row per technician, generated work plus everything booked on the website. */
export default function Schedule({ db }: { db: DB }) {
  const now = useNow(60_000);
  const geo = useGeo();
  const townOf = useTownOf();
  const toast = useToast();
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<Visit | null>(null);
  const todayISO = toISODate(now);
  const days = useMemo(() => {
    const today = fromISODate(todayISO);
    const monday = addDays(today, -((today.getDay() + 6) % 7) + offset * 7);
    return Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  }, [todayISO, offset]);

  const grid = useMemo(() => {
    const today = fromISODate(todayISO);
    return TRADE.crew.map((tech) =>
        days.map((d) => {
          const iso = toISODate(d);
          const items: Item[] = [];
          const gen = generatedDay(iso, tech.id, today);
          const wins = windowsOf(d);
          if (gen.allDay) items.push({ key: "all", time: gen.allDay.kind === "off" ? "" : "celý deň", title: gen.allDay.title, who: gen.allDay.customer, place: placeName(gen.allDay.place, geo), kind: gen.allDay.kind === "off" ? "off" : "job" });
          gen.windows.forEach((g, i) => {
            if (g) items.push({ key: `g${i}`, time: windowLabel(wins[i]), title: g.title, who: g.customer, place: placeName(g.place, geo), kind: "visit" });
          });
          for (const v of db.visits.filter((v) => v.techId === tech.id && v.date === iso && v.status !== "cancelled")) {
            const lead = db.leads.find((l) => l.id === v.leadId);
            items.push({ key: v.id, time: windowLabel(wins[v.window] ?? { start: 0, end: 0 }), title: TRADE.visitTypes.find((t) => t.id === v.typeId)?.title ?? "Návšteva", who: v.name, place: townOf(v), kind: lead && !("place" in lead) ? "web" : "visit", visit: v });
          }
          for (const e of db.emergencies.filter((e) => e.techId === tech.id && toISODate(new Date(e.createdAt)) === iso && e.status !== "zrusene")) {
            items.push({ key: e.id, time: new Date(e.createdAt).toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" }), title: "Havária", who: e.name, place: e.town || placeName(1, geo), kind: "emergency" });
          }
          return items.sort((a, b) => a.time.localeCompare(b.time));
        }),
    );
  }, [db, days, geo, todayISO, townOf]);

  const tones: Record<Item["kind"], string> = {
    web: "border-accent bg-accent-soft",
    visit: "border-line bg-paper",
    job: "border-[#fb923c]/40 bg-[#fff4ea]",
    off: "stripes border-dashed border-line bg-transparent text-mute",
    emergency: "border-danger/40 bg-danger-soft",
  };

  return (
    <div>
      <PageTitle
        title="Kalendár tímu"
        text="Rezervácie z webu sa zapíšu rovno k voľnému technikovi."
        action={
          <div className="flex items-center gap-2">
            <button type="button" className="btn-outline btn-sm px-2.5" onClick={() => setOffset(offset - 1)} aria-label="Predchádzajúci týždeň">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={() => setOffset(0)} disabled={offset === 0}>
              Tento týždeň
            </button>
            <button type="button" className="btn-outline btn-sm px-2.5" onClick={() => setOffset(offset + 1)} aria-label="Ďalší týždeň">
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-soft">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-accent bg-accent-soft" /> rezervované cez web
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-line bg-paper" /> obhliadky a servis
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-[#fb923c]/40 bg-[#fff4ea]" /> realizácia
        </span>
        {TRADE.emergency && (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-danger/40 bg-danger-soft" /> havária
          </span>
        )}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-40 border-b border-line p-3 text-left text-sm font-bold">Technik</th>
              {days.map((d) => {
                const iso = toISODate(d);
                const holiday = holidayName(d);
                return (
                  <th key={iso} className={`border-b border-l border-line p-3 text-left ${iso === todayISO ? "bg-accent-soft" : ""}`}>
                    <span className="block text-sm font-bold">
                      {WEEKDAYS_SHORT[d.getDay()]} {formatDateShort(d)}
                    </span>
                    {holiday && <span className="block truncate font-medium text-danger">{holiday}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TRADE.crew.map((tech, r) => (
              <tr key={tech.id}>
                <th className="border-b border-line p-3 text-left align-top">
                  <span className="flex items-center gap-2">
                    <Initials name={tech.name} className="size-8 text-[11px]" />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-sm font-bold">{tech.name}</span>
                      <span className="block truncate font-normal text-mute">{tech.role}</span>
                    </span>
                  </span>
                </th>
                {grid[r].map((items, c) => (
                  <td key={c} className={`border-b border-l border-line p-1.5 align-top ${toISODate(days[c]) === todayISO ? "bg-accent-soft/40" : ""}`}>
                    <div className="flex min-h-16 flex-col gap-1">
                      {items.map((it) => (
                        <button
                          key={it.key}
                          type="button"
                          disabled={!it.visit}
                          onClick={() => it.visit && setOpen(it.visit)}
                          className={`rounded-lg border px-2 py-1.5 text-left disabled:cursor-default ${tones[it.kind]} ${it.visit ? "hover:shadow" : ""}`}
                        >
                          {it.kind === "emergency" && <Siren size={11} className="mr-1 inline text-danger" />}
                          {it.time && <span className="block font-bold tabular-nums">{it.time}</span>}
                          <span className="block truncate font-semibold">{it.title}</span>
                          {it.who && <span className="block truncate text-soft">{it.who}</span>}
                          {it.kind !== "off" && <span className="block truncate text-mute">{it.place}</span>}
                        </button>
                      ))}
                      {!items.length && windowsOf(days[c]).length > 0 && <span className="px-2 py-1.5 text-mute">voľno</span>}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${TRADE.visitTypes.find((t) => t.id === open.typeId)?.title} · ${open.code}` : ""}
        size="sm"
        footer={
          open?.status === "planned" && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost btn-sm text-danger"
                onClick={() => {
                  updateVisit(open.id, { status: "cancelled" }, "Zrušené firmou");
                  setOpen(null);
                  toast("Termín zrušený, zákazník dostane SMS.", "info");
                }}
              >
                Zrušiť
              </button>
              <button
                type="button"
                className="btn-dark btn-sm"
                onClick={() => {
                  updateVisit(open.id, { status: "done" }, "Návšteva prebehla");
                  setOpen(null);
                  toast("Označené ako hotové.");
                }}
              >
                Hotovo
              </button>
            </div>
          )
        }
      >
        {open && (
          <div className="space-y-3 p-5 text-sm sm:p-6">
            <p className="text-lg font-bold">{open.name}</p>
            <p className="flex items-center gap-2 text-soft">
              <Clock size={16} /> {open.date} · {windowLabel(windowsOf(new Date(`${open.date}T12:00`))[open.window] ?? { start: 0, end: 0 })}
            </p>
            <p className="flex items-center gap-2 text-soft">
              <MapPin size={16} /> {open.street}, {townOf(open)}
            </p>
            <p className="flex items-center gap-2 text-soft">
              <Phone size={16} /> {formatPhone(open.phone)}
            </p>
            {open.note && <p className="rounded-xl bg-bg p-3 italic">„{open.note}“</p>}
            <Pill tone={open.status === "planned" ? "info" : open.status === "done" ? "ok" : "off"}>{{ planned: "naplánované", done: "hotovo", cancelled: "zrušené" }[open.status]}</Pill>
          </div>
        )}
      </Dialog>
    </div>
  );
}
