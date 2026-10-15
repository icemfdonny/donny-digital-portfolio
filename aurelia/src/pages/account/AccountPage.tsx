import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Crown, Gift, Lock, Logout, Sparkles, User } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Checkbox, Initials, Monogram, Segmented, TextField } from "../../components/ui";
import { LOYALTY } from "../../config";
import { emailTaken, login, logout, register } from "../../lib/actions";
import { isEmail, normalizePhone } from "../../lib/format";
import { useNow, usePageMeta } from "../../lib/hooks";
import { loyaltyState } from "../../lib/loyalty";
import { DEMO_ACCOUNT, useAccount, useDB } from "../../lib/store";
import Appointments from "./Appointments";
import Overview from "./Overview";
import Points from "./Points";
import Profile from "./Profile";

type Tab = "prehlad" | "terminy" | "body" | "profil";
const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "prehlad", label: "Prehľad", icon: Sparkles },
  { id: "terminy", label: "Termíny", icon: Calendar },
  { id: "body", label: "Body a odmeny", icon: Gift },
  { id: "profil", label: "Profil", icon: User },
];

export default function AccountPage() {
  usePageMeta("Môj účet", "Termíny, história návštev, vernostné body a odmeny na jednom mieste.");
  const account = useAccount();
  return account ? <Dashboard /> : <Auth />;
}

function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(params.get("registracia") ? "register" : "login");
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-plum pb-16 pt-28 sm:pt-32">
      <Monogram arc={false} className="pointer-events-none absolute -left-32 top-20 size-[560px] text-ivory/[0.05]" />
      <div className="container-page relative grid items-center gap-12 lg:grid-cols-[1fr_460px]">
        <div className="text-ivory">
          <p className="eyebrow text-gold-soft">Klientsky účet</p>
          <h1 className="mt-3 font-display text-[2.8rem] font-medium leading-none sm:text-7xl">
            Všetko o vašej kráse <em className="font-normal text-gold-soft">na jednom mieste.</em>
          </h1>
          <ul className="mt-8 space-y-3 text-[15px] font-light text-ivory/80">
            {[
              "Termíny presuniete alebo zrušíte jedným klikom",
              "História návštev aj s receptúrou vašej farby",
              `${LOYALTY.signupBonus} bodov na privítanie, potom 1 bod za každé euro`,
              "Pripomienka, keď je čas na odrasty či gél lak",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Crown size={18} className="mt-0.5 shrink-0 text-gold" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="animate-rise rounded-[1.8rem] bg-paper p-6 shadow-2xl sm:p-8">
          <Segmented
            label="Prihlásenie alebo registrácia"
            value={mode}
            onChange={setMode}
            options={[
              { value: "login", label: "Prihlásenie" },
              { value: "register", label: "Nový účet" },
            ]}
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
          />
          {mode === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </section>
  );
}

function LoginForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      const account = login(email, password);
      setBusy(false);
      if (!account) setError("E-mail alebo heslo nesedí.");
      else toast(<>Vitajte späť, {account.name.split(" ")[0]}!</>);
    }, 450);
  };
  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <button
        type="button"
        onClick={() => {
          setEmail(DEMO_ACCOUNT.email);
          setPassword(DEMO_ACCOUNT.password);
          setError(null);
        }}
        className="w-full rounded-xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-2.5 text-left text-sm text-plum hover:bg-gold-soft"
      >
        Ukážka: kliknite a prihlásime vás ako stálu klientku Zuzanu (Gold, história, body).
      </button>
      <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Heslo" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
      <button type="submit" className="btn-primary w-full py-3.5" disabled={busy}>
        <Lock size={16} /> {busy ? "Prihlasujem…" : "Prihlásiť sa"}
      </button>
      <p className="text-center text-xs text-mute">Zabudnuté heslo pošleme e-mailom (v ukážke vypnuté).</p>
    </form>
  );
}

