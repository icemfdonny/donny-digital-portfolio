import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import HeroBackdrop from "./HeroBackdrop";
import HeroConsole from "./HeroConsole";
import { ArrowRightIcon } from "./icons";

export default function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden pb-24 pt-36 md:pb-32 md:pt-48">
      <HeroBackdrop />

      <div className="mx-auto max-w-6xl px-6 text-center">
        <span
          className="rise-in inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] py-1.5 pl-3 pr-4 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-300"
          style={{ "--d": "0ms" } as CSSProperties}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-white" />
          </span>
          Available for freelance work
        </span>

        <h1 className="mt-9 whitespace-nowrap font-display text-[min(6rem,calc((100vw-3rem)/11.6))] leading-[1.1] tracking-[-0.04em]">
          <span
            className="word-in -mb-[0.28em] -mr-[0.16em] inline-block pb-[0.28em] pr-[0.16em] text-silver"
            style={{ "--i": 0 } as CSSProperties}
          >
            Digital
          </span>{" "}
          <span className="word-in inline-block" style={{ "--i": 1 } as CSSProperties}>
            <span className="text-shine -mb-[0.28em] -mr-[0.12em] inline-block animate-shine pb-[0.28em] pr-[0.12em]">experiences.</span>
          </span>
        </h1>

        <p
          className="rise-in mx-auto mt-9 max-w-xl text-balance text-base leading-relaxed text-fg/90 md:text-lg"
          style={{ "--d": "650ms" } as CSSProperties}
        >
          I design and develop memorable websites and products &mdash; merging sharp visual craft with clean,
          considered front-end engineering so brands feel as good to use as they look.
        </p>

        <div
          className="rise-in mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ "--d": "800ms" } as CSSProperties}
        >
          <Link to="/work" className="btn-primary px-7 py-3.5 text-sm">
            View my work
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link to="/contact" className="btn-ghost px-7 py-3.5 text-sm">
            Let&rsquo;s talk
          </Link>
        </div>
      </div>

      <div className="rise-in mx-auto mt-16 max-w-5xl px-4 md:mt-24 md:px-6" style={{ "--d": "1000ms" } as CSSProperties}>
        <HeroConsole />
      </div>
    </section>
  );
}
