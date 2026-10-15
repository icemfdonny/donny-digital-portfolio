import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Crown, Lock, Shield, Tag } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Checkbox, Initials, TextArea, TextField } from "../../components/ui";
import { BOOKING, LOYALTY } from "../../config";
import { login } from "../../lib/actions";
import type { Quote } from "../../lib/loyalty";
import { DEMO_ACCOUNT } from "../../lib/store";
import type { Account } from "../../lib/types";
import type { DetailsForm, FormErrors } from "./form";

export default function StepDetails({
  form,
  setForm,
  errors,
  account,
  needsPatch,
  quote,
  emailExists,
}: {
  form: DetailsForm;
  setForm: (f: DetailsForm) => void;
  errors: FormErrors;
  account: Account | null;
  needsPatch: boolean;
  quote: Quote;
  emailExists: boolean;
}) {
  const set = <K extends keyof DetailsForm>(key: K, value: DetailsForm[K]) => setForm({ ...form, [key]: value });
  const [codeDraft, setCodeDraft] = useState(form.code);

  return (
    <div className="space-y-8">
      {account ? (
        <div className="flex items-center gap-4 rounded-2xl bg-blush/70 p-4">
          <Initials name={account.name} className="size-11 text-sm" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-plum">Prihlásená ako {account.name}</p>
            <p className="text-soft">Za túto návštevu získate {quote.points} bodov. Údaje sme vyplnili z vášho profilu.</p>
          </div>
          <Crown size={20} className="shrink-0 text-gold" />
        </div>
      ) : (
        <InlineLogin />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Meno a priezvisko" required autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} className="sm:col-span-2" />
        <TextField label="Telefón" required type="tel" inputMode="tel" autoComplete="tel" placeholder="0905 123 456" value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} hint="Pošleme SMS pripomienku deň vopred." />
        <TextField label="E-mail" required type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} hint="Sem príde potvrdenie a odkaz na zmenu." />
        <TextArea
          label="Poznámka pre špecialistku"
          placeholder="Napr. inšpirácia z Instagramu, citlivá pokožka, prídem s kočíkom…"
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          className="sm:col-span-2"
          rows={3}
        />
        {!account && (
          <div className="sm:col-span-2">
            <Checkbox checked={form.firstVisit} onChange={(v) => set("firstVisit", v)}>
              Som u vás prvýkrát
            </Checkbox>
          </div>
        )}
      </div>

      {needsPatch && (
        <fieldset className="rounded-2xl border border-line p-5">
          <legend className="flex items-center gap-2 px-1 text-sm font-medium text-plum">
            <Shield size={16} className="text-gold" /> Test citlivosti
          </legend>
          <p className="text-sm leading-relaxed text-soft">Pri farbách, lash liftingu a peelingoch robíme 48 hodín vopred päťminútový test za uchom. Je zadarmo.</p>
          <div className="mt-3 space-y-2" role="radiogroup" aria-label="Test citlivosti">
            {[
              { value: "done" as const, label: "Test som u vás robila za posledných 6 mesiacov" },
              { value: "needed" as const, label: "Prídem na test aspoň 48 hodín vopred (čas dohodneme v SMS)" },
            ].map((o) => (
              <label key={o.value} className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-1 text-sm text-ink">
                <input type="radio" name="patch" className="mt-0.5 size-[18px] accent-plum" checked={form.patchTest === o.value} onChange={() => set("patchTest", o.value)} />
                {o.label}
              </label>
            ))}
          </div>
          {errors.patchTest && <p className="mt-2 text-sm text-danger">{errors.patchTest}</p>}
        </fieldset>
      )}

      <div>
        <p className="field-label flex items-center gap-2">
          <Tag size={15} className="text-gold" /> Kód odmeny alebo odporúčania
        </p>
        <div className="flex gap-2">
          <label htmlFor="booking-code" className="sr-only">
            Kód
          </label>
          <input
            id="booking-code"
            className="field uppercase"
            placeholder={account ? "ODM-…" : "napr. ZUZANA10"}
            value={codeDraft}
            onChange={(e) => setCodeDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                set("code", codeDraft);
              }
            }}
            aria-invalid={quote.code ? !quote.code.ok : undefined}
          />
          <button type="button" className="btn-outline shrink-0" onClick={() => set("code", codeDraft)}>
            Použiť
          </button>
        </div>
        {quote.code && <p className={`mt-1.5 text-sm ${quote.code.ok ? "text-ok" : "text-danger"}`}>{quote.code.message}</p>}
        {account && account.rewards.some((r) => !r.usedAt) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {account.rewards
              .filter((r) => !r.usedAt)
              .map((r) => {
                const def = LOYALTY.rewards.find((x) => x.id === r.rewardId);
                return (
                  <button
                    key={r.code}
                    type="button"
                    className="chip py-1.5 text-xs"
                    onClick={() => {
                      setCodeDraft(r.code);
                      set("code", r.code);
                    }}
                  >
                    Moja odmena: {def?.title}
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {!account && (
        <div className="rounded-2xl border border-gold/40 bg-gold-soft/30 p-5">
          <Checkbox checked={form.createAccount} onChange={(v) => set("createAccount", v)}>
            <span className="font-medium text-plum">Vytvoriť účet a zbierať body</span> – {LOYALTY.signupBonus} bodov hneď, ďalších {quote.points} za túto návštevu. Termíny potom zmeníte
            jedným klikom.
          </Checkbox>
          {form.createAccount && (
            <div className="mt-4 pl-7">
              {emailExists ? (
                <p className="text-sm text-soft">Účet s týmto e-mailom už existuje. Prihláste sa hore a body sa pripíšu.</p>
              ) : (
                <TextField
                  label="Heslo"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  error={errors.password}
                  hint="Aspoň 6 znakov."
                />
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <Checkbox checked={form.terms} onChange={(v) => set("terms", v)} error={errors.terms}>
          Súhlasím so{" "}
          <Link to="/kontakt#faq" className="underline underline-offset-2" target="_blank">
            storno podmienkami
          </Link>
          : bezplatná zmena alebo zrušenie do {BOOKING.freeCancelHours} hodín pred termínom.
        </Checkbox>
        <Checkbox checked={form.marketing} onChange={(v) => set("marketing", v)}>
          Chcem dostávať beauty list a voľné termíny na poslednú chvíľu (nepovinné).
        </Checkbox>
      </div>
    </div>
  );
}

function InlineLogin() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const account = login(email, password);
    if (!account) {
      setError("E-mail alebo heslo nesedí.");
      return;
    }
    toast(<>Vitajte späť, {account.name.split(" ")[0]}!</>);
  };
  if (!open)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blush/70 p-4">
        <p className="text-sm text-soft">
          <span className="font-medium text-plum">Máte účet?</span> Prihláste sa, vyplníme údaje a pripíšeme body.
        </p>
        <button type="button" className="btn-outline bg-paper py-2" onClick={() => setOpen(true)}>
          <Lock size={15} /> Prihlásiť sa
        </button>
      </div>
    );
  return (
    <form onSubmit={submit} className="rounded-2xl bg-blush/70 p-4 sm:p-5" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Heslo" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className="btn-primary py-2.5">
          Prihlásiť sa
        </button>
        <button
          type="button"
          className="btn-outline bg-paper py-2.5"
          onClick={() => {
            setEmail(DEMO_ACCOUNT.email);
            setPassword(DEMO_ACCOUNT.password);
            setError(null);
          }}
        >
          Vyplniť ukážkový účet
        </button>
      </div>
    </form>
  );
}
