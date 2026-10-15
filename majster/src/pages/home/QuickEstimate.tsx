import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Icon } from "../../components/icons";
import { RangeField, Stepper } from "../../components/ui";
import { defaultValues, estimate } from "../../lib/calc";
import { formatEuro } from "../../lib/format";
import { TRADE } from "../../lib/profile";
import { useDB } from "../../lib/store";

/** One input, instant price range: a taste of the full calculator on the home page. */
export default function QuickEstimate() {
  const db = useDB();
  const [jobId, setJobId] = useState(TRADE.jobs[0].id);
  const job = TRADE.jobs.find((j) => j.id === jobId)!;
  const [values, setValues] = useState(() => Object.fromEntries(TRADE.jobs.map((j) => [j.id, defaultValues(j)])));
  const v = values[jobId];
  const input = job.inputs.find((i) => i.id === job.quick)!;
  const est = estimate(job, v, db.settings);
  const set = (value: number | string) => setValues((all) => ({ ...all, [jobId]: { ...all[jobId], [input.id]: value } }));
  const query = new URLSearchParams({ praca: jobId, [input.id]: String(v[input.id]) }).toString();

  return (
    <div className="card overflow-hidden shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)]">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-line bg-bg p-2">
        {TRADE.jobs.map((j) => (
          <button
            key={j.id}
            type="button"
            onClick={() => setJobId(j.id)}
            aria-pressed={j.id === jobId}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${j.id === jobId ? "bg-ink text-white" : "text-soft hover:bg-paper hover:text-ink"}`}
          >
            <Icon name={j.icon} size={17} />
            {j.title}
          </button>
        ))}
      </div>
      <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="text-sm font-semibold text-soft">{input.label}</p>
          <div className="mt-3">
            {input.kind === "number" && <RangeField value={Number(v[input.id])} onChange={set} min={input.min} max={input.max} step={input.step} unit={input.unit} label={input.label} />}
            {input.kind === "count" && <Stepper value={Number(v[input.id])} onChange={set} min={input.min} max={input.max} label={input.label} />}
            {input.kind === "choice" && (
              <div className="flex flex-wrap gap-2">
                {input.options.map((o) => (
                  <button key={o.id} type="button" className="chip" aria-pressed={v[input.id] === o.id} onClick={() => set(o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-4 text-sm text-mute">Ostatné parametre podľa najčastejšej voľby. Upresníte ich v kalkulačke.</p>
        </div>
        <div className="rounded-2xl bg-ink p-5 text-white">
          <p className="text-sm text-white/60">Orientačná cena {db.settings.vatPayer ? "s DPH" : ""}</p>
          <p className="display mt-1 text-[1.7rem] leading-tight tabular-nums sm:text-[1.9rem]" aria-live="polite">
            <span className="whitespace-nowrap">{formatEuro(est.low)}</span> – <span className="whitespace-nowrap">{formatEuro(est.high)}</span>
          </p>
          <p className="mt-2 text-sm text-white/60">
            {est.days === 1 ? "Hotovo za 1 deň" : `Približne ${est.days} pracovných dní`} · {est.lines.length} položiek
          </p>
          <Link to={`/kalkulacka?${query}`} className="btn-accent mt-4 w-full">
            Presný rozpočet <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
