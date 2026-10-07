import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { observeReveal, useInView, useReducedMotion } from "../hooks";
import { ArrowRightIcon } from "./icons";

export function ArrowLink({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={`group/arrow inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.03] py-2.5 pl-5 pr-4 text-sm text-neutral-200 transition-colors hover:border-white/30 hover:bg-white/[0.07] hover:text-white ${className}`}
    >
      {children}
      <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover/arrow:translate-x-1" />
    </Link>
  );
}

export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    return el ? observeReveal(el) : undefined;
  }, []);
  const Tag = as;
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Card with a cursor-following glow and border highlight. Direct children should sit above the glow (relative z-10). */
export function SpotlightCard({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return createElement(
    as,
    { onPointerMove: onMove, className: `spotlight ${className}` },
    <div className="relative z-10 h-full">{children}</div>,
  );
}

/** Subtle 3D tilt that follows the pointer. */
export function Tilt({
  children,
  max = 6,
  className = "",
}: {
  children: ReactNode;
  max?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reduced || e.pointerType === "touch") return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = (clientX - r.left) / r.width - 0.5;
      const y = (clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(raf.current);
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}

export function Counter({ to, suffix = "", duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to, duration]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

export function SectionHeading({
  index,
  label,
  title,
  children,
  align = "left",
}: {
  index?: string;
  label: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  // One reveal for the whole heading group: three separate transitions per heading made every section start three animations.
  return (
    <Reveal className={`flex flex-col gap-6 ${align === "center" ? "items-center text-center" : ""}`}>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-dim">
        {index && (
          <>
            <span className="text-white/80">{index}</span>
            <span className="mx-2.5 text-white/20">/</span>
          </>
        )}
        {label}
      </p>
      <h2 className="-mb-[0.24em] text-balance pb-[0.24em] font-display text-[clamp(1.8rem,4.2vw,3.4rem)] leading-[1.12] tracking-[-0.03em] text-silver">
        {title}
      </h2>
      {children && <p className="max-w-xl text-lg leading-relaxed text-muted">{children}</p>}
    </Reveal>
  );
}

