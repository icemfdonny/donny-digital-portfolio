import type { ReactNode } from "react";

export function Panel({ title, action, children, className = "" }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-paper ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
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
      <p className="text-sm font-medium text-soft">{label}</p>
      <p className="display mt-2 text-[2rem] leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-xs text-mute">
        {delta && <span className={`mr-1.5 font-bold ${deltaGood ? "text-ok" : "text-danger"}`}>{delta}</span>}
        {hint}
      </p>
    </div>
  );
}

export function PageTitle({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-[1.9rem] leading-tight sm:text-[2.3rem]">{title}</h1>
        {text && <p className="mt-1 text-soft">{text}</p>}
      </div>
      {action}
    </div>
  );
}
