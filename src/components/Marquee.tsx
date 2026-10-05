const TOOLS = ["Figma", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Webflow", "Vite", "Vercel", "Git"];
const TRACK = [...TOOLS, ...TOOLS, ...TOOLS, ...TOOLS];

export default function Marquee() {
  return (
    <section aria-label="Tools and technologies" className="relative border-y border-white/10 bg-black py-7">
      <p className="sr-only">Built with {TOOLS.join(", ")}.</p>
      <div aria-hidden="true" className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
          {TRACK.map((tool, i) => (
            <span key={i} className="flex items-center font-mono text-[13px] uppercase tracking-[0.2em] text-dim">
              <span className="px-8 transition-colors hover:text-white">{tool}</span>
              <span className="text-white/20">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
