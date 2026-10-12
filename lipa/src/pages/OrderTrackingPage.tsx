import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bag, Check, Chef, Clock, External, Info, Phone, Store, Truck, Star, Utensils } from "../components/icons";
import { useToast } from "../components/toast";
import { PageHero } from "../components/ui";
import { LUNCH, ORDERING, RESTAURANT } from "../config";
import { useCart } from "../lib/cart";
import { formatClock, formatPhone, formatPrice, isSameDay } from "../lib/format";
import { relativeDay } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { STATUS_HINT, STATUS_LABEL, etaOf, historyAt, statusAt, stepsFor } from "../lib/orders";
import { useDB } from "../lib/store";
import type { OrderStatus } from "../lib/types";

const STEP_ICON: Record<OrderStatus, typeof Check> = {
  received: Check,
  accepted: Utensils,
  preparing: Chef,
  ready: Store,
  delivering: Truck,
  completed: Bag,
  cancelled: Info,
};

export default function OrderTrackingPage() {
  const { id = "" } = useParams();
  const db = useDB();
  const now = useNow(1000);
  const navigate = useNavigate();
  const toast = useToast();
  const { add, setMode } = useCart();
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const order = db.orders.find((o) => o.id === id);
  usePageMeta(order ? `Objednávka #${order.number}` : "Objednávka");

  if (!order) {
    return (
      <>
        <PageHero eyebrow="Objednávka" title="Túto objednávku nevidíme" text="Odkaz je neplatný alebo bol vytvorený v inom prehliadači.">
          <Link to="/objednavka" className="btn-honey mt-8">
            Nová objednávka
          </Link>
        </PageHero>
        <div className="h-24" />
      </>
    );
  }

  const t = now.getTime();
  const status = statusAt(order, t);
  const history = historyAt(order, t);
  const steps = stepsFor(order.mode);
  const currentIndex = status === "cancelled" ? -1 : steps.indexOf(status);
  const eta = new Date(etaOf(order));
  const minutesLeft = Math.max(0, Math.round((eta.getTime() - t) / 60_000));
  const done = status === "completed";
  const cancelled = status === "cancelled";
  const deliveringAt = history.find((h) => h.status === "delivering")?.at;
  const rideProgress = status === "delivering" && deliveringAt ? Math.min(0.92, (t - deliveringAt) / (240_000 * (order.auto ? 1 : 2))) : done ? 1 : 0;

  const reorder = () => {
    for (const line of order.lines) add({ ...line, packaging: line.itemId.startsWith("lunch-") ? LUNCH.box : ORDERING.packaging });
    setMode(order.mode);
    navigate("/objednavka");
  };

  return (
    <>
      <PageHero
        eyebrow={`Objednávka #${order.number}`}
        title={
          cancelled ? (
            "Objednávka bola zrušená"
          ) : done ? (
            <>
              Dobrú chuť, <em className="text-honey-soft">{order.customer.name.split(" ")[0]}!</em>
            </>
          ) : (
            STATUS_LABEL[status]
          )
        }
        text={STATUS_HINT[status]}
      >
        {!done && !cancelled && (
          <div className="mt-8 inline-flex items-center gap-4 rounded-2xl bg-cream/10 px-5 py-4">
            <Clock size={22} className="text-honey" />
            <div>
              <p className="text-sm text-cream/60">
                {order.mode === "pickup" ? "Pripravené" : "Doručíme"} {isSameDay(eta, now) ? "okolo" : relativeDay(eta, now)}
              </p>
              <p className="font-display text-3xl tabular-nums">
                {formatClock(eta)}
                {minutesLeft > 0 && minutesLeft < 120 && <span className="ml-3 font-sans text-base text-cream/60">o {minutesLeft} min</span>}
              </p>
            </div>
          </div>
        )}
      </PageHero>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_380px] lg:py-16">
        <div className="space-y-8">
          {!cancelled && (
            <ol className="card relative p-6 sm:p-8" aria-label="Priebeh objednávky">
              {steps.map((step, i) => {
                const reached = i <= currentIndex;
                const current = i === currentIndex && !done;
                const at = history.find((h) => h.status === step)?.at;
                const Icon = STEP_ICON[step];
                const label = step === "completed" ? (order.mode === "pickup" ? "Vyzdvihnuté" : "Doručené") : STATUS_LABEL[step];
                return (
                  <li key={step} className="relative flex gap-5 pb-8 last:pb-0" aria-current={current ? "step" : undefined}>
                    {i < steps.length - 1 && (
                      <span className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                        <span className={`block w-full bg-moss transition-[height] duration-700 ${i < currentIndex ? "h-full" : "h-0"}`} />
                      </span>
                    )}
                    <span
                      className={`relative grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-500 ${
                        reached ? "bg-forest text-cream" : "bg-sand text-mute"
                      } ${current ? "text-honey ring-4 ring-honey/25" : ""}`}
                    >
                      <Icon size={18} />
                      {current && <span className="absolute inset-0 animate-ping rounded-full bg-honey/20" aria-hidden="true" />}
                    </span>
                    <div className="pt-1.5">
                      <p className={`font-medium ${reached ? "text-ink" : "text-mute"}`}>{label}</p>
                      <p className="text-sm text-mute">{at ? formatClock(new Date(at)) : current ? "práve teraz" : "čaká sa"}</p>
                      {current && <p className="mt-1 max-w-md text-sm text-soft">{STATUS_HINT[step]}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {order.mode === "delivery" && !cancelled && <RideMap progress={rideProgress} active={status === "delivering"} />}

          {done && (
            <div className="card p-6 sm:p-8">
              <p className="font-display text-2xl text-forest">Ako vám chutilo?</p>
              {rated ? (
                <p className="mt-2 text-soft">Ďakujeme! Hodnotenie si prečíta celý tím.</p>
              ) : (
                <>
                  <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Hodnotenie">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} z 5`} onClick={() => setRating(n)} className="p-1 text-honey">
                        <Star size={30} className={n <= rating ? "" : "opacity-25"} />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-primary mt-4"
                    disabled={!rating}
                    onClick={() => {
                      setRated(true);
                      toast("Ďakujeme za hodnotenie!");
                    }}
                  >
                    Odoslať hodnotenie
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-honey/60 bg-honey-soft/40 p-5 text-sm text-forest">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              Ukážka: stav sa posúva sám a zrýchlene. Otvorte{" "}
              <a href="/admin?karta=objednavky" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium underline underline-offset-2">
                administráciu v novom okne <External size={13} />
              </a>{" "}
              a meňte stav ručne, táto stránka sa zmení okamžite.
            </p>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-2xl text-forest">#{order.number}</h2>
              <span className="flex items-center gap-1.5 text-sm text-soft">
                {order.mode === "pickup" ? <Store size={16} /> : <Truck size={16} />}
                {order.mode === "pickup" ? "Vyzdvihnutie" : "Rozvoz"}
              </span>
            </div>
            <ul className="divide-y divide-line px-6">
              {order.lines.map((line) => (
                <li key={line.key} className="flex justify-between gap-4 py-3 text-[15px]">
                  <span>
                    <span className="tabular-nums text-mute">{line.qty}×</span> {line.name}
                    {line.options.length > 0 && <span className="block text-xs text-mute">{line.options.join(" · ")}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatPrice(line.unitPrice * line.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-6 py-4 text-sm">
              <Row label="Obaly" value={formatPrice(order.packaging)} />
              {order.mode === "delivery" && <Row label="Doprava" value={order.deliveryFee ? formatPrice(order.deliveryFee) : "zadarmo"} />}
              {order.discount > 0 && <Row label={`Zľava ${order.promoCode ?? ""}`} value={`−${formatPrice(order.discount)}`} />}
              {order.voucherUsed > 0 && <Row label="Poukážka" value={`−${formatPrice(order.voucherUsed)}`} />}
              <div className="flex justify-between pt-2 text-base font-medium">
                <dt>Spolu</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
              <p className="pt-1 text-xs text-mute">
                {order.payment === "card" ? "Zaplatené kartou online" : order.payment === "voucher" ? "Uhradené poukážkou" : "Platba pri prevzatí"}
              </p>
            </dl>
            <div className="space-y-1 border-t border-line px-6 py-4 text-sm text-soft">
              <p className="font-medium text-ink">{order.customer.name}</p>
              <p>{formatPhone(order.customer.phone)}</p>
              {order.address && (
                <p>
                  {order.address.street}, {order.address.zip} {order.address.city}
                  {order.address.floor && `, ${order.address.floor}`}
                </p>
              )}
              {order.note && <p className="italic">„{order.note}“</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary flex-1" onClick={reorder}>
              <Bag size={17} /> Objednať znova
            </button>
            <a href={RESTAURANT.phoneHref} className="btn-outline flex-1">
              <Phone size={17} /> Zavolať
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-soft">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/** Stylised route from the restaurant to the guest, with the courier moving along it. */
function RideMap({ progress, active }: { progress: number; active: boolean }) {
  // Quadratic Bézier from restaurant (40,150) via (260,-10) to home (520,110).
  const p0 = [40, 150];
  const p1 = [260, -10];
  const p2 = [520, 110];
  const at = (k: number) => {
    const u = 1 - k;
    return [u * u * p0[0] + 2 * u * k * p1[0] + k * k * p2[0], u * u * p0[1] + 2 * u * k * p1[1] + k * k * p2[1]];
  };
  const [x, y] = at(progress);
  return (
    <div className="card overflow-hidden">
      <div className="relative bg-[#e8e1d2]">
        <svg viewBox="0 0 560 200" className="block w-full" role="img" aria-label={active ? "Kuriér je na ceste" : "Trasa doručenia"}>
          <defs>
            <pattern id="streets" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
              <path d="M0 24h48M24 0v48" stroke="#d8cfbd" strokeWidth="6" />
            </pattern>
          </defs>
          <rect width="560" height="200" fill="url(#streets)" />
          <path d="M-20 180 C 120 150, 200 200, 600 160" stroke="#b9cbb5" strokeWidth="26" fill="none" opacity=".7" />
          <path d={`M${p0} Q${p1} ${p2}`} stroke="#1c2b21" strokeOpacity=".18" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d={`M${p0} Q${p1} ${p2}`} stroke="#3d5a43" strokeWidth="6" fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${progress} 1`} className="transition-[stroke-dasharray] duration-1000" />
          <g transform={`translate(${p0[0]} ${p0[1]})`}>
            <circle r="16" fill="#1c2b21" />
            <path d="M0 7c-.5-1.5-1.2-2.4-2.7-3.3C-5 2.3-6.5.8-6.5-1.6c0-2.2 1.7-4 3.9-4 1.1 0 2.1.5 2.6 1.3.5-.8 1.5-1.3 2.6-1.3 2.2 0 3.9 1.8 3.9 4 0 2.4-1.5 3.9-3.8 5.3C1.2 4.6.5 5.5 0 7Z" fill="#c99a3e" />
          </g>
          <g transform={`translate(${p2[0]} ${p2[1]})`}>
            <circle r="16" fill="#fbf8f2" stroke="#1c2b21" strokeWidth="2" />
            <path d="M-6 1 0-5l6 6M-4 0v6h8V0" stroke="#1c2b21" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {progress > 0 && progress < 1 && (
            <g style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 1s linear" }}>
              <circle r="15" fill="#c99a3e" opacity=".25">
                <animate attributeName="r" values="12;20;12" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle r="11" fill="#c99a3e" />
              <path d="M-5 2h10M-3 -3h6l2 5" stroke="#1c2b21" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>
      <div className="flex items-center justify-between px-6 py-4 text-sm">
        <span className="font-medium">{RESTAURANT.street}</span>
        <span className="text-soft">{active ? "Kuriér je na ceste" : progress >= 1 ? "Doručené" : "Čakáme na kuriéra"}</span>
      </div>
    </div>
  );
}
