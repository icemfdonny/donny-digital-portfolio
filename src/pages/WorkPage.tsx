import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { PROJECTS, PROJECT_GROUPS, type Project } from "../data";
import { usePageMeta } from "../hooks";
import { ProjectArt } from "../components/art";
import CtaCard from "../components/CtaCard";
import { ArrowUpRightIcon } from "../components/icons";
import PageHeader from "../components/PageHeader";
import ProjectCard from "../components/ProjectCard";
import { Reveal } from "../components/ui";

type View = "grid" | "index";

function spansFor(n: number): string[] {
  if (n === 1) return ["md:col-span-6"];
  if (n === 2) return ["md:col-span-3", "md:col-span-3"];
  if (n === 3) return ["md:col-span-4", "md:col-span-2", "md:col-span-6"];
  const cycle = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4"];
  return Array.from({ length: n }, (_, i) => cycle[i % 4]);
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/** Editorial index: big rows, with a live art preview that follows the cursor. */
function IndexList({ projects }: { projects: Project[] }) {
  const [hover, setHover] = useState<string | null>(null);

  const onMove = (e: MouseEvent<HTMLUListElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--py", `${e.clientY - r.top}px`);
  };

  return (
    <ul className="relative border-t border-white/10" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      {projects.map((p) => (
        <li key={p.slug} className="border-b border-white/10">
          <Link
            to={`/work/${p.slug}`}
            onMouseEnter={() => setHover(p.slug)}
            onFocus={() => setHover(p.slug)}
            className={`group/row grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-1 px-2 py-7 transition-all duration-500 md:grid-cols-[4rem_1fr_16rem_5rem_3rem] md:gap-x-6 md:py-9 ${
              hover && hover !== p.slug ? "opacity-35" : "opacity-100"
            }`}
          >
            <span className="font-mono text-xs text-dim">{p.index}</span>
            <span className="font-display text-2xl text-white transition-transform duration-500 group-hover/row:translate-x-3 md:text-4xl">{p.title}</span>
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-dim md:block">{p.category}</span>
            <span className="hidden font-mono text-xs text-neutral-400 md:block">{p.year}</span>
            <span className="grid size-10 place-items-center justify-self-end rounded-full border border-white/15 text-white transition-all duration-300 group-hover/row:border-white group-hover/row:bg-white group-hover/row:text-black">
              <ArrowUpRightIcon className="size-4" />
            </span>
          </Link>
        </li>
      ))}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute z-10 hidden h-[210px] w-[280px] overflow-hidden rounded-2xl border border-white/15 bg-panel shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] transition-opacity duration-300 lg:block ${
          hover ? "opacity-100" : "opacity-0"
        }`}
        style={{ left: "calc(var(--px, 50%) + 28px)", top: "var(--py, 50%)", transform: "translateY(-50%)" }}
      >
        {hover && (
          <div key={hover} className="absolute left-1/2 top-1/2 h-[320px] w-[400px] -translate-x-1/2 -translate-y-1/2 scale-[0.7] animate-[fade-up_0.4s_both]">
            <ProjectArt slug={hover} />
          </div>
        )}
      </div>
    </ul>
  );
}

export default function WorkPage() {
  usePageMeta("Work — Donny Digital", "Selected web design, brand and creative-coding projects by Donny Digital.");
  const [filter, setFilter] = useState<(typeof PROJECT_GROUPS)[number]>("All");
  const [view, setView] = useState<View>("grid");

  const shown = PROJECTS.filter((p) => filter === "All" || p.group === filter);
  const spans = spansFor(shown.length);

  return (
    <>
      <PageHeader eyebrow="Work / Portfolio" title={<>Selected work</>}>
        A handful of recent projects spanning product design, brand sites, and experimental front-end work.
      </PageHeader>

      <section className="relative pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
              {PROJECT_GROUPS.map((g) => {
                const count = g === "All" ? PROJECTS.length : PROJECTS.filter((p) => p.group === g).length;
                return (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={filter === g}
                    onClick={() => setFilter(g)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                      filter === g
                        ? "border-white bg-white text-black"
                        : "border-white/12 bg-white/[0.03] text-neutral-300 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {g}
                    <span className={`font-mono text-[10px] ${filter === g ? "text-black/50" : "text-dim"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div role="group" aria-label="Change layout" className="inline-flex rounded-full border border-white/12 bg-white/[0.03] p-1 self-start sm:self-auto">
              {(
                [
                  ["grid", "Grid", <GridIcon key="g" />],
                  ["index", "Index", <ListIcon key="l" />],
                ] as const
              ).map(([v, label, icon]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
                    view === v ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </Reveal>

          <div key={`${filter}-${view}`} className="mt-10 animate-[fade-up_0.6s_both]">
            {view === "grid" ? (
              <div className="grid gap-4 md:grid-cols-6">
                {shown.map((p, i) => (
                  <ProjectCard key={p.slug} project={p} span={spans[i]} delay={(i % 2) * 80} />
                ))}
              </div>
            ) : (
              <IndexList projects={shown} />
            )}
          </div>
        </div>
      </section>

      <CtaCard />
    </>
  );
}
