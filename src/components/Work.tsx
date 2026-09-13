import Placeholder from "./Placeholder";
import { ArrowUpRightIcon } from "./icons";

const PROJECTS = [
  {
    title: "Orbit",
    category: "SaaS website redesign",
    year: "2025",
    description:
      "A full marketing-site rebuild for a workflow-automation platform, cutting bounce rate by 32% with a clearer story and faster load times.",
  },
  {
    title: "Field Notes",
    category: "Digital publication",
    year: "2024",
    description:
      "An editorial reading experience for an independent design magazine, built around variable type and long-form layout rhythm.",
  },
  {
    title: "Northstar",
    category: "Brand & portfolio site",
    year: "2024",
    description:
      "Visual identity and portfolio site for a boutique architecture studio, translating their material palette into an interface language.",
  },
  {
    title: "Flux",
    category: "Creative coding experiment",
    year: "2023",
    description:
      "A generative-art playground exploring shader-driven motion, later adapted into interactive backgrounds for client work.",
  },
];

export default function Work() {
  return (
    <section id="work" className="bg-cream py-24 text-charcoal md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange">
              01 / Portfolio
            </p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-tight tracking-tight">
              Selected work
            </h2>
          </div>
          <p className="max-w-sm text-charcoal/70">
            A handful of recent projects spanning product design, brand
            sites, and experimental front-end work.
          </p>
        </div>

        <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-2">
          {PROJECTS.map((project, i) => (
            <article key={project.title} className="group">
              <a href="#" className="block" aria-label={`View case study: ${project.title}`}>
                <div className="relative overflow-hidden rounded-sm border border-charcoal/10 transition-colors duration-300 group-hover:border-orange">
                  <div className="overflow-hidden">
                    <Placeholder
                      label={project.title}
                      tone={i % 2 === 0 ? "peach" : "charcoal"}
                      className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                  <span className="absolute right-4 top-4 flex h-10 w-10 -translate-y-2 items-center justify-center rounded-full bg-orange text-charcoal opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRightIcon className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-orange">
                    {project.title}
                  </h3>
                  <span className="whitespace-nowrap pt-1 text-sm text-charcoal/60">
                    {project.category} &middot; {project.year}
                  </span>
                </div>
                <p className="mt-2 max-w-md text-charcoal/70">{project.description}</p>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
