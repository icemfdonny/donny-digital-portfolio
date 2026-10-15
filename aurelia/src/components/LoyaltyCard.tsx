import { Crown } from "./icons";
import { Monogram } from "./ui";

/** The champagne loyalty card, shown on the home page and in the client account. */
export default function LoyaltyCard({ name, tier, points, since, stacked = true }: { name: string; tier: string; points: number; since: number; stacked?: boolean }) {
  return (
    <div className={`relative mx-auto aspect-[1.6/1] max-w-md ${stacked ? "w-[calc(100%-1.5rem)] sm:w-full" : "w-full"}`}>
      {stacked && <div className="absolute inset-0 translate-x-5 translate-y-5 rotate-3 rounded-[1.6rem] bg-plum/90" />}
      <div className="gold-card relative flex h-full animate-shimmer flex-col justify-between overflow-hidden rounded-[1.6rem] p-6 text-plum shadow-2xl sm:p-7">
        <Monogram arc={false} className="absolute -right-10 -top-10 size-48 text-white/40" />
        <div className="flex items-start justify-between">
          <span className="font-display text-2xl font-medium italic">Aurelia</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
            <Crown size={13} /> {tier}
          </span>
        </div>
        <div>
          <p className="font-display text-5xl font-medium tabular-nums">{points.toLocaleString("sk-SK")}</p>
          <p className="text-sm text-plum/70">bodov</p>
        </div>
        <p className="flex items-end justify-between gap-3 text-sm">
          <span className="truncate font-medium">{name}</span>
          <span className="shrink-0 text-plum/60">členka od {since}</span>
        </p>
      </div>
    </div>
  );
}
