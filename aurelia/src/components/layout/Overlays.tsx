import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SALON, STUDIO } from "../../config";
import { usePersistentState } from "../../lib/hooks";
import { durationLabel, formatEuro, plural } from "../../lib/format";
import { DEMO_ACCOUNT, resetDemo, useDB } from "../../lib/store";
import { durationOf, priceRange } from "../../lib/catalog";
import { useVisit } from "../../lib/visit";
import { ArrowRight, Calendar, Check, Mail, Refresh, Sparkles, X } from "../icons";
import { useToast } from "../toast";
import { Dialog } from "../ui";

type Consent = { decided: boolean; analytics: boolean; marketing: boolean };

/**
 * Cookie consent (Slovak sites need one) and the demo badge. They share a corner, so they are laid out together:
 * the badge waits until the visitor has dealt with the cookie banner.
 */
export default function Overlays() {
  const [consent, setConsent] = usePersistentState<Consent>("aurelia-consent", { decided: false, analytics: false, marketing: false });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener("aurelia:cookies", open);
    return () => window.removeEventListener("aurelia:cookies", open);
  }, []);

  return (
    <>
      {!consent.decided && (
        <CookieBanner
          onAccept={() => setConsent({ decided: true, analytics: true, marketing: true })}
          onNecessary={() => setConsent({ decided: true, analytics: false, marketing: false })}
          onSettings={() => setSettingsOpen(true)}
        />
      )}
      <CookieSettings
        open={settingsOpen}
        consent={consent}
        onClose={() => setSettingsOpen(false)}
        onSave={(c) => {
          setConsent({ ...c, decided: true });
          setSettingsOpen(false);
        }}
      />
      <VisitTray />
      {consent.decided && <DemoBadge />}
    </>
  );
}

