import { useScrollProgress } from "../hooks";
import { STEPS } from "../data";
import { Reveal, SpotlightCard } from "./ui";

/** Four-step timeline whose connecting line fills as the section scrolls into view. */
export default function ProcessTimeline({ showDetails = false }: { showDetails?: boolean }) {
  const [ref, p] = useScrollProgress<HTMLOListElement>();
  const fill = Math.min(1, Math.max(0, (p - 0.1) / 0.7));

  return (
    <ol ref={ref} className="relative grid gap-10 md:grid-cols-4 md:gap-5">
      <span aria-hidden="true" className="absolute left-5 top-5 hidden h-px bg-white/10 md:block md:w-[calc(100%-2.5rem)]" />
      <span
        aria-hidden="true"
        className="absolute left-5 top-5 hidden h-px origin-left bg-gradient-to-r from-white/40 to-white shadow-[0_0_16px_rgba(255,255,255,0.7)] md:block md:w-[calc(100%-2.5rem)]"
        style={{ transform: `scaleX(${fill})` }}
      />
      <span aria-hidden="true" className="absolute bottom-5 left-5 top-5 w-px bg-white/10 md:hidden" />
      <span
        aria-hidden="true"
        className="absolute left-5 top-5 w-px origin-top bg-gradient-to-b from-white/40 to-white shadow-[0_0_16px_rgba(255,255,255,0.7)] md:hidden"
        style={{ height: "calc(100% - 2.5rem)", transform: `scaleY(${fill})` }}
      />

      {STEPS.map((step, i) => {
        const lit = fill >= i * 0.25 + 0.02;
        return (
          <li key={step.number} className="relative pl-16 md:pl-0">
            <span
              className={`absolute left-0 top-0 z-10 grid size-10 place-items-center rounded-full border font-mono text-xs transition-all duration-500 md:static ${
                lit ? "border-white bg-white text-black shadow-[0_0_34px_rgba(255,255,255,0.55)]" : "border-white/15 bg-black text-dim"
              }`}
            >
              {step.number}
            </span>
            <Reveal delay={i * 90} className="md:mt-8">
              <SpotlightCard
                className={`rounded-2xl border border-white/10 bg-panel p-6 transition-opacity duration-700 ${lit ? "opacity-100" : "opacity-45"}`}
              >
                <h3 className="font-display text-xl text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{step.description}</p>
                {showDetails && (
                  <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm text-neutral-300">
                        <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-white/60" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </SpotlightCard>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
