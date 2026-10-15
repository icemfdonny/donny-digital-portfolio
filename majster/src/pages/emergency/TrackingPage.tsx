import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AreaMap } from "../../components/AreaMap";
import { Alert, Check, Info, Phone, Star, Truck } from "../../components/icons";
import { useToast } from "../../components/toast";
import { ContactLink, Initials, StatusDot } from "../../components/ui";
import { rateEmergency, setEmergencyStatus } from "../../lib/actions";
import { autoStatus, driveProgress, EMERGENCY_STEPS, emergencyPrice, stepIndex } from "../../lib/emergency";
import { formatClock } from "../../lib/format";
import { findTown, useGeo } from "../../lib/geo";
import { useNow, usePageMeta } from "../../lib/hooks";
import { BIZ, TRADE } from "../../lib/profile";
import { slugify } from "../../lib/profile";
import { useDB } from "../../lib/store";
import NotFound from "../NotFound";

/** Live tracking of an emergency call. The demo runs the dispatch on its own, faster than real time. */
export default function TrackingPage() {
  const { code } = useParams();
  usePageMeta(`Havária ${code}`);
  const db = useDB();
  const now = useNow(1000);
  const geo = useGeo();
  const toast = useToast();
  const [hover, setHover] = useState(0);
  const call = db.emergencies.find((e) => e.code === code);

  // Advance the simulated dispatch while the page is open.
  const due = call ? autoStatus(call, now.getTime()) : null;
  useEffect(() => {
    if (call && due && due !== call.status) {
      setEmergencyStatus(call.id, due);
      if (due === "na-mieste") toast("Technik je na mieste.");
    }
  }, [call, due, toast]);

  if (!call) return <NotFound />;
  const issue = TRADE.emergency?.issues.find((i) => i.id === call.issueId);
  const tech = TRADE.crew.find((c) => c.id === call.techId);
  const idx = stepIndex(call.status);
  const cancelled = call.status === "zrusene";
  const { progress, minutesLeft } = driveProgress(call, now.getTime());
  const town = geo ? findTown(call.town, geo.towns) : null;
  const price = emergencyPrice(call.night);
  const plate = `${slugify(BIZ.city).slice(0, 2).toUpperCase() || "SK"}-${String(400 + (call.code.charCodeAt(3) % 500)).padStart(3, "0")}${call.code.slice(-2)}`;
  const at = (s: string) => call.timeline.find((t) => t.status === s)?.at;

  const headline = cancelled
    ? "Hlásenie je zrušené"
    : call.status === "prijate"
      ? "Hľadáme najbližšieho technika…"
      : call.status === "pridelene"
        ? `${tech?.name.split(" ")[0]} prijal zásah`
        : call.status === "na-ceste"
          ? `Na ceste · u vás o ~${minutesLeft} min`
          : call.status === "na-mieste"
            ? "Technik je u vás"
            : "Porucha je vyriešená";

  return (
    <div className="bg-bg pb-16">
      <section className="bg-ink pb-8 pt-8 text-white sm:pt-12">
        <div className="container-page">
          <p className="flex items-center gap-2 text-sm font-semibold text-white/60">
            {!cancelled && idx < 4 && <StatusDot tone="danger" />} Hlásenie {call.code} · {issue?.title}
          </p>
          <h1 className="display mt-2 text-[2rem] leading-tight sm:text-[3rem]" aria-live="polite">
            {headline}
          </h1>
          {!cancelled && (
            <ol className="mt-6 grid grid-cols-5 gap-1.5">
              {EMERGENCY_STEPS.map((s, i) => (
                <li key={s.status}>
                  <span className={`block h-1.5 rounded-full ${i < idx ? "bg-accent" : i === idx ? "animate-blink bg-accent" : "bg-white/15"}`} />
                  <span className={`mt-2 hidden text-xs font-semibold sm:block ${i <= idx ? "text-white" : "text-white/40"}`}>{s.label}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <div className="container-page mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-line">
            <AreaMap target={town ? { lat: town.lat, lng: town.lng, name: call.town } : null} progress={cancelled ? undefined : call.status === "na-ceste" ? progress : idx >= 3 ? 1 : 0} />
            {call.auto && idx < 3 && !cancelled && (
              <p className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-paper/95 px-2.5 py-1.5 text-xs font-semibold text-soft shadow">
                <Info size={14} /> Ukážka: čas tu plynie rýchlejšie
              </p>
            )}
          </div>
          {issue && idx < 4 && !cancelled && (
            <div className="rounded-2xl border-2 border-warn/25 bg-warn-soft p-5">
              <p className="flex items-center gap-2 font-bold text-warn">
                <Alert size={19} /> Kým príde technik
              </p>
              <ul className="mt-2 space-y-1.5 text-[15px]">
                {issue.safety.map((s) => (
                  <li key={s} className="flex gap-2">
                    <Check size={16} className="mt-1 shrink-0 text-warn" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {tech && !cancelled && (
            <div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
              <div className="flex items-center gap-4">
                <Initials name={tech.name} className="size-14 bg-accent text-lg text-accent-ink" />
                <div className="min-w-0">
                  <p className="text-lg font-bold">{idx === 0 ? "Prideľujeme…" : tech.name}</p>
                  <p className="text-sm text-soft">{tech.role}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-mute">
                    <Truck size={14} /> Biela dodávka {BIZ.name} · {plate}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ContactLink kind="tel" className="btn-dark btn-sm">
                  <Phone size={16} /> Zavolať
                </ContactLink>
                {idx < 2 ? (
                  <button type="button" className="btn-outline btn-sm" onClick={() => setEmergencyStatus(call.id, "zrusene", { manual: true })}>
                    Zrušiť hlásenie
                  </button>
                ) : (
                  <span className="grid place-items-center rounded-lg bg-sand text-sm font-semibold">{call.status === "na-ceste" ? `~${minutesLeft} min` : formatClock(new Date(at(call.status) ?? call.createdAt))}</span>
                )}
              </div>
            </div>
          )}

          <ol className="rounded-2xl bg-paper p-5 ring-1 ring-line">
            {EMERGENCY_STEPS.map((s, i) => {
              const time = at(s.status);
              const done = i <= idx && !cancelled;
              return (
                <li key={s.status} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < EMERGENCY_STEPS.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${i < idx && !cancelled ? "bg-ok" : "bg-line"}`} aria-hidden="true" />}
                  <span className={`relative grid size-7 shrink-0 place-items-center rounded-full ${done ? "bg-ok text-white" : "border-2 border-line bg-paper"}`}>{done && <Check size={14} strokeWidth={3} />}</span>
                  <div className="min-w-0">
                    <p className={`font-bold ${done ? "" : "text-mute"}`}>
                      {s.label} {time && <span className="ml-1 text-sm font-medium text-mute">{formatClock(new Date(time))}</span>}
                    </p>
                    {i === idx && !cancelled && <p className="text-sm text-soft">{s.text}</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          {call.status === "na-mieste" && (
            <button type="button" className="btn-outline w-full" onClick={() => setEmergencyStatus(call.id, "vyriesene", { manual: true })}>
              <Check size={18} /> Ukážka: technik dokončil opravu
            </button>
          )}

          {call.status === "vyriesene" && (
            <div className="rounded-2xl bg-paper p-5 text-center ring-1 ring-line">
              <p className="font-bold">{call.rating ? "Ďakujeme za hodnotenie!" : "Ako sme to zvládli?"}</p>
              <div className="mt-3 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-label={`${n} z 5`} onMouseEnter={() => setHover(n)} onClick={() => rateEmergency(call.id, n)} disabled={!!call.rating}>
                    <Star size={34} className={n <= (hover || call.rating || 0) ? "text-[#f5b400]" : "text-line"} />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-soft">Faktúru s rozpisom pre poisťovňu vám pošleme e-mailom.</p>
            </div>
          )}

          <div className="rounded-2xl bg-paper p-5 text-sm ring-1 ring-line">
            <p className="font-bold">Cena zásahu{call.night ? " (noc / víkend)" : ""}</p>
            <p className="mt-1 text-soft">
              Výjazd {price.callout} € + {price.hourly} € za každú začatú hodinu + materiál. Zaplatíte kartou na mieste alebo na faktúru.
            </p>
          </div>
          <Link to="/" className="block text-center text-sm font-semibold text-soft hover:text-ink">
            Späť na úvod
          </Link>
        </div>
      </div>
    </div>
  );
}
