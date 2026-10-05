import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import HeroBackdrop from "./HeroBackdrop";

export default function PageHeader({
  eyebrow,
  title,
  children,
  back,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <header className="relative isolate overflow-hidden pb-16 pt-40 md:pb-24 md:pt-52">
      <HeroBackdrop />
      <div className="mx-auto max-w-6xl px-6">
        {back && (
          <Link
            to={back.to}
            className="rise-in mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-white"
            style={{ "--d": "0ms" } as CSSProperties}
          >
            <span aria-hidden="true">&larr;</span> {back.label}
          </Link>
        )}
        <p className="rise-in font-mono text-xs uppercase tracking-[0.22em] text-dim" style={{ "--d": "60ms" } as CSSProperties}>
          {eyebrow}
        </p>
        <h1
          className="rise-in mt-6 max-w-5xl text-balance pb-[0.22em] font-display text-[clamp(2rem,5.6vw,4.6rem)] leading-[1.1] tracking-[-0.03em] text-silver"
          style={{ "--d": "140ms" } as CSSProperties}
        >
          {title}
        </h1>
        {children && (
          <p className="rise-in mt-8 max-w-xl text-lg leading-relaxed text-muted" style={{ "--d": "260ms" } as CSSProperties}>
            {children}
          </p>
        )}
      </div>
    </header>
  );
}

