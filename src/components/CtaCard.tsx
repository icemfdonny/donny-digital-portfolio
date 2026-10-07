import { Link } from "react-router-dom";
import { EMAIL } from "../data";
import { useCopyEmail } from "../hooks";
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "./icons";
import { Reveal } from "./ui";

/** Closing call-to-action shown at the bottom of most pages. */
export default function CtaCard() {
  const { copied, copy } = useCopyEmail();

  return (
    <section className="relative px-4 pb-24 pt-8 md:px-6 md:pb-32">
      <Reveal>
        <div className="noise relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-[#cfcfcf] px-6 py-20 text-center text-black md:rounded-[2.5rem] md:px-16 md:py-28">
          {/* Dark versions of the watermark and dot pattern are used as-is instead of inverting the white ones with a CSS filter:
              the first time a large filtered element reached the screen, Firefox needed ~130ms to build it. */}
          <img
            src="/brand/mark-dark.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 w-[26rem] opacity-[0.06] md:-right-10 md:w-[40rem]"
          />
          <div className="dots-bg-dark pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_75%)]" />

          <div className="relative">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-black/50">Contact</p>
            <h2 className="mx-auto mt-6 max-w-4xl text-balance pb-[0.1em] font-display text-[clamp(1.9rem,5vw,4rem)] leading-[1.12] tracking-[-0.03em]">
              Have an idea? <span className="text-black/50">Let&rsquo;s make it real.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-md text-lg text-black/60">
              Currently booking new freelance projects starting in Q4. Tell me what you&rsquo;re building.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-3 rounded-full bg-black px-7 py-4 text-sm font-medium text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5"
              >
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                <span aria-live="polite">{copied ? "Copied to clipboard" : EMAIL}</span>
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-black/15 px-7 py-4 text-sm font-medium text-black transition-colors hover:border-black/40 hover:bg-black/5"
              >
                Start a project
                <ArrowUpRightIcon className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

