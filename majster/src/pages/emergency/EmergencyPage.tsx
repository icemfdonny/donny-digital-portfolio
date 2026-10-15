import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Clock, Euro, Icon, Phone, Siren } from "../../components/icons";
import { TownInput, type TownPick } from "../../components/TownInput";
import { ContactLink, Initials, StatusDot, TextArea, TextField } from "../../components/ui";
import { reportEmergency } from "../../lib/actions";
import { emergencyPrice, etaFor, isOffHours, onCall } from "../../lib/emergency";
import { normalizePhone } from "../../lib/format";
import { useNow, usePageMeta } from "../../lib/hooks";
import { BIZ, TRADE } from "../../lib/profile";
import { markProgress, useDB } from "../../lib/store";

export default function EmergencyPage() {
  usePageMeta("Havária 24/7", `Nonstop pohotovosť – ${BIZ.name}. Nahláste poruchu a sledujte technika online.`);
  const db = useDB();
  const now = useNow(30_000);
  const navigate = useNavigate();
  const [issueId, setIssueId] = useState<string | null>(null);
  const [town, setTown] = useState<TownPick | null>(null);
  const [form, setForm] = useState({ street: "", name: "", phone: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const em = TRADE.emergency;

  if (!em)
    return (
      <div className="container-page py-24 text-center">
        <h1 className="display text-3xl">Havarijnú službu neposkytujeme</h1>
        <p className="mx-auto mt-3 max-w-md text-soft">Ak potrebujete niečo rýchlo, zavolajte nám a pokúsime sa nájsť najbližší voľný termín.</p>
        <ContactLink kind="tel" className="btn-accent mt-6">
          <Phone size={18} /> {BIZ.phoneLabel}
        </ContactLink>
      </div>
    );

  const issue = em.issues.find((i) => i.id === issueId);
  const night = isOffHours(now);
  const price = emergencyPrice(night);
  const crew = onCall(now);
  const eta = town?.km != null ? etaFor(town.km, now) : null;
  const available = db.settings.emergencyOn;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!issue) err.issue = "Vyberte, čo sa deje.";
    if (!town) err.town = "Zadajte obec.";
    if (form.street.trim().length < 3) err.street = "Zadajte ulicu a číslo.";
    if (form.name.trim().length < 2) err.name = "Napíšte meno.";
    const phone = normalizePhone(form.phone);
    if (!phone) err.phone = "Technik vám bude volať – skontrolujte číslo.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setSending(true);
    window.setTimeout(() => {
      const call = reportEmergency({ issueId: issue!.id, name: form.name.trim(), phone: phone!, town: town!.name, street: form.street.trim(), note: form.note.trim(), km: town!.km ?? 15 });
      markProgress("havaria");
      navigate(`/havaria/${call.code}`);
    }, 500);
  };

  return (
    <div className="bg-bg pb-16">
      <section className="relative overflow-hidden bg-ink pb-10 pt-10 text-white sm:pt-14">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(-45deg,#d92d20_0_14px,#14171c_14px_28px)]" aria-hidden="true" />
        <div className="container-page">
          <p className="eyebrow text-[#ff8a80]">
            <StatusDot tone="danger" /> Nonstop pohotovosť
          </p>
          <h1 className="display mt-3 text-[2.3rem] leading-[1.02] sm:text-[3.4rem]">{em.title}? Sme na ceste.</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">Vyplňte 4 údaje, dispečer hneď pridelí technika a na ďalšej obrazovke uvidíte, kde práve je. Alebo rovno volajte.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ContactLink kind="tel" className="btn-danger px-6 py-4 text-base">
              <Phone size={20} /> Volať {BIZ.phoneLabel}
            </ContactLink>
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-2.5">
              <div className="flex -space-x-2">
                {crew.map((c) => (
                  <Initials key={c.id} name={c.name} className="size-9 border-2 border-ink bg-accent text-sm text-accent-ink" />
                ))}
              </div>
              <span className="text-sm leading-tight">
                <span className="block font-semibold">Dnes slúžia {crew.map((c) => c.name.split(" ")[0]).join(" a ")}</span>
                <span className="text-white/55">výjazd do 15 minút od nahlásenia</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {!available && (
        <div className="container-page mt-6">
          <p className="flex items-start gap-3 rounded-2xl border-2 border-warn/30 bg-warn-soft p-4 text-warn">
            <Alert size={20} className="mt-0.5 shrink-0" /> Online hlásenie je teraz vypnuté, všetci technici sú na zásahoch. Volajte prosím priamo, dispečer vám povie najbližší možný čas.
          </p>
        </div>
      )}

      <form onSubmit={submit} noValidate className="container-page mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
            <h2 className="display text-xl">Čo sa deje?</h2>
            <div role="radiogroup" aria-label="Typ poruchy" className="mt-4 grid gap-2 sm:grid-cols-2">
              {em.issues.map((i) => (
                <button key={i.id} type="button" role="radio" aria-checked={i.id === issueId} onClick={() => setIssueId(i.id)} className="option-tile items-center">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${i.urgent ? "bg-danger-soft text-danger" : "bg-sand text-ink"}`}>
                    <Icon name={i.icon} size={20} strokeWidth={2.2} />
                  </span>
                  <span className="font-semibold">{i.title}</span>
                </button>
              ))}
            </div>
            {errors.issue && <p className="mt-3 text-sm font-medium text-danger">{errors.issue}</p>}
            {issue && (
              <div className={`mt-5 animate-rise rounded-2xl border-2 p-5 ${issue.urgent ? "border-danger/30 bg-danger-soft" : "border-warn/25 bg-warn-soft"}`} role="alert">
                <p className={`flex items-center gap-2 font-bold ${issue.urgent ? "text-danger" : "text-warn"}`}>
                  <Alert size={19} /> Kým prídeme, urobte toto:
                </p>
                <ol className="mt-3 space-y-2">
                  {issue.safety.map((s, n) => (
                    <li key={s} className="flex gap-3 text-[15px] text-ink">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{n + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
            <h2 className="display text-xl">Kam a komu</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TownInput value={town} onChange={setTown} required error={errors.town} />
              <TextField label="Ulica a číslo" required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} error={errors.street} autoComplete="street-address" />
              <TextField label="Meno" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoComplete="name" />
              <TextField label="Telefón" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} placeholder="0905 123 456" autoComplete="tel" />
              <TextArea label="Niečo ďalšie? (nepovinné)" className="sm:col-span-2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Poschodie, zvonček, prístup k rozvádzaču…" />
            </div>
          </section>
        </div>

        <aside>
          <div className="sticky top-28 space-y-4">
            <div className="overflow-hidden rounded-2xl bg-ink text-white">
              <div className="p-6">
                <p className="flex items-center gap-2 text-sm text-white/60">
                  <Clock size={16} /> Odhad príchodu
                </p>
                <p className="display mt-1 text-[2.2rem] leading-none tabular-nums">{eta ? `${eta} – ${eta + 15} min` : "— min"}</p>
                <p className="mt-2 text-sm text-white/55">{town ? `${town.name} · ${town.km ?? "?"} km od nás` : "Zadajte obec a spočítame to podľa aktuálnej premávky."}</p>
              </div>
              <div className="border-t border-white/10 px-6 py-5">
                <p className="flex items-center gap-2 text-sm text-white/60">
                  <Euro size={16} /> Cena zásahu {night && <span className="rounded bg-accent px-1.5 text-[11px] font-bold text-accent-ink">noc / víkend</span>}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li className="flex justify-between">
                    <span className="text-white/70">Výjazd</span>
                    <span className="font-bold">{price.callout} €</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/70">Každá začatá hodina</span>
                    <span className="font-bold">{price.hourly} €</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/70">Materiál</span>
                    <span className="font-bold">podľa cenníka</span>
                  </li>
                </ul>
                {night && <p className="mt-2 text-xs text-white/50">V noci (20:00 – 6:00), cez víkend a sviatky platí príplatok {Math.round(em.nightSurcharge * 100)} %.</p>}
              </div>
              <div className="p-6 pt-0">
                <button type="submit" className="btn-danger w-full py-4 text-base" disabled={sending || !available}>
                  <Siren size={20} /> {sending ? "Odosielam…" : "Privolať technika"}
                </button>
              </div>
            </div>
            <p className="px-1 text-xs leading-relaxed text-mute">
              Pri ohrození života volajte 112. Nejde o haváriu?{" "}
              <Link to="/obhliadka" className="link">
                Objednajte bežný termín
              </Link>
              .
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
