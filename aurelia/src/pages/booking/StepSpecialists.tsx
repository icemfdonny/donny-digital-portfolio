import type { ReactNode } from "react";
import { Heart, Sparkles, Star } from "../../components/icons";
import { Avatar } from "../../components/ui";
import { LEVELS, TEAM } from "../../data/team";
import { liveService, priceFor, priceRange, qualified, variantOf } from "../../lib/catalog";
import { formatEuro } from "../../lib/format";
import type { DB } from "../../lib/store";
import type { Account } from "../../lib/types";
import { useVisit } from "../../lib/visit";

export default function StepSpecialists({ db, account }: { db: DB; account: Account | null }) {
  const { items, update } = useVisit();
  // Someone who can do every service in the visit, for the "all with one person" shortcut.
  const allRounders = TEAM.filter((p) => items.every((i) => p.cats.includes(liveService(i.serviceId, db.serviceOverrides).cat)));

  return (
    <div className="space-y-8">
      {items.length > 1 && allRounders.length > 0 && (
        <div className="rounded-2xl bg-blush/70 p-4 sm:p-5">
          <p className="text-sm font-medium text-plum">Všetko u jednej osoby</p>
          <p className="mt-0.5 text-sm text-soft">Bez prechádzania medzi kreslami. Vyberte jedným klikom:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allRounders.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip bg-paper py-1.5 pl-1.5"
                aria-pressed={items.every((i) => i.specialistId === p.id)}
                onClick={() => items.forEach((i) => update(i.key, { specialistId: p.id }))}
              >
                <Avatar id={p.id} size={26} /> {p.firstName}
              </button>
            ))}
          </div>
        </div>
      )}

      {items.map((item) => {
        const service = liveService(item.serviceId, db.serviceOverrides);
        const variant = variantOf(service, item.variantId);
        const people = qualified(service);
        const range = priceRange(service.id, item.variantId, db.serviceOverrides);
        return (
          <section key={item.key}>
            <h3 className="font-display text-2xl font-medium text-plum">
              {service.name}
              {variant && <span className="ml-2 font-sans text-sm font-normal text-mute">{variant.label}</span>}
            </h3>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <Option
                selected={item.specialistId === "any"}
                onClick={() => update(item.key, { specialistId: "any" })}
                avatar={
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold-soft text-gold">
                    <Sparkles size={20} />
                  </span>
                }
                title="Ktokoľvek voľný"
                sub="Najviac voľných termínov"
                price={range.min === range.max ? formatEuro(range.min) : `${formatEuro(range.min)} – ${formatEuro(range.max)}`}
              />
              {people.map((p) => (
                <Option
                  key={p.id}
                  selected={item.specialistId === p.id}
                  onClick={() => update(item.key, { specialistId: p.id })}
                  avatar={<Avatar id={p.id} size={48} />}
                  title={
                    <>
                      {p.firstName}
                      {account?.favouriteSpecialist === p.id && (
                        <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-mauve/12 px-2 py-0.5 text-[10.5px] font-semibold text-mauve">
                          <Heart size={11} /> Vaša obľúbená
                        </span>
                      )}
                    </>
                  }
                  sub={
                    <span className="inline-flex items-center gap-1.5">
                      {service.levelPricing ? LEVELS[p.level].label : p.role.split(" a ")[0]} · <Star size={12} className="text-gold" /> {p.rating.toLocaleString("sk-SK")}
                    </span>
                  }
                  price={formatEuro(priceFor(service.id, item.variantId, p.id, db.serviceOverrides))}
                />
              ))}
            </div>
          </section>
        );
      })}

      {items.some((i) => liveService(i.serviceId, db.serviceOverrides).levelPricing) && (
        <p className="rounded-2xl border border-line p-4 text-sm leading-relaxed text-soft">
          <strong className="font-medium text-plum">Prečo sa ceny líšia?</strong> {LEVELS.junior.label}: {LEVELS.junior.text.toLowerCase()} {LEVELS.art.label}: {LEVELS.art.text.toLowerCase()}
        </p>
      )}
    </div>
  );
}

function Option({
  selected,
  onClick,
  avatar,
  title,
  sub,
  price,
}: {
  selected: boolean;
  onClick: () => void;
  avatar: ReactNode;
  title: ReactNode;
  sub: ReactNode;
  price: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex items-center gap-3.5 rounded-2xl border p-3 pr-4 text-left transition-colors ${selected ? "border-plum bg-paper ring-1 ring-plum" : "border-line bg-paper/70 hover:border-plum/40"}`}
    >
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-ink">{title}</span>
        <span className="block text-xs text-mute">{sub}</span>
      </span>
      <span className="text-sm font-medium tabular-nums text-plum">{price}</span>
    </button>
  );
}
