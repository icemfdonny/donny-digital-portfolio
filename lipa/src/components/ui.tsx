import qrcode from "qrcode-generator";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { ALLERGENS, DIET_LABELS, type DietTag } from "../data/menu";
import { PHOTOS, photoSrc, type PhotoKey } from "../data/photos";
import { useReveal } from "../lib/hooks";
import { Leaf, Minus, Plus, Star, X } from "./icons";

const loadedPhotos = new Map<string, boolean>();

/**
 * A photo slot. Shows the image from public/images when it exists, and a warm placeholder naming the slot when it
 * does not, so the site looks finished before the photography is in.
 */
export function Photo({
  name,
  className = "",
  imgClassName = "",
  priority = false,
  sizes,
  children,
  showLabel = true,
  labelAt = "bottom",
}: {
  name: PhotoKey;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  children?: ReactNode;
  showLabel?: boolean;
  /** Where the placeholder names the slot; "top" for cards with text over the bottom. */
  labelAt?: "top" | "bottom";
}) {
  const photo = PHOTOS[name];
  const src = photoSrc(name);
  const [state, setState] = useState<"loading" | "loaded" | "missing">(() =>
    loadedPhotos.has(src) ? (loadedPhotos.get(src) ? "loaded" : "missing") : "loading",
  );
  return (
    <div className={`relative overflow-hidden ${state !== "loaded" ? "photo-fallback grain" : "bg-sand"} ${className}`}>
      {state !== "missing" && (
        <img
          src={src}
          alt={photo.alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => {
            loadedPhotos.set(src, true);
            setState("loaded");
          }}
          onError={() => {
            loadedPhotos.set(src, false);
            setState("missing");
          }}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${state === "loaded" ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      )}
      {state === "missing" && showLabel && (
        <div className={`absolute inset-0 flex p-4 ${labelAt === "top" ? "items-start justify-end" : "items-end"}`} role="img" aria-label={photo.alt}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium tracking-wide text-cream/75 backdrop-blur-sm">
            <Leaf size={12} /> {photo.label}
          </span>
        </div>
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
      {eyebrow && <p className={`eyebrow mb-4 ${tone === "light" ? "text-honey" : "text-moss"}`}>{eyebrow}</p>}
      <h2 className={`font-display text-[2.1rem] leading-[1.08] tracking-tight sm:text-5xl ${tone === "light" ? "text-cream" : "text-forest"}`}>{title}</h2>
      {text && <p className={`mt-5 text-[17px] leading-relaxed ${tone === "light" ? "text-cream/70" : "text-soft"}`}>{text}</p>}
    </Reveal>
  );
}

/** Linden-leaf mark with the wordmark. */
export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  const color = tone === "light" ? "text-cream" : "text-forest";
  return (
    <span className={`inline-flex items-center gap-2.5 ${color}`}>
      <LeafMark className="size-8" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[26px] font-medium italic tracking-tight">Lipa</span>
        {!compact && <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.24em] opacity-60">Kuchyňa &amp; vínny bar</span>}
      </span>
    </span>
  );
}

export function LeafMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M20 35c-1.2-3.4-2.8-5.6-6.2-7.6C8.6 24.4 5 20.7 5 15.4 5 10.2 9 6 14 6c2.6 0 4.8 1.1 6 3 1.2-1.9 3.4-3 6-3 5 0 9 4.2 9 9.4 0 5.3-3.6 9-8.8 12-3.4 2-5 4.2-6.2 7.6Z"
        fill="currentColor"
        opacity=".14"
      />
      <path
        d="M20 35c-1.2-3.4-2.8-5.6-6.2-7.6C8.6 24.4 5 20.7 5 15.4 5 10.2 9 6 14 6c2.6 0 4.8 1.1 6 3 1.2-1.9 3.4-3 6-3 5 0 9 4.2 9 9.4 0 5.3-3.6 9-8.8 12-3.4 2-5 4.2-6.2 7.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M20 35V12M20 19l-6-4M20 24l7-5M20 29l-5-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
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
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "modal" | "drawer";
  footer?: ReactNode;
  labelledBy?: string;
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
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";
  const placement =
    variant === "drawer"
      ? `m-0 ml-auto h-dvh max-h-dvh w-full ${width} rounded-none sm:rounded-l-3xl`
      : `m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${width} rounded-3xl`;
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
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
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <h2 id={titleId} className="font-display text-2xl tracking-tight text-forest">
                {title}
              </h2>
              <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2 text-mute hover:bg-sand hover:text-ink" aria-label="Zavrieť">
                <X />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="border-t border-line bg-paper px-6 py-4">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "size-8" : "size-11";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-paper" role="group" aria-label={label}>
      <button type="button" className={`${btn} grid place-items-center rounded-full text-ink hover:bg-sand disabled:opacity-30`} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Menej">
        <Minus size={size === "sm" ? 15 : 18} />
      </button>
      <output className={`min-w-8 text-center font-medium tabular-nums ${size === "sm" ? "text-sm" : "text-base"}`} aria-live="polite">
        {value}
      </output>
      <button type="button" className={`${btn} grid place-items-center rounded-full text-ink hover:bg-sand disabled:opacity-30`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Viac">
        <Plus size={size === "sm" ? 15 : 18} />
      </button>
    </div>
  );
}

function FieldShell({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-honey"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
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

export function Checkbox({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: string | null }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed text-soft">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-[18px] shrink-0 accent-forest" aria-invalid={!!error} />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1 pl-7 text-sm text-danger">{error}</p>}
    </div>
  );
}

/** Allergen numbers as on a printed Slovak menu, with full names on hover and for screen readers. */
export function Allergens({ list, className = "" }: { list: number[]; className?: string }) {
  if (!list.length) return <span className={`text-xs text-mute ${className}`}>bez alergénov</span>;
  const names = list.map((n) => ALLERGENS.find((a) => a.n === n)?.short ?? n).join(", ");
  return (
    <span className={`text-xs tabular-nums text-mute ${className}`} title={`Alergény: ${names}`}>
      <span className="sr-only">Alergény: {names}</span>
      <span aria-hidden="true">({list.join(", ")})</span>
    </span>
  );
}

const DIET_SHORT: Record<DietTag, string> = { vegetarian: "V", vegan: "VG", glutenFree: "GF", spicy: "🌶" };

export function DietBadges({ diet, className = "" }: { diet: DietTag[]; className?: string }) {
  if (!diet.length) return null;
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      {diet.map((d) => (
        <span
          key={d}
          title={DIET_LABELS[d]}
          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
            d === "spicy" ? "bg-wine/10 text-wine" : "bg-moss/12 text-moss"
          }`}
        >
          <span aria-hidden="true">{DIET_SHORT[d]}</span>
          <span className="sr-only">{DIET_LABELS[d]}</span>
        </span>
      ))}
    </span>
  );
}

export function QrCode({ value, size = 132, className = "" }: { value: string; size?: number; className?: string }) {
  const cells = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { count, d };
  }, [value]);
  return (
    <svg viewBox={`-2 -2 ${cells.count + 4} ${cells.count + 4}`} width={size} height={size} className={className} role="img" aria-label={`QR kód ${value}`}>
      <rect x="-2" y="-2" width={cells.count + 4} height={cells.count + 4} fill="#fff" />
      <path d={cells.d} fill="#1b231d" shapeRendering="crispEdges" />
    </svg>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-honey" aria-label={`${value} z 5 hviezdičiek`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "" : "opacity-25"} />
      ))}
    </span>
  );
}

export function StatusDot({ tone }: { tone: "ok" | "warn" | "off" }) {
  const color = tone === "ok" ? "bg-[#4cbf7a] text-[#4cbf7a]" : tone === "warn" ? "bg-honey text-honey" : "bg-mute text-mute";
  return <span className={`inline-block size-2 rounded-full ${color} ${tone !== "off" ? "animate-pulse-dot" : ""}`} aria-hidden="true" />;
}

/** Pill-style single choice, used for tabs and toggles. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className = "",
  tone = "light",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  label: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-full p-1 ${tone === "dark" ? "bg-white/10" : "bg-sand"} ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
            value === o.value
              ? tone === "dark"
                ? "bg-cream text-forest"
                : "bg-paper text-forest shadow-sm"
              : tone === "dark"
                ? "text-cream/70 hover:text-cream"
                : "text-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: ReactNode; text?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-forest pb-14 pt-32 text-cream sm:pb-20 sm:pt-40">
      <LeafMark className="pointer-events-none absolute -right-16 -top-10 size-[420px] text-cream/[0.04]" />
      <div className="container-page relative">
        <p className="eyebrow mb-4 text-honey animate-rise">{eyebrow}</p>
        <h1 className="max-w-3xl font-display text-[2.6rem] leading-[1.04] tracking-tight animate-rise sm:text-6xl">{title}</h1>
        {text && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-cream/70 animate-rise">{text}</p>}
        {children}
      </div>
    </section>
  );
}
