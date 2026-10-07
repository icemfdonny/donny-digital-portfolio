import { CLIENTS, PRINCIPLES, SKILLS, TOOLS } from "../data";
import { usePageMeta } from "../hooks";
import BrandCard from "../components/BrandCard";
import CtaCard from "../components/CtaCard";
import PageHeader from "../components/PageHeader";
import { ArrowLink, Counter, Reveal, SectionHeading, SpotlightCard } from "../components/ui";

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  usePageMeta("About — Donny Digital", "Darien — freelance web designer and frontend developer based in Bratislava, Slovakia.");

  return (
    <>
      <PageHeader eyebrow="About" title={<>Designer and developer, in equal measure.</>} />

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-start gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <BrandCard className="lg:sticky lg:top-28" />

            <div>
              <Reveal className="max-w-2xl space-y-5 text-lg leading-relaxed text-muted">
                <p>
                  I&rsquo;m Darien, a freelance web designer and frontend developer working with startups and studios who want
                  their site to feel as sharp as their product. My process moves between Figma and code constantly, so nothing
                  gets lost in translation between design and build.
                </p>
                <p>
                  Over the last four years I&rsquo;ve helped teams launch marketing sites, design systems, and product interfaces
                  that hold up under real use &mdash; fast, accessible, and built to be maintained long after launch.
                </p>
              </Reveal>

              <Reveal delay={120} className="mt-12 grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-panel">
                <div className="p-5">
                  <p className="font-display text-2xl leading-none text-white md:text-[1.7rem]">
                    <Counter to={4} suffix="+" />
                  </p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Years of experience</p>
                </div>
                <div className="p-5">
                  <p className="font-display text-2xl leading-none text-white md:text-[1.7rem]">
                    <Counter to={6} />
                  </p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Core disciplines</p>
                </div>
                <div className="p-5">
                  <p className="font-display text-2xl leading-none text-white md:text-[1.7rem]">
                    <Counter to={100} suffix="%" />
                  </p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Hand-crafted</p>
                </div>
              </Reveal>

              <div className="mt-12 space-y-8">
                <Reveal>
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Skills</p>
                  <Chips items={SKILLS} />
                </Reveal>
                <Reveal delay={60}>
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Tools</p>
                  <Chips items={TOOLS} />
                </Reveal>
                <Reveal delay={100} className="border-t border-white/10 pt-8">
                  <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Selected clients</p>
                  <ul className="flex flex-wrap gap-x-8 gap-y-3">
                    {CLIENTS.map((c) => (
                      <li key={c} className="font-display text-base text-neutral-500 transition-colors hover:text-white">
                        {c}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-panel py-24 md:py-32">
        <div className="dots-bg pointer-events-none absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <SectionHeading label="Principles" title={<>How I like to work</>} />
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 90} className="h-full">
                <SpotlightCard className="h-full rounded-3xl border border-white/10 bg-black p-7">
                  <p className="font-mono text-[11px] tracking-[0.2em] text-dim">0{i + 1}</p>
                  <h3 className="mt-6 font-display text-lg leading-snug text-white">{p.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{p.body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 flex flex-wrap gap-3">
            <ArrowLink to="/process">How a project runs</ArrowLink>
            <ArrowLink to="/work">See the work</ArrowLink>
          </Reveal>
        </div>
      </section>

      <CtaCard />
    </>
  );
}
