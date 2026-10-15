import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Chart, External, Lock, Logout, Mail, Tag, Users } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Avatar, Logo } from "../../components/ui";
import { capitalize, formatDateLong, fromISODate, minutesToTime } from "../../lib/format";
import { useNow, usePageMeta, usePersistentState } from "../../lib/hooks";
import { updateDB, useDB } from "../../lib/store";
import CalendarView from "./CalendarView";
import Clients from "./Clients";
import Inbox from "./Inbox";
import Overview from "./Overview";
import ServicesAdmin from "./ServicesAdmin";
import TeamAdmin from "./TeamAdmin";

export type Tab = "prehlad" | "kalendar" | "klienti" | "sluzby" | "tim" | "spravy";

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
  { id: "prehlad", label: "Prehľad", icon: Chart },
  { id: "kalendar", label: "Kalendár", icon: Calendar },
  { id: "klienti", label: "Klientky", icon: Users },
  { id: "sluzby", label: "Služby a ceny", icon: Tag },
  { id: "tim", label: "Tím a smeny", icon: Users },
  { id: "spravy", label: "Správy a čakačky", icon: Mail },
];

export default function AdminPage() {
  usePageMeta("Administrácia");
  const [authed, setAuthed] = usePersistentState("aurelia-admin-auth", false);
  const db = useDB();

  useEffect(() => {
    if (authed && !db.adminVisited) updateDB((d) => ({ ...d, adminVisited: true }));
  }, [authed, db.adminVisited]);

  return authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <Login onLogin={() => setAuthed(true)} />;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [busy, setBusy] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(onLogin, 500);
  };
  return (
    <div className="grid min-h-dvh place-items-center bg-plum px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm animate-rise rounded-[1.8rem] bg-paper p-8 shadow-2xl">
        <Logo />
        <h1 className="mt-8 font-display text-4xl font-medium text-plum">Administrácia</h1>
        <p className="mt-1 text-sm text-soft">Kalendár, klientky, služby a tím na jednom mieste.</p>
        <div className="mt-6 space-y-3">
          <div>
            <label htmlFor="admin-email" className="field-label">
              E-mail
            </label>
            <input id="admin-email" className="field" defaultValue="veronika@aurelia-atelier.sk" autoComplete="username" />
          </div>
          <div>
            <label htmlFor="admin-pass" className="field-label">
              Heslo
            </label>
            <input id="admin-pass" className="field" type="password" defaultValue="ukazka2026" autoComplete="current-password" />
          </div>
        </div>
        <button type="submit" className="btn-primary mt-6 w-full py-3.5" disabled={busy}>
          <Lock size={17} /> {busy ? "Prihlasujem…" : "Prihlásiť sa"}
        </button>
        <p className="mt-4 rounded-xl bg-gold-soft/60 px-3 py-2.5 text-center text-xs text-plum">Ukážkový prístup: údaje sú predvyplnené, stačí kliknúť.</p>
        <Link to="/" className="mt-6 block text-center text-sm text-mute hover:text-ink">
          ← Späť na web
        </Link>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const db = useDB();
  const now = useNow(30_000);
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get("karta")) ? params.get("karta") : "prehlad") as Tab;
  const go = (t: Tab, extra: Record<string, string> = {}) => setParams({ karta: t, ...extra }, { replace: true });
  const inbox = db.messages.filter((m) => !m.read).length + db.waitlist.filter((w) => w.status === "waiting").length;

  // Announce bookings made on the website while the dashboard is open, e.g. in another tab.
  const seen = useRef(new Set(db.appointments.map((a) => a.id)));
  useEffect(() => {
    for (const a of db.appointments) {
      if (seen.current.has(a.id)) continue;
      seen.current.add(a.id);
      if (a.source === "web")
        toast(
          <>
            Nová rezervácia z webu: {a.clientName}, {capitalize(formatDateLong(fromISODate(a.date)))} {minutesToTime(a.start)}
          </>,
          "info",
        );
    }
  }, [db.appointments, toast]);

  return (
    <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-plum text-ivory lg:h-dvh lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-5 lg:py-6">
          <Link to="/" aria-label="Späť na web">
            <Logo tone="light" compact />
          </Link>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1.5 text-sm text-ivory/60 hover:text-ivory lg:hidden">
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
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${tab === t.id ? "bg-ivory/12 font-medium text-ivory" : "text-ivory/65 hover:bg-ivory/5 hover:text-ivory"}`}
            >
              <t.icon size={18} />
              {t.label}
              {t.id === "spravy" && inbox > 0 && <span className="ml-auto rounded-full bg-gold px-1.5 text-[11px] font-semibold tabular-nums text-white">{inbox}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 hidden space-y-1 p-3 lg:block">
          <Link to="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory/65 hover:bg-ivory/5 hover:text-ivory">
            <External size={18} /> Zobraziť web
          </Link>
          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory/65 hover:bg-ivory/5 hover:text-ivory">
            <Logout size={18} /> Odhlásiť sa
          </button>
          <div className="flex items-center gap-3 border-t border-ivory/10 px-3 pt-3">
            <Avatar id="veronika" size={34} />
            <span className="text-xs leading-tight">
              <span className="block text-ivory">Veronika Hudáková</span>
              <span className="text-ivory/50">Majiteľka</span>
            </span>
          </div>
        </div>
      </aside>
      <div className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
        {tab === "prehlad" && <Overview db={db} now={now} go={go} />}
        {tab === "kalendar" && <CalendarView db={db} now={now} initialDate={params.get("datum")} go={go} />}
        {tab === "klienti" && <Clients db={db} now={now} initialClient={params.get("klientka")} />}
        {tab === "sluzby" && <ServicesAdmin db={db} />}
        {tab === "tim" && <TeamAdmin db={db} now={now} />}
        {tab === "spravy" && <Inbox db={db} now={now} />}
      </div>
    </div>
  );
}
