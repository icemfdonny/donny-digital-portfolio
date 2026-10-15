import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { useReveal } from "../lib/hooks";
import { BIZ, TRADE } from "../lib/profile";
import { Icon, Minus, Plus, Star, X } from "./icons";
import { useToast } from "./toast";

const loaded = new Set<string>();

/** A photo that fades in, with a dark accent-tinted placeholder while loading or when the file is missing. */
export function Photo({
  src,
  alt,
  className = "",
  imgClassName = "",
  priority = false,
  sizes,
  children,
  position,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  children?: ReactNode;
  position?: string;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "missing">(() => (loaded.has(src) ? "loaded" : "loading"));
  return (
    <div className={`relative overflow-hidden ${state !== "loaded" ? "photo-fallback" : "bg-sand"} ${className}`}>
      {state !== "missing" && (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => {
            loaded.add(src);
            setState("loaded");
          }}
          onError={() => setState("missing")}
          style={position ? { objectPosition: position } : undefined}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${state === "loaded" ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      )}
      {children}
    </div>
  );
}

export function Reveal({ children, delay = 0, className = "", as = "div" }: { children: ReactNode; delay?: number; className?: string; as?: ElementType }) {
  const ref = useReveal<HTMLElement>();
  const Tag = as;
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
  tone = "dark",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <Reveal className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && (
        <p className={`eyebrow mb-3 ${tone === "light" ? "text-accent" : "text-accent-deep"}`}>
          <span className="h-[3px] w-6 rounded-full bg-accent" />
          {eyebrow}
        </p>
      )}
      <h2 className={`display text-[2rem] leading-[1.05] sm:text-[2.6rem] ${tone === "light" ? "text-white" : "text-ink"}`}>{title}</h2>
      {text && <p className={`mt-4 text-[17px] leading-relaxed ${tone === "light" ? "text-white/70" : "text-soft"}`}>{text}</p>}
    </Reveal>
  );
}

/** Square badge with the trade icon and the business name. */
export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink shadow-[inset_0_-3px_0_rgb(0_0_0/0.15)]">
        <Icon name={TRADE.icon} size={22} strokeWidth={2.3} />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`display truncate text-[19px] ${tone === "light" ? "text-white" : "text-ink"}`}>{BIZ.name}</span>
        {!compact && <span className={`mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.12em] ${tone === "light" ? "text-white/55" : "text-mute"}`}>{TRADE.tagline}</span>}
      </span>
    </span>
  );
}

/**
 * Phone and e-mail links to the business. The sample businesses have made-up contacts, so in that case the link
 * explains itself instead of dialling a stranger.
 */
export function ContactLink({ kind, className = "", children, onClick }: { kind: "tel" | "mail"; className?: string; children: ReactNode; onClick?: () => void }) {
  const toast = useToast();
  const real = kind === "tel" ? BIZ.realPhone : false;
  const href = kind === "tel" ? BIZ.phoneHref : `mailto:${BIZ.email}`;
  const handle = (e: MouseEvent) => {
    onClick?.();
    if (real) return;
    e.preventDefault();
    toast(kind === "tel" ? "Ukážka: na skutočnom webe sa tu rovno vytočí číslo firmy." : "Ukážka: na skutočnom webe sa tu otvorí e-mail pre firmu.", "info");
  };
  return (
    <a href={href} onClick={handle} className={className}>
      {children}
    </a>
  );
}

/** Modal built on <dialog>: focus trap, Esc and the top layer come from the browser. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  size = "md",
  variant = "modal",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "modal" | "drawer";
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (!open && el.open) el.close();
    return () => {
      if (open) document.documentElement.style.overflow = "";
    };
  }, [open]);
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : size === "xl" ? "max-w-5xl" : "max-w-xl";
  const placement =
    variant === "drawer"
      ? `m-0 ml-auto h-dvh max-h-dvh w-full ${width} rounded-none sm:rounded-l-3xl`
      : `m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${width} rounded-3xl`;
  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`${placement} border-0 bg-paper p-0 text-ink shadow-2xl backdrop:bg-transparent open:flex open:animate-pop open:flex-col`}
    >
      {open && (
        <>
          {title && (
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <h2 id={titleId} className="display text-xl leading-tight sm:text-2xl">
                {title}
              </h2>
              <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2 text-mute hover:bg-sand hover:text-ink" aria-label="Zavrieť">
                <X />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="border-t border-line bg-paper px-5 py-4 sm:px-6">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

function FieldShell({ id, label, required, error, hint, className, children }: { id: string; label: string; required?: boolean; error?: string | null; hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type FieldProps = { label: string; error?: string | null; hint?: ReactNode; className?: string };

export function TextField({ label, error, hint, className = "", ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={input.required} error={error} hint={hint} className={className}>
      <input id={id} className="field" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...input} />
    </FieldShell>
  );
}

export function TextArea({ label, error, hint, className = "", ...input }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={input.required} error={error} hint={hint} className={className}>
      <textarea id={id} className="field min-h-24 resize-y" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...input} />
    </FieldShell>
  );
}

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23858a92' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export function SelectField({ label, error, hint, className = "", children, ...input }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={input.required} error={error} hint={hint} className={className}>
      <select id={id} className="field appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10" style={{ backgroundImage: SELECT_ARROW }} aria-invalid={!!error} {...input}>
        {children}
      </select>
    </FieldShell>
  );
}

export function Checkbox({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: string | null }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed text-soft">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-[18px] shrink-0 accent-[var(--color-ink)]" aria-invalid={!!error} />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1 pl-7 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-ink" : "bg-line"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full shadow transition-[left,background-color] ${checked ? "left-[22px] bg-accent" : "left-0.5 bg-paper"}`} />
    </button>
  );
}

/** Number with − / + buttons. */
export function Stepper({ value, onChange, min, max, label, step = 1 }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string; step?: number }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-paper" role="group" aria-label={label}>
      <button type="button" className="grid size-11 place-items-center rounded-l-xl text-soft hover:bg-sand disabled:opacity-30" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label="Menej">
        <Minus size={18} />
      </button>
      <output className="w-12 text-center text-lg font-bold tabular-nums">{value}</output>
      <button type="button" className="grid size-11 place-items-center rounded-r-xl text-soft hover:bg-sand disabled:opacity-30" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label="Viac">
        <Plus size={18} />
      </button>
    </div>
  );
}

