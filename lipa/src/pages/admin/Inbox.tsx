import { useState } from "react";
import { ChevronDown, Mail, Phone } from "../../components/icons";
import { upcomingEvents } from "../../data/events";
import { capitalize, formatDateLong, formatDateNumeric, formatPhone, formatPrice, fromISODate, guestsLabel } from "../../lib/format";
import { INQUIRY_STATUS } from "../../lib/labels";
import { updateDB, type DB } from "../../lib/store";
import type { InquiryStatus } from "../../lib/types";
import { Panel, Pill } from "./AdminUI";

const TONE: Record<InquiryStatus, "ok" | "warn" | "off" | "bad" | "info"> = { new: "warn", offer: "info", confirmed: "ok", declined: "off" };

export default function Inbox({ db, now }: { db: DB; now: Date }) {
  const [openId, setOpenId] = useState<string | null>(db.inquiries[0]?.id ?? null);
  const events = upcomingEvents(now, 120, 30);
  const eventTitle = (id: string) => {
    const e = events.find((x) => x.id === id);
    return e ? `${e.title}, ${formatDateNumeric(e.date)}` : id;
  };
  const pipeline = db.inquiries.filter((i) => i.status === "offer" || i.status === "confirmed").reduce((s, i) => s + i.estimate, 0);
  const vouchersSold = db.vouchers.reduce((s, v) => s + v.amount, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <Panel title="Dopyty na súkromné akcie" action={<span className="text-xs text-mute">v hre {formatPrice(pipeline)}</span>}>
        <ul className="divide-y divide-line">
          {db.inquiries.map((inq) => {
            const open = openId === inq.id;
            return (
              <li key={inq.id}>
                <button type="button" className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-cream/60" aria-expanded={open} onClick={() => setOpenId(open ? null : inq.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{inq.type}</span>
                      <Pill tone={TONE[inq.status]}>{INQUIRY_STATUS[inq.status]}</Pill>
                    </span>
                    <span className="mt-0.5 block text-sm text-soft">
                      {capitalize(formatDateLong(fromISODate(inq.date)))} · {guestsLabel(inq.guests)} · {inq.name}
                      {inq.company ? `, ${inq.company}` : ""}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatPrice(inq.estimate)}</span>
                  <ChevronDown size={18} className={`text-mute transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="grid gap-4 bg-cream/50 px-5 pb-5 pt-1 text-sm sm:grid-cols-2">
                    <dl className="space-y-1.5">
                      <div>
                        <dt className="inline text-mute">Priestor: </dt>
                        <dd className="inline">{inq.space}</dd>
                      </div>
                      <div>
                        <dt className="inline text-mute">Menu: </dt>
                        <dd className="inline">
                          {inq.pkg}
                          {inq.wine ? " + vínne párovanie" : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-mute">Číslo: </dt>
                        <dd className="inline">{inq.ref}</dd>
                      </div>
                      {inq.message && <p className="pt-1 italic text-soft">„{inq.message}“</p>}
                    </dl>
                    <div className="space-y-2">
                      <a href={`mailto:${inq.email}`} className="flex items-center gap-2 text-moss">
                        <Mail size={15} /> {inq.email}
                      </a>
                      <a href={`tel:${inq.phone}`} className="flex items-center gap-2 text-moss">
                        <Phone size={15} /> {formatPhone(inq.phone)}
                      </a>
                      <label className="block pt-1">
                        <span className="mb-1 block text-xs text-mute">Stav</span>
                        <select
                          className="field py-2"
                          value={inq.status}
                          onChange={(e) =>
                            updateDB((d) => ({ ...d, inquiries: d.inquiries.map((x) => (x.id === inq.id ? { ...x, status: e.target.value as InquiryStatus } : x)) }))
                          }
                        >
                          {(Object.keys(INQUIRY_STATUS) as InquiryStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {INQUIRY_STATUS[s]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="min-w-0 space-y-6">
        <Panel title="Darčekové poukážky" action={<span className="text-xs text-mute">predané {formatPrice(vouchersSold)}</span>}>
          <ul className="divide-y divide-line">
            {db.vouchers.map((v) => (
              <li key={v.code} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium tabular-nums">{v.code}</span>
                  <span className="block truncate text-xs text-mute">
                    Príjemca: {v.to} · platí do {formatDateNumeric(new Date(v.validUntil))}
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="block font-semibold">{formatPrice(v.balance)}</span>
                  <span className="text-xs text-mute">z {formatPrice(v.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Vstupenky z webu">
          {db.tickets.length ? (
            <ul className="divide-y divide-line">
              {db.tickets.map((t) => (
                <li key={t.id} className="px-5 py-3 text-sm">
                  <p className="flex justify-between gap-3">
                    <span className="font-medium">
                      {t.qty}× {eventTitle(t.eventId)}
                    </span>
                    <span className="tabular-nums">{formatPrice(t.total)}</span>
                  </p>
                  <p className="text-xs text-mute">
                    {t.name} · {t.code}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-mute">Zatiaľ žiadne. Kúpte vstupenku na stránke Podujatia.</p>
          )}
        </Panel>
        <Panel title="Správy z kontaktného formulára">
          {db.messages.length ? (
            <ul className="divide-y divide-line">
              {db.messages.map((m) => (
                <li key={m.id} className="px-5 py-3 text-sm">
                  <p className="flex justify-between gap-3">
                    <span className="font-medium">{m.name}</span>
                    <Pill tone="off">{m.topic}</Pill>
                  </p>
                  <p className="mt-1 text-soft">{m.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-mute">Žiadne nové správy.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
