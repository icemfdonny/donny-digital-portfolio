import Logo from "./Logo";
import { Reveal, Tilt } from "./ui";

/** The premium textured-paper logo shot, presented as a tilting brand card. */
export default function BrandCard({ className = "" }: { className?: string }) {
  return (
    <Reveal className={className}>
      <Tilt max={5}>
        <figure className="group relative overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-[0_40px_100px_-40px_rgba(255,255,255,0.18)]">
          <img
            src="/brand/premium.jpg"
            alt="The Donny-Digital monogram embossed on dark textured paper"
            className="aspect-[4/5] w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/70 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-200">
            Design + Development
          </span>
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
            <Logo className="h-5 md:h-6" />
            <span className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-neutral-400">
              Based in
              <br />
              <span className="text-white">Senec, Slovakia</span>
            </span>
          </figcaption>
        </figure>
      </Tilt>
    </Reveal>
  );
}
