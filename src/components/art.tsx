function OrbitArt() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      {[110, 190, 270].map((d, i) => (
        <div key={d} className="absolute rounded-full border border-white/15" style={{ width: d, height: d }}>
          <div className={`absolute inset-0 ${i % 2 ? "animate-orbit-rev" : "animate-orbit"}`} style={{ animationDuration: `${14 + i * 8}s` }}>
            <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_14px_3px_rgba(255,255,255,0.7)]" />
          </div>
        </div>
      ))}
      <div className="size-10 rounded-full bg-white shadow-[0_0_70px_14px_rgba(255,255,255,0.4)]" />
    </div>
  );
}

function NotesArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-6 px-6">
      <span className="font-display pb-[0.15em] pr-1 text-[4.25rem] leading-none text-silver">Aa</span>
      <div className="hidden w-24 space-y-2.5 sm:block">
        {[100, 82, 94, 60, 88, 70, 42].map((w, i) => (
          <div key={i} className="h-1.5 animate-pulse-soft rounded-full bg-white/25" style={{ width: `${w}%`, animationDelay: `${i * 220}ms` }} />
        ))}
      </div>
    </div>
  );
}

function NorthstarArt() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="absolute size-44 rounded-full border border-white/10" />
      <div className="absolute size-24 rounded-full border border-white/20" />
      <div className="relative size-60 animate-orbit" style={{ animationDuration: "70s" }}>
        {[0, 45, 90, 135].map((a) => (
          <span
            key={a}
            className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/55 to-transparent"
            style={{ transform: `translateX(-50%) rotate(${a}deg)` }}
          />
        ))}
      </div>
      <div className="absolute size-3 rotate-45 bg-white shadow-[0_0_30px_6px_rgba(255,255,255,0.55)]" />
    </div>
  );
}

function FluxArt() {
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          key={i}
          d={`M-10 ${70 + i * 16} C 80 ${10 + i * 22}, 140 ${210 - i * 12}, 220 ${110 + i * 6} S 360 ${30 + i * 14}, 420 ${120 + i * 10}`}
          stroke="white"
          strokeOpacity={0.12 + i * 0.07}
          strokeWidth="1.2"
          strokeDasharray="500 500"
          className="animate-dash"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>
  );
}

export function ProjectArt({ slug }: { slug: string }) {
  switch (slug) {
    case "orbit":
      return <OrbitArt />;
    case "field-notes":
      return <NotesArt />;
    case "northstar":
      return <NorthstarArt />;
    default:
      return <FluxArt />;
  }
}

/* ---------- Service visuals ---------- */

function DesignVisual() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full" fill="none" aria-hidden="true">
      <g stroke="rgba(255,255,255,0.28)" strokeWidth="1">
        <path d="M20 72 L58 14" />
        <path d="M150 62 L112 14" />
      </g>
      <path d="M20 72 C 58 14, 112 14, 150 62 S 182 84, 190 32" stroke="white" strokeWidth="1.6" strokeDasharray="500 500" className="animate-dash" />
      {[
        [20, 72],
        [150, 62],
      ].map(([x, y]) => (
        <rect key={x} x={x - 3.5} y={y - 3.5} width="7" height="7" fill="#000" stroke="white" strokeWidth="1.2" />
      ))}
      {[
        [58, 14],
        [112, 14],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.8" fill="white" />
      ))}
    </svg>
  );
}

function CodeVisual() {
  return (
    <div className="font-mono text-[12px] leading-6 text-neutral-500">
      <p>
        <span className="text-white">const</span> <span className="text-neutral-300">ship</span> = () =&gt; {"{"}
      </p>
      <p className="pl-4">
        <span className="text-neutral-300">design</span>.<span className="text-white">build</span>()
      </p>
      <p>
        {"}"}
        <span className="ml-1 inline-block h-3.5 w-[7px] translate-y-[2px] animate-blink bg-white" />
      </p>
    </div>
  );
}

function DirectionVisual() {
  return (
    <div className="relative h-20 w-36">
      {[
        "left-0 top-2 animate-float",
        "left-10 top-0 animate-float [animation-delay:-2s]",
        "left-20 top-2 animate-float [animation-delay:-4s]",
      ].map((c, i) => (
        <span key={i} className={`absolute size-[4.5rem] rounded-full border border-white/40 bg-white/[0.08] ${c}`} />
      ))}
    </div>
  );
}

function SystemVisual() {
  return (
    <div className="relative h-20 w-28">
      {[
        "left-0 top-0 group-hover/cap:-translate-x-2 group-hover/cap:-translate-y-2 border-white/20 bg-[#141414]",
        "left-3 top-3 border-white/30 bg-[#1b1b1b]",
        "left-6 top-6 group-hover/cap:translate-x-2 group-hover/cap:translate-y-2 border-white/60 bg-[#222]",
      ].map((c, i) => (
        <span key={i} className={`absolute size-14 rounded-xl border transition-transform duration-500 ${c}`} />
      ))}
    </div>
  );
}

export function ServiceVisual({ slug }: { slug: string }) {
  switch (slug) {
    case "product-design":
      return <DesignVisual />;
    case "frontend-development":
      return <CodeVisual />;
    case "creative-direction":
      return <DirectionVisual />;
    default:
      return <SystemVisual />;
  }
}
