import { useMemo } from "react";
import { TRAVEL } from "../config";
import { useGeo, type Town } from "../lib/geo";
import { BIZ, TRADE } from "../lib/profile";
import { Icon, Truck } from "./icons";

type Pt = { lat: number; lng: number };

const W = 640;
const H = 440;

/**
 * Stylised map of the service area drawn from real coordinates: the firm in the middle, the 50 km circle, towns
 * around it, and optionally a customer's town with a route and a moving van (emergency tracking).
 */
export function AreaMap({
  target,
  progress,
  className = "",
  showRadius = true,
}: {
  target?: (Pt & { name: string }) | null;
  /** 0–1 position of the van along the route; omit for no van. */
  progress?: number;
  className?: string;
  showRadius?: boolean;
}) {
  const geo = useGeo();
  const base = geo?.base ?? null;

  const view = useMemo(() => {
    if (!base) return null;
    const kmLat = 111.32;
    const kmLng = 111.32 * Math.cos((base.lat * Math.PI) / 180);
    // Fit the whole radius, or zoom to base + target when tracking.
    const tgtKm = target ? Math.hypot((target.lat - base.lat) * kmLat, (target.lng - base.lng) * kmLng) : 0;
    const spanKm = target && progress !== undefined ? Math.max(8, tgtKm * 1.5) : TRAVEL.radiusKm * 1.12;
    const center = target && progress !== undefined ? { lat: (base.lat + target.lat) / 2, lng: (base.lng + target.lng) / 2 } : base;
    const scale = Math.min(W, H) / 2 / spanKm;
    const project = (p: Pt) => ({ x: W / 2 + (p.lng - center.lng) * kmLng * scale, y: H / 2 - (p.lat - center.lat) * kmLat * scale });
    const inView = (t: Town) => {
      const { x, y } = project(t);
      return x > 24 && x < W - 24 && y > 20 && y < H - 16;
    };
    const minRank = spanKm > 14 ? 2 : 1;
    // Greedy label placement, larger places first, so names never sit on top of each other.
    const placed: { x: number; y: number; w: number }[] = [project(base)].map((p) => ({ ...p, w: 90 }));
    if (target) placed.push({ ...project(target), w: 130 });
    const towns = geo!.towns
      .filter((t) => t.rank >= minRank && t.name !== base.name && t.name !== target?.name && inView(t))
      .sort((a, b) => b.rank - a.rank)
      .filter((t) => {
        const p = project(t);
        const w = t.name.length * 6.6 + 10;
        if (placed.some((q) => Math.abs(q.y - p.y) < 18 && p.x < q.x + q.w && q.x < p.x + w)) return false;
        placed.push({ ...p, w });
        return true;
      })
      .slice(0, 40);
    const villages = spanKm <= 40 ? geo!.towns.filter((t) => t.rank === 1 && inView(t)).slice(0, 160) : [];
    return { project, scale, towns, villages };
  }, [base, geo, target, progress]);

  if (!base || !view) return <div className={`grid-paper rounded-2xl bg-sand ${className}`} aria-hidden="true" style={{ aspectRatio: `${W}/${H}` }} />;

  const b = view.project(base);
  const t = target ? view.project(target) : null;
  // Route as a gentle curve, so it reads as a road rather than a ruler line.
  const ctrl = t ? { x: (b.x + t.x) / 2 + (t.y - b.y) * 0.22, y: (b.y + t.y) / 2 - (t.x - b.x) * 0.22 } : null;
  const at = (s: number) =>
    t && ctrl ? { x: (1 - s) ** 2 * b.x + 2 * (1 - s) * s * ctrl.x + s ** 2 * t.x, y: (1 - s) ** 2 * b.y + 2 * (1 - s) * s * ctrl.y + s ** 2 * t.y } : b;
  const van = progress !== undefined ? at(progress) : null;
  const radiusPx = TRAVEL.radiusKm * view.scale;
  const freePx = TRAVEL.freeKm * view.scale;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`h-auto w-full rounded-2xl bg-[#eef0ec] ${className}`} role="img" aria-label={`Mapa oblasti pôsobenia okolo mesta ${BIZ.city}${target ? ` a trasa do obce ${target.name}` : ""}`}>
      <defs>
        <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="#14171c" strokeOpacity="0.05" />
        </pattern>
        <radialGradient id="map-area">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.06" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#map-grid)" />
      {showRadius && progress === undefined && (
        <>
          <circle cx={b.x} cy={b.y} r={radiusPx} fill="url(#map-area)" stroke="var(--color-accent-deep)" strokeOpacity="0.45" strokeDasharray="6 6" strokeWidth="1.5" />
          <circle cx={b.x} cy={b.y} r={freePx} fill="var(--color-accent)" fillOpacity="0.16" stroke="var(--color-accent-deep)" strokeOpacity="0.35" strokeWidth="1" />
          <text x={b.x} y={b.y - radiusPx + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill="#4a4f58">
            {TRAVEL.radiusKm} km
          </text>
          <text x={b.x} y={b.y - freePx + 13} textAnchor="middle" fontSize="10" fontWeight="600" fill="#4a4f58">
            doprava zdarma
          </text>
        </>
      )}
      {view.villages.map((v) => {
        const p = view.project(v);
        return <circle key={`${v.name}-${v.district}`} cx={p.x} cy={p.y} r="1.6" fill="#14171c" fillOpacity="0.18" />;
      })}
      {view.towns.map((town) => {
        const p = view.project(town);
        return (
          <g key={`${town.name}-${town.district}`}>
            <circle cx={p.x} cy={p.y} r={town.rank >= 2 ? 3.5 : 2.5} fill="#14171c" fillOpacity="0.45" />
            <text x={p.x + 6} y={p.y + 4} fontSize={town.rank >= 2 ? 12 : 10} fontWeight="600" fill="#14171c" fillOpacity="0.6">
              {town.name}
            </text>
          </g>
        );
      })}
      {t && ctrl && (
        <>
          <path d={`M${b.x} ${b.y} Q${ctrl.x} ${ctrl.y} ${t.x} ${t.y}`} fill="none" stroke="#14171c" strokeOpacity="0.15" strokeWidth="9" strokeLinecap="round" />
          <path d={`M${b.x} ${b.y} Q${ctrl.x} ${ctrl.y} ${t.x} ${t.y}`} fill="none" stroke="var(--color-accent-deep)" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
          <g transform={`translate(${t.x} ${t.y})`}>
            <circle r="16" fill="#d92d20" fillOpacity="0.15" />
            <circle r="7" fill="#d92d20" stroke="#fff" strokeWidth="2.5" />
            <rect x="12" y="-26" width={target!.name.length * 7.4 + 18} height="24" rx="7" fill="#14171c" />
            <text x="21" y="-9.5" fontSize="12" fontWeight="700" fill="#fff">
              {target!.name}
            </text>
          </g>
        </>
      )}
      <g transform={`translate(${b.x} ${b.y})`}>
        <rect x="-15" y="-15" width="30" height="30" rx="8" fill="var(--color-accent)" stroke="#14171c" strokeWidth="2" />
        <foreignObject x="-10" y="-10" width="20" height="20">
          <div style={{ color: "var(--color-accent-ink)", display: "grid", placeItems: "center", height: 20 }}>
            <Icon name={TRADE.icon} size={16} strokeWidth={2.4} />
          </div>
        </foreignObject>
        <text x="0" y="31" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#14171c" stroke="#eef0ec" strokeWidth="4" paintOrder="stroke">
          {BIZ.city}
        </text>
      </g>
      {van && (
        <g transform={`translate(${van.x} ${van.y})`}>
          <circle r="18" fill="var(--color-accent)" fillOpacity="0.25" className="animate-pulse-ring" />
          <circle r="14" fill="#14171c" stroke="#fff" strokeWidth="2" />
          <foreignObject x="-9" y="-9" width="18" height="18">
            <div style={{ color: "var(--color-accent)", display: "grid", placeItems: "center", height: 18 }}>
              <Truck size={15} strokeWidth={2.2} />
            </div>
          </foreignObject>
        </g>
      )}
    </svg>
  );
}