/** Slider with a typed number next to it. */
export function RangeField({ value, onChange, min, max, step, unit, label }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string; label: string }) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const fill = `${((value - min) / (max - min)) * 100}%`;
  const commit = (raw: string) => {
    const n = Number(raw.replace(",", "."));
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n / step) * step)));
    setDraft(null);
  };
  return (
    <div className="flex items-center gap-4">
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="range" style={{ "--fill": fill } as CSSProperties} aria-label={label} />
      <div className="flex shrink-0 items-center rounded-xl border border-line bg-paper pr-3 focus-within:border-ink/50">
        <input
          type="text"
          inputMode="decimal"
          value={draft ?? String(Math.round(value * 100) / 100).replace(".", ",")}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
          className="w-16 bg-transparent py-2.5 pl-3 text-right text-lg font-bold tabular-nums outline-none"
          aria-label={`${label} (${unit})`}
        />
        <span className="pl-1 text-sm font-medium text-mute">{unit}</span>
      </div>
    </div>
  );
}

export function Stars({ value, size = 16, className = "" }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${value.toLocaleString("sk-SK")} z 5 hviezdičiek`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "text-[#f5b400]" : "text-line"} />
      ))}
    </span>
  );
}

export function StatusDot({ tone }: { tone: "ok" | "warn" | "off" | "danger" }) {
  const color = { ok: "bg-[#22c55e] text-[#22c55e]", warn: "bg-accent text-accent", off: "bg-mute text-mute", danger: "bg-danger text-danger" }[tone];
  return <span className={`inline-block size-2 shrink-0 rounded-full ${color} ${tone !== "off" ? "animate-pulse-ring" : ""}`} aria-hidden="true" />;
}

/** Pill-style single choice, used for tabs and toggles. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-xl bg-sand p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${value === o.value ? "bg-paper text-ink shadow-sm" : "text-soft hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Dark page header used by inner pages. */
export function PageHero({ eyebrow, title, text, children, photo }: { eyebrow: string; title: ReactNode; text?: ReactNode; children?: ReactNode; photo?: string }) {
  return (
    <section className="relative overflow-hidden bg-ink pb-12 pt-28 text-white sm:pb-16 sm:pt-36">
      {photo && (
        <>
          <Photo src={photo} alt="" priority className="!absolute inset-0 opacity-35" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(20_23_28/0.96)_0%,rgb(20_23_28/0.8)_55%,rgb(20_23_28/0.45)_100%)]" />
        </>
      )}
      <div className="grid-paper absolute inset-0 opacity-[0.12] invert" aria-hidden="true" />
      <div className="container-page relative">
        <p className="eyebrow mb-4 animate-rise text-accent">
          <span className="h-[3px] w-6 rounded-full bg-accent" />
          {eyebrow}
        </p>
        <h1 className="display max-w-3xl animate-rise text-[2.4rem] leading-[1.02] sm:text-[3.6rem]">{title}</h1>
        {text && <p className="mt-5 max-w-2xl animate-rise text-[17px] leading-relaxed text-white/70">{text}</p>}
        {children}
      </div>
    </section>
  );
}

export function Pill({ tone, children, className = "" }: { tone: "ok" | "warn" | "off" | "bad" | "info" | "accent"; children: ReactNode; className?: string }) {
  const tones = {
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    off: "bg-sand text-soft",
    bad: "bg-danger-soft text-danger",
    info: "bg-[#e8f0fe] text-[#1d4ed8]",
    accent: "bg-accent-soft text-accent-deep",
  };
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${tones[tone]} ${className}`}>{children}</span>;
}

export function Initials({ name, className = "" }: { name: string; className?: string }) {
  const letters = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return <span className={`grid shrink-0 place-items-center rounded-full bg-sand font-bold text-ink ${className}`}>{letters}</span>;
}
