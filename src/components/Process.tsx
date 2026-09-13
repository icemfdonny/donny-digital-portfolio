const STEPS = [
  {
    number: "01",
    title: "Discover",
    description:
      "Understand the goals, audience, and constraints before any pixels move.",
  },
  {
    number: "02",
    title: "Define",
    description:
      "Translate research into a clear brief, sitemap, and success criteria.",
  },
  {
    number: "03",
    title: "Design",
    description:
      "Explore concepts and refine the details that make an interface feel considered.",
  },
  {
    number: "04",
    title: "Deliver",
    description:
      "Build, test, and ship a performant product that's ready for the real world.",
  },
];

export default function Process() {
  return (
    <section id="process" className="bg-cream py-24 text-charcoal md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange">
          04 / Process
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-tight tracking-tight">
          How a project comes together
        </h2>

        <ol className="mt-20 grid gap-12 md:grid-cols-4 md:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.number} className="relative pl-10 md:pl-0">
              <div
                className="absolute left-[7px] top-1 bottom-[-3rem] w-px bg-orange/30 md:hidden"
                aria-hidden="true"
                style={{ display: i === STEPS.length - 1 ? "none" : undefined }}
              />
              <div
                className="hidden md:absolute md:left-0 md:right-0 md:top-[7px] md:block md:h-px md:bg-orange/30"
                aria-hidden="true"
                style={{ display: i === STEPS.length - 1 ? "none" : undefined }}
              />

              <span
                className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-orange bg-cream md:relative md:mb-6"
                aria-hidden="true"
              />

              <span className="font-display text-sm font-semibold text-orange">
                {step.number}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-charcoal/70">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
