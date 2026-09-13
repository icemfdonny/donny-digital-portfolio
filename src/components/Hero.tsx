import CodeBackdrop from "./CodeBackdrop";
import { LogoIcon } from "./Logo";

export default function Hero() {
  return (
    <section
      id="home"
      className="grain relative overflow-hidden bg-charcoal pt-16 pb-24 md:pt-20 md:pb-32"
    >
      <CodeBackdrop />

      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-[520px] w-[520px] rounded-full bg-orange/30 blur-[110px] md:h-[640px] md:w-[640px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-16 px-6 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-orange/40 bg-orange/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-peach">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
            </span>
            Available for freelance work
          </span>

          <h1 className="text-balance mt-7 font-display text-[clamp(2.5rem,6.5vw,5rem)] font-bold leading-[1.03] tracking-tight text-white">
            Websites with <span className="text-orange">personality.</span>{" "}
            Digital experiences.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white">
            I design and develop memorable websites and products — merging
            sharp visual craft with clean, considered front-end engineering
            so brands feel as good to use as they look.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#work"
              className="rounded-full bg-orange px-7 py-3.5 text-sm font-semibold text-charcoal transition-transform hover:-translate-y-0.5"
            >
              View my work
            </a>
            <a
              href="#contact"
              className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/50"
            >
              Let&rsquo;s talk
            </a>
          </div>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[linear-gradient(135deg,var(--color-orange)_0%,var(--color-peach)_100%)] opacity-90 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1d1d1d] shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#232323] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="ml-3 h-5 flex-1 rounded-full bg-white/5" />
            </div>
            <div className="relative flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-[linear-gradient(160deg,#242424_0%,#1a1a1a_70%)] p-8">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 30%, rgba(255,107,53,0.25), transparent 55%)",
                }}
                aria-hidden="true"
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-orange/40 bg-orange/10">
                <LogoIcon className="h-11 w-auto" />
              </div>
              <p className="relative text-sm text-white/40">
                Profile / project mockup placeholder
              </p>
            </div>
          </div>

          <div className="absolute -left-4 bottom-6 hidden -translate-x-1/2 rounded-xl border border-white/10 bg-charcoal/90 px-4 py-3 shadow-lg backdrop-blur sm:block">
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              Based in
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              Bratislava, Slovakia
            </p>
          </div>

          <div className="absolute -right-4 -top-4 hidden rounded-xl border border-white/10 bg-charcoal/90 px-4 py-3 shadow-lg backdrop-blur sm:block">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-orange" />
              Design + Development
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
