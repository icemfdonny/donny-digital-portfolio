import { Link, useParams } from "react-router-dom";
import { PROJECTS, STEPS } from "../data";
import { usePageMeta } from "../hooks";
import CtaCard from "../components/CtaCard";
import { BrowserFrame, PhoneFrame } from "../components/Frames";
import { ArrowUpRightIcon, CheckIcon } from "../components/icons";
import PageHeader from "../components/PageHeader";
import { ArrowLink, Reveal } from "../components/ui";
import NotFound from "./NotFound";

export default function ProjectPage() {
  const { slug } = useParams();
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  const project = PROJECTS[i];
  usePageMeta(project ? `${project.title} — Donny Digital` : "Not found — Donny Digital", project?.summary);

  if (!project) return <NotFound />;
  const next = PROJECTS[(i + 1) % PROJECTS.length];

  const meta: [string, string][] = [
    ["Year", project.year],
    ["Type", project.concept ? `${project.category} · concept project` : project.category],
    ["Services", project.services.join(", ")],
    ["Stack", project.stack.join(", ")],
  ];

  return (
    <>
      <PageHeader eyebrow={`${project.index} / ${project.category}`} title={<>{project.title}</>} back={{ to: "/work", label: "All work" }}>
        {project.summary}
      </PageHeader>

      <section className="px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <BrowserFrame src={project.cover} alt={project.coverAlt} label={project.url ? new URL(project.url).host : project.title} priority />
          </Reveal>
        </div>
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
              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer" className="btn-primary mt-10 px-7 py-3.5 text-sm">
                  Visit live site
                  <ArrowUpRightIcon className="size-4" />
                </a>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-dim">Selected screens</p>
            <h2 className="mt-5 font-display text-2xl leading-snug text-white md:text-3xl">Beyond the homepage</h2>
          </Reveal>

          <div className="mt-12 grid gap-x-5 gap-y-12 md:grid-cols-2">
            {project.shots.map((s, n) => (
              <Reveal key={s.src} className={n === 0 ? "md:col-span-2" : ""}>
                <BrowserFrame src={s.src} alt={s.alt} label={project.title} />
                <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-dim">{s.caption}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-24 grid items-center gap-12 md:grid-cols-[1fr_0.6fr] md:gap-20">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-dim">On a phone</p>
              <h2 className="mt-5 font-display text-2xl leading-snug text-white md:text-3xl">Built for every screen</h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
                The layout reflows all the way down to phone size: type, spacing and navigation all adapt to the screen.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <PhoneFrame shot={project.mobile} />
              <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-widest text-dim">{project.mobile.caption}</p>
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
            <img
              src={next.cover}
              alt=""
              width={1600}
              height={1000}
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute right-24 top-1/2 hidden h-[200px] w-[320px] -translate-y-1/2 rounded-xl border border-white/10 object-cover object-top opacity-50 transition-opacity duration-500 group-hover:opacity-100 lg:block"
            />
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
