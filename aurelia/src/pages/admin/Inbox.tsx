import { Check, Hourglass, Mail, Phone, Send } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Avatar } from "../../components/ui";
import { SPECIALIST_BY_ID } from "../../data/team";
import { findSlots } from "../../lib/availability";
import { SERVICES } from "../../data/services";
import { capitalize, formatClock, formatDateLong, formatPhone, fromISODate, minutesToTime } from "../../lib/format";
import { updateDB, type DB } from "../../lib/store";
import { Panel, Pill } from "./AdminUI";

export default function Inbox({ db, now }: { db: DB; now: Date }) {
  const toast = useToast();
  const waitlist = [...db.waitlist].sort((a, b) => a.date.localeCompare(b.date));
  const messages = [...db.messages].sort((a, b) => b.createdAt - a.createdAt);

  /** First free start that day for the waiting client's first service, so the offer is concrete. */
  const freeFor = (date: string, services: string, specialistId: string) => {
    const service = SERVICES.find((s) => services.startsWith(s.name));
    if (!service) return null;
    return findSlots(date, [{ serviceId: service.id, variantId: service.variants?.[0].id, specialistId }], db, now)[0] ?? null;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-medium text-plum sm:text-5xl">Správy a čakačky</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={`Čakacia listina (${waitlist.filter((w) => w.status === "waiting").length})`}>
          {waitlist.length ? (
            <ul className="divide-y divide-line">
              {waitlist.map((w) => {
                const free = w.status === "waiting" ? freeFor(w.date, w.services, w.specialistId) : null;
                return (
                  <li key={w.id} className="space-y-3 px-5 py-4 text-sm">
                    <div className="flex items-start gap-3">
                      <Avatar id={w.specialistId} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">{w.name}</p>
                        <p className="text-xs text-mute">
                          {w.services} · {capitalize(formatDateLong(fromISODate(w.date)))} · {w.specialistId === "any" ? "ktokoľvek" : SPECIALIST_BY_ID.get(w.specialistId)?.firstName}
                        </p>
                      </div>
                      {w.status === "offered" ? <Pill tone="ok">ponúknuté</Pill> : <Pill tone="warn">čaká</Pill>}
                    </div>
                    {w.status === "waiting" && (
                      <div className="flex flex-wrap items-center gap-2 pl-12">
                        <span className={`flex items-center gap-1.5 text-xs ${free ? "text-ok" : "text-mute"}`}>
                          <Hourglass size={13} /> {free ? `Uvoľnilo sa: ${minutesToTime(free.start)}` : "Zatiaľ nič voľné"}
                        </span>
                        <button
                          type="button"
                          className="btn-outline ml-auto py-1.5 text-xs"
                          onClick={() => {
                            updateDB((d) => ({ ...d, waitlist: d.waitlist.map((x) => (x.id === w.id ? { ...x, status: "offered" } : x)) }));
                            toast(`SMS odoslaná na ${formatPhone(w.phone)}${free ? `: voľno o ${minutesToTime(free.start)}` : ""} (simulácia).`);
                          }}
                        >
                          <Send size={13} /> Ponúknuť SMS
                        </button>
                        <a href={`tel:${w.phone}`} className="btn-outline py-1.5 text-xs">
                          <Phone size={13} /> Volať
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-mute">Nikto nečaká.</p>
          )}
        </Panel>

        <Panel title={`Správy (${messages.filter((m) => !m.read).length} nových)`}>
          {messages.length ? (
            <ul className="divide-y divide-line">
              {messages.map((m) => (
                <li key={m.id} className={`px-5 py-4 text-sm ${m.read ? "" : "bg-gold-soft/25"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{m.name}</p>
                    <Pill tone="info">{m.topic}</Pill>
                    <span className="ml-auto text-xs text-mute">
                      {formatDateLong(new Date(m.createdAt))}, {formatClock(new Date(m.createdAt))}
                    </span>
                  </div>
                  <p className="mt-2 leading-relaxed text-soft">{m.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic}`)}`} className="btn-outline py-1.5 text-xs">
                      <Mail size={13} /> Odpovedať
                    </a>
                    {!m.read && (
                      <button type="button" className="btn-outline py-1.5 text-xs" onClick={() => updateDB((d) => ({ ...d, messages: d.messages.map((x) => (x.id === m.id ? { ...x, read: true } : x)) }))}>
                        <Check size={13} /> Prečítané
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-mute">Žiadne správy.</p>
          )}
          <p className="border-t border-line px-5 py-3 text-xs text-mute">Odber beauty listu: {db.newsletter.length} e-mailov</p>
        </Panel>
      </div>
    </div>
  );
}
