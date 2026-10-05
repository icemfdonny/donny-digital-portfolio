import { SERVICES } from "../data";
import { usePageMeta } from "../hooks";
import { ServiceVisual } from "../components/art";
import CtaCard from "../components/CtaCard";
import { CheckIcon } from "../components/icons";
import PageHeader from "../components/PageHeader";
import { ArrowLink, Reveal, SpotlightCard } from "../components/ui";

export default function ServicesPage() {
  usePageMeta("Services — Donny Digital", "Product design, frontend development, creative direction and design systems.");

  return (
    <>
      <PageHeader eyebrow="Services" title={<>Design and build, under one roof.</>}>
        Four disciplines that work best together &mdash; so what gets designed is exactly what gets shipped.
      </PageHeader>

      <section className="pb-12 md:pb-20">
        <div className="mx-auto max-w-6xl space-y-6 px-6">
          {SERVICES.map((s, i) => (
            <div key={s.slug} id={s.slug} className="scroll-mt-28">
            <Reveal>
              <SpotlightCard as="section" className="group/cap overflow-hidden rounded-3xl border border-white/10 bg-panel">
                <div className={`grid items-stretch md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                  <div className="relative grid min-h-[260px] place-items-center overflow-hidden border-b border-white/10 bg-black md:min-h-[380px] md:border-b-0 md:border-r">
                    <div className="dots-bg absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_85%)]" />
                    <div className="relative origin-center scale-[1.5] md:scale-[1.9]">
                      <ServiceVisual slug={s.slug} />
                    </div>
                    <span className="absolute left-6 top-6 font-mono text-[11px] tracking-[0.2em] text-white/40">{s.number}</span>
                  </div>

                  <div className="flex flex-col justify-center p-8 md:p-12">
                    <h2 className="font-display text-2xl leading-snug text-white md:text-3xl">{s.title}</h2>
                    <p className="mt-5 leading-relaxed text-muted">{s.long}</p>
                    <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">What&rsquo;s included</p>
                    <ul className="mt-4 space-y-3">
                      {s.includes.map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-neutral-200">
                          <CheckIcon className="size-3.5 shrink-0 text-white" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
            </div>
          ))}
        </div>

        <Reveal className="mx-auto mt-14 flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6">
          <ArrowLink to="/work">See it in action</ArrowLink>
          <ArrowLink to="/process">How a project runs</ArrowLink>
        </Reveal>
      </section>

      <CtaCard />
    </>
  );
}