function RegisterForm() {
  const now = useNow();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", birthday: "", marketing: false, terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form, v: string | boolean) => setForm({ ...form, [k]: v });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.name.trim().split(/\s+/).length < 2) err.name = "Meno aj priezvisko, prosím.";
    if (!isEmail(form.email)) err.email = "Zadajte platný e-mail.";
    else if (emailTaken(form.email)) err.email = "Účet s týmto e-mailom už existuje.";
    if (!normalizePhone(form.phone)) err.phone = "Skontrolujte telefónne číslo.";
    if (form.password.length < 6) err.password = "Aspoň 6 znakov.";
    if (!form.terms) err.terms = "Potrebujeme váš súhlas.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const birthday = form.birthday ? form.birthday.slice(5) : undefined;
    register({ name: form.name, email: form.email, phone: normalizePhone(form.phone)!, password: form.password, birthday, marketing: form.marketing }, now);
    toast(<>Vitajte v Aurelii! Pripísali sme {LOYALTY.signupBonus} bodov.</>);
  };
  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <TextField label="Meno a priezvisko" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
        <TextField label="Telefón" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Heslo" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} error={errors.password} />
        <TextField label="Narodeniny" type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} hint="Dvojnásobné body v tom mesiaci." />
      </div>
      <Checkbox checked={form.terms} onChange={(v) => set("terms", v)} error={errors.terms}>
        Súhlasím so spracovaním údajov na vedenie účtu.{" "}
        <Link to="/ochrana-sukromia" className="underline underline-offset-2">
          Viac
        </Link>
      </Checkbox>
      <Checkbox checked={form.marketing} onChange={(v) => set("marketing", v)}>
        Chcem dostávať beauty list (nepovinné).
      </Checkbox>
      <button type="submit" className="btn-gold w-full py-3.5">
        <Sparkles size={16} /> Vytvoriť účet a získať {LOYALTY.signupBonus} bodov
      </button>
      <p className="text-center text-xs text-mute">Predchádzajúce rezervácie s rovnakým e-mailom sa pripoja automaticky.</p>
    </form>
  );
}

function Dashboard() {
  const account = useAccount()!;
  const db = useDB();
  const now = useNow(30_000);
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get("karta")) ? params.get("karta") : "prehlad") as Tab;
  const setTab = (t: Tab) => setParams({ karta: t }, { replace: true });
  const loyalty = loyaltyState(account, db, now);

  return (
    <>
      <section className="bg-plum pb-0 pt-28 text-ivory sm:pt-32">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <Initials name={account.name} className="size-16 text-xl" />
              <div>
                <p className="eyebrow text-gold-soft">
                  {loyalty.tier.name} · {loyalty.balance.toLocaleString("sk-SK")} bodov
                </p>
                <h1 className="mt-2 font-display text-[2.4rem] font-medium leading-none sm:text-5xl">Ahoj, {account.name.split(" ")[0]}</h1>
              </div>
            </div>
            <button
              type="button"
              className="btn-ghost-light py-2.5"
              onClick={() => {
                logout();
                toast("Boli ste odhlásená.", "info");
              }}
            >
              <Logout size={16} /> Odhlásiť
            </button>
          </div>
          <nav aria-label="Môj účet" className="no-scrollbar -mx-4 mt-10 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-t-2xl px-5 py-3.5 text-sm transition-colors ${tab === t.id ? "bg-ivory font-medium text-plum" : "text-ivory/70 hover:text-ivory"}`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </nav>
        </div>
      </section>
      <div className="container-page py-10 sm:py-14">
        {tab === "prehlad" && <Overview account={account} loyalty={loyalty} now={now} onTab={setTab} />}
        {tab === "terminy" && <Appointments account={account} now={now} />}
        {tab === "body" && <Points account={account} loyalty={loyalty} now={now} />}
        {tab === "profil" && <Profile account={account} />}
      </div>
    </>
  );
}
