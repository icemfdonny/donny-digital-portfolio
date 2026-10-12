import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bag, Calendar, External, Layout, Lock, Logout, Mail, Utensils } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Logo } from "../../components/ui";
import { usePersistentState, useNow, usePageMeta } from "../../lib/hooks";
import { isActiveStatus, statusAt } from "../../lib/orders";
import { updateDB, useDB } from "../../lib/store";
import Inbox from "./Inbox";
import MenuAdmin from "./MenuAdmin";
import Orders from "./Orders";
import Overview from "./Overview";
import Reservations from "./Reservations";

type Tab = "prehlad" | "rezervacie" | "objednavky" | "menu" | "dopyty";

export default function AdminPage() {
  usePageMeta("Administrácia");
  const [authed, setAuthed] = usePersistentState("lipa-admin-auth", false);
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
    <div className="grid min-h-dvh place-items-center bg-forest px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm animate-rise rounded-3xl bg-paper p-8 shadow-2xl">
        <Logo />
        <h1 className="mt-8 font-display text-3xl text-forest">Administrácia</h1>
        <p className="mt-1 text-sm text-soft">Rezervácie, objednávky a menu na jednom mieste.</p>
        <div className="mt-6 space-y-3">
          <div>
            <label htmlFor="admin-email" className="field-label">
              E-mail
            </label>
            <input id="admin-email" className="field" defaultValue="lucia@lipa-bistro.sk" autoComplete="username" />
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
        <p className="mt-4 rounded-xl bg-honey-soft/60 px-3 py-2.5 text-center text-xs text-forest">Ukážkový prístup: údaje sú predvyplnené, stačí kliknúť.</p>
        <Link to="/" className="mt-6 block text-center text-sm text-mute hover:text-ink">
          ← Späť na web
        </Link>
      </form>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: typeof Layout }[] = [
  { id: "prehlad", label: "Prehľad", icon: Layout },
  { id: "rezervacie", label: "Rezervácie", icon: Calendar },
  { id: "objednavky", label: "Objednávky", icon: Bag },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "dopyty", label: "Dopyty a predaj", icon: Mail },
];

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const db = useDB();
  const now = useNow(2000);
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get("karta")) ? params.get("karta") : "prehlad") as Tab;
  const setTab = (t: Tab) => setParams({ karta: t }, { replace: true });
  const activeOrders = db.orders.filter((o) => isActiveStatus(statusAt(o, now.getTime()))).length;
  const newInquiries = db.inquiries.filter((i) => i.status === "new").length;

  // Announce orders that arrive while the dashboard is open (for example from the shop in another tab).
  const seen = useRef(new Set(db.orders.map((o) => o.id)));
  useEffect(() => {
    for (const o of db.orders) {
      if (seen.current.has(o.id)) continue;
      seen.current.add(o.id);
      toast(<>Nová objednávka #{o.number}</>, "info");
    }
  }, [db.orders, toast]);

  const badge = (id: Tab) => (id === "objednavky" ? activeOrders : id === "dopyty" ? newInquiries : 0);

  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-forest text-cream lg:h-dvh lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-5 lg:py-6">
          <Link to="/" aria-label="Späť na web">
            <Logo tone="light" compact />
          </Link>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-cream lg:hidden">
            <Logout size={16} /> Odhlásiť
          </button>
        </div>
        <nav aria-label="Administrácia" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${tab === t.id ? "bg-cream/12 font-medium text-cream" : "text-cream/65 hover:bg-cream/5 hover:text-cream"}`}
            >
              <t.icon size={18} />
              {t.label}
              {badge(t.id) > 0 && <span className="ml-auto rounded-full bg-honey px-1.5 text-[11px] font-semibold tabular-nums text-forest">{badge(t.id)}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 hidden space-y-1 p-3 lg:block">
          <Link to="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/65 hover:bg-cream/5 hover:text-cream">
            <External size={18} /> Zobraziť web
          </Link>
          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/65 hover:bg-cream/5 hover:text-cream">
            <Logout size={18} /> Odhlásiť sa
          </button>
          <div className="flex items-center gap-3 border-t border-cream/10 px-3 pt-3">
            <span className="grid size-8 place-items-center rounded-full bg-honey text-xs font-semibold text-forest">LM</span>
            <span className="text-xs leading-tight">
              <span className="block text-cream">Lucia Mrázová</span>
              <span className="text-cream/50">Manažérka</span>
            </span>
          </div>
        </div>
      </aside>
      <div className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
        {tab === "prehlad" && <Overview db={db} now={now} />}
        {tab === "rezervacie" && <Reservations db={db} now={now} />}
        {tab === "objednavky" && <Orders db={db} now={now} />}
        {tab === "menu" && <MenuAdmin db={db} now={now} />}
        {tab === "dopyty" && <Inbox db={db} now={now} />}
      </div>
    </div>
  );
}
