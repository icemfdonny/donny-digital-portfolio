import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { STUDIO } from "../../config";
import { TRADE_LIST } from "../../data/trades";
import { usePersistentState } from "../../lib/hooks";
import { BIZ, PROFILE, TRADE, tradeSampleLink } from "../../lib/profile";
import { resetDemo, useDB, type DemoTask } from "../../lib/store";
import { ArrowRight, Check, Icon, Mail, Refresh, Sparkles, X } from "../icons";
import { useToast } from "../toast";
import { Dialog } from "../ui";

type Consent = { decided: boolean; analytics: boolean; marketing: boolean };

/**
 * Cookie consent (Slovak sites need one) and the demo badge. They share a corner, so the badge waits until the
 * visitor has dealt with the cookie banner.
 */
export default function Overlays() {
  const [consent, setConsent] = usePersistentState<Consent>("majster-consent", { decided: false, analytics: false, marketing: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pathname } = useLocation();
  const print = pathname.startsWith("/ponuka/");

  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener("majster:cookies", open);
    return () => window.removeEventListener("majster:cookies", open);
  }, []);

  return (
    <>
      {!consent.decided && !pathname.startsWith("/admin") && (
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
      {(consent.decided || pathname.startsWith("/admin")) && !print && pathname !== "/generator" && <DemoBadge />}
    </>
  );
}

function CookieBanner({ onAccept, onNecessary, onSettings }: { onAccept: () => void; onNecessary: () => void; onSettings: () => void }) {
  return (
    <div className="no-print fixed inset-x-3 bottom-20 z-50 animate-rise sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm" role="region" aria-label="Súhlas s cookies">
      <div className="rounded-2xl border border-line bg-paper p-5 shadow-2xl">
        <p className="display text-lg">Cookies, len tie potrebné</p>
        <p className="mt-1.5 text-sm leading-relaxed text-soft">
          Nevyhnutné cookies potrebujeme na objednávky a kalkulačku. S vaším súhlasom použijeme aj analytické.{" "}
          <Link to="/ochrana-sukromia" className="link font-medium">
            Viac
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-dark btn-sm flex-1" onClick={onAccept}>
            Prijať všetko
          </button>
          <button type="button" className="btn-outline btn-sm flex-1" onClick={onNecessary}>
            Len nevyhnutné
          </button>
          <button type="button" className="w-full py-1 text-sm font-medium text-soft underline-offset-4 hover:underline" onClick={onSettings}>
            Nastavenia
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieSettings({ open, consent, onClose, onSave }: { open: boolean; consent: Consent; onClose: () => void; onSave: (c: Consent) => void }) {
  const [draft, setDraft] = useState(consent);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(consent);
  }
  const rows: { key: "necessary" | "analytics" | "marketing"; title: string; text: string }[] = [
    { key: "necessary", title: "Nevyhnutné", text: "Objednávky, kalkulačka a nastavenia webu. Bez nich web nefunguje." },
    { key: "analytics", title: "Analytické", text: "Anonymná štatistika návštevnosti, aby sme vedeli web zlepšovať." },
    { key: "marketing", title: "Marketingové", text: "Meranie reklám na Facebooku a Googli." },
  ];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nastavenia cookies"
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-outline btn-sm flex-1" onClick={() => onSave({ ...draft, decided: true })}>
            Uložiť výber
          </button>
          <button type="button" className="btn-dark btn-sm flex-1" onClick={() => onSave({ decided: true, analytics: true, marketing: true })}>
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
                <p className="font-semibold text-ink">{row.title}</p>
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
                className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? "bg-ink" : "bg-line"}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full shadow transition-[left] ${checked ? "left-[22px] bg-accent" : "left-0.5 bg-paper"}`} />
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

/** Floating pitch for prospects: what this is, what to try, other trades, and how to get one. */
function DemoBadge() {
  const db = useDB();
  const { pathname } = useLocation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = usePersistentState(`majster-demo-intro:${TRADE.id}`, false);

  useEffect(() => {
    if (seen) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      setSeen(true);
    }, 3000);
    return () => window.clearTimeout(t);
  }, [seen, setSeen]);

  const tasks: { id: DemoTask; to: string; label: string }[] = [
    { id: "kalkulacka", to: "/kalkulacka", label: "Spočítajte si cenu v kalkulačke" },
    { id: "obhliadka", to: "/obhliadka", label: "Objednajte si termín obhliadky" },
    ...(TRADE.emergency ? [{ id: "havaria" as const, to: "/havaria", label: "Nahláste haváriu a sledujte technika" }] : []),
    { id: "admin", to: "/admin", label: "Pozrite sa do administrácie firmy" },
    { id: "ponuka", to: "/admin?karta=zakazky", label: "Pošlite z adminu ponuku a prijmite ju" },
  ];
  const done = tasks.filter((t) => db.progress[t.id]).length;
  const admin = pathname.startsWith("/admin");
  const raised = admin ? "bottom-4" : pathname.startsWith("/kalkulacka") ? "bottom-40 sm:bottom-5" : "bottom-24 sm:bottom-5";
  const side = admin ? "right-3 sm:right-5" : "left-3 sm:left-5";
  const mailto = `mailto:${STUDIO.email}?subject=${encodeURIComponent(`Chcem web pre ${PROFILE.personalized ? BIZ.name : `moju firmu (${TRADE.label.toLowerCase()})`}`)}&body=${encodeURIComponent(
    `Dobrý deň,\n\npozrel(a) som si ukážkový web a zaujíma ma podobný pre moju firmu.\n\nFirma: ${PROFILE.personalized ? BIZ.name : ""}\nMesto: ${PROFILE.personalized ? BIZ.city : ""}\nTelefón:\n`,
  )}`;

  return (
    <div className={`no-print fixed z-50 ${side} ${raised}`}>
      {open ? (
        <div className="max-h-[calc(100dvh-6rem)] w-[min(23rem,calc(100vw-1.5rem))] animate-pop overflow-y-auto rounded-3xl bg-night text-white shadow-2xl ring-1 ring-white/10" role="dialog" aria-label="O tejto ukážke">
          <div className="hazard h-1.5" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3 px-5 pt-4">
            <p className="eyebrow text-accent">
              <Sparkles size={14} /> Ukážkový web
            </p>
            <button type="button" onClick={() => setOpen(false)} className="-mr-1 -mt-1 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Zavrieť">
              <X size={18} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <p className="display mt-2 text-[1.5rem] leading-tight">{PROFILE.personalized ? `Takto môže vyzerať web firmy ${BIZ.name}.` : "Takto môže vyzerať web aj vašej firmy."}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">
              {PROFILE.personalized
                ? "Pripravili sme ho ako ukážku s vaším názvom a mestom. Všetko funguje naozaj, len sa nikam neposielajú e-maily ani SMS."
                : `${BIZ.name} je fiktívna firma. Všetko na webe funguje naozaj, len sa nikam neposielajú e-maily ani SMS.`}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-white/45">
              <span>Vyskúšajte si</span>
              <span className="tabular-nums">
                {done}/{tasks.length}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done / tasks.length) * 100}%` }} />
            </div>
            <ul className="mt-2.5 space-y-0.5">
              {tasks.map((t) => {
                const ok = !!db.progress[t.id];
                return (
                  <li key={t.id}>
                    <Link to={t.to} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-white/5">
                      <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${ok ? "border-accent bg-accent text-accent-ink" : "border-white/25"}`}>{ok && <Check size={12} strokeWidth={3} />}</span>
                      <span className={ok ? "text-white/45 line-through decoration-white/30" : "text-white/90"}>{t.label}</span>
                      <ArrowRight size={14} className="ml-auto text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Ten istý web pre iné remeslo</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TRADE_LIST.map((t) => (
                <a
                  key={t.id}
                  href={tradeSampleLink(t.id)}
                  aria-current={t.id === TRADE.id ? "true" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${t.id === TRADE.id ? "bg-white text-ink" : "bg-white/8 text-white/75 hover:bg-white/15 hover:text-white"}`}
                >
                  <span className="grid size-4 place-items-center rounded-full" style={{ background: t.colors.accent, color: t.colors.ink }}>
                    <Icon name={t.icon} size={10} strokeWidth={2.6} />
                  </span>
                  {t.label}
                </a>
              ))}
            </div>
            <a href={mailto} className="btn-accent mt-5 w-full">
              <Mail size={17} /> Chcem takýto web
            </a>
            <div className="mt-3 flex items-center justify-between text-xs text-white/45">
              <span>
                Navrhol a naprogramoval{" "}
                {STUDIO.url ? (
                  <a href={STUDIO.url} className="text-white/75 hover:text-white" target="_blank" rel="noreferrer">
                    {STUDIO.author}
                  </a>
                ) : (
                  <span className="text-white/75">{STUDIO.author}</span>
                )}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-white"
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
          className="group flex items-center gap-2 rounded-full bg-night py-2 pl-2 pr-4 text-[13px] text-white shadow-xl ring-1 ring-white/10 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-ink">
            <Sparkles size={15} />
          </span>
          <span className="font-semibold">Ukážka</span>
          <span className="hidden text-white/50 sm:inline">· {STUDIO.name}</span>
          {done > 0 && (
            <span className="ml-1 rounded-full bg-white/10 px-1.5 text-[11px] tabular-nums text-white/70">
              {done}/{tasks.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
