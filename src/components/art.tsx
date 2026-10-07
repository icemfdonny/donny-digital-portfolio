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
