import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useInView, useReducedMotion } from "../hooks";
import { CheckIcon } from "./icons";
import { LogoMark } from "./Logo";

type Kind = "kw" | "str" | "tag" | "prop" | "fn" | "txt" | "pun";
type Tok = [string, Kind];
type Block = "nav" | "hero" | "work" | "contact";
type CodeLine = { toks: Tok[]; reveals?: Block };

const KIND: Record<Kind, string> = {
  kw: "text-white font-medium",
  str: "text-neutral-300",
  tag: "text-white",
  prop: "text-neutral-500",
  fn: "text-neutral-200",
  txt: "text-neutral-400",
  pun: "text-neutral-600",
};

const LINES: CodeLine[] = [
  { toks: [["import", "kw"], [" { Site } ", "txt"], ["from", "kw"], [' "@donny/ui"', "str"]] },
  { toks: [] },
  { toks: [["export default function", "kw"], [" Home", "fn"], ["() {", "pun"]] },
  { toks: [["  return", "kw"], [" (", "pun"]] },
  { toks: [["    <", "pun"], ["Site", "tag"], [" theme", "prop"], ["=", "pun"], ['"mono"', "str"], [">", "pun"]] },
  { toks: [["      <", "pun"], ["Nav", "tag"], [" />", "pun"]], reveals: "nav" },
  { toks: [["      <", "pun"], ["Hero", "tag"], [" title", "prop"], ["=", "pun"], ['"Digital experiences."', "str"], [" />", "pun"]], reveals: "hero" },
  { toks: [["      <", "pun"], ["Work", "tag"], [" projects", "prop"], ["={", "pun"], ["4", "fn"], ["} />", "pun"]], reveals: "work" },
  { toks: [["      <", "pun"], ["Contact", "tag"], [" />", "pun"]], reveals: "contact" },
  { toks: [["    </", "pun"], ["Site", "tag"], [">", "pun"]] },
  { toks: [["  )", "pun"]] },
  { toks: [["}", "pun"]] },
];

const lineText = (l: CodeLine) => l.toks.map(([t]) => t).join("");
const LENS = LINES.map((l) => lineText(l).length);
const STARTS = LENS.map((_, i) => LENS.slice(0, i).reduce((a, n) => a + n + 1, 0));
const FULL = LINES.map(lineText).join("\n");
const TOTAL = FULL.length;
const TOKEN_STARTS = LINES.map((l) => {
  let at = 0;
  return l.toks.map(([t]) => {
    const start = at;
    at += t.length;
    return start;
  });
});
const REVEAL_AT = (block: Block) => {
  const i = LINES.findIndex((l) => l.reveals === block);
  return STARTS[i] + LENS[i];
};

const STEPS = ["Compile", "Optimize", "Deploy"];
const LOGS = ["writing Home.tsx", "▸ compiling", "▸ optimizing assets", "▸ deploying to the edge", "✓ live — donny-digital.com"];

/* ---------- Code pane (only the active line re-renders while typing) ---------- */

const CodeLineView = memo(function CodeLineView({ index, shown, cursor }: { index: number; shown: number; cursor: boolean }) {
  if (shown < 0) return null;
  return (
    <div className="flex whitespace-pre">
      <span className="w-7 shrink-0 select-none pr-3 text-right text-white/20">{index + 1}</span>
      <span>
        {LINES[index].toks.map(([text, kind], k) => {
          const visible = shown - TOKEN_STARTS[index][k];
          if (visible <= 0) return null;
          return (
            <span key={k} className={KIND[kind]}>
              {visible >= text.length ? text : text.slice(0, visible)}
            </span>
          );
        })}
        {cursor && <span className="ml-px inline-block h-[14px] w-[7px] translate-y-[2px] animate-blink bg-white" />}
      </span>
    </div>
  );
});

function CodePane({ typed }: { typed: number }) {
  const active = Math.max(0, STARTS.findLastIndex((s) => s <= typed));
  return (
    <div className="border-white/10 md:border-r">
      <div className="flex border-b border-white/10 font-mono text-[11px]">
        <span className="border-b border-white px-4 py-2 text-white">Home.tsx</span>
        <span className="px-4 py-2 text-dim">tokens.css</span>
      </div>
      <pre className="min-h-[296px] overflow-hidden px-3 py-4 font-mono text-[10.5px] leading-[22px] sm:text-xs sm:leading-[22px]">
        {LINES.map((_, i) => (
          <CodeLineView
            key={i}
            index={i}
            shown={typed < STARTS[i] ? -1 : Math.min(LENS[i], typed - STARTS[i])}
            cursor={i === active}
          />
        ))}
      </pre>
    </div>
  );
}

