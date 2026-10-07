import { Link, useParams } from "react-router-dom";
import { PROJECTS, STEPS } from "../data";
import { usePageMeta } from "../hooks";
import { ProjectArt } from "../components/art";
import CtaCard from "../components/CtaCard";
import { ArrowUpRightIcon, CheckIcon } from "../components/icons";
import PageHeader from "../components/PageHeader";
import { ArrowLink, Reveal } from "../components/ui";
import NotFound from "./NotFound";

export default function ProjectPage() {
  const { slug } = useParams();
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  const project = PROJECTS[i];
  usePageMeta(project ? `${project.title} — Donny Digital` : "Not found — Donny Digital", project?.description);

  if (!project) return <NotFound />;
  const next = PROJECTS[(i + 1) % PROJECTS.length];

  const meta: [string, string][] = [
    ["Year", project.year],
    ["Type", project.category],
    ["Role", "Design + Development"],
    ["Services", project.services.join(", ")],
  ];

  return (
    <>
      <PageHeader eyebrow={`${project.index} / ${project.category}`} title={<>{project.title}</>} back={{ to: "/work", label: "All work" }}>
        {project.description}
      </PageHeader>

      <section className="px-4 md:px-6">
        <Reveal>
          <div className="relative mx-auto h-[340px] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-[0_40px_120px_-40px_rgba(255,255,255,0.15)] md:h-[540px]">
            <div className="dots-bg absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_85%)]" />
            <div className="absolute left-1/2 top-1/2 h-[320px] w-[400px] -translate-x-1/2 -translate-y-1/2 scale-[1.2] md:scale-[1.8]">
              <ProjectArt slug={project.slug} />
            </div>
            <span className="absolute left-6 top-6 font-mono text-[11px] tracking-widest text-white/40">{project.index}</span>
            <span className="absolute right-6 top-6 rounded-full border border-white/15 bg-black/65 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
              {project.year}
            </span>
          </div>
        </Reveal>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
              {meta.map(([k, v]) => (
                <div key={k} className="bg-black p-6">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{k}</dt>
                  <dd className="mt-3 text-sm leading-relaxed text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div className="mt-20 grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-dim">Overview</p>
              <h2 className="mt-5 font-display text-2xl leading-snug text-white md:text-3xl">What this project was about</h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-lg leading-relaxed text-muted">{project.description}</p>
              <p className="mt-10 font-mono text-xs uppercase tracking-[0.22em] text-dim">What was involved</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {project.deliverables.map((d) => (
                  <li key={d} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-neutral-200">
                    <CheckIcon className="size-3.5 shrink-0 text-white" />
                    {d}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-dim">How it was built</p>
              <ol className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-lg text-white md:text-xl">
                {STEPS.map((s, n) => (
                  <li key={s.number} className="flex items-center gap-3">
                    {s.title}
                    {n < STEPS.length - 1 && <span aria-hidden="true" className="text-white/25">→</span>}
                  </li>
                ))}
              </ol>
            </div>
            <ArrowLink to="/process">See how I work</ArrowLink>
          </Reveal>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6">
        <Reveal>
          <Link
            to={`/work/${next.slug}`}
            className="group relative mx-auto flex max-w-6xl flex-col justify-between gap-10 overflow-hidden rounded-3xl border border-white/10 bg-panel p-8 transition-colors hover:border-white/25 md:flex-row md:items-end md:p-12"
          >
            <div className="pointer-events-none absolute right-24 top-1/2 hidden h-[320px] w-[400px] -translate-y-1/2 scale-[0.8] opacity-40 md:block transition-opacity duration-500 group-hover:opacity-80">
              <ProjectArt slug={next.slug} />
            </div>
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-dim">Next project</p>
              <p className="mt-4 font-display text-3xl text-white md:text-5xl">{next.title}</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-dim">{next.category}</p>
            </div>
            <span className="relative grid size-14 place-items-center rounded-full bg-white text-black transition-transform duration-300 group-hover:scale-110">
              <ArrowUpRightIcon className="size-6" />
            </span>
          </Link>
        </Reveal>
      </section>

      <CtaCard />
    </>
  );
}
