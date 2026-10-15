import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Bell, Calendar, Clock, Gift, Refresh, Sparkles } from "../../components/icons";
import LoyaltyCard from "../../components/LoyaltyCard";
import { Avatar } from "../../components/ui";
import { LOYALTY } from "../../config";
import { SPECIALIST_BY_ID } from "../../data/team";
import { effectiveStatus } from "../../lib/availability";
import { capitalize, formatDateLong, fromISODate, minutesToTime } from "../../lib/format";
import { relativeDay } from "../../lib/hours";
import type { loyaltyState } from "../../lib/loyalty";
import { hoursUntil } from "../../lib/loyalty";
import { dueReminders, weeksAgo } from "../../lib/reminders";
import { useDB } from "../../lib/store";
import type { Account } from "../../lib/types";
import { useVisit } from "../../lib/visit";

type Loyalty = ReturnType<typeof loyaltyState>;

export default function Overview({ account, loyalty, now, onTab }: { account: Account; loyalty: Loyalty; now: Date; onTab: (t: "terminy" | "body") => void }) {
  const db = useDB();
  const navigate = useNavigate();
  const { replace } = useVisit();
  const mine = db.appointments.filter((a) => a.accountId === account.id);
  const upcoming = mine
    .filter((a) => effectiveStatus(a, now) === "confirmed" || effectiveStatus(a, now) === "arrived")
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const next = upcoming[0];
  const reminders = dueReminders(mine, now).slice(0, 2);
  const last = [...loyalty.visits].sort((a, b) => b.date.localeCompare(a.date))[0];
  const progress = loyalty.next ? Math.min(100, ((loyalty.lifetime - loyalty.tier.from) / (loyalty.next.from - loyalty.tier.from)) * 100) : 100;
  const birthdayMonth = account.birthday && Number(account.birthday.slice(0, 2)) === now.getMonth() + 1;
  const cheapest = LOYALTY.rewards[0];

  const book = (items: { serviceId: string; variantId?: string; specialistId: string }[]) => {
    replace(items);
    navigate("/rezervacia");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 space-y-6">
        {birthdayMonth && (
          <div className="flex items-center gap-4 rounded-2xl bg-gold-soft/70 p-4 text-sm text-plum">
            <Gift size={22} className="shrink-0 text-gold" />
            <p>
              <strong className="font-medium">Všetko najlepšie!</strong> Celý tento mesiac zbierate dvojnásobné body.
            </p>
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2 font-medium text-plum">
              <Calendar size={18} className="text-gold" /> Najbližší termín
            </h2>
            {upcoming.length > 1 && (
              <button type="button" className="text-sm text-soft hover:text-ink" onClick={() => onTab("terminy")}>
                +{upcoming.length - 1} ďalšie
              </button>
            )}
          </div>
          {next ? (
            <div className="p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-display text-[2.2rem] font-medium leading-none text-plum">
                    {capitalize(relativeDay(fromISODate(next.date), now))} o {minutesToTime(next.start)}
                  </p>
                  <p className="mt-2 text-sm text-soft">{capitalize(formatDateLong(fromISODate(next.date)))}</p>
                </div>
                <p className="flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-sm text-plum">
                  <Clock size={14} /> {hoursUntil(next, now) < 24 ? `o ${Math.max(1, Math.round(hoursUntil(next, now)))} h` : `o ${Math.ceil(hoursUntil(next, now) / 24)} dní`}
                </p>
              </div>
              <ul className="mt-5 space-y-3">
                {next.items.map((i, k) => (
                  <li key={k} className="flex items-center gap-3">
                    <Avatar id={i.specialistId} size={40} />
                    <div className="text-sm">
                      <p className="font-medium text-ink">{i.name}</p>
                      <p className="text-mute">
                        {SPECIALIST_BY_ID.get(i.specialistId)?.firstName} · {minutesToTime(i.start)} – {minutesToTime(i.end)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/rezervacia/${next.code}`} className="btn-primary py-2.5">
                  Spravovať <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-soft">Zatiaľ nemáte naplánovaný žiadny termín.</p>
              <Link to="/rezervacia" className="btn-primary mt-4">
                <Calendar size={16} /> Rezervovať
              </Link>
            </div>
          )}
        </section>

        {reminders.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-medium text-plum">
              <Bell size={17} className="text-gold" /> Je čas na osvieženie
            </h2>
            {reminders.map((r) => (
              <div key={r.serviceId} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-paper p-4">
                <Avatar id={r.specialistId} size={44} />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-ink">
                    {r.name} · {weeksAgo(r.daysAgo)}
                  </p>
                  <p className="text-soft">{r.text}</p>
                </div>
                <button type="button" className="btn-outline py-2" onClick={() => book([{ serviceId: r.serviceId, variantId: r.variantId, specialistId: r.specialistId }])}>
                  U {SPECIALIST_BY_ID.get(r.specialistId)?.genitive} <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </section>
        )}

        {last && (
          <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-blush/70 p-5">
            <Refresh size={22} className="text-gold" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-plum">Rovnako ako minule?</p>
              <p className="text-soft">
                {last.items.map((i) => i.name).join(" + ")} · {formatDateLong(fromISODate(last.date))}
              </p>
            </div>
            <button type="button" className="btn-primary py-2.5" onClick={() => book(last.items.map((i) => ({ serviceId: i.serviceId, variantId: i.variantId, specialistId: i.specialistId })))}>
              Rezervovať znova
            </button>
          </section>
        )}
      </div>

      <aside className="space-y-5">
        <LoyaltyCard name={account.name} tier={loyalty.tier.name} points={loyalty.balance} since={new Date(account.createdAt).getFullYear()} stacked={false} />
        <div className="card p-5">
          {loyalty.next ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-soft">Do statusu {loyalty.next.name}</span>
                <span className="font-medium tabular-nums text-plum">{(loyalty.next.from - loyalty.lifetime).toLocaleString("sk-SK")} bodov</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-blush">
                <div className="h-full rounded-full bg-gradient-to-r from-gold to-[#d9bb85] transition-[width] duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-xs text-mute">
                {loyalty.next.name}: zľava {Math.round(loyalty.next.discount * 100)} % na každú návštevu.
              </p>
            </>
          ) : (
            <p className="text-sm text-soft">Máte najvyšší status. Ďakujeme, že ste s nami.</p>
          )}
          {loyalty.tier.discount > 0 && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-gold-soft/60 px-3 py-2 text-sm text-plum">
              <Sparkles size={15} className="text-gold" /> Zľavu {Math.round(loyalty.tier.discount * 100)} % odpočítame pri každej rezervácii.
            </p>
          )}
          {loyalty.pending > 0 && <p className="mt-3 text-xs text-mute">+{loyalty.pending} bodov čaká na pripísanie po najbližšej návšteve.</p>}
          <button type="button" className="btn-outline mt-4 w-full" onClick={() => onTab("body")}>
            {loyalty.balance >= cheapest.points ? "Vybrať si odmenu" : "Body a odmeny"} <ArrowRight size={15} />
          </button>
        </div>
      </aside>
    </div>
  );
}
