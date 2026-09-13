import Placeholder from "./Placeholder";

const SKILLS = [
  "UI Design",
  "Design Systems",
  "Motion & Interaction",
  "Frontend Engineering",
  "Art Direction",
  "Accessibility",
];

const TOOLS = [
  "Figma",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Framer Motion",
  "Webflow",
];

const CLIENTS = ["Acme Studio", "Northwind Labs", "Fieldwork Co.", "Loop & Co.", "Vantage"];

export default function About() {
  return (
    <section id="about" className="bg-cream py-24 text-charcoal md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange">
          03 / About
        </p>

        <div className="mt-10 grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Placeholder
              label="Portrait"
              sublabel="Donny Digital"
              tone="charcoal"
              className="aspect-[4/5] w-full rounded-sm"
            />
          </div>

          <div>
            <h2 className="text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-tight tracking-tight">
              Designer and developer, in equal measure.
            </h2>

            <div className="mt-8 space-y-5 max-w-2xl text-lg leading-relaxed text-charcoal/70">
              <p>
                I&rsquo;m Darien, a freelance web designer and frontend
                developer working with startups and studios who want their
                site to feel as sharp as their product. My process moves
                between Figma and code constantly, so nothing gets lost in
                translation between design and build.
              </p>
              <p>
                Over the last four years I&rsquo;ve helped teams launch
                marketing sites, design systems, and product interfaces that
                hold up under real use &mdash; fast, accessible, and built to
                be maintained long after launch.
              </p>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-charcoal/60">
                  Experience
                </dt>
                <dd className="mt-2 font-display text-3xl font-bold text-orange">
                  4+ yrs
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-sm font-semibold uppercase tracking-wide text-charcoal/60">
                  Skills
                </dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {SKILLS.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-charcoal/15 px-3 py-1 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-wide text-charcoal/60">
                  Tools
                </dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {TOOLS.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-charcoal/15 px-3 py-1 text-xs font-medium"
                    >
                      {tool}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>

            <div className="mt-12 border-t border-charcoal/10 pt-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-charcoal/60">
                Selected clients
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                {CLIENTS.map((client) => (
                  <li
                    key={client}
                    className="font-display text-base font-semibold text-charcoal/70"
                  >
                    {client}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
