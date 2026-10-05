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
 * 0 to 1 as the element scrolls through the viewport. Only listens to scroll while the element is
 * within about one screen of the viewport, so it costs nothing the rest of the time.
 */
export function useScrollProgress<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let listening = false;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = Math.max(r.height * 0.85, vh * 0.5);
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / span));
      setSteps(Math.round(p * 100));
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

  return [ref, steps / 100];
}

const ANIMATION_SCOPES = 'main section, main header, footer, [class~="group/card"], [class~="group/cap"]';

/**
 * Pauses every CSS animation inside sections/cards that are off-screen (the matching rule lives in
 * index.css under [data-offscreen]), so only what you can actually see keeps animating.
 */
export function useOffscreenAnimationPause(routeKey: string) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.removeAttribute("data-offscreen");
          else e.target.setAttribute("data-offscreen", "");
        }
      },
      { rootMargin: "80px 0px" },
    );
    document.querySelectorAll(ANIMATION_SCOPES).forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      document.querySelectorAll("[data-offscreen]").forEach((el) => el.removeAttribute("data-offscreen"));
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
