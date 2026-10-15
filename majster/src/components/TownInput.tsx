import { useId, useMemo, useState } from "react";
import { TRAVEL } from "../config";
import { findTown, roadKm, searchTowns, useGeo, type Town } from "../lib/geo";
import { MapPin } from "./icons";

export type TownPick = { name: string; district: string; km: number | null };

/**
 * Town field with suggestions from all Slovak municipalities. Reports the road distance from the firm, so forms can
 * show travel costs and the service area as the visitor types.
 */
export function TownInput({
  value,
  onChange,
  label = "Obec alebo mesto",
  error,
  required,
  autoFocus,
}: {
  value: TownPick | null;
  onChange: (t: TownPick | null) => void;
  label?: string;
  error?: string | null;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const geo = useGeo();
  const id = useId();
  const [text, setText] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => (geo && text.length >= 2 ? searchTowns(text, geo.towns) : []), [geo, text]);

  const choose = (t: Town) => {
    setText(t.name);
    setOpen(false);
    onChange({ name: t.name, district: t.district, km: geo?.base ? roadKm(geo.base, t) : null });
  };

  const commitTyped = () => {
    if (!geo) return;
    const exact = findTown(text, geo.towns);
    if (exact) choose(exact);
    else if (text.trim()) onChange({ name: text.trim(), district: "", km: null });
    else onChange(null);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <div className="relative">
        <MapPin size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
        <input
          id={id}
          className="field pl-10"
          value={text}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Začnite písať, napr. Rajec"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={`${id}-list`}
          aria-invalid={!!error}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() =>
            window.setTimeout(() => {
              setOpen(false);
              commitTyped();
            }, 120)
          }
          onKeyDown={(e) => {
            if (!results.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && open) {
              e.preventDefault();
              choose(results[active]);
            }
          }}
        />
      </div>
      {open && results.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-line bg-paper py-1 shadow-xl">
          {results.map((t, i) => (
            <li key={`${t.name}-${t.district}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(t)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm ${i === active ? "bg-sand" : ""}`}
              >
                <span className="font-semibold text-ink">{t.name}</span>
                <span className="text-xs text-mute">
                  okres {t.district}
                  {geo?.base && ` · ${roadKm(geo.base, t)} km`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-danger">{error}</p>
      ) : (
        value && <AreaNote km={value.km} town={value.name} />
      )}
    </div>
  );
}

/** One line about the distance: free travel, a per-km fee, or outside the usual area. */
export function AreaNote({ km, town, perKm = TRAVEL.perKm, freeKm = TRAVEL.freeKm }: { km: number | null; town: string; perKm?: number; freeKm?: number }) {
  if (km === null) return <p className="mt-1.5 text-sm text-mute">Obec sme nenašli v zozname, vzdialenosť spresníme telefonicky.</p>;
  if (km > TRAVEL.radiusKm)
    return (
      <p className="mt-1.5 text-sm font-medium text-warn">
        {town} je asi {km} km od nás, mimo bežnej oblasti. Dopyt pošlite, ozveme sa s individuálnou ponukou.
      </p>
    );
  return (
    <p className="mt-1.5 text-sm font-medium text-ok">
      ✓ {town} · {km} km od nás · {km <= freeKm ? "doprava zadarmo" : `doprava ${((km - freeKm) * 2 * perKm).toLocaleString("sk-SK", { maximumFractionDigits: 0 })} € za výjazd`}
    </p>
  );
}
