import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Icon, Info, Send } from "../../components/icons";
import { PhotoUpload } from "../../components/PhotoUpload";
import { TownInput, type TownPick } from "../../components/TownInput";
import { Checkbox, Photo, RangeField, Segmented, Stepper, Switch, TextArea, TextField } from "../../components/ui";
import { URGENCY, type UrgencyId } from "../../config";
import type { CalcJob, CalcValues } from "../../data/trades";
import { createLead } from "../../lib/actions";
import { defaultValues, estimate, jobById, type Estimate } from "../../lib/calc";
import { formatEuro, formatPrice, isEmail, normalizePhone } from "../../lib/format";
import { usePageMeta } from "../../lib/hooks";
import { BIZ, TRADE } from "../../lib/profile";
import { markProgress, useDB } from "../../lib/store";

const STEPS = ["Práca", "Parametre", "Miesto a termín", "Kontakt"];

/** Reads ?praca=job&input=value links from the home page and service cards. */
function initial(params: URLSearchParams): { job: CalcJob | null; values: Record<string, CalcValues> } {
  const job = jobById(params.get("praca")) ?? null;
  const values = Object.fromEntries(TRADE.jobs.map((j) => [j.id, defaultValues(j)]));
  if (job) {
    for (const input of job.inputs) {
      const raw = params.get(input.id);
      if (raw === null) continue;
      if (input.kind === "number" || input.kind === "count") {
        const n = Number(raw);
        if (Number.isFinite(n)) values[job.id][input.id] = Math.min(input.max, Math.max(input.min, n));
      } else if (input.kind === "choice" && input.options.some((o) => o.id === raw)) values[job.id][input.id] = raw;
    }
  }
  return { job, values };
}

