import { Link } from "react-router-dom";
import type { Project } from "../data";
import { ArrowUpRightIcon } from "./icons";
import { Reveal, SpotlightCard } from "./ui";

export default function ProjectCard({ project: p, span = "", delay = 0 }: { project: Project; span?: string; delay?: number }) {
  return (
    <Reveal delay={delay} className={span}>
      <SpotlightCard as="article" className="group/card h-full overflow-hidden rounded-3xl border border-white/10 bg-panel">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-black">
          <img
            src={p.cover}
            alt={p.coverAlt}
            width={1600}
            height={1000}
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-top transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
          />
          <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/65 px-3 py-1 font-mono text-[10px] tracking-widest text-neutral-300">
            {p.index}
          </span>
          <span className="absolute right-5 top-5 rounded-full border border-white/15 bg-black/65 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
            {p.year}
          </span>
          <span className="absolute bottom-5 right-5 grid size-11 translate-y-2 place-items-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <ArrowUpRightIcon className="size-5" />
          </span>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h3 className="font-display text-2xl text-white md:text-3xl">
              <Link to={`/work/${p.slug}`} className="after:absolute after:inset-0 after:z-20 after:content-['']">
                {p.title}
              </Link>
            </h3>
            <span className="font-mono text-[11px] uppercase tracking-widest text-dim">{p.category}</span>
          </div>
          <p className="mt-4 max-w-md leading-relaxed text-muted">{p.summary}</p>
        </div>
      </SpotlightCard>
    </Reveal>
  );
}
