import { useState } from "react";
import { ProjectDialog } from "../components/ProjectDialog";
import { CtaBand, ProjectCard } from "../components/sections";
import { PageHero, Reveal } from "../components/ui";
import type { Project } from "../data/trades";
import { usePageMeta } from "../lib/hooks";
import { BIZ, TRADE } from "../lib/profile";

const YEARS = new Date().getFullYear() - TRADE.stats.since;

export default function ProjectsPage() {
  usePageMeta("Realizácie", `Ukážky zákaziek firmy ${BIZ.name}.`);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<Project | null>(null);
  const used = TRADE.services.filter((s) => TRADE.projects.some((p) => p.service === s.id));
  const list = TRADE.projects.filter((p) => filter === "all" || p.service === filter);
  const total = TRADE.projects.reduce((s, p) => s + p.days, 0);

  return (
    <>
      <PageHero eyebrow="Realizácie" title="Zákazky, na ktoré sme hrdí" text={`Za ${YEARS} rokov sme dokončili vyše ${TRADE.stats.jobs.toLocaleString("sk-SK")} zákaziek. Tu je výber z posledných mesiacov, s cenou aj trvaním.`} photo={TRADE.projects[1].photo} />
      <section className="container-page py-12 sm:py-16">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filtrovať podľa služby">
          <button type="button" className="chip shrink-0" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            Všetko ({TRADE.projects.length})
          </button>
          {used.map((s) => (
            <button key={s.id} type="button" className="chip shrink-0" aria-pressed={filter === s.id} onClick={() => setFilter(s.id)}>
              {s.title} ({TRADE.projects.filter((p) => p.service === s.id).length})
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 70}>
              <ProjectCard project={p} onOpen={() => setOpen(p)} />
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-mute">
          Na zobrazených zákazkách sme spolu strávili {total} pracovných dní. Fotky ďalších realizácií vám radi ukážeme pri obhliadke.
        </p>
      </section>
      <ProjectDialog project={open} onClose={() => setOpen(null)} />
      <CtaBand />
    </>
  );
}
