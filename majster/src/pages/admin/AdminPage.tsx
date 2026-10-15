import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Chart, External, Kanban, Lock, Logout, Siren, Sliders } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Initials, Logo } from "../../components/ui";
import { usePageMeta, usePersistentState } from "../../lib/hooks";
import { BIZ, TRADE } from "../../lib/profile";
import { markProgress, updateDB, useDB } from "../../lib/store";
import Dispatch from "./Dispatch";
import Overview from "./Overview";
import Pipeline from "./Pipeline";
import PriceSettings from "./PriceSettings";
import Schedule from "./Schedule";

export type Tab = "prehlad" | "zakazky" | "kalendar" | "havarie" | "cennik";

const TABS: { id: Tab; label: string; icon: typeof Chart }[] = [
  { id: "prehlad", label: "Prehľad", icon: Chart },
  { id: "zakazky", label: "Zákazky", icon: Kanban },
  { id: "kalendar", label: "Kalendár tímu", icon: Calendar },
  ...(TRADE.emergency ? [{ id: "havarie" as const, label: "Havárie", icon: Siren }] : []),
  { id: "cennik", label: "Cenník a nastavenia", icon: Sliders },
];

export default function AdminPage() {
  usePageMeta("Administrácia");
  const [authed, setAuthed] = usePersistentState(`majster-admin:${TRADE.id}`, false);
  const db = useDB();
  useEffect(() => {
    if (!authed) return;
    markProgress("admin");
    if (!db.adminVisited) updateDB((d) => ({ ...d, adminVisited: true }));
  }, [authed, db.adminVisited]);
  return authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <Login onLogin={() => setAuthed(true)} />;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [busy, setBusy] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(onLogin, 450);
  };
  return (
    <div className="grid min-h-dvh place-items-center bg-ink px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm animate-rise rounded-3xl bg-paper p-8 shadow-2xl">
        <Logo />
        <h1 className="display mt-8 text-3xl">Administrácia</h1>
        <p className="mt-1 text-sm text-soft">Dopyty, ponuky, kalendár tímu a cenník na jednom mieste.</p>
        <div className="mt-6 space-y-3">
          <div>
            <label htmlFor="admin-email" className="field-label">
              E-mail
            </label>
            <input id="admin-email" className="field" defaultValue={BIZ.email} autoComplete="username" />
          </div>
          <div>
            <label htmlFor="admin-pass" className="field-label">
              Heslo
            </label>
            <input id="admin-pass" className="field" type="password" defaultValue="ukazka2026" autoComplete="current-password" />
          </div>
        </div>
        <button type="submit" className="btn-accent mt-6 w-full py-3.5" disabled={busy}>
          <Lock size={17} /> {busy ? "Prihlasujem…" : "Prihlásiť sa"}
        </button>
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2.5 text-center text-xs font-medium text-accent-deep">Ukážkový prístup: údaje sú predvyplnené, stačí kliknúť.</p>
        <Link to="/" className="mt-6 block text-center text-sm text-mute hover:text-ink">
          ← Späť na web
        </Link>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const db = useDB();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get("karta")) ? params.get("karta") : "prehlad") as Tab;
  const go = (t: Tab, extra: Record<string, string> = {}) => setParams({ karta: t, ...extra }, { replace: true });
  const fresh = db.leads.filter((l) => l.stage === "novy").length;
  const live = db.emergencies.filter((e) => !["vyriesene", "zrusene"].includes(e.status)).length;

  // Announce requests from the website while the dashboard is open, e.g. in another tab.
  const seen = useRef(new Set([...db.leads.map((l) => l.id), ...db.emergencies.map((e) => e.id), ...db.quotes.filter((q) => q.status === "prijata").map((q) => q.id)]));
  useEffect(() => {
    for (const l of db.leads) {
      if (seen.current.has(l.id)) continue;
      seen.current.add(l.id);
      toast(`Nový dopyt: ${l.name} – ${l.jobTitle}`, "info");
    }
    for (const e of db.emergencies) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      toast(`Havária: ${e.name}, ${e.town}`, "info");
    }
    for (const q of db.quotes) {
      if (q.status !== "prijata" || seen.current.has(q.id)) continue;
      seen.current.add(q.id);
      toast(`Ponuka ${q.code} prijatá zákazníkom`);
    }
  }, [db.leads, db.emergencies, db.quotes, toast]);

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-white/10 bg-ink text-white lg:h-dvh lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-5 lg:py-6">
          <Link to="/" aria-label="Späť na web" className="block min-w-0">
            <Logo tone="light" compact />
          </Link>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white lg:hidden">
            <Logout size={16} /> Odhlásiť
          </button>
        </div>
        <nav aria-label="Administrácia" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
            >
              <t.icon size={18} />
              {t.label}
              {t.id === "zakazky" && fresh > 0 && <span className="ml-auto rounded-full bg-accent px-1.5 text-[11px] font-bold tabular-nums text-accent-ink">{fresh}</span>}
              {t.id === "havarie" && live > 0 && <span className="ml-auto animate-blink rounded-full bg-danger px-1.5 text-[11px] font-bold tabular-nums">{live}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 hidden space-y-1 p-3 lg:block">
          <Link to="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            <External size={18} /> Zobraziť web
          </Link>
          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            <Logout size={18} /> Odhlásiť sa
          </button>
          <div className="flex items-center gap-3 border-t border-white/10 px-3 pt-3">
            <Initials name={`${BIZ.owner} ${BIZ.name}`} className="size-9 bg-accent text-sm text-accent-ink" />
            <span className="text-xs leading-tight">
              <span className="block text-white">{BIZ.owner}</span>
              <span className="text-white/50">Majiteľ · {BIZ.name}</span>
            </span>
          </div>
        </div>
      </aside>
      <div className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
        {tab === "prehlad" && <Overview db={db} go={go} />}
        {tab === "zakazky" && <Pipeline db={db} initialLead={params.get("dopyt")} />}
        {tab === "kalendar" && <Schedule db={db} />}
        {tab === "havarie" && <Dispatch db={db} />}
        {tab === "cennik" && <PriceSettings db={db} />}
      </div>
    </div>
  );
}
