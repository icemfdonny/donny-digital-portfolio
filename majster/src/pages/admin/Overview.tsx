import { useMemo, useState } from "react";
import { ArrowRight, Calendar, Clock, MapPin, Siren } from "../../components/icons";
import { Pill } from "../../components/ui";
import { SOURCE_LABEL, STAGES, useTownOf } from "../../lib/actions";
import { windowLabel, windowOf } from "../../lib/availability";
import { quoteTotals } from "../../lib/calc";
import { addDays, formatDateShort, formatEuro, plural, toISODate } from "../../lib/format";
import { useNow } from "../../lib/hooks";
import { BIZ, TRADE } from "../../lib/profile";
import type { DB } from "../../lib/store";
import type { Tab } from "./AdminPage";
import { PageTitle, Panel, StatTile } from "./AdminUI";

const DAY = 86_400_000;

export default function Overview({ db, go }: { db: DB; go: (t: Tab, extra?: Record<string, string>) => void }) {
  const now = useNow(60_000);
  const townOf = useTownOf();
  const t = now.getTime();
  const h = now.getHours();
  const greeting = h < 10 ? "Dobré ráno" : h < 18 ? "Dobrý deň" : "Dobrý večer";

  const stats = useMemo(() => {
    const inRange = (iso: string, from: number, to: number) => {
      const x = new Date(iso).getTime();
      return x >= t - from * DAY && x < t - to * DAY;
    };
    const week = db.leads.filter((l) => inRange(l.createdAt, 7, 0)).length;
    const prevWeek = db.leads.filter((l) => inRange(l.createdAt, 14, 7)).length;
    const open = db.quotes.filter((q) => q.status === "odoslana" || q.status === "zobrazena");
    const openValue = open.reduce((s, q) => s + quoteTotals(q.items, q.discountPct, db.settings.vatPayer).gross, 0);
    const decided = db.quotes.filter((q) => q.decidedAt && inRange(q.decidedAt, 90, 0));
    const lost = db.leads.filter((l) => l.stage === "strateny" && inRange(l.createdAt, 90, 0)).length;
    const won = decided.filter((q) => q.status === "prijata");
    const rate = won.length + lost ? Math.round((won.length / (won.length + lost + decided.filter((q) => q.status === "odmietnuta").length)) * 100) : 0;
    const signed = db.leads.filter((l) => l.value && db.quotes.some((q) => q.id === l.quoteId && q.decidedAt && inRange(q.decidedAt, 30, 0))).reduce((s, l) => s + (l.value ?? 0), 0);
    return { week, prevWeek, open: open.length, openValue, rate, signed };
  }, [db, t]);

  // Requests per week, last 10 weeks, oldest first.
  const weeks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const end = t - (9 - i) * 7 * DAY;
        const start = end - 7 * DAY;
        const leads = db.leads.filter((l) => {
          const x = new Date(l.createdAt).getTime();
          return x >= start && x < end;
        });
        return { label: formatDateShort(new Date(start + DAY)), count: leads.length, value: leads.reduce((s, l) => s + (l.value ?? 0), 0) };
      }),
    [db.leads, t],
  );

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of db.leads) counts.set(l.source, (counts.get(l.source) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [db.leads]);

  const todayISO = toISODate(now);
  const agenda = db.visits
    .filter((v) => v.status === "planned" && v.date >= todayISO && v.date <= toISODate(addDays(now, 7)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.window - b.window)
    .slice(0, 6);
  const fresh = db.leads.filter((l) => l.stage === "novy").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const live = db.emergencies.filter((e) => !["vyriesene", "zrusene"].includes(e.status));
  const activity = db.leads
    .flatMap((l) => l.log.map((e) => ({ ...e, lead: l })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 7);
  const delta = stats.week - stats.prevWeek;

  return (
    <div className="space-y-6">
      <PageTitle title={`${greeting}, ${BIZ.owner}`} text={`${fresh.length} ${plural(fresh.length, ["nový dopyt čaká", "nové dopyty čakajú", "nových dopytov čaká"])} na odpoveď · ${agenda.filter((v) => v.date === todayISO).length} návštev dnes`} />

      {live.length > 0 && (
        <button type="button" onClick={() => go("havarie")} className="flex w-full items-center gap-3 rounded-2xl bg-danger p-4 text-left text-white">
          <Siren size={22} className="animate-blink" />
          <span className="flex-1 font-semibold">
            {live.length} {plural(live.length, ["aktívna havária", "aktívne havárie", "aktívnych havárií"])} · {live.map((e) => e.town).join(", ")}
          </span>
          <ArrowRight size={18} />
        </button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Nové dopyty za 7 dní" value={String(stats.week)} delta={`${delta >= 0 ? "+" : "−"}${Math.abs(delta)}`} deltaGood={delta >= 0} hint="oproti minulému týždňu" />
        <StatTile label="Otvorené ponuky" value={formatEuro(Math.round(stats.openValue))} hint={`${stats.open} ${plural(stats.open, ["ponuka čaká", "ponuky čakajú", "ponúk čaká"])} na rozhodnutie`} />
        <StatTile label="Úspešnosť ponúk" value={`${stats.rate} %`} hint="za posledných 90 dní" />
        <StatTile label="Podpísané za 30 dní" value={formatEuro(Math.round(stats.signed))} hint="hodnota prijatých ponúk s DPH" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Dopyty po týždňoch" action={<span className="text-xs text-mute">posledných 10 týždňov</span>}>
          <WeekChart weeks={weeks} />
        </Panel>
        <Panel title="Odkiaľ prichádzajú">
          <ul className="space-y-3 p-5">
            {sources.map(([source, count]) => {
              const max = sources[0][1];
              return (
                <li key={source}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{SOURCE_LABEL[source as keyof typeof SOURCE_LABEL]}</span>
                    <span className="tabular-nums text-soft">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-line px-5 py-3 text-xs text-mute">Online kalkulačka a rezervácie prinášajú väčšinu dopytov aj mimo pracovného času.</p>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Nové dopyty" action={<button type="button" className="text-sm font-semibold text-accent-deep" onClick={() => go("zakazky")}>Všetky</button>}>
          <ul className="divide-y divide-line">
            {fresh.slice(0, 5).map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => go("zakazky", { dopyt: l.code })} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-bg">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{l.name}</span>
                    <span className="block truncate text-xs text-soft">
                      {l.jobTitle} · {townOf(l)}
                    </span>
                  </span>
                  {l.estimate && <span className="text-xs font-semibold tabular-nums">{formatEuro(l.estimate.low)}+</span>}
                </button>
              </li>
            ))}
            {!fresh.length && <li className="px-5 py-6 text-sm text-mute">Všetko vybavené.</li>}
          </ul>
        </Panel>
        <Panel title="Najbližšie návštevy" action={<button type="button" className="text-sm font-semibold text-accent-deep" onClick={() => go("kalendar")}>Kalendár</button>}>
          <ul className="divide-y divide-line">
            {agenda.map((v) => {
              const w = windowOf(v.date, v.window);
              const tech = TRADE.crew.find((c) => c.id === v.techId);
              return (
                <li key={v.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-sand py-1 text-center text-xs font-bold leading-tight">
                    {v.date === todayISO ? "dnes" : formatDateShort(new Date(`${v.date}T12:00`))}
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-bold">{v.name}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-soft">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {w ? windowLabel(w) : ""}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {townOf(v)}
                      </span>
                      <span>{tech?.name.split(" ")[0]}</span>
                    </span>
                  </span>
                </li>
              );
            })}
            {!agenda.length && <li className="px-5 py-6 text-sm text-mute">Na najbližšie dni nič naplánované.</li>}
          </ul>
        </Panel>
        <Panel title="Posledná aktivita">
          <ul className="space-y-3 p-5">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <Calendar size={15} className="mt-0.5 shrink-0 text-mute" />
                <span className="min-w-0">
                  <span className="font-semibold">{a.lead.name}</span> <span className="text-soft">– {a.text}</span>
                  <span className="block text-xs text-mute">{relative(a.at, t)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Pipeline">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((s) => {
            const leads = db.leads.filter((l) => l.stage === s.id);
            const value = leads.reduce((sum, l) => sum + (l.value ?? l.estimate?.gross ?? 0), 0);
            return (
              <button key={s.id} type="button" onClick={() => go("zakazky")} className="bg-paper p-4 text-left hover:bg-bg">
                <span className="flex items-center gap-2 text-xs font-semibold text-soft">
                  <span className={`size-2 rounded-full ${s.tone}`} /> {s.label}
                </span>
                <span className="display mt-2 block text-2xl">{leads.length}</span>
                <span className="text-xs text-mute">{formatEuro(Math.round(value / 10) * 10)}</span>
              </button>
            );
          })}
        </div>
      </Panel>
      <p className="text-center text-xs text-mute">
        <Pill tone="info">Ukážka</Pill> Čísla sú vypočítané zo skutočných záznamov v tejto ukážke vrátane tých, ktoré pridáte na webe.
      </p>
    </div>
  );
}

function relative(iso: string, now: number) {
  const min = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "práve teraz";
  if (min < 60) return `pred ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `pred ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "včera" : `pred ${d} dňami`;
}

/** Single series bar chart: ink bars, the current week in the accent, hover tooltip, labels on the last and the peak. */
function WeekChart({ weeks }: { weeks: { label: string; count: number; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...weeks.map((w) => w.count));
  const top = Math.ceil(max / 2) * 2;
  const peak = weeks.reduce((best, w, i) => (w.count > weeks[best].count ? i : best), 0);
  const W = 600;
  const H = 220;
  const pad = { l: 28, r: 8, t: 22, b: 26 };
  const bw = (W - pad.l - pad.r) / weeks.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
  return (
    <div className="relative p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Počet dopytov po týždňoch">
        {[0, top / 2, top].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-mute)">
              {v}
            </text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const x = pad.l + i * bw + 5;
          const h = Math.max(0, y(0) - y(w.count));
          const last = i === weeks.length - 1;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              {h > 0 && <path d={`M${x} ${y(0)}V${y(w.count) + 4}a4 4 0 0 1 4-4h${bw - 18}a4 4 0 0 1 4 4V${y(0)}Z`} fill={last ? "var(--color-accent)" : "var(--color-ink)"} opacity={hover === null || hover === i ? 1 : 0.55} />}
              {(last || i === peak) && (
                <text x={x + (bw - 10) / 2} y={y(w.count) - 6} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--color-ink)">
                  {w.count}
                </text>
              )}
              <text x={x + (bw - 10) / 2} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--color-mute)">
                {last ? "tento t." : w.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-2 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg" style={{ left: `${((hover + 0.5) / weeks.length) * 92 + 2}%`, transform: "translateX(-50%)" }}>
          <p className="font-bold">Týždeň od {weeks[hover].label}</p>
          <p>
            {weeks[hover].count} {plural(weeks[hover].count, ["dopyt", "dopyty", "dopytov"])}
          </p>
          {weeks[hover].value > 0 && <p className="text-white/70">z toho podpísané {formatEuro(weeks[hover].value)}</p>}
        </div>
      )}
      <table className="sr-only">
        <caption>Dopyty po týždňoch</caption>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.label}>
              <th>{w.label}</th>
              <td>{w.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
