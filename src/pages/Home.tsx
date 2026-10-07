import { Link } from "react-router-dom";
import { PROJECTS, SERVICES } from "../data";
import { usePageMeta } from "../hooks";
import { ServiceVisual } from "../components/art";
import BrandCard from "../components/BrandCard";
import CtaCard from "../components/CtaCard";
import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import ProcessTimeline from "../components/ProcessTimeline";
import ProjectCard from "../components/ProjectCard";
import { ArrowLink, Reveal, SectionHeading, SpotlightCard } from "../components/ui";

function WorkTeaser() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading index="01" label="Work" title={<>Selected work</>} />
          <Reveal delay={200}>
            <ArrowLink to="/work">All work</ArrowLink>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.slug} project={p} delay={(i % 2) * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesTeaser() {
  return (
    <section className="relative border-t border-white/10 bg-panel py-28 md:py-36">
      <div className="dots-bg pointer-events-none absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000,transparent)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading index="02" label="Services" title={<>What I bring to a project</>} />
          <Reveal delay={200}>
            <ArrowLink to="/services">All services</ArrowLink>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <Reveal key={s.slug} delay={i * 90} className="h-full">
              <SpotlightCard className="group/cap h-full rounded-3xl border border-white/10 bg-black p-5">
                <div className="relative mb-8 grid h-36 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-panel">
                  <div className="dots-bg pointer-events-none absolute inset-0 opacity-30" />
                  <div className="relative">
                    <ServiceVisual slug={s.slug} />
                  </div>
                </div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-dim">{s.number}</p>
                <h3 className="mt-3 font-display text-lg leading-snug text-white">
                  <Link to={`/services#${s.slug}`} className="after:absolute after:inset-0 after:z-20 after:content-['']">
                    {s.title}
                  </Link>
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">{s.short}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutTeaser() {
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <BrandCard />
          <div>
            <SectionHeading index="03" label="About" title={<>Designer and developer, in equal measure.</>} />
            <Reveal delay={120} className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              <p>
                I&rsquo;m Darien, a freelance web designer and frontend developer working with startups and studios who want
                their site to feel as sharp as their product. My process moves between Figma and code constantly, so nothing
                gets lost in translation between design and build.
              </p>
            </Reveal>
            <Reveal delay={200} className="mt-10">
              <ArrowLink to="/about">More about me</ArrowLink>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessTeaser() {
  return (
    <section className="relative border-t border-white/10 py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading index="04" label="Process" title={<>How a project comes together</>} />
          <Reveal delay={200}>
            <ArrowLink to="/process">See the full process</ArrowLink>
          </Reveal>
        </div>
        <div className="mt-20">
          <ProcessTimeline />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta(
    "Donny Digital",
    "Donny Digital — freelance web design and frontend development studio building bold, memorable digital experiences.",
  );
  return (
    <>
      <Hero />
      <Marquee />
      <WorkTeaser />
      <ServicesTeaser />
      <AboutTeaser />
      <ProcessTeaser />
      <CtaCard />
    </>
  );
}
