import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AreaMap } from "../components/AreaMap";
import { Calculator, Calendar, Check, Clock, Mail, MapPin, Phone, Send, Siren } from "../components/icons";
import { useEmergencyOn } from "../components/layout/nav";
import { PhotoUpload } from "../components/PhotoUpload";
import { Checkbox, ContactLink, PageHero, StatusDot, TextArea, TextField } from "../components/ui";
import { createLead } from "../lib/actions";
import { isEmail, minutesToTime, normalizePhone } from "../lib/format";
import { HOURS_ROWS, officeStatus } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { BIZ } from "../lib/profile";

export default function ContactPage() {
  usePageMeta("Kontakt", `Kontakt – ${BIZ.name}, ${BIZ.street}, ${BIZ.city}.`);
  const now = useNow();
  const status = officeStatus(now);
  const emergency = useEmergencyOn();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", consent: false });
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.name.trim().length < 3) err.name = "Napíšte meno.";
    const phone = normalizePhone(form.phone);
    if (!phone && !isEmail(form.email)) err.phone = "Nechajte nám telefón alebo e-mail.";
    if (form.email && !isEmail(form.email)) err.email = "E-mail nevyzerá správne.";
    if (form.message.trim().length < 5) err.message = "Napíšte nám aspoň pár slov.";
    if (!form.consent) err.consent = "Bez súhlasu vám nemôžeme odpovedať.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const lead = createLead({
      source: "kontakt",
      name: form.name.trim(),
      phone: phone ?? "",
      email: form.email.trim(),
      town: "",
      km: null,
      jobTitle: "Správa z webu",
      note: form.message.trim(),
      photos,
      logText: "Správa z kontaktného formulára",
    });
    setSent(lead.code);
  };

  return (
    <>
      <PageHero eyebrow="Kontakt" title="Ozvite sa. Odpovieme do 2 hodín." text="V pracovnom čase zdvíhame telefón hneď. Správu z webu vybavíme v ten istý deň.">
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
          <StatusDot tone={status.open ? "ok" : "off"} /> {status.text}
        </p>
      </PageHero>
      <section className="container-page grid gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <ContactLink kind="tel" className="card flex items-center gap-4 p-5 transition-colors hover:border-ink/30">
            <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-ink">
              <Phone size={22} />
            </span>
            <span>
              <span className="block text-sm text-mute">Telefón</span>
              <span className="text-lg font-bold">{BIZ.phoneLabel}</span>
            </span>
          </ContactLink>
          <ContactLink kind="mail" className="card flex items-center gap-4 p-5 transition-colors hover:border-ink/30">
            <span className="grid size-12 place-items-center rounded-xl bg-sand">
              <Mail size={22} />
            </span>
            <span>
              <span className="block text-sm text-mute">E-mail</span>
              <span className="text-lg font-bold">{BIZ.email}</span>
            </span>
          </ContactLink>
          <div className="card flex items-start gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sand">
              <MapPin size={22} />
            </span>
            <span>
              <span className="block text-sm text-mute">Kancelária a sklad</span>
              <span className="text-lg font-bold">
                {BIZ.street}, {BIZ.city}
              </span>
              <span className="mt-1 block text-sm text-soft">
                IČO {BIZ.ico} · DIČ {BIZ.dic}
              </span>
            </span>
          </div>
          <div className="card p-5">
            <p className="flex items-center gap-2 font-bold">
              <Clock size={18} /> Otváracie hodiny
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {HOURS_ROWS.map((r) => (
                <li key={r.label} className="flex justify-between gap-4">
                  <span className="text-soft">{r.label}</span>
                  <span className="font-semibold tabular-nums">{r.hours ? `${minutesToTime(r.hours.open)} – ${minutesToTime(r.hours.close)}` : "zatvorené"}</span>
                </li>
              ))}
            </ul>
            {emergency && (
              <Link to="/havaria" className="mt-4 flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-bold text-danger">
                <Siren size={17} /> Havárie riešime nonstop
              </Link>
            )}
          </div>
          <AreaMap />
        </div>

        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="py-10 text-center">
              <span className="mx-auto grid size-16 animate-pop place-items-center rounded-2xl bg-ok text-white">
                <Check size={32} strokeWidth={3} />
              </span>
              <h2 className="display mt-5 text-2xl">Správa je odoslaná</h2>
              <p className="mx-auto mt-2 max-w-sm text-soft">Ďakujeme, {form.name.split(" ")[0]}. Ozveme sa do 2 hodín v pracovnom čase. Číslo vašej správy je {sent}.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link to="/kalkulacka" className="btn-outline btn-sm">
                  <Calculator size={16} /> Medzitým spočítať cenu
                </Link>
                <Link to="/obhliadka" className="btn-accent btn-sm">
                  <Calendar size={16} /> Rovno objednať obhliadku
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
              <h2 className="display text-2xl sm:col-span-2">Napíšte nám</h2>
              <TextField label="Meno a priezvisko" required className="sm:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoComplete="name" />
              <TextField label="Telefón" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} autoComplete="tel" />
              <TextField label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" />
              <TextArea label="Správa" required className="sm:col-span-2" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} placeholder="Čo potrebujete urobiť, kde a kedy?" />
              <div className="sm:col-span-2">
                <PhotoUpload value={photos} onChange={setPhotos} />
              </div>
              <div className="sm:col-span-2">
                <Checkbox checked={form.consent} onChange={(consent) => setForm({ ...form, consent })} error={errors.consent}>
                  Súhlasím so spracovaním údajov podľa{" "}
                  <Link to="/ochrana-sukromia" className="link font-medium">
                    zásad ochrany súkromia
                  </Link>
                  .
                </Checkbox>
              </div>
              <button type="submit" className="btn-accent sm:col-span-2">
                <Send size={18} /> Odoslať správu
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
