import { Plane, Star } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Avatar } from "../../components/ui";
import { LEVELS, TEAM } from "../../data/team";
import { absenceKey, appointmentsOn, utilisation } from "../../lib/availability";
import { WEEKDAYS_SHORT, addDays, formatDateLong, minutesToTime, plural, toISODate } from "../../lib/format";
import { dayInfo } from "../../lib/hours";
import { updateDB, type DB } from "../../lib/store";

export default function TeamAdmin({ db, now }: { db: DB; now: Date }) {
  const toast = useToast();
  const days = Array.from({ length: 14 }, (_, i) => addDays(now, i));

  const toggle = (personId: string, date: Date) => {
    const iso = toISODate(date);
    const key = absenceKey(personId, iso);
    const off = db.absences.includes(key);
    const person = TEAM.find((p) => p.id === personId)!;
    if (!off) {
      const booked = appointmentsOn(iso, db, now).filter((a) => a.status !== "cancelled" && a.items.some((i) => i.specialistId === personId)).length;
      toast(
        booked
          ? `${person.firstName} má ${formatDateLong(date)} voľno. Pozor: ${booked} ${plural(booked, ["termín treba", "termíny treba", "termínov treba"])} presunúť.`
          : `${person.firstName} má ${formatDateLong(date)} voľno, online sa už nedá rezervovať.`,
        "info",
      );
    } else toast(`${person.firstName} ${formatDateLong(date)} pracuje, termíny sú znova online.`);
    updateDB((d) => ({ ...d, absences: off ? d.absences.filter((k) => k !== key) : [...d.absences, key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-medium text-plum sm:text-5xl">Tím a smeny</h1>
        <p className="mt-1 max-w-xl text-sm text-mute">Kliknutím na deň označíte dovolenku alebo voľno. Online rezervácia to zohľadní okamžite.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {TEAM.map((p) => {
          const week = Array.from({ length: 7 }, (_, i) => toISODate(addDays(now, i)));
          const avg = Math.round((week.reduce((s, iso) => s + utilisation(p.id, iso, db, now), 0) / Math.max(1, week.filter((iso) => p.week[new Date(`${iso}T00:00`).getDay()]).length)) * 100);
          return (
            <section key={p.id} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-center gap-4">
                <Avatar id={p.id} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-medium leading-tight text-plum">{p.name}</p>
                  <p className="text-sm text-mute">
                    {p.role} · {LEVELS[p.level].label}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-display text-2xl font-medium text-plum">{avg} %</p>
                  <p className="text-xs text-mute">vyťaženosť 7 dní</p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-soft">
                <Star size={12} className="text-gold" /> {p.rating.toLocaleString("sk-SK")} · {p.reviews} hodnotení
              </p>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px]">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const s = p.week[d];
                  return (
                    <div key={d} className={`rounded-lg px-1 py-1.5 ${s ? "bg-blush text-plum" : "text-mute"}`}>
                      <p className="font-semibold">{WEEKDAYS_SHORT[d]}</p>
                      <p className="tabular-nums">{s ? `${minutesToTime(s.start).replace(":00", "")}–${minutesToTime(s.end).replace(":00", "")}` : "–"}</p>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-mute">
                <Plane size={13} /> Najbližšie 2 týždne
              </p>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {days.map((date) => {
                  const iso = toISODate(date);
                  const works = !!p.week[date.getDay()] && !!dayInfo(date).hours;
                  const off = db.absences.includes(absenceKey(p.id, iso));
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!works}
                      onClick={() => toggle(p.id, date)}
                      aria-pressed={off}
                      aria-label={`${formatDateLong(date)}${off ? ", dovolenka" : works ? ", pracuje" : ", nepracuje"}`}
                      className={`rounded-lg border py-1.5 text-center text-[11px] transition-colors ${
                        off ? "border-gold bg-gold text-white" : works ? "border-line bg-paper text-ink hover:border-plum/40" : "border-transparent text-mute/50"
                      }`}
                    >
                      <span className="block">{WEEKDAYS_SHORT[date.getDay()]}</span>
                      <span className="block font-semibold tabular-nums">{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
