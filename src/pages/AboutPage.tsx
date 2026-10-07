import { PRINCIPLES, SKILLS, TOOLS } from "../data";
import { usePageMeta } from "../hooks";
import BrandCard from "../components/BrandCard";
import CtaCard from "../components/CtaCard";
import PageHeader from "../components/PageHeader";
import { ArrowLink, Reveal, SectionHeading, SpotlightCard } from "../components/ui";

const OFFER = [
  { title: "Design that feels like you", body: "Distinctive websites shaped around your brand, product, and audience." },
  { title: "Development that does it justice", body: "Responsive, polished builds with thoughtful interactions and attention to detail." },
];

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
  usePageMeta("About — Donny Digital", "Darien — freelance web designer and frontend developer based in Senec, Slovakia.");

  return (
    <>
      <PageHeader eyebrow="About" title={<>Designer and developer, in equal measure.</>} />

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-start gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <BrandCard className="lg:sticky lg:top-28" />

            <div>
              <Reveal className="max-w-2xl text-lg leading-relaxed text-muted">
                <p>
                  I&rsquo;m Darien, a freelance web designer and frontend developer working with startups and studios who want
                  their site to feel as sharp as their product. My process moves between Figma and code constantly, so nothing
                  gets lost in translation between design and build.
                </p>
              </Reveal>

              <Reveal
                delay={120}
                className="mt-12 grid divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-panel sm:grid-cols-2 sm:divide-x sm:divide-y-0"
              >
                {OFFER.map((o) => (
                  <div key={o.title} className="p-6">
                    <h3 className="text-balance font-display text-base leading-snug text-white md:text-lg">{o.title}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-muted">{o.body}</p>
                  </div>
                ))}
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
