import { useState, type FormEvent } from "react";
import { Download, Shield, Trash } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Dialog, SelectField, TextArea, TextField } from "../../components/ui";
import { MONTHS, isEmail, normalizePhone, pad } from "../../lib/format";
import { deleteAccount, updateAccount } from "../../lib/actions";
import { getDB } from "../../lib/store";
import type { Account } from "../../lib/types";
import { TEAM } from "../../data/team";

export default function Profile({ account }: { account: Account }) {
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    name: account.name,
    phone: account.phone,
    email: account.email,
    day: account.birthday ? String(Number(account.birthday.slice(3))) : "",
    month: account.birthday ? String(Number(account.birthday.slice(0, 2))) : "",
    favourite: account.favouriteSpecialist ?? "",
    careNotes: account.careNotes,
    marketing: account.marketing,
    reminders: account.reminders,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  const save = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.name.trim().split(/\s+/).length < 2) err.name = "Meno aj priezvisko, prosím.";
    if (!normalizePhone(form.phone)) err.phone = "Skontrolujte telefónne číslo.";
    if (!isEmail(form.email)) err.email = "Zadajte platný e-mail.";
    if ((form.day && !form.month) || (!form.day && form.month)) err.day = "Vyplňte deň aj mesiac.";
    setErrors(err);
    if (Object.keys(err).length) return;
    updateAccount(account.id, {
      name: form.name.trim(),
      phone: normalizePhone(form.phone)!,
      email: form.email.trim().toLowerCase(),
      birthday: form.day && form.month ? `${pad(Number(form.month))}-${pad(Number(form.day))}` : undefined,
      favouriteSpecialist: form.favourite || undefined,
      careNotes: form.careNotes.trim(),
      marketing: form.marketing,
      reminders: form.reminders,
    });
    toast("Profil je uložený.");
  };

  const exportData = () => {
    const db = getDB();
    const data = { ucet: { ...account, password: undefined }, navstevy: db.appointments.filter((a) => a.accountId === account.id) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurelia-moje-udaje.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={save} className="card space-y-5 p-5 sm:p-7" noValidate>
        <h2 className="font-display text-3xl font-medium text-plum">Osobné údaje</h2>
        <TextField label="Meno a priezvisko" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Telefón" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
          <TextField label="E-mail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Narodeniny – deň" value={form.day} onChange={(e) => set("day", e.target.value)} error={errors.day}>
            <option value="">–</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}.
              </option>
            ))}
          </SelectField>
          <SelectField label="Mesiac" value={form.month} onChange={(e) => set("month", e.target.value)}>
            <option value="">–</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </SelectField>
        </div>
        <SelectField label="Obľúbená špecialistka" value={form.favourite} onChange={(e) => set("favourite", e.target.value)} hint="Pri rezervácii ju zvýrazníme.">
          <option value="">Nemám</option>
          {TEAM.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} – {p.role.toLowerCase()}
            </option>
          ))}
        </SelectField>
        <TextArea
          label="Poznámky k starostlivosti"
          value={form.careNotes}
          onChange={(e) => set("careNotes", e.target.value)}
          hint="Alergie, citlivá pokožka, preferencie. Vidí ich len vaša špecialistka."
          rows={3}
        />
        <div className="space-y-3 border-t border-line pt-5">
          {[
            { key: "reminders" as const, title: "SMS pripomienky", text: "Deň pred termínom a keď je čas na osvieženie." },
            { key: "marketing" as const, title: "Beauty list", text: "Raz mesačne tipy a voľné termíny na poslednú chvíľu." },
          ].map((row) => (
            <div key={row.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ink">{row.title}</p>
                <p className="text-sm text-soft">{row.text}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form[row.key]}
                aria-label={row.title}
                onClick={() => set(row.key, !form[row.key])}
                className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${form[row.key] ? "bg-plum" : "bg-line"}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-paper shadow transition-[left] ${form[row.key] ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto">
          Uložiť zmeny
        </button>
      </form>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="flex items-center gap-2 font-medium text-plum">
            <Shield size={17} className="text-gold" /> Vaše údaje, vaše pravidlá
          </p>
          <p className="mt-2 text-sm text-soft">Podľa GDPR si môžete kedykoľvek stiahnuť všetko, čo o vás vieme, alebo účet zmazať.</p>
          <button type="button" className="btn-outline mt-4 w-full" onClick={exportData}>
            <Download size={16} /> Stiahnuť moje údaje
          </button>
          <button type="button" className="btn mt-2 w-full text-danger hover:bg-danger/5" onClick={() => setConfirmDelete(true)}>
            <Trash size={16} /> Zmazať účet
          </button>
        </div>
        <p className="px-1 text-xs text-mute">Členka od {new Date(account.createdAt).getFullYear()} · kód odporúčania {account.referralCode}</p>
      </aside>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Zmazať účet?"
        size="sm"
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn-outline flex-1" onClick={() => setConfirmDelete(false)}>
              Ponechať
            </button>
            <button
              type="button"
              className="btn flex-1 bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                deleteAccount(account.id);
                toast("Účet je zmazaný. Rezervácie zostávajú platné.", "info");
              }}
            >
              Zmazať natrvalo
            </button>
          </div>
        }
      >
        <p className="p-6 text-sm leading-relaxed text-soft">
          Prídete o body a históriu návštev. Nadchádzajúce termíny zostanú platné, spravovať ich môžete cez kód z potvrdenia. V ukážke vrátite všetko tlačidlom Obnoviť v
          odznaku „Ukážka“.
        </p>
      </Dialog>
    </div>
  );
}
