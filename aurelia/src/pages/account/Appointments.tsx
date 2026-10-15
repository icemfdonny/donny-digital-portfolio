import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { STATUS_LABEL } from "../../lib/labels";
import { ArrowRight, Calendar, ChevronDown, Refresh } from "../../components/icons";
import { Avatar, Segmented } from "../../components/ui";
import { SPECIALIST_BY_ID } from "../../data/team";
import { effectiveStatus } from "../../lib/availability";
import { MONTHS_SHORT, WEEKDAYS, capitalize, formatPrice, fromISODate, minutesToTime } from "../../lib/format";
import { visitPoints } from "../../lib/loyalty";
import { useDB } from "../../lib/store";
import type { Account, Appointment } from "../../lib/types";
import { useVisit } from "../../lib/visit";

export default function Appointments({ account, now }: { account: Account; now: Date }) {
  const db = useDB();
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const mine = db.appointments.filter((a) => a.accountId === account.id).map((a) => ({ a, status: effectiveStatus(a, now) }));
  const upcoming = mine.filter((x) => x.status === "confirmed" || x.status === "arrived").sort((x, y) => `${x.a.date}${x.a.start}`.localeCompare(`${y.a.date}${y.a.start}`));
  const past = mine.filter((x) => !(x.status === "confirmed" || x.status === "arrived")).sort((x, y) => `${y.a.date}${y.a.start}`.localeCompare(`${x.a.date}${x.a.start}`));
  const list = view === "upcoming" ? upcoming : past;
  const spent = past.filter((x) => x.status === "completed").reduce((s, x) => s + x.a.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Segmented
          label="Zobraziť"
          value={view}
          onChange={setView}
          options={[
            { value: "upcoming", label: `Nadchádzajúce (${upcoming.length})` },
            { value: "past", label: `História (${past.length})` },
          ]}
        />
        <Link to="/rezervacia" className="btn-primary py-2.5">
          <Calendar size={16} /> Nový termín
        </Link>
      </div>
      {view === "past" && past.length > 0 && (
        <p className="text-sm text-soft">
          {past.filter((x) => x.status === "completed").length} návštev, spolu {formatPrice(spent)}. Poznámky špecialistiek (napríklad receptúru farby) nájdete pri každej návšteve.
        </p>
      )}
      {list.length ? (
        <ul className="space-y-3">
          {list.map(({ a, status }) => (
            <Row key={a.id} a={a} status={status} account={account} />
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-soft">{view === "upcoming" ? "Žiadne nadchádzajúce termíny." : "Zatiaľ žiadna história."}</p>
      )}
    </div>
  );
}

function Row({ a, status, account }: { a: Appointment; status: ReturnType<typeof effectiveStatus>; account: Account }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { replace } = useVisit();
  const muted = status === "cancelled" || status === "noshow";
  const date = fromISODate(a.date);
  return (
    <li className={`card overflow-hidden ${muted ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <div className="w-16 shrink-0 text-center">
          <p className="font-display text-3xl font-medium leading-none text-plum">{date.getDate()}</p>
          <p className="text-xs uppercase tracking-wider text-mute">{MONTHS_SHORT[date.getMonth()]}</p>
        </div>
        <div className="flex -space-x-2">
          {[...new Set(a.items.map((i) => i.specialistId))].map((id) => (
            <Avatar key={id} id={id} size={38} className="ring-2 ring-paper" />
          ))}
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <p className={`font-medium text-ink ${status === "cancelled" ? "line-through" : ""}`}>{a.items.map((i) => i.name).join(" + ")}</p>
          <p className="text-sm text-mute">
            {capitalize(WEEKDAYS[date.getDay()])} {minutesToTime(a.start)} · {[...new Set(a.items.map((i) => SPECIALIST_BY_ID.get(i.specialistId)?.firstName))].join(", ")} · {formatPrice(a.total)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            status === "completed" ? "bg-ok/10 text-ok" : status === "cancelled" || status === "noshow" ? "bg-blush text-soft" : "bg-gold-soft text-plum"
          }`}
        >
          {STATUS_LABEL[status]}
          {status === "completed" && ` · +${visitPoints(a.total, account, a.date)} b.`}
        </span>
        <div className="flex gap-2">
          {status === "confirmed" ? (
            <Link to={`/rezervacia/${a.code}`} className="btn-outline py-2 text-sm">
              Spravovať <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              type="button"
              className="btn-outline py-2 text-sm"
              onClick={() => {
                replace(a.items.map((i) => ({ serviceId: i.serviceId, variantId: i.variantId, specialistId: i.specialistId })));
                navigate("/rezervacia");
              }}
            >
              <Refresh size={14} /> Znova
            </button>
          )}
          {(a.stylistNote || a.note) && (
            <button type="button" className="grid size-10 place-items-center rounded-full border border-line text-soft hover:text-ink" aria-expanded={open} aria-label="Detaily" onClick={() => setOpen(!open)}>
              <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="space-y-2 border-t border-line bg-blush/40 px-5 py-4 text-sm">
          {a.stylistNote && (
            <p>
              <span className="font-medium text-plum">Od špecialistky:</span> <span className="text-soft">{a.stylistNote}</span>
            </p>
          )}
          {a.note && (
            <p>
              <span className="font-medium text-plum">Vaša poznámka:</span> <span className="text-soft">{a.note}</span>
            </p>
          )}
          <p className="text-xs text-mute">Kód {a.code}</p>
        </div>
      )}
    </li>
  );
}
