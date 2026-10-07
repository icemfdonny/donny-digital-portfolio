// Static light shafts, angled to echo the slant of the logo. `shift` nudges each one so they do not look evenly spaced.
const BLADES = [
  { left: "14%", width: 110, opacity: 0.05, shift: "-6vw" },
  { left: "32%", width: 34, opacity: 0.1, shift: "4vw" },
  { left: "47%", width: 170, opacity: 0.035, shift: "-2vw" },
  { left: "63%", width: 46, opacity: 0.085, shift: "6vw" },
  { left: "82%", width: 120, opacity: 0.045, shift: "-4vw" },
];

export default function HeroBackdrop() {
  return (
    // will-change keeps the backdrop on its own cached layer. Without it, Firefox re-renders the masked light blades across
    // the whole 2560px-wide hero on every frame in which anything else in the hero animates (about 3fps on a 1440p screen).
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden will-change-transform">
      <div className="absolute left-1/2 top-[-18%] h-[80%] w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_55%_at_50%_0%,rgba(255,255,255,0.22),rgba(255,255,255,0.05)_46%,transparent_72%)]" />

      <div className="grid-bg absolute inset-0" />

      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_25%,transparent_78%)]">
        {BLADES.map((b, i) => (
          <span
            key={i}
            className="absolute -top-20 h-[140%] bg-gradient-to-r from-transparent via-white to-transparent"
            style={{ left: b.left, width: b.width, opacity: b.opacity, transform: `translateX(${b.shift}) skewX(-24deg)` }}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
