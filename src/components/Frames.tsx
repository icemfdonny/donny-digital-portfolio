import type { Shot } from "../data";

/**
 * Static device frames for project screenshots. Deliberately plain: no filters, blur, masks or blend modes, so the page
 * stays cheap to paint. The screenshots are compressed WebP with explicit sizes, so nothing shifts while they load.
 */

export function BrowserFrame({
  src,
  alt,
  label,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-white/10 bg-panel ${className}`}>
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/12" />
          <span className="size-2.5 rounded-full bg-white/8" />
        </span>
        <span className="mx-auto max-w-[70%] truncate rounded bg-white/5 px-3 py-0.5 text-center font-mono text-[10px] text-dim">{label}</span>
        <span className="w-[42px]" aria-hidden="true" />
      </div>
      <img
        src={src}
        alt={alt}
        width={1600}
        height={1000}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="block h-auto w-full"
      />
    </figure>
  );
}

export function PhoneFrame({ shot, className = "" }: { shot: Shot; className?: string }) {
  return (
    <figure className={`mx-auto w-full max-w-[260px] rounded-[2rem] border border-white/15 bg-panel p-2 ${className}`}>
      <img
        src={shot.src}
        alt={shot.alt}
        width={780}
        height={1688}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full rounded-[1.5rem]"
      />
    </figure>
  );
}
