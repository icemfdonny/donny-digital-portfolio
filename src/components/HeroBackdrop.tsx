import { useEffect, useRef } from "react";

const BLADES = [
  { left: "14%", width: 110, opacity: 0.05, delay: "-2s", duration: "19s" },
  { left: "32%", width: 34, opacity: 0.1, delay: "-9s", duration: "14s" },
  { left: "47%", width: 170, opacity: 0.035, delay: "-5s", duration: "23s" },
  { left: "63%", width: 46, opacity: 0.085, delay: "-12s", duration: "16s" },
  { left: "82%", width: 120, opacity: 0.045, delay: "-7s", duration: "21s" },
];

/**
 * Grid lines that light up around the cursor. The cursor position is written only to this
 * element (rAF-throttled), so moving the mouse never forces a restyle of the rest of the hero.
 */
function GridHighlight() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    const host = node?.parentElement?.parentElement;
    if (!node || !host || window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      node.style.setProperty("--mx", `${x}px`);
      node.style.setProperty("--my", `${y}px`);
    };
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      node.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => {
      node.style.opacity = "0";
    };

    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={el} className="grid-hi absolute inset-0 opacity-0 transition-opacity duration-500" />;
}

export default function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-1/2 top-[-18%] h-[80%] w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_55%_at_50%_0%,rgba(255,255,255,0.22),rgba(255,255,255,0.05)_46%,transparent_72%)]" />

      <div className="grid-bg absolute inset-0" />
      <GridHighlight />

      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_25%,transparent_78%)]">
        {BLADES.map((b, i) => (
          <span
            key={i}
            className="absolute -top-20 h-[140%] animate-sweep bg-gradient-to-r from-transparent via-white to-transparent"
            style={{ left: b.left, width: b.width, opacity: b.opacity, animationDelay: b.delay, animationDuration: b.duration }}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
