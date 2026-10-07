import { useEffect, useRef, useState, type RefObject } from "react";
import { EMAIL } from "./data";

/** Sets the document title (and meta description) for the current page. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function useInView<T extends Element>(
  { threshold = 0.15, once = true, rootMargin = "0px" } = {},
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, inView];
}

/**
 * One shared IntersectionObserver per kind reveals every `.reveal` element by setting a data attribute, so a reveal never
 * causes a React render. Small and medium elements fade up as they scroll in. Big blocks (over ~200,000px2 and taller than 400px, e.g. the About
 * photo card or the closing call-to-action) are not animated at all: fading a surface that large made Firefox build one
 * big off-screen surface the moment it scrolled in, a visible ~80ms hitch. They are switched on instantly while still a
 * little below the screen edge, so nobody sees them pop in.
 */
// "Big" means large and tall (the photo card is about 540px high, the CTA about 590px); wide text headings stay animated.
const isBigReveal = (el: HTMLElement) => el.offsetWidth * el.offsetHeight > 200_000 && el.offsetHeight > 400;
let revealObserver: IntersectionObserver | null = null;
let bigRevealObserver: IntersectionObserver | null = null;

export function observeReveal(el: HTMLElement) {
  if (isBigReveal(el)) {
    bigRevealObserver ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-instant", "");
          entry.target.setAttribute("data-in", "");
          bigRevealObserver?.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px 30% 0px" },
    );
    bigRevealObserver.observe(el);
    return () => bigRevealObserver?.unobserve(el);
  }
  revealObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-in", "");
        revealObserver?.unobserve(entry.target);
      }
    },
    { threshold: 0.12 },
  );
  revealObserver.observe(el);
  return () => revealObserver?.unobserve(el);
}
/**
 * Calls onProgress(0..1) as the element scrolls through the viewport, writing straight to the DOM (no React state, so
 * scrolling never re-renders the component). It only listens to scroll while the element is within about one screen
 * of the viewport, so it costs nothing the rest of the time.
 */
export function useScrollProgress<T extends HTMLElement>(onProgress: (p: number, el: T) => void): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const callback = useRef(onProgress);
  useEffect(() => {
    callback.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let listening = false;
    let last = -1;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = Math.max(r.height * 0.85, vh * 0.5);
      const p = Math.round(Math.min(1, Math.max(0, (vh * 0.8 - r.top) / span)) * 200) / 200;
      if (p === last) return;
      last = p;
      callback.current(p, el);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const start = () => {
      if (listening) return;
      listening = true;
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    };
    const stop = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  return ref;
}
const ANIMATION_SCOPES = 'main section, main header, footer, [class~="group/card"], [class~="group/cap"]';

/**
 * Pauses the CSS animations inside sections/cards that are off-screen, so only what you can actually see keeps animating.
 * It sets animation-play-state directly on the few elements that animate (anything with an animate-* class). The earlier
 * version put an attribute on the whole section and used a `*` rule, which made the browser restyle every element in the
 * section each time one entered or left the screen: single 20-40ms hitches in the middle of a scroll.
 */
export function useOffscreenAnimationPause(routeKey: string) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const state = entry.isIntersecting ? "" : "paused";
          entry.target.querySelectorAll<HTMLElement>('[class*="animate-"]').forEach((el) => {
            el.style.animationPlayState = state;
          });
        }
      },
      { rootMargin: "80px 0px" },
    );
    document.querySelectorAll(ANIMATION_SCOPES).forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      document.querySelectorAll<HTMLElement>('[class*="animate-"]').forEach((el) => {
        el.style.animationPlayState = "";
      });
    };
  }, [routeKey]);
}
export function useCopyEmail() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };
  return { copied, copy };
}
