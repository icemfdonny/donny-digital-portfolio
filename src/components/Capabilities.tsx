import { CodeIcon, CompassIcon, LayersIcon, PenToolIcon } from "./icons";

const ITEMS = [
  {
    number: "01",
    title: "Product design",
    icon: PenToolIcon,
    description:
      "User flows, wireframes, and interface design grounded in real user research, not just aesthetics.",
  },
  {
    number: "02",
    title: "Frontend development",
    icon: CodeIcon,
    description:
      "Accessible, performant React and TypeScript builds that translate design intent pixel-for-pixel.",
  },
  {
    number: "03",
    title: "Creative direction",
    icon: CompassIcon,
    description:
      "Visual concepts, art direction, and brand systems that give a product a distinct point of view.",
  },
  {
    number: "04",
    title: "Design systems",
    icon: LayersIcon,
    description:
      "Reusable component libraries and documentation that keep teams shipping consistent work fast.",
  },
];

export default function Capabilities() {
  return (
    <section id="capabilities" className="bg-charcoal py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange">
          02 / Capabilities
        </p>
        <h2 className="text-balance mt-4 max-w-2xl font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-tight tracking-tight text-white">
          What I bring to a project
        </h2>

        <div className="mt-16 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ number, title, icon: Icon, description }) => (
            <div
              key={title}
              className="group flex flex-col gap-6 bg-charcoal p-8 transition-colors hover:bg-[#1d1d1d]"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-white/30">
                  {number}
                </span>
                <Icon className="h-6 w-6 text-orange transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
