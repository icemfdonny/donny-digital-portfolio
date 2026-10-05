import { usePageMeta } from "../hooks";
import CtaCard from "../components/CtaCard";
import PageHeader from "../components/PageHeader";
import ProcessTimeline from "../components/ProcessTimeline";
import { ArrowLink, Reveal } from "../components/ui";

export default function ProcessPage() {
  usePageMeta("Process — Donny Digital", "A simple four-step process: discover, define, design, deliver.");

  return (
    <>
      <PageHeader eyebrow="Process" title={<>How a project comes together</>}>
        A simple, transparent four-step approach &mdash; so you always know what&rsquo;s happening and what comes next.
      </PageHeader>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <ProcessTimeline showDetails />
          <Reveal className="mt-16 flex flex-wrap gap-3">
            <ArrowLink to="/services">What I offer</ArrowLink>
            <ArrowLink to="/work">Projects built this way</ArrowLink>
          </Reveal>
        </div>
      </section>

      <CtaCard />
    </>
  );
}