function CookieBanner({ onAccept, onNecessary, onSettings }: { onAccept: () => void; onNecessary: () => void; onSettings: () => void }) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 animate-rise sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-md" role="region" aria-label="Súhlas s cookies">
      <div className="rounded-3xl border border-line bg-paper p-5 shadow-2xl sm:p-6">
        <p className="font-display text-2xl font-medium text-plum">Trochu cookies, nič viac.</p>
        <p className="mt-2 text-sm leading-relaxed text-soft">
          Nevyhnutné cookies potrebujeme na rezervácie a prihlásenie. S vaším súhlasom použijeme aj analytické, aby sme vedeli, čo na webe funguje.{" "}
          <Link to="/ochrana-sukromia" className="underline underline-offset-2">
            Viac
          </Link>
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn-primary flex-1 py-2.5" onClick={onAccept}>
            Prijať všetko
          </button>
          <button type="button" className="btn-outline flex-1 py-2.5" onClick={onNecessary}>
            Len nevyhnutné
          </button>
          <button type="button" className="btn w-full py-2 text-soft underline-offset-4 hover:underline" onClick={onSettings}>
            Nastavenia
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieSettings({ open, consent, onClose, onSave }: { open: boolean; consent: Consent; onClose: () => void; onSave: (c: Consent) => void }) {
  // Start from the saved choice each time the dialog opens.
  const [draft, setDraft] = useState(consent);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(consent);
  }
  const rows: { key: "necessary" | "analytics" | "marketing"; title: string; text: string }[] = [
    { key: "necessary", title: "Nevyhnutné", text: "Rezervácie, prihlásenie a nastavenia webu. Bez nich web nefunguje." },
    { key: "analytics", title: "Analytické", text: "Anonymná štatistika návštevnosti, aby sme vedeli web zlepšovať." },
    { key: "marketing", title: "Marketingové", text: "Meranie kampaní na Instagrame a Facebooku." },
  ];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nastavenia cookies"
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-outline flex-1" onClick={() => onSave({ ...draft, decided: true })}>
            Uložiť výber
          </button>
          <button type="button" className="btn-primary flex-1" onClick={() => onSave({ decided: true, analytics: true, marketing: true })}>
            Prijať všetko
          </button>
        </div>
      }
    >
      <ul className="divide-y divide-line px-6">
        {rows.map((row) => {
          const checked = row.key === "necessary" ? true : draft[row.key];
          return (
            <li key={row.key} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-medium text-ink">{row.title}</p>
                <p className="mt-1 text-sm text-soft">{row.text}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={row.title}
                disabled={row.key === "necessary"}
                onClick={() => {
                  const key = row.key;
                  if (key !== "necessary") setDraft((d) => ({ ...d, [key]: !d[key] }));
                }}
                className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? "bg-plum" : "bg-line"}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-paper shadow transition-[left] ${checked ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

/** Bottom bar with the services picked so far, so the client can carry on browsing and book when ready. */
function VisitTray() {
  const db = useDB();
  const { items, clear } = useVisit();
  const { pathname } = useLocation();
  if (!items.length || pathname.startsWith("/rezervacia") || pathname.startsWith("/admin")) return null;
  const minutes = items.reduce((s, i) => s + durationOf(i.serviceId, i.variantId, db.serviceOverrides), 0);
  const from = items.reduce((s, i) => s + priceRange(i.serviceId, i.variantId, db.serviceOverrides).min, 0);
  return (
    <div className="no-print fixed inset-x-3 bottom-3 z-40 animate-rise sm:inset-x-auto sm:left-1/2 sm:w-[min(36rem,calc(100vw-2rem))] sm:-translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full bg-plum py-2 pl-5 pr-2 text-ivory shadow-2xl ring-1 ring-ivory/10">
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-medium">
            {items.length} {plural(items.length, ["služba", "služby", "služieb"])} · {durationLabel(minutes)}
          </p>
          <p className="text-xs text-ivory/60">od {formatEuro(from)}</p>
        </div>
        <button type="button" onClick={clear} className="hidden rounded-full px-3 py-2 text-xs text-ivory/60 hover:text-ivory sm:block">
          Zrušiť výber
        </button>
        <Link to="/rezervacia" className="btn-gold px-5 py-2.5">
          <Calendar size={16} /> Vybrať termín
        </Link>
      </div>
    </div>
  );
}

/** Floating pitch for prospects: what this is, what to try, and how to get one. */
function DemoBadge() {
  const db = useDB();
  const { pathname } = useLocation();
  const { items } = useVisit();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = usePersistentState("aurelia-demo-intro", false);

  // Introduce the demo once, a moment after the first visit.
  useEffect(() => {
    if (seen) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      setSeen(true);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [seen, setSeen]);

  const own = db.appointments.filter((a) => !a.generated && !a.id.startsWith("seed"));
  const tasks = [
    { to: "/rezervacia", label: "Rezervujte si termín online", done: own.some((a) => a.source === "web") },
    { to: "/ucet", label: "Prihláste sa a pozrite si vernostné body", done: db.sessionAccountId !== null },
    { to: "/ucet?karta=terminy", label: "Presuňte alebo zrušte termín", done: db.appointments.some((a) => a.log.some((l) => /Presunuté|Zrušené klientkou/.test(l.text))) },
    { to: "/admin", label: "Pozrite sa do administrácie salónu", done: db.adminVisited },
  ];
  const done = tasks.filter((t) => t.done).length;
  const trayVisible = items.length > 0 && !pathname.startsWith("/rezervacia") && !pathname.startsWith("/admin");
  const raised = trayVisible ? "bottom-24" : pathname === "/rezervacia" ? "bottom-24 lg:bottom-5" : "bottom-4 sm:bottom-5";
  // In the admin the sidebar owns the bottom-left corner.
  const side = pathname.startsWith("/admin") ? "right-3 sm:right-5" : "left-3 sm:left-5";
  const mailto = `mailto:${STUDIO.email}?subject=${encodeURIComponent("Chcem web ako Aurelia")}&body=${encodeURIComponent(
    "Dobrý deň,\n\nvidel(a) som ukážkový web salónu Aurelia a zaujíma ma podobný web pre náš salón.\n\nNázov salónu:\nMesto:\nTelefón:\n",
  )}`;

  return (
    <div className={`no-print fixed z-50 ${side} ${raised}`}>
      {open ? (
        <div className="max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-1.5rem))] animate-pop overflow-y-auto rounded-[1.6rem] bg-night text-ivory shadow-2xl ring-1 ring-ivory/10" role="dialog" aria-label="O tejto ukážke">
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <p className="eyebrow flex items-center gap-2 text-gold-soft">
              <Sparkles size={14} /> Ukážkový web
            </p>
            <button type="button" onClick={() => setOpen(false)} className="-mr-1 -mt-1 rounded-full p-1.5 text-ivory/50 hover:bg-ivory/10 hover:text-ivory" aria-label="Zavrieť">
              <X size={18} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <p className="mt-2 font-display text-[1.65rem] font-medium leading-tight">Takto môže vyzerať web aj vášho salónu.</p>
            <p className="mt-2 text-[13.5px] font-light leading-relaxed text-ivory/65">
              {SALON.name} je fiktívny salón. Všetko na webe funguje, len platby sú simulované a nikam sa neposielajú e-maily ani SMS.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-ivory/50">
              <span>Vyskúšajte si</span>
              <span className="tabular-nums">
                {done}/{tasks.length}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ivory/10">
              <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${(done / tasks.length) * 100}%` }} />
            </div>
            <ul className="mt-3 space-y-1">
              {tasks.map((t) => (
                <li key={t.to}>
                  <Link to={t.to} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-ivory/5">
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${t.done ? "border-gold bg-gold text-night" : "border-ivory/25"}`}>
                      {t.done && <Check size={12} strokeWidth={2.5} />}
                    </span>
                    <span className={t.done ? "text-ivory/50 line-through decoration-ivory/30" : "text-ivory/90"}>{t.label}</span>
                    <ArrowRight size={14} className="ml-auto text-ivory/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ivory/70" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl bg-ivory/5 px-3 py-2 text-xs leading-relaxed text-ivory/55">
              Ukážkový účet: <strong className="text-ivory/80">{DEMO_ACCOUNT.email}</strong>, heslo <strong className="text-ivory/80">{DEMO_ACCOUNT.password}</strong>. Kód odporúčania{" "}
              <strong className="text-ivory/80">ZUZANA10</strong> dá novej klientke 10 € zľavu.
            </p>
            <a href={mailto} className="btn-gold mt-4 w-full">
              <Mail size={17} /> Chcem takýto web
            </a>
            <div className="mt-3 flex items-center justify-between text-xs text-ivory/45">
              <span>
                Navrhol a naprogramoval{" "}
                {STUDIO.url ? (
                  <a href={STUDIO.url} className="text-ivory/75 hover:text-ivory" target="_blank" rel="noreferrer">
                    {STUDIO.author}
                  </a>
                ) : (
                  <span className="text-ivory/75">{STUDIO.author}</span>
                )}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-ivory"
                onClick={() => {
                  resetDemo();
                  toast("Ukážkové dáta sú obnovené.", "info");
                }}
              >
                <Refresh size={13} /> Obnoviť
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-full bg-night py-2 pl-2 pr-4 text-[13px] text-ivory shadow-xl ring-1 ring-ivory/10 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid size-7 place-items-center rounded-full bg-gold text-night">
            <Sparkles size={15} />
          </span>
          <span className="font-medium">Ukážka</span>
          <span className="hidden text-ivory/50 sm:inline">· {STUDIO.name}</span>
          {done > 0 && (
            <span className="ml-1 rounded-full bg-ivory/10 px-1.5 text-[11px] tabular-nums text-ivory/70">
              {done}/{tasks.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
