import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Check, Clock, Info, MapPin, User } from "../../components/icons";
import { TownInput, type TownPick } from "../../components/TownInput";
import { Checkbox, TextArea, TextField } from "../../components/ui";
import { bookVisit, createLead } from "../../lib/actions";
import { slotsFor, windowLabel, windowOf } from "../../lib/availability";
import { capitalize, formatDateLong, fromISODate, isEmail, normalizePhone } from "../../lib/format";
import { useNow, usePageMeta } from "../../lib/hooks";
import { BIZ, TRADE } from "../../lib/profile";
import { markProgress, useDB } from "../../lib/store";
import { DatePicker } from "./DatePicker";

export default function BookingPage() {
  usePageMeta("Objednať termín", `Vyberte si termín obhliadky v reálnom čase – ${BIZ.name}.`);
  const db = useDB();
  const now = useNow(60_000);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromLead = db.leads.find((l) => l.code === params.get("dopyt"));

  const [typeId, setTypeId] = useState(TRADE.visitTypes[0].id);
  const [date, setDate] = useState<string | null>(params.get("datum"));
  const [win, setWin] = useState<number | null>(params.get("okno") !== null ? Number(params.get("okno")) : null);
  const [town, setTown] = useState<TownPick | null>(fromLead?.town ? { name: fromLead.town, district: "", km: fromLead.km } : null);
  const [form, setForm] = useState({ street: "", name: fromLead?.name ?? "", phone: fromLead?.phone ?? "", email: fromLead?.email ?? "", note: fromLead ? `K dopytu ${fromLead.code}: ${fromLead.jobTitle}` : "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const type = TRADE.visitTypes.find((t) => t.id === typeId)!;
  const slot = useMemo(() => (date && win !== null ? slotsFor(fromISODate(date), db, now).find((s) => s.index === win && s.bookable) : undefined), [date, win, db, now]);
  // The owner does the surveys himself when he is free.
  const techId = slot ? (slot.free.includes("t1") ? "t1" : slot.free[0]) : null;
  const tech = TRADE.crew.find((c) => c.id === techId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!slot) err.slot = "Vyberte deň a čas príchodu.";
    if (!type.atBase && !town) err.town = "Zadajte obec.";
    if (!type.atBase && form.street.trim().length < 3) err.street = "Zadajte ulicu a číslo domu.";
    if (form.name.trim().length < 3) err.name = "Napíšte meno a priezvisko.";
    const phone = normalizePhone(form.phone);
    if (!phone) err.phone = "Skontrolujte telefónne číslo.";
    if (form.email && !isEmail(form.email)) err.email = "E-mail nevyzerá správne.";
    if (!form.consent) err.consent = "Bez súhlasu termín nevieme potvrdiť.";
    setErrors(err);
    if (Object.keys(err).length) {
      document.querySelector('[aria-invalid="true"], [data-error]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      const lead =
        fromLead ??
        createLead({
          source: "obhliadka",
          stage: "obhliadka",
          name: form.name.trim(),
          phone: phone!,
          email: form.email.trim(),
          town: type.atBase ? BIZ.city : (town?.name ?? ""),
          street: form.street.trim(),
          km: type.atBase ? 0 : (town?.km ?? null),
          jobTitle: type.title,
          note: form.note.trim(),
          photos: [],
          logText: `Objednaný termín cez web: ${type.title}`,
        });
      const visit = bookVisit({
        leadId: lead.id,
        typeId,
        date: slot!.date,
        window: slot!.index,
        techId: techId!,
        name: form.name.trim(),
        phone: phone!,
        email: form.email.trim(),
        town: type.atBase ? BIZ.city : (town?.name ?? ""),
        street: type.atBase ? BIZ.street : form.street.trim(),
        note: form.note.trim(),
      });
      markProgress("obhliadka");
      navigate(`/termin/${visit.code}`);
    }, 600);
  };

  return (
    <div className="bg-bg pb-16">
      <div className="border-b border-line bg-paper">
        <div className="container-page py-6 sm:py-8">
          <p className="eyebrow text-accent-deep">
            <span className="h-[3px] w-6 rounded-full bg-accent" /> Rezervácia termínu
          </p>
          <h1 className="display mt-2 text-[2rem] leading-tight sm:text-[2.6rem]">Vyberte si, kedy k vám prídeme</h1>
          <p className="mt-2 max-w-2xl text-soft">Kalendár vidí naše skutočné vyťaženie. Termín, ktorý si vyberiete, je váš – potvrdenie dostanete hneď.</p>
          {fromLead && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-deep">
              <Check size={16} /> Termín k dopytu {fromLead.code} · {fromLead.jobTitle}
            </p>
          )}
        </div>
      </div>
      <form onSubmit={submit} noValidate className="container-page mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
            <h2 className="display text-xl">1. Čo potrebujete</h2>
            <div role="radiogroup" aria-label="Typ návštevy" className="mt-4 grid gap-2 sm:grid-cols-2">
              {TRADE.visitTypes.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={t.id === typeId} onClick={() => setTypeId(t.id)} className="option-tile flex-col gap-1">
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-bold">{t.title}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${t.price === "zadarmo" ? "bg-ok-soft text-ok" : "bg-sand"}`}>{t.price}</span>
                  </span>
                  <span className="text-sm text-soft">{t.text}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
            <h2 className="display text-xl">2. Kam</h2>
            {type.atBase ? (
              <p className="mt-3 flex items-start gap-2 text-soft">
                <MapPin size={18} className="mt-0.5 shrink-0" /> Stretneme sa u nás: {BIZ.street}, {BIZ.city}. Parkovanie priamo pred budovou.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TownInput value={town} onChange={setTown} required error={errors.town} />
                <TextField label="Ulica a číslo" required autoComplete="street-address" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} error={errors.street} />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6" data-error={errors.slot ? "" : undefined}>
            <h2 className="display text-xl">3. Kedy</h2>
            <p className="mt-1 text-sm text-soft">Uvádzame dvojhodinové okno príchodu. Technik vám 30 minút vopred zavolá.</p>
            <div className="mt-4">
              <DatePicker
                db={db}
                now={now}
                date={date}
                window={win}
                onPick={(d, w) => {
                  setDate(d);
                  setWin(w);
                }}
              />
            </div>
            {errors.slot && <p className="mt-3 text-sm font-medium text-danger">{errors.slot}</p>}
          </section>

          <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
            <h2 className="display text-xl">4. Kontakt</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField label="Meno a priezvisko" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} className="sm:col-span-2" />
              <TextField label="Telefón" required type="tel" autoComplete="tel" placeholder="0905 123 456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
              <TextField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} hint="Pošleme potvrdenie a pripomienku." />
              <TextArea label="Čo máme vedieť vopred?" className="sm:col-span-2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Napríklad poschodie, kód od brány, čo presne treba riešiť…" />
              <div className="sm:col-span-2">
                <Checkbox checked={form.consent} onChange={(consent) => setForm({ ...form, consent })} error={errors.consent}>
                  Súhlasím so spracovaním údajov na účely termínu podľa{" "}
                  <Link to="/ochrana-sukromia" className="link font-medium">
                    zásad ochrany súkromia
                  </Link>
                  .
                </Checkbox>
              </div>
            </div>
          </section>
        </div>

        <aside>
          <div className="sticky top-28 overflow-hidden rounded-2xl bg-ink text-white">
            <div className="p-6">
              <p className="text-sm text-white/60">Vaša rezervácia</p>
              <p className="display mt-1 text-2xl">{type.title}</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Calendar size={18} className="mt-0.5 text-accent" />
                  <span>{slot ? capitalize(formatDateLong(fromISODate(slot.date))) : <span className="text-white/50">Vyberte deň</span>}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={18} className="mt-0.5 text-accent" />
                  <span>{slot ? `Príchod ${windowLabel(slot)}` : <span className="text-white/50">Vyberte čas</span>}</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 text-accent" />
                  <span>{type.atBase ? `${BIZ.street}, ${BIZ.city}` : town ? `${form.street ? `${form.street}, ` : ""}${town.name}` : <span className="text-white/50">Zadajte adresu</span>}</span>
                </li>
                <li className="flex items-start gap-3">
                  <User size={18} className="mt-0.5 text-accent" />
                  <span>{tech ? `${tech.name} · ${tech.role.toLowerCase()}` : <span className="text-white/50">Technika priradíme podľa termínu</span>}</span>
                </li>
              </ul>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-white/60">Cena</span>
                <span className="font-bold">{type.price}</span>
              </div>
              <button type="submit" className="btn-accent mt-5 w-full py-4" disabled={sending}>
                <Check size={19} /> {sending ? "Potvrdzujem…" : "Potvrdiť termín"}
              </button>
            </div>
            <p className="flex gap-2 border-t border-white/10 bg-white/5 px-6 py-4 text-xs leading-relaxed text-white/55">
              <Info size={15} className="mt-0.5 shrink-0" /> Zmeniť alebo zrušiť termín môžete zadarmo online až do 12 hodín pred príchodom.
            </p>
          </div>
        </aside>
      </form>
      {date && win !== null && !slot && windowOf(date, win) && <p className="sr-only">Vybraný termín už nie je voľný.</p>}
    </div>
  );
}