/* ---------- Live preview (re-renders only when a block is revealed) ---------- */

function PreviewBlock({ show, className = "", children }: { show: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute inset-0 rounded-md border border-dashed border-white/10 transition-opacity duration-500 ${
          show ? "opacity-0" : "animate-pulse-soft"
        }`}
      />
      <div
        className={`h-full transition-all duration-700 ease-out ${
          show ? "translate-y-0 opacity-100 blur-0" : "translate-y-2 opacity-0 blur-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function MiniCard({ variant }: { variant: number }) {
  return (
    <div className="relative h-full overflow-hidden rounded-md border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent">
      {variant === 0 && (
        <>
          <span className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
          <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.6)]" />
        </>
      )}
      {variant === 1 && (
        <div className="absolute inset-2 space-y-1.5">
          {[90, 60, 75, 40].map((w) => (
            <div key={w} className="h-[3px] rounded bg-white/25" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
      {variant === 2 && (
        <svg viewBox="0 0 60 40" className="absolute inset-0 h-full w-full" fill="none">
          <path d="M0 30 C 12 8, 22 36, 34 18 S 52 6, 60 14" stroke="rgba(255,255,255,.7)" strokeWidth="1.2" />
          <path d="M0 36 C 14 18, 26 40, 38 26 S 54 14, 60 22" stroke="rgba(255,255,255,.28)" strokeWidth="1" />
        </svg>
      )}
    </div>
  );
}

const Preview = memo(function Preview({
  nav,
  hero,
  work,
  contact,
  building,
}: {
  nav: boolean;
  hero: boolean;
  work: boolean;
  contact: boolean;
  building: boolean;
}) {
  return (
    <div className="relative overflow-hidden p-4">
      <div className="dots-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_80%)]" />
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-white/20" />
          <span className="flex-1 truncate rounded bg-white/5 px-2 py-0.5 text-center font-mono text-[9px] text-dim">donny-digital.com</span>
        </div>

        <div className="relative space-y-3 p-3">
          {/* First child on purpose: space-y adds margin to every non-last child, so mounting this last made the panel jump 12px. */}
          {building && <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/3 animate-scan bg-gradient-to-b from-white/12 to-transparent" />}
          <PreviewBlock show={nav} className="h-6">
            <div className="flex h-full items-center justify-between">
              <LogoMark className="h-3.5" />
              <div className="flex gap-2">
                {[0, 1, 2].map((n) => (
                  <span key={n} className="h-[3px] w-6 rounded bg-white/25" />
                ))}
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-[7px] font-medium text-black">Let&rsquo;s talk</span>
            </div>
          </PreviewBlock>

          <PreviewBlock show={hero} className="h-[136px]">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-2 rounded-full border border-white/15 px-2 py-0.5 font-mono text-[6.5px] uppercase tracking-widest text-neutral-400">
                Available for freelance work
              </span>
              <p className="font-display pb-[0.2em] text-[13px] leading-tight text-silver">Digital experiences.</p>
              <div className="mt-2 space-y-1">
                <div className="mx-auto h-[3px] w-28 rounded bg-white/25" />
                <div className="mx-auto h-[3px] w-20 rounded bg-white/15" />
              </div>
              <div className="mt-2.5 flex gap-1.5">
                <span className="rounded-full bg-white px-2.5 py-1 text-[7px] font-medium text-black">View my work</span>
                <span className="rounded-full border border-white/20 px-2.5 py-1 text-[7px] text-white">Let&rsquo;s talk</span>
              </div>
            </div>
          </PreviewBlock>

          <PreviewBlock show={work} className="h-[58px]">
            <div className="grid h-full grid-cols-3 gap-1.5">
              {[0, 1, 2].map((n) => (
                <MiniCard key={n} variant={n} />
              ))}
            </div>
          </PreviewBlock>

          <PreviewBlock show={contact} className="h-8">
            <div className="flex h-full items-center justify-between rounded-md bg-white px-3 text-[8px] font-medium text-black">
              <span>Have an idea? Let&rsquo;s make it real.</span>
              <span>→</span>
            </div>
          </PreviewBlock>

        </div>
      </div>
    </div>
  );
});

/* ---------- Status bar ---------- */

const StatusBar = memo(function StatusBar({ log, live, building, done }: { log: string; live: boolean; building: boolean; done: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/10 px-4 py-3 font-mono text-[11px]">
      <span className={live ? "text-white" : "text-dim"}>{log}</span>
      <ol className="flex items-center gap-3">
        {STEPS.map((s, i) => {
          const isDone = done > i;
          const isActive = building && done === i;
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`grid size-4 place-items-center rounded-full border transition-colors ${
                  isDone ? "border-white bg-white text-black" : isActive ? "animate-pulse-soft border-white/70" : "border-white/15"
                }`}
              >
                {isDone && <CheckIcon className="size-2.5" />}
              </span>
              <span className={isDone ? "text-white" : "text-dim"}>{s}</span>
              {i < STEPS.length - 1 && <span className="hidden h-px w-5 bg-white/15 sm:block" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
});

/* ---------- Console ---------- */

export default function HeroConsole() {
  const reduced = useReducedMotion();
  const [wrapRef, inView] = useInView<HTMLDivElement>({ once: false, threshold: 0.2 });
  const [typed, setTyped] = useState(reduced ? TOTAL : 0);
  const [done, setDone] = useState(reduced ? 3 : 0);
  const [fade, setFade] = useState(false);

  // The animation freezes while the pointer is over the console, and while the page is scrolling (the typing re-renders
  // React about 12 times a second, which competes with the scroll); it picks up where it left off.
  const hovering = useRef(false);
  const scrolling = useRef(false);
  const paused = useRef(false);
  const resumeWaiters = useRef<(() => void)[]>([]);
  const sync = useCallback(() => {
    paused.current = hovering.current || scrolling.current;
    if (!paused.current) resumeWaiters.current.splice(0).forEach((resume) => resume());
  }, []);

  useEffect(() => {
    if (reduced || !inView) return;
    let cancelled = false;
    const timers: number[] = [];
    hovering.current = wrapRef.current?.matches(":hover") ?? false;
    sync();
    let scrollTimer = 0;
    const onScroll = () => {
      scrolling.current = true;
      sync();
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scrolling.current = false;
        sync();
      }, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const wait = async (ms: number) => {
      await new Promise<void>((res) => {
        timers.push(window.setTimeout(res, ms));
      });
      if (paused.current) await new Promise<void>((res) => resumeWaiters.current.push(res));
    };

    (async () => {
      while (!cancelled) {
        setFade(false);
        setTyped(0);
        setDone(0);
        await wait(600);
        // Type in small bursts (1-3 chars per ~80ms): same pace as per-character typing, a third of the renders.
        for (let i = 0; i < TOTAL && !cancelled; ) {
          i = Math.min(TOTAL, i + 1 + Math.floor(Math.random() * 3));
          setTyped(i);
          await wait(FULL[i - 1] === "\n" ? 300 : 62 + Math.random() * 40);
        }
        for (let d = 1; d <= 3 && !cancelled; d++) {
          await wait(900);
          setDone(d);
        }
        await wait(5200);
        setFade(true);
        await wait(700);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      resumeWaiters.current = [];
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(scrollTimer);
      scrolling.current = false;
    };
  }, [inView, reduced, wrapRef, sync]);

  const typing = typed < TOTAL;
  const building = !typing && done < 3;
  const live = done === 3;
  const log = typing ? LOGS[0] : LOGS[Math.min(done + 1, 4)];

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="Animated preview of a website being written, built and deployed"
      className="relative"
      onPointerEnter={() => {
        hovering.current = true;
        sync();
      }}
      onPointerLeave={() => {
        hovering.current = false;
        sync();
      }}
    >
      <div className="pointer-events-none absolute -inset-x-16 -bottom-16 top-1/2 -z-10 rounded-full bg-white/[0.07] blur-3xl" />

      {/* Static outline: no animated border and no backdrop blur, both of which repainted the whole panel every frame. */}
      <div className="rounded-2xl bg-panel shadow-[0_40px_120px_-30px_rgba(255,255,255,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/15">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/12" />
            <span className="size-2.5 rounded-full bg-white/8" />
          </div>
          <p className="font-mono text-[11px] text-dim">donny-digital — studio</p>
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-dim">
            <span className={`size-1.5 rounded-full ${live ? "bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" : "bg-white/25"}`} />
            {live ? "live" : "draft"}
          </p>
        </div>

        <div className={`grid transition-opacity duration-500 md:grid-cols-[1.05fr_1fr] ${fade ? "opacity-0" : "opacity-100"}`}>
          <CodePane typed={typed} />
          <Preview
            nav={typed >= REVEAL_AT("nav")}
            hero={typed >= REVEAL_AT("hero")}
            work={typed >= REVEAL_AT("work")}
            contact={typed >= REVEAL_AT("contact")}
            building={building}
          />
        </div>

        <StatusBar log={log} live={live} building={building} done={done} />
      </div>
    </div>
  );
}