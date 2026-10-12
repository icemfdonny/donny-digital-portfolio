import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { RESTAURANT, STUDIO } from "../../config";
import { usePersistentState } from "../../lib/hooks";
import { resetDemo, useDB } from "../../lib/store";
import { ArrowRight, Check, Mail, Refresh, Sparkles, X } from "../icons";
import { useToast } from "../toast";
import { Dialog } from "../ui";

type Consent = { decided: boolean; analytics: boolean; marketing: boolean };

/**
 * Cookie consent (Slovak sites need one) and the demo badge. They share a corner, so they are laid out together:
 * the badge waits until the visitor has dealt with the cookie banner.
 */
export default function Overlays() {
  const [consent, setConsent] = usePersistentState<Consent>("lipa-consent", { decided: false, analytics: false, marketing: false });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener("lipa:cookies", open);
    return () => window.removeEventListener("lipa:cookies", open);
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
      {consent.decided && <DemoBadge />}
    </>
  );
}

function CookieBanner({ onAccept, onNecessary, onSettings }: { onAccept: () => void; onNecessary: () => void; onSettings: () => void }) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 animate-rise sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-md" role="region" aria-label="Súhlas s cookies">
      <div className="rounded-3xl border border-line bg-paper p-5 shadow-2xl sm:p-6">
        <p className="font-display text-xl text-forest">Koláčiky? Len tie domáce.</p>
        <p className="mt-2 text-sm leading-relaxed text-soft">
          Nevyhnutné cookies potrebujeme na rezervácie a košík. S vaším súhlasom použijeme aj analytické, aby sme vedeli, čo na webe funguje.{" "}
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
    { key: "necessary", title: "Nevyhnutné", text: "Košík, rezervácie a nastavenia webu. Bez nich web nefunguje." },
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
                className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? "bg-forest" : "bg-line"}`}
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

/** Floating pitch for prospects: what this is, what to try, and how to get one. */
function DemoBadge() {
  const db = useDB();
  const { pathname } = useLocation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = usePersistentState("lipa-demo-intro", false);

  // Introduce the demo once, a moment after the first visit.
  useEffect(() => {
    if (seen) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      setSeen(true);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [seen, setSeen]);

  const tasks = [
    { to: "/rezervacia", label: "Rezervujte si stôl", done: db.reservations.some((r) => r.source === "web") },
    { to: "/objednavka", label: "Objednajte jedlo a sledujte ho naživo", done: db.orders.length > 0 },
    { to: "/poukazky", label: "Kúpte darčekovú poukážku", done: db.vouchers.some((v) => !v.code.startsWith("LIPA-DEMO")) },
    { to: "/admin", label: "Pozrite sa do administrácie", done: db.adminVisited },
  ];
  const done = tasks.filter((t) => t.done).length;
  const raised = pathname === "/objednavka" ? "bottom-24 lg:bottom-5" : "bottom-4 sm:bottom-5";
  // In the admin the sidebar owns the bottom-left corner.
  const side = pathname.startsWith("/admin") ? "right-3 sm:right-5" : "left-3 sm:left-5";
  const mailto = `mailto:${STUDIO.email}?subject=${encodeURIComponent("Chcem web ako Lipa")}&body=${encodeURIComponent(
    "Dobrý deň,\n\nvidel(a) som ukážkový web reštaurácie Lipa a zaujíma ma podobný web pre náš podnik.\n\nNázov podniku:\nMesto:\nTelefón:\n",
  )}`;

  return (
    <div className={`no-print fixed z-50 ${side} ${raised}`}>
      {open ? (
        <div className="w-[min(22rem,calc(100vw-1.5rem))] animate-pop overflow-hidden rounded-3xl bg-night text-cream shadow-2xl ring-1 ring-cream/10" role="dialog" aria-label="O tejto ukážke">
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <p className="eyebrow flex items-center gap-2 text-honey">
              <Sparkles size={14} /> Ukážkový web
            </p>
            <button type="button" onClick={() => setOpen(false)} className="-mr-1 -mt-1 rounded-full p-1.5 text-cream/50 hover:bg-cream/10 hover:text-cream" aria-label="Zavrieť">
              <X size={18} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <p className="mt-2 font-display text-[1.45rem] leading-tight">Takto môže vyzerať web aj vašej reštaurácie.</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-cream/65">
              {RESTAURANT.name} je fiktívna reštaurácia. Všetko na webe funguje, len platby sú simulované a nikam sa neposielajú e-maily.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-cream/50">
              <span>Vyskúšajte si</span>
              <span className="tabular-nums">
                {done}/{tasks.length}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-cream/10">
              <div className="h-full rounded-full bg-honey transition-[width] duration-500" style={{ width: `${(done / tasks.length) * 100}%` }} />
            </div>
            <ul className="mt-3 space-y-1">
              {tasks.map((t) => (
                <li key={t.to}>
                  <Link to={t.to} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-cream/5">
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${t.done ? "border-honey bg-honey text-night" : "border-cream/25"}`}>
                      {t.done && <Check size={12} strokeWidth={2.5} />}
                    </span>
                    <span className={t.done ? "text-cream/50 line-through decoration-cream/30" : "text-cream/90"}>{t.label}</span>
                    <ArrowRight size={14} className="ml-auto text-cream/30 transition-transform group-hover:translate-x-0.5 group-hover:text-cream/70" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl bg-cream/5 px-3 py-2 text-xs leading-relaxed text-cream/55">
              Tip: kód <strong className="text-cream/80">LIPA10</strong> dá zľavu 10 %, poukážka <strong className="text-cream/80">LIPA-DEMO-0050</strong> má zostatok 50 €.
            </p>
            <a href={mailto} className="btn-honey mt-4 w-full">
              <Mail size={17} /> Chcem takýto web
            </a>
            <div className="mt-3 flex items-center justify-between text-xs text-cream/45">
              <span>
                Navrhol a naprogramoval{" "}
                {STUDIO.url ? (
                  <a href={STUDIO.url} className="text-cream/75 hover:text-cream" target="_blank" rel="noreferrer">
                    {STUDIO.author}
                  </a>
                ) : (
                  <span className="text-cream/75">{STUDIO.author}</span>
                )}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-cream"
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
          className="group flex items-center gap-2 rounded-full bg-night py-2 pl-2 pr-4 text-[13px] text-cream shadow-xl ring-1 ring-cream/10 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid size-7 place-items-center rounded-full bg-honey text-night">
            <Sparkles size={15} />
          </span>
          <span className="font-medium">Ukážka</span>
          <span className="hidden text-cream/50 sm:inline">· {STUDIO.name}</span>
          {done > 0 && <span className="ml-1 rounded-full bg-cream/10 px-1.5 text-[11px] tabular-nums text-cream/70">{done}/4</span>}
        </button>
      )}
    </div>
  );
}
