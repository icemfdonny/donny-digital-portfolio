import { Link } from "react-router-dom";
import { Clock, External, MapPin, Phone, Siren, Star } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Initials, Pill, StatusDot, Switch } from "../../components/ui";
import { saveSettings, setEmergencyStatus } from "../../lib/actions";
import { EMERGENCY_STEPS, onCall, stepIndex } from "../../lib/emergency";
import { formatDateNumeric, formatPhone } from "../../lib/format";
import { placeName, useGeo } from "../../lib/geo";
import { useNow } from "../../lib/hooks";
import { TRADE } from "../../lib/profile";
import type { DB } from "../../lib/store";
import type { EmergencyCall, EmergencyStatus } from "../../lib/types";
import { PageTitle, Panel } from "./AdminUI";

/** Dispatcher's board: live calls with manual control, on-call roster and the online switch. */
export default function Dispatch({ db }: { db: DB }) {
  const now = useNow(5_000);
  const geo = useGeo();
  const toast = useToast();
  const em = TRADE.emergency;
  if (!em) return null;
  const live = db.emergencies.filter((e) => !["vyriesene", "zrusene"].includes(e.status));
  const past = db.emergencies.filter((e) => ["vyriesene", "zrusene"].includes(e.status));
  const crew = onCall(now);
  const issue = (e: EmergencyCall) => em.issues.find((i) => i.id === e.issueId)?.title ?? "Porucha";
  const town = (e: EmergencyCall) => e.town || placeName(2, geo);
  const minutes = (e: EmergencyCall) => Math.round((now.getTime() - new Date(e.createdAt).getTime()) / 60_000);

  return (
    <div className="space-y-6">
      <PageTitle title="Havárie" text="Hlásenia z webu sa tu zobrazia okamžite a zákazník vidí každú zmenu stavu na svojom telefóne." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5">
          <div>
            <p className="font-bold">Online hlásenie havárií</p>
            <p className="text-sm text-soft">{db.settings.emergencyOn ? "Zapnuté – tlačidlo Havária je na webe aktívne." : "Vypnuté – na webe sa zobrazí výzva zavolať."}</p>
          </div>
          <Switch
            checked={db.settings.emergencyOn}
            label="Online hlásenie havárií"
            onChange={(v) => {
              saveSettings({ emergencyOn: v });
              toast(v ? "Pohotovosť je na webe zapnutá." : "Pohotovosť je na webe vypnutá.", "info");
            }}
          />
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-5">
          <div className="flex -space-x-2">
            {crew.map((c) => (
              <Initials key={c.id} name={c.name} className="size-10 border-2 border-paper bg-accent text-sm text-accent-ink" />
            ))}
          </div>
          <div>
            <p className="font-bold">Dnes slúži {crew.map((c) => c.name).join(" a ")}</p>
            <p className="text-sm text-soft">Pohotovosť sa strieda po týždňoch.</p>
          </div>
        </div>
      </div>

      <Panel title={<span className="flex items-center gap-2">{live.length > 0 && <StatusDot tone="danger" />} Aktívne zásahy ({live.length})</span>}>
        {live.length === 0 ? (
          <div className="p-8 text-center text-sm text-soft">
            <Siren size={28} className="mx-auto text-mute" />
            <p className="mt-2">Žiadna aktívna havária.</p>
            <Link to="/havaria" target="_blank" className="link mt-1 inline-block">
              Vyskúšajte nahlásiť jednu na webe
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {live.map((e) => {
              const idx = stepIndex(e.status);
              return (
                <li key={e.id} className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold">{issue(e)}</p>
                      <Pill tone="bad">{EMERGENCY_STEPS[idx]?.label}</Pill>
                      {e.night && <Pill tone="warn">noc / víkend</Pill>}
                      {e.auto && <Pill tone="off">automaticky</Pill>}
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-soft">
                      <span className="font-semibold text-ink">{e.name}</span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} /> {formatPhone(e.phone)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {e.street}, {town(e)} · {e.km} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> pred {minutes(e)} min · ETA {e.etaMin} min
                      </span>
                    </p>
                    {e.note && <p className="mt-2 text-sm italic text-soft">„{e.note}“</p>}
                    <a href={`/havaria/${e.code}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent-deep">
                      <External size={14} /> Čo vidí zákazník
                    </a>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <span className="w-16 font-semibold">Technik</span>
                      <select value={e.techId} onChange={(ev) => setEmergencyStatus(e.id, idx < 1 ? "pridelene" : e.status, { manual: true, techId: ev.target.value })} className="field py-2 text-sm">
                        {TRADE.crew.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["pridelene", "na-ceste", "na-mieste", "vyriesene"] as EmergencyStatus[]).map((s) => {
                        const i = stepIndex(s);
                        return (
                          <button key={s} type="button" disabled={i <= idx} onClick={() => setEmergencyStatus(e.id, s, { manual: true })} className={`btn btn-sm ${i === idx + 1 ? "bg-ink text-white" : "border border-line"} disabled:opacity-35`}>
                            {EMERGENCY_STEPS[i].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="História zásahov">
        <ul className="divide-y divide-line">
          {past.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
              <span className="w-24 text-mute">{formatDateNumeric(new Date(e.createdAt))}</span>
              <span className="flex-1 font-semibold">{issue(e)}</span>
              <span className="text-soft">
                {e.name} · {town(e)}
              </span>
              <span className="text-soft">{TRADE.crew.find((c) => c.id === e.techId)?.name}</span>
              {e.status === "zrusene" ? (
                <Pill tone="off">zrušené</Pill>
              ) : e.rating ? (
                <span className="flex items-center gap-0.5 font-semibold">
                  <Star size={14} className="text-[#f5b400]" /> {e.rating}
                </span>
              ) : (
                <Pill tone="ok">vyriešené</Pill>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
