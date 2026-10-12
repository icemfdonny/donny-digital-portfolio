import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS, durationAt, reservationsForDate } from "../../lib/availability";
import { addDays, capitalize, formatClock, formatDateLong, formatPrice, guestsLabel, minutesToTime, plural, timeToMinutes, toISODate } from "../../lib/format";
import { dayInfo, openStatus } from "../../lib/hours";
import { STATUS_LABEL, isActiveStatus, statusAt } from "../../lib/orders";
import type { DB } from "../../lib/store";
import { DISHES } from "../../data/menu";
import { ArrowRight, Store, Truck } from "../../components/icons";
import { StatusDot } from "../../components/ui";
import { CHART, greeting, pastOrdersToday } from "./adminData";
import { Panel, Pill, StatTile } from "./AdminUI";

const ACTIVE = ["confirmed", "seated", "completed"];

export default function Overview({ db, now }: { db: DB; now: Date }) {
  const iso = toISODate(now);
  const today = useMemo(() => reservationsForDate(iso, db, now), [iso, db, now]);
  // Same weekday over the previous four weeks, as the baseline for the delta.
  const baseline = useMemo(() => {
    let sum = 0;
    for (let w = 1; w <= 4; w++)
      sum += reservationsForDate(toISODate(addDays(now, -7 * w)), db, now)
        .filter((r) => r.status !== "cancelled")
        .reduce((s, r) => s + r.guests, 0);
    return sum / 4;
  }, [db, now]);
  const active = today.filter((r) => ACTIVE.includes(r.status));
  const guests = active.reduce((s, r) => s + r.guests, 0);
  const delta = baseline ? Math.round(((today.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.guests, 0) - baseline) / baseline) * 100) : 0;

  const capacity = AREAS.filter((a) => a.id !== "chefs" && (!a.months || a.months.includes(now.getMonth()))).reduce((s, a) => s + a.capacity, 0);
  const peakMinute = 19 * 60;
  const atPeak = active.filter((r) => {
    const start = timeToMinutes(r.time);
    return start <= peakMinute && peakMinute < start + durationAt(start) && r.area !== "chefs";
  });
  const occupancy = Math.min(100, Math.round((atPeak.reduce((s, r) => s + r.guests, 0) / capacity) * 100));

  const past = pastOrdersToday(now);
  const ownToday = db.orders.filter((o) => toISODate(new Date(o.createdAt)) === iso);
  const ordersCount = past.length + ownToday.length;
  const revenue = past.reduce((s, o) => s + o.total, 0) + ownToday.reduce((s, o) => s + o.total + o.voucherUsed, 0);
  const activeOrders = db.orders.filter((o) => isActiveStatus(statusAt(o, now.getTime()))).sort((a, b) => b.createdAt - a.createdAt);
  const upcoming = today.filter((r) => r.status === "confirmed" && timeToMinutes(r.time) >= now.getHours() * 60 + now.getMinutes() - 15).slice(0, 7);
  const newInquiries = db.inquiries.filter((i) => i.status === "new").length;
  const status = openStatus(now);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{capitalize(formatDateLong(now))}</p>
          <h1 className="mt-1 font-display text-3xl text-forest sm:text-4xl">{greeting(now)}, Lucia</h1>
        </div>
        <p className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm">
          <StatusDot tone={status.open ? "ok" : "off"} /> {status.label} <span className="text-mute">· {status.detail}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Hostia s rezerváciou dnes" value={String(guests)} delta={`${delta >= 0 ? "+" : ""}${delta} %`} deltaGood={delta >= 0} hint={`oproti priemeru ${["nedieľ", "pondelkov", "utorkov", "stried", "štvrtkov", "piatkov", "sobôt"][now.getDay()]}`} />
        <StatTile label="Obsadenosť o 19:00" value={`${occupancy} %`} hint={`${atPeak.reduce((s, r) => s + r.guests, 0)} z ${capacity} miest`} />
        <StatTile label="Online objednávky dnes" value={String(ordersCount)} hint={`${activeOrders.length} ${plural(activeOrders.length, ["aktívna", "aktívne", "aktívnych"])}`} />
        <StatTile label="Tržby z webu dnes" value={formatPrice(revenue)} hint="rozvoz a vyzdvihnutie" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Príchody hostí podľa hodiny" action={<span className="text-xs text-mute">dnes, všetky priestory</span>}>
          <CoversChart now={now} reservations={active} />
        </Panel>
        <Panel
          title="Najbližšie rezervácie"
          action={
            <Link to="/admin?karta=rezervacie" className="inline-flex items-center gap-1 text-sm font-medium text-moss">
              Všetky <ArrowRight size={14} />
            </Link>
          }
        >
          {upcoming.length ? (
            <ul className="divide-y divide-line">
              {upcoming.map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <span className="w-12 font-semibold tabular-nums">{r.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.name}</span>
                    <span className="text-xs text-mute">
                      {guestsLabel(r.guests)} · {AREAS.find((a) => a.id === r.area)?.name}
                      {r.occasion ? ` · ${r.occasion}` : ""}
                    </span>
                  </span>
                  {!r.generated && <Pill tone="warn">z webu teraz</Pill>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-mute">Na dnes už nečakáme ďalšie rezervácie.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Aktívne objednávky"
          action={
            <Link to="/admin?karta=objednavky" className="inline-flex items-center gap-1 text-sm font-medium text-moss">
              Tabuľa <ArrowRight size={14} />
            </Link>
          }
          className="lg:col-span-2"
        >
          {activeOrders.length ? (
            <ul className="divide-y divide-line">
              {activeOrders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <span className="text-mute">{o.mode === "pickup" ? <Store size={17} /> : <Truck size={17} />}</span>
                  <span className="w-14 font-semibold">#{o.number}</span>
                  <span className="min-w-0 flex-1 truncate">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}</span>
                  <Pill tone="info">{STATUS_LABEL[statusAt(o, now.getTime())]}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-mute">
              Žiadne aktívne objednávky.{" "}
              <Link to="/objednavka" className="font-medium text-moss underline underline-offset-2">
                Vytvorte jednu na webe
              </Link>{" "}
              a sledujte ju tu.
            </p>
          )}
        </Panel>
        <Panel title="Na pozornosť">
          <ul className="space-y-3 px-5 py-4 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span>Nové dopyty na akcie</span>
              <Link to="/admin?karta=dopyty">
                <Pill tone={newInquiries ? "warn" : "off"}>{newInquiries}</Pill>
              </Link>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Vypredané jedlá</span>
              <Link to="/admin?karta=menu">
                <Pill tone={db.soldOut.length ? "bad" : "off"}>{db.soldOut.length}</Pill>
              </Link>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Predané vstupenky (web)</span>
              <Pill tone="off">{db.tickets.reduce((s, t) => s + t.qty, 0)}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Odberatelia newslettera</span>
              <Pill tone="off">{412 + db.newsletter.length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Jedál na lístku</span>
              <Pill tone="off">{DISHES.length}</Pill>
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/** Columns of arriving guests per hour; the current hour is accented. Hover or focus a column for its value. */
function CoversChart({ now, reservations }: { now: Date; reservations: { time: string; guests: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const hours = dayInfo(now).hours;
  if (!hours) return <p className="px-5 py-10 text-center text-sm text-mute">Dnes je zatvorené.</p>;
  const slots: { hour: number; guests: number }[] = [];
  for (let h = Math.floor(hours.open / 60); h < Math.ceil(hours.kitchen / 60); h++) {
    slots.push({ hour: h, guests: reservations.filter((r) => Math.floor(timeToMinutes(r.time) / 60) === h).reduce((s, r) => s + r.guests, 0) });
  }
  const max = Math.max(10, ...slots.map((s) => s.guests));
  const top = Math.ceil(max / 10) * 10;
  const ticks = [0, top / 2, top];
  const peak = slots.reduce((best, s) => (s.guests > best.guests ? s : best), slots[0]);
  const nowHour = now.getHours();

  return (
    <div className="px-5 pb-4 pt-5">
      {table ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-mute">
              <th className="py-1.5 font-medium">Hodina</th>
              <th className="py-1.5 text-right font-medium">Hostia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {slots.map((s) => (
              <tr key={s.hour}>
                <td className="py-1.5 tabular-nums">
                  {minutesToTime(s.hour * 60)} – {minutesToTime((s.hour + 1) * 60)}
                </td>
                <td className="py-1.5 text-right tabular-nums">{s.guests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex gap-3">
          <div className="relative h-52 w-7 shrink-0 text-right text-[11px] tabular-nums text-mute" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
                {t}
              </span>
            ))}
          </div>
          <div className="relative flex-1">
            <div className="relative h-52">
              {ticks.map((t) => (
                <div key={t} className="absolute inset-x-0 h-px" style={{ bottom: `${(t / top) * 100}%`, background: CHART.grid }} aria-hidden="true" />
              ))}
              <div className="absolute inset-0 flex items-end" role="list" aria-label="Príchody hostí podľa hodiny">
                {slots.map((s, i) => {
                  const current = s.hour === nowHour;
                  const showLabel = s === peak || current;
                  return (
                    <div
                      key={s.hour}
                      role="listitem"
                      tabIndex={0}
                      aria-label={`${minutesToTime(s.hour * 60)}: ${guestsLabel(s.guests)}`}
                      onPointerEnter={() => setHover(i)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      className="relative flex h-full flex-1 items-end justify-center outline-none"
                    >
                      {showLabel && s.guests > 0 && hover !== i && (
                        <span className="absolute text-[11px] font-semibold tabular-nums text-ink" style={{ bottom: `calc(${(s.guests / top) * 100}% + 4px)` }}>
                          {s.guests}
                        </span>
                      )}
                      <div
                        className="w-full max-w-6 rounded-t-[4px] transition-[filter] duration-150"
                        style={{
                          height: `${(s.guests / top) * 100}%`,
                          minHeight: s.guests ? 2 : 0,
                          background: current ? CHART.now : CHART.bar,
                          filter: hover === i ? "brightness(1.15)" : undefined,
                        }}
                      />
                      {hover === i && (
                        <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-night px-3 py-2 text-cream shadow-lg" style={{ bottom: `${(s.guests / top) * 100}%` }}>
                          <p className="text-sm font-semibold tabular-nums">{guestsLabel(s.guests)}</p>
                          <p className="text-[11px] text-cream/60">
                            {minutesToTime(s.hour * 60)} – {minutesToTime((s.hour + 1) * 60)}
                            {current ? " · teraz" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex text-[11px] tabular-nums text-mute" aria-hidden="true">
              {slots.map((s) => (
                <span key={s.hour} className={`flex-1 text-center ${s.hour === nowHour ? "font-semibold text-ink" : ""}`}>
                  {s.hour}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-mute">
        {slots.some((s) => s.hour === nowHour) ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: CHART.now }} /> aktuálna hodina ({formatClock(now)})
          </span>
        ) : (
          <span>Spolu {guestsLabel(slots.reduce((s, x) => s + x.guests, 0))}</span>
        )}
        <button type="button" className="font-medium text-moss underline underline-offset-2" onClick={() => setTable((v) => !v)}>
          {table ? "Zobraziť graf" : "Zobraziť tabuľku"}
        </button>
      </div>
    </div>
  );
}