export default function CalculatorPage() {
  usePageMeta("Kalkulačka ceny", `Spočítajte si orientačnú cenu online – ${BIZ.name}.`);
  const db = useDB();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [init] = useState(() => initial(params));
  const [step, setStep] = useState(init.job ? 1 : 0);
  const [jobId, setJobId] = useState(init.job?.id ?? TRADE.jobs[0].id);
  const [values, setValues] = useState(init.values);
  const [town, setTown] = useState<TownPick | null>(null);
  const [urgency, setUrgency] = useState<UrgencyId>("normal");
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "", pref: "telefon" as "telefon" | "email" | "whatsapp", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const job = TRADE.jobs.find((j) => j.id === jobId)!;
  const v = values[jobId];
  const est = useMemo(() => estimate(job, v, db.settings, { urgency, km: town?.km ?? null }), [job, v, db.settings, urgency, town]);
  const setValue = (id: string, value: CalcValues[string]) => setValues((all) => ({ ...all, [jobId]: { ...all[jobId], [id]: value } }));

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    if (step === 2) {
      if (!town) return setErrors({ town: "Zadajte obec, nech vieme rátať s dopravou." });
      setErrors({});
    }
    go(step + 1);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (contact.name.trim().length < 3) err.name = "Napíšte meno a priezvisko.";
    const phone = normalizePhone(contact.phone);
    if (!phone) err.phone = "Skontrolujte telefónne číslo, napr. 0905 123 456.";
    if (contact.email && !isEmail(contact.email)) err.email = "E-mail nevyzerá správne.";
    if (!contact.consent) err.consent = "Bez súhlasu vás nemôžeme kontaktovať.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setSending(true);
    window.setTimeout(() => {
      const lead = createLead({
        source: "kalkulacka",
        name: contact.name.trim(),
        phone: phone!,
        email: contact.email.trim(),
        town: town?.name ?? "",
        km: town?.km ?? null,
        jobId: job.id,
        jobTitle: job.title,
        values: v,
        lines: est.lines,
        estimate: { low: est.low, high: est.high, gross: est.gross, days: est.days },
        urgency,
        note: note.trim(),
        photos,
        contactPref: contact.pref,
        logText: "Dopyt z online kalkulačky",
      });
      markProgress("kalkulacka");
      navigate(`/dopyt/${lead.code}`);
    }, 700);
  };

  return (
    <div className="bg-bg pb-32 lg:pb-20">
      <div className="border-b border-line bg-paper">
        <div className="container-page py-6 sm:py-8">
          <p className="eyebrow text-accent-deep">
            <span className="h-[3px] w-6 rounded-full bg-accent" /> Online kalkulačka
          </p>
          <h1 className="display mt-2 text-[2rem] leading-tight sm:text-[2.6rem]">Koľko to bude stáť?</h1>
          <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Kroky">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button type="button" disabled={i > step} onClick={() => go(i)} className="group w-full text-left disabled:cursor-default" aria-current={i === step ? "step" : undefined}>
                  <span className={`block h-1.5 rounded-full transition-colors ${i <= step ? "bg-ink" : "bg-sand"}`} />
                  <span className={`mt-2 hidden text-sm font-semibold sm:block ${i === step ? "text-ink" : "text-mute"}`}>
                    {i + 1}. {s}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {step === 0 && (
            <div className="animate-rise">
              <h2 className="display text-2xl">Čo potrebujete urobiť?</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {TRADE.jobs.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    aria-pressed={j.id === jobId}
                    onClick={() => {
                      setJobId(j.id);
                      go(1);
                    }}
                    className="option-tile overflow-hidden p-0"
                  >
                    <Photo src={j.photo} alt="" className="h-full w-28 shrink-0 self-stretch sm:w-32" />
                    <span className="flex flex-1 flex-col py-4 pr-4">
                      <span className="flex items-center gap-2 font-bold">
                        <Icon name={j.icon} size={18} className="text-accent-deep" /> {j.title}
                      </span>
                      <span className="mt-1 text-sm text-soft">{j.text}</span>
                      <span className="mt-auto pt-3 text-sm font-semibold text-ink">
                        od {formatEuro(estimate(j, defaultValues(j), db.settings).low)} <ArrowRight size={14} className="inline" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-6 flex items-start gap-2 text-sm text-soft">
                <Info size={17} className="mt-0.5 shrink-0" />
                <span>
                  Nenašli ste, čo hľadáte?{" "}
                  <Link to="/kontakt" className="link">
                    Napíšte nám
                  </Link>{" "}
                  a nacenime to individuálne.
                </span>
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="animate-rise">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-ink">
                  <Icon name={job.icon} size={22} strokeWidth={2.2} />
                </span>
                <div>
                  <h2 className="display text-2xl leading-tight">{job.title}</h2>
                  <button type="button" onClick={() => go(0)} className="text-sm font-semibold text-mute hover:text-ink">
                    Zmeniť prácu
                  </button>
                </div>
              </div>
              <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-paper">
                {job.inputs.map((input) => (
                  <div key={input.id} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                      <div className="min-w-0">
                        <p className="font-bold">{input.label}</p>
                        {input.hint && <p className="mt-0.5 text-sm text-mute">{input.hint}</p>}
                      </div>
                      {input.kind === "count" && <Stepper value={Number(v[input.id])} onChange={(n) => setValue(input.id, n)} min={input.min} max={input.max} label={input.label} />}
                      {input.kind === "toggle" && <Switch checked={v[input.id] === true} onChange={(b) => setValue(input.id, b)} label={input.label} />}
                    </div>
                    {input.kind === "number" && (
                      <div className="mt-4">
                        <RangeField value={Number(v[input.id])} onChange={(n) => setValue(input.id, n)} min={input.min} max={input.max} step={input.step} unit={input.unit} label={input.label} />
                      </div>
                    )}
                    {input.kind === "choice" && (
                      <div role="radiogroup" aria-label={input.label} className={`mt-4 grid gap-2 ${input.options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                        {input.options.map((o) => (
                          <button key={o.id} type="button" role="radio" aria-checked={v[input.id] === o.id} onClick={() => setValue(input.id, o.id)} className="option-tile items-center py-3">
                            <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${v[input.id] === o.id ? "border-ink bg-ink text-accent" : "border-line"}`}>
                              {v[input.id] === o.id && <span className="size-2 rounded-full bg-accent" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold">{o.label}</span>
                              {o.hint && <span className="block text-xs text-mute">{o.hint}</span>}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-rise space-y-6">
              <h2 className="display text-2xl">Kde a kedy</h2>
              <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
                <TownInput value={town} onChange={setTown} label="Kde sa bude pracovať?" required error={errors.town} autoFocus />
              </div>
              <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
                <p className="font-bold">Kedy by ste to potrebovali?</p>
                <div role="radiogroup" aria-label="Termín" className="mt-4 grid gap-2 sm:grid-cols-3">
                  {URGENCY.map((u) => (
                    <button key={u.id} type="button" role="radio" aria-checked={urgency === u.id} onClick={() => setUrgency(u.id)} className="option-tile flex-col gap-0.5 py-3">
                      <span className="font-semibold">{u.label}</span>
                      <span className="text-xs text-mute">{u.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
                <PhotoUpload value={photos} onChange={setPhotos} />
                <TextArea className="mt-5" label="Poznámka (nepovinné)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Napríklad stav, prístup, kedy ste doma…" maxLength={600} />
              </div>
            </div>
          )}

          {step === 3 && (
            <form id="calc-form" onSubmit={submit} noValidate className="animate-rise space-y-6">
              <h2 className="display text-2xl">Kam vám máme poslať presnú ponuku?</h2>
              <div className="grid gap-4 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-2 sm:p-6">
                <TextField label="Meno a priezvisko" required autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} error={errors.name} className="sm:col-span-2" />
                <TextField label="Telefón" required type="tel" autoComplete="tel" inputMode="tel" placeholder="0905 123 456" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} error={errors.phone} />
                <TextField label="E-mail" type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} error={errors.email} hint="Pošleme naň rozpočet." />
                <div className="sm:col-span-2">
                  <p className="field-label">Ako vás máme kontaktovať?</p>
                  <Segmented
                    label="Preferovaný kontakt"
                    value={contact.pref}
                    onChange={(pref) => setContact({ ...contact, pref })}
                    options={[
                      { value: "telefon", label: "Telefonicky" },
                      { value: "email", label: "E-mailom" },
                      { value: "whatsapp", label: "WhatsApp" },
                    ]}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Checkbox checked={contact.consent} onChange={(consent) => setContact({ ...contact, consent })} error={errors.consent}>
                    Súhlasím so spracovaním údajov na účely cenovej ponuky podľa{" "}
                    <Link to="/ochrana-sukromia" className="link font-medium">
                      zásad ochrany súkromia
                    </Link>
                    .
                  </Checkbox>
                </div>
              </div>
              <p className="flex items-start gap-2 text-sm text-soft">
                <Info size={17} className="mt-0.5 shrink-0" /> Odoslanie je nezáväzné. Ozveme sa do 2 hodín v pracovnom čase a dohodneme obhliadku.
              </p>
            </form>
          )}

          <div className="mt-8 hidden items-center justify-between gap-3 lg:flex">
            {step > 0 ? (
              <button type="button" className="btn-ghost" onClick={() => go(step - 1)}>
                <ArrowLeft size={18} /> Späť
              </button>
            ) : (
              <span />
            )}
            {step > 0 && <NextButton step={step} sending={sending} onNext={next} />}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <Summary job={job} est={est} town={town} vatPayer={db.settings.vatPayer} showLines={step >= 1} />
          </div>
        </aside>
      </div>

      {/* Phones: price and the next step always in reach. */}
      {step > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <MobileSummary job={job} est={est} town={town} vatPayer={db.settings.vatPayer} />
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-outline px-4" onClick={() => go(step - 1)} aria-label="Späť">
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1">
              <NextButton step={step} sending={sending} onNext={next} full />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NextButton({ step, sending, onNext, full }: { step: number; sending: boolean; onNext: () => void; full?: boolean }) {
  if (step === 3)
    return (
      <button type="submit" form="calc-form" className={`btn-accent px-6 ${full ? "w-full" : ""}`} disabled={sending}>
        <Send size={18} /> {sending ? "Odosielam…" : "Odoslať nezáväzný dopyt"}
      </button>
    );
  return (
    <button type="button" className={`btn-dark px-6 ${full ? "w-full" : ""}`} onClick={onNext}>
      Pokračovať <ArrowRight size={18} />
    </button>
  );
}

function Summary({ job, est, town, vatPayer, showLines }: { job: CalcJob; est: Estimate; town: TownPick | null; vatPayer: boolean; showLines: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-2xl bg-ink text-white shadow-[0_30px_60px_-30px_rgb(0_0_0/0.5)]">
      <div className="p-6">
        <p className="text-sm text-white/60">{job.title}</p>
        <p className="mt-1 text-sm text-white/60">Orientačná cena {vatPayer ? "s DPH" : ""}</p>
        <p className="display mt-1 text-[2.1rem] leading-none tabular-nums" aria-live="polite">
          {formatEuro(est.low)} – {formatEuro(est.high)}
        </p>
        <p className="mt-2 text-sm text-white/60">{est.days === 1 ? "Hotovo za 1 deň" : `Približne ${est.days} pracovných dní`}</p>
      </div>
      {showLines && (
        <div className="border-t border-white/10">
          <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-6 py-3 text-sm font-semibold text-white/80" aria-expanded={open}>
            Rozpočet po položkách
            <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="max-h-[42vh] overflow-y-auto px-6 pb-5 text-sm">
              <ul className="space-y-2">
                {est.lines.map((l, i) => (
                  <li key={`${l.item}-${i}`} className="flex justify-between gap-3">
                    <span className="text-white/75">
                      {l.label}
                      <span className="block text-xs text-white/45">
                        {l.qty.toLocaleString("sk-SK")} {l.unit} × {formatPrice(l.price)}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatPrice(l.total)}</span>
                  </li>
                ))}
                {est.urgencyFee > 0 && <Row label="Príplatok za skorší termín" value={est.urgencyFee} />}
                <Row label={town ? `Doprava (${town.km ?? "?"} km${est.days > 1 ? `, ${est.days} výjazdov` : ""})` : "Doprava – zadajte obec"} value={est.travelFee} free={!!town && est.travelFee === 0} />
              </ul>
              <div className="mt-4 space-y-1 border-t border-white/10 pt-3">
                <Row label="Spolu bez DPH" value={est.net} />
                {vatPayer && <Row label="DPH 23 %" value={est.vat} />}
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>Spolu</span>
                  <span className="tabular-nums">{formatPrice(est.gross)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="border-t border-white/10 bg-white/5 px-6 py-4 text-xs leading-relaxed text-white/55">
        {job.assumptions.map((a) => (
          <p key={a} className="flex gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-accent" /> {a}
          </p>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, free }: { label: string; value: number; free?: boolean }) {
  return (
    <li className="flex list-none justify-between gap-3">
      <span className="text-white/75">{label}</span>
      <span className="shrink-0 font-semibold tabular-nums">{free ? "zadarmo" : formatPrice(value)}</span>
    </li>
  );
}

function MobileSummary({ job, est, town, vatPayer }: { job: CalcJob; est: Estimate; town: TownPick | null; vatPayer: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between text-left">
        <span>
          <span className="block text-xs font-semibold text-mute">Orientačne {vatPayer ? "s DPH" : ""}</span>
          <span className="display text-xl tabular-nums">
            {formatEuro(est.low)} – {formatEuro(est.high)}
          </span>
        </span>
        <span className="text-sm font-semibold text-accent-deep">Rozpočet ↑</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={() => setOpen(false)}>
          <div className="max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-paper p-3" onClick={(e) => e.stopPropagation()}>
            <Summary job={job} est={est} town={town} vatPayer={vatPayer} showLines />
            <button type="button" className="btn-outline mt-3 w-full" onClick={() => setOpen(false)}>
              Zavrieť
            </button>
          </div>
        </div>
      )}
    </>
  );
}
