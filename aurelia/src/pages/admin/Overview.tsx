import { useMemo, useState } from "react";
import { ArrowRight, Hourglass } from "../../components/icons";
import { Avatar, StatusDot } from "../../components/ui";
import { SERVICE_BY_ID } from "../../data/services";
import { TEAM } from "../../data/team";
import { appointmentsOn, shiftFor, utilisation } from "../../lib/availability";
import { WEEKDAYS_SHORT, addDays, capitalize, formatDateLong, formatEuro, formatPrice, minutesOfDay, minutesToTime, plural, toISODate } from "../../lib/format";
import { openStatus } from "../../lib/hours";
import type { DB } from "../../lib/store";
import { CHART, dayRevenue, dayUtilisation, greeting, revenueSeries } from "./adminData";
import type { Tab } from "./AdminPage";
import { Panel, Pill, StatTile } from "./AdminUI";

export default function Overview({ db, now, go }: { db: DB; now: Date; go: (t: Tab, extra?: Record<string, string>) => void }) {
  const iso = toISODate(now);
  const today = useMemo(() => appointmentsOn(iso, db, now), [iso, db, now]);
  const active = today.filter((a) => a.status !== "cancelled");
  const revenue = dayRevenue(today);
  // Same weekday over the previous four weeks, as the baseline.
  const baseline = useMemo(() => {
    let sum = 0;
    for (let w = 1; w <= 4; w++) sum += dayRevenue(appointmentsOn(toISODate(addDays(now, -7 * w)), db, now));
    return sum / 4;
  }, [db, now]);
  const delta = baseline ? Math.round(((revenue - baseline) / baseline) * 100) : 0;
  const util = Math.round(dayUtilisation(iso, db, now) * 100);
  const series = useMemo(() => revenueSeries(db, now, 14), [db, now]);
  const weekWeb = useMemo(() => {
    const since = now.getTime() - 7 * 86_400_000;
    let web = 0;
    let all = 0;
    for (let i = -7; i <= 45; i++)
      for (const a of appointmentsOn(toISODate(addDays(now, i)), db, now)) {
        if (a.createdAt < since || a.createdAt > now.getTime()) continue;
        all++;
        if (a.source === "web") web++;
      }
    return { web, all };
  }, [db, now]);
  const nowMin = minutesOfDay(now);
  const upcoming = active.filter((a) => a.end > nowMin && a.status !== "completed" && a.status !== "noshow").slice(0, 7);
  const topServices = useMemo(() => {
    const countBy = new Map<string, { n: number; revenue: number }>();
    for (let i = -29; i <= 0; i++)
      for (const a of appointmentsOn(toISODate(addDays(now, i)), db, now)) {
        if (a.status !== "completed") continue;
        for (const item of a.items) {
          const c = countBy.get(item.serviceId) ?? { n: 0, revenue: 0 };
          c.n++;
          c.revenue += item.price;
          countBy.set(item.serviceId, c);
        }
      }
    return [...countBy.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  }, [db, now]);
  const status = openStatus(now);
  const waiting = db.waitlist.filter((w) => w.status === "waiting").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{capitalize(formatDateLong(now))}</p>
          <h1 className="mt-1 font-display text-4xl font-medium text-plum sm:text-5xl">{greeting(now)}, Veronika</h1>
        </div>
        <p className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm">
          <StatusDot tone={status.open ? "ok" : "off"} /> {status.label} <span className="text-mute">· {status.detail}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Termíny dnes" value={String(active.length)} hint={`${active.filter((a) => a.status === "completed").length} hotových · ${active.filter((a) => a.status === "arrived").length} prebieha`} />
        <StatTile
          label="Tržby dnes vrátane plánovaných"
          value={formatEuro(Math.round(revenue))}
          delta={`${delta >= 0 ? "+" : ""}${delta} %`}
          deltaGood={delta >= 0}
          hint={`oproti priemeru ${["nedieľ", "pondelkov", "utorkov", "stried", "štvrtkov", "piatkov", "sobôt"][now.getDay()]}`}
        />
        <StatTile label="Vyťaženosť tímu dnes" value={`${util} %`} hint={`${TEAM.filter((p) => shiftFor(p, iso, db)).length} ľudí v práci`} />
        <StatTile label="Online rezervácie za 7 dní" value={String(weekWeb.web)} hint={`${weekWeb.all ? Math.round((weekWeb.web / weekWeb.all) * 100) : 0} % všetkých rezervácií`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Tržby za posledné 2 týždne" action={<span className="text-xs text-mute">dokončené návštevy, bez DPH</span>}>
          <RevenueChart series={series} />
        </Panel>
        <Panel
          title="Ďalšie termíny dnes"
          action={
            <button type="button" onClick={() => go("kalendar")} className="inline-flex items-center gap-1 text-sm font-medium text-mauve">
              Kalendár <ArrowRight size={14} />
            </button>
          }
        >
          {upcoming.length ? (
            <ul className="divide-y divide-line">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-12 font-semibold tabular-nums">{minutesToTime(a.start)}</span>
                  <Avatar id={a.items[0].specialistId} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.clientName}</span>
                    <span className="block truncate text-xs text-mute">{a.items.map((i) => i.name).join(" + ")}</span>
                  </span>
                  {a.status === "arrived" ? <Pill tone="ok">v salóne</Pill> : !a.generated ? <Pill tone="warn">z webu</Pill> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-mute">Na dnes už žiadne termíny.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Vyťaženosť tímu dnes">
          <ul className="space-y-3.5 p-5">
            {TEAM.map((p) => {
              const shift = shiftFor(p, iso, db);
              const u = Math.round(utilisation(p.id, iso, db, now) * 100);
              return (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <Avatar id={p.id} size={30} />
                  <span className="w-20 shrink-0 truncate">{p.firstName}</span>
                  {shift ? (
                    <>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-blush" role="meter" aria-valuenow={u} aria-valuemin={0} aria-valuemax={100} aria-label={`Vyťaženosť ${p.firstName}`}>
                        <div className="h-full rounded-full" style={{ width: `${u}%`, background: CHART.bar }} />
                      </div>
                      <span className="w-10 text-right tabular-nums text-soft">{u} %</span>
                    </>
                  ) : (
                    <span className="flex-1 text-xs text-mute">{db.absences.includes(`${p.id}|${iso}`) ? "dovolenka" : "dnes voľno"}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Najvýnosnejšie služby za 30 dní">
          <ul className="divide-y divide-line">
            {topServices.map(([id, c], i) => (
              <li key={id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="w-5 text-mute">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate font-medium">{SERVICE_BY_ID.get(id)?.name}</span>
                <span className="text-xs text-mute">
                  {c.n} {plural(c.n, ["návšteva", "návštevy", "návštev"])}
                </span>
                <span className="w-20 text-right tabular-nums">{formatEuro(Math.round(c.revenue))}</span>
              </li>
            ))}
          </ul>
          {waiting > 0 && (
            <button type="button" onClick={() => go("spravy")} className="flex w-full items-center gap-2 border-t border-line bg-gold-soft/40 px-5 py-3 text-left text-sm text-plum">
              <Hourglass size={16} /> {waiting} {plural(waiting, ["klientka čaká", "klientky čakajú", "klientok čaká"])} na uvoľnený termín <ArrowRight size={14} className="ml-auto" />
            </button>
          )}
        </Panel>
      </div>
    </div>
  );
}

function RevenueChart({ series }: { series: ReturnType<typeof revenueSeries> }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...series.map((d) => d.revenue), 1);
  const nice = Math.ceil(max / 500) * 500;
  const ticks = [0, nice / 2, nice];
  const total = series.reduce((s, d) => s + d.revenue, 0);
  return (
    <div className="p-5">
      <p className="text-sm text-soft">
        Spolu <strong className="font-medium text-ink">{formatPrice(total)}</strong>
      </p>
      <div className="relative mt-8 h-52">
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${(t / nice) * 100}%` }}>
            <span className="w-10 -translate-y-1/2 text-right text-[11px] tabular-nums text-mute">{t >= 1000 ? `${t / 1000}k` : t}</span>
            <span className="h-px flex-1 -translate-y-1/2" style={{ background: CHART.grid }} />
          </div>
        ))}
        <div className="absolute inset-y-0 left-12 right-0 flex items-end gap-[2px]">
          {series.map((d, i) => {
            const isToday = i === series.length - 1;
            return (
              <div
                key={d.iso}
                className="relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${formatDateLong(d.date)}: ${formatPrice(d.revenue)}, ${d.count} návštev`}
              >
                <div className="w-full max-w-7 rounded-t-[4px] transition-opacity" style={{ height: `${(d.revenue / nice) * 100}%`, background: isToday ? CHART.today : CHART.bar, opacity: hover === null || hover === i ? 1 : 0.55 }} />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-night px-2.5 py-1.5 text-xs text-ivory shadow-lg">
                    <span className="block font-medium">{capitalize(formatDateLong(d.date))}</span>
                    {formatPrice(d.revenue)} · {d.count} návštev
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ml-12 mt-2 flex gap-[2px] text-center text-[10.5px] text-mute">
        {series.map((d, i) => (
          <span key={d.iso} className={`flex-1 ${i === series.length - 1 ? "font-semibold text-ink" : ""}`}>
            {i === series.length - 1 ? "dnes" : `${WEEKDAYS_SHORT[d.date.getDay()]}`}
          </span>
        ))}
      </div>
    </div>
  );
}
