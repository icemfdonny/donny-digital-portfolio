import type { ReactNode } from "react";

export function Panel({ title, action, children, className = "" }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-paper ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Label, value, optional signed delta against a named period. */
export function StatTile({ label, value, delta, deltaGood, hint }: { label: string; value: string; delta?: string; deltaGood?: boolean; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="text-sm text-soft">{label}</p>
      <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-xs text-mute">
        {delta && <span className={`mr-1.5 font-semibold ${deltaGood ? "text-ok" : "text-danger"}`}>{delta}</span>}
        {hint}
      </p>
    </div>
  );
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "off" | "bad" | "info"; children: ReactNode }) {
  const tones = {
    ok: "bg-[#4cbf7a]/15 text-ok",
    warn: "bg-honey-soft text-forest",
    off: "bg-sand text-soft",
    bad: "bg-danger/10 text-danger",
    info: "bg-moss/12 text-moss",
  };
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-forest" : "bg-line"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-paper shadow transition-[left] ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
