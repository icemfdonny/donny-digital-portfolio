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
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { PHOTOS, photoSrc, type PhotoDef, type PhotoKey } from "../data/photos";
import type { CategoryId } from "../data/services";
import { SPECIALIST_BY_ID } from "../data/team";
import { useReveal } from "../lib/hooks";
import { Brush, Droplet, Eye, Flower, Hand, Palette, Scissors, Sparkles, Star, X } from "./icons";

const loadedPhotos = new Map<string, boolean>();

/**
 * A photo slot. Shows the image from public/images when it exists, and a soft placeholder naming the slot when it
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
}: {
  name: PhotoKey;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  children?: ReactNode;
  showLabel?: boolean;
}) {
  const photo: PhotoDef = PHOTOS[name];
  const src = photoSrc(name);
  const [state, setState] = useState<"loading" | "loaded" | "missing">(() =>
    loadedPhotos.has(src) ? (loadedPhotos.get(src) ? "loaded" : "missing") : "loading",
  );
  return (
    <div className={`relative overflow-hidden ${state !== "loaded" ? "photo-fallback grain" : "bg-blush"} ${className}`}>
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
          style={photo.focus ? { objectPosition: photo.focus } : undefined}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${state === "loaded" ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      )}
      {state === "missing" && showLabel && (
        <div className="absolute inset-0 flex items-end p-4" role="img" aria-label={photo.alt}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ivory/75 backdrop-blur-sm">
            <Sparkles size={12} /> {photo.label}
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
      {eyebrow && <p className={`eyebrow mb-4 ${tone === "light" ? "text-gold-soft" : "text-gold"}`}>{eyebrow}</p>}
      <h2 className={`font-display text-[2.5rem] font-medium leading-[1.02] tracking-[-0.01em] sm:text-[3.4rem] ${tone === "light" ? "text-ivory" : "text-plum"}`}>{title}</h2>
      {text && <p className={`mt-5 text-[17px] font-light leading-relaxed ${tone === "light" ? "text-ivory/70" : "text-soft"}`}>{text}</p>}
    </Reveal>
  );
}

/** Monogram in a fine ring with the wordmark. */
export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  const color = tone === "light" ? "text-ivory" : "text-plum";
  return (
    <span className={`inline-flex items-center gap-2.5 ${color}`}>
      <Monogram className="size-9" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[27px] font-medium italic tracking-tight">Aurelia</span>
        {!compact && <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-[0.34em] opacity-60">Beauty atelier</span>}
      </span>
    </span>
  );
}

export function Monogram({ className = "", arc = true }: { className?: string; arc?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth={arc ? 1 : 0.5} opacity={arc ? 0.55 : 1} />
      {arc && <path d="M20 3.5a16.5 16.5 0 0 1 16.2 13.4" fill="none" stroke="var(--color-gold)" strokeWidth="1.6" strokeLinecap="round" />}
      <text x="20" y="27.5" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic" fontSize="22" fill="currentColor">
        A
      </text>
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
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
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
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";
  const placement =
    variant === "drawer"
      ? `m-0 ml-auto h-dvh max-h-dvh w-full ${width} rounded-none sm:rounded-l-[1.75rem]`
      : `m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${width} rounded-[1.75rem]`;
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
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <h2 id={titleId} className="font-display text-[1.75rem] font-medium leading-tight text-plum">
                {title}
              </h2>
              <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2 text-mute hover:bg-blush hover:text-ink" aria-label="Zavrieť">
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
        {required && <span className="text-gold"> *</span>}
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

export function SelectField({ label, error, hint, className = "", children, ...input }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={input.required} error={error} hint={hint} className={className}>
      <select id={id} className="field appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10" style={{ backgroundImage: SELECT_ARROW }} aria-invalid={!!error} {...input}>
        {children}
      </select>
    </FieldShell>
  );
}

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23918489' stroke-width='1.6' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export function Checkbox({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: string | null }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed text-soft">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-[18px] shrink-0 accent-plum" aria-invalid={!!error} />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1 pl-7 text-sm text-danger">{error}</p>}
    </div>
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
      <path d={cells.d} fill="#2b2226" shapeRendering="crispEdges" />
    </svg>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-gold" aria-label={`${value.toLocaleString("sk-SK")} z 5 hviezdičiek`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "" : "opacity-25"} />
      ))}
    </span>
  );
}

export function StatusDot({ tone }: { tone: "ok" | "warn" | "off" }) {
  const color = tone === "ok" ? "bg-[#5fbf86] text-[#5fbf86]" : tone === "warn" ? "bg-gold text-gold" : "bg-mute text-mute";
  return <span className={`inline-block size-2 rounded-full ${color} ${tone !== "off" ? "animate-pulse-dot" : ""}`} aria-hidden="true" />;
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
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-full bg-blush p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
            value === o.value ? "bg-paper text-plum shadow-sm" : "text-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHero({ eyebrow, title, text, photo, children }: { eyebrow: string; title: ReactNode; text?: ReactNode; photo?: PhotoKey; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-plum pb-14 pt-32 text-ivory sm:pb-20 sm:pt-40">
      {photo && (
        <>
          <Photo name={photo} priority showLabel={false} className="!absolute inset-0 opacity-45" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(59_41_48/0.95)_0%,rgb(59_41_48/0.75)_50%,rgb(59_41_48/0.35)_100%)]" />
        </>
      )}
      <Monogram arc={false} className="pointer-events-none absolute -right-24 -top-16 size-[440px] text-ivory/[0.06]" />
      <div className="container-page relative">
        <p className="eyebrow mb-4 animate-rise text-gold-soft">{eyebrow}</p>
        <h1 className="max-w-3xl animate-rise font-display text-[2.9rem] font-medium leading-[1] tracking-[-0.01em] sm:text-[4.3rem]">{title}</h1>
        {text && <p className="mt-5 max-w-2xl animate-rise text-[17px] font-light leading-relaxed text-ivory/75">{text}</p>}
        {children}
      </div>
    </section>
  );
}

const CATEGORY_ICON: Record<CategoryId, typeof Scissors> = {
  strih: Scissors,
  farba: Palette,
  nechty: Hand,
  riasy: Eye,
  plet: Droplet,
  telo: Flower,
  licenie: Brush,
};

export function CategoryIcon({ cat, size = 20, className = "" }: { cat: CategoryId; size?: number; className?: string }) {
  const Icon = CATEGORY_ICON[cat];
  return <Icon size={size} className={className} />;
}

/** Round specialist portrait; "any" shows the monogram. */
export function Avatar({ id, size = 40, className = "" }: { id: string; size?: number; className?: string }) {
  const person = SPECIALIST_BY_ID.get(id);
  if (!person)
    return (
      <span className={`grid shrink-0 place-items-center rounded-full bg-blush text-plum ${className}`} style={{ width: size, height: size }}>
        <Sparkles size={Math.round(size * 0.45)} />
      </span>
    );
  return (
    <span className={`block shrink-0 overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}>
      <Photo name={person.photo} showLabel={false} className="size-full" sizes={`${size}px`} />
    </span>
  );
}

export function Initials({ name, className = "" }: { name: string; className?: string }) {
  const letters = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return <span className={`grid shrink-0 place-items-center rounded-full bg-gold-soft font-medium text-plum ${className}`}>{letters}</span>;
}
