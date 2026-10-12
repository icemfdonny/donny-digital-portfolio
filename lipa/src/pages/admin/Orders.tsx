import { Link } from "react-router-dom";
import { ArrowRight, Clock, External, Store, Truck, X } from "../../components/icons";
import { formatClock, formatPhone, formatPrice, isSameDay } from "../../lib/format";
import { relativeDay } from "../../lib/hours";
import { STATUS_LABEL, etaOf, statusAt } from "../../lib/orders";
import type { DB } from "../../lib/store";
import type { Order, OrderStatus } from "../../lib/types";
import { nextStatusOf, pastOrdersToday, setOrderStatus } from "./adminData";
import { Pill } from "./AdminUI";

const COLUMNS: { id: string; title: string; statuses: OrderStatus[] }[] = [
  { id: "new", title: "Nové", statuses: ["received"] },
  { id: "accepted", title: "Potvrdené", statuses: ["accepted"] },
  { id: "kitchen", title: "V kuchyni", statuses: ["preparing"] },
  { id: "out", title: "Hotové / na ceste", statuses: ["ready", "delivering"] },
  { id: "done", title: "Dokončené", statuses: ["completed", "cancelled"] },
];

const ACTION: Partial<Record<OrderStatus, string>> = {
  received: "Potvrdiť",
  accepted: "Začať variť",
  preparing: "Hotové",
  ready: "Vyzdvihnuté",
  delivering: "Doručené",
};

export default function Orders({ db, now }: { db: DB; now: Date }) {
  const t = now.getTime();
  const orders = [...db.orders].sort((a, b) => b.createdAt - a.createdAt);
  const past = pastOrdersToday(now).reverse();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-soft">
          Objednávky z webu sa tu objavia okamžite. Zmena stavu sa hneď prejaví na stránke, ktorú sleduje zákazník, aj v inom okne.
        </p>
        <Link to="/objednavka" target="_blank" className="btn-outline py-2 text-sm">
          Otvoriť e-shop <External size={14} />
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 2xl:mx-0 2xl:grid 2xl:grid-cols-5 2xl:px-0">
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => col.statuses.includes(statusAt(o, t)));
          return (
            <section key={col.id} className="flex w-72 shrink-0 flex-col rounded-2xl bg-sand/60 2xl:w-auto">
              <h2 className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
                {col.title}
                <span className="rounded-full bg-paper px-2 py-0.5 text-xs tabular-nums text-soft">{items.length + (col.id === "done" ? past.length : 0)}</span>
              </h2>
              <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
                {items.map((o) => (
                  <OrderCard key={o.id} order={o} now={now} />
                ))}
                {col.id === "done" &&
                  past.slice(0, 6).map((p) => (
                    <div key={p.id} className="rounded-xl border border-line bg-paper/70 px-3 py-2.5 text-xs text-soft">
                      <div className="flex justify-between">
                        <span className="font-semibold text-ink">#{p.number}</span>
                        <span className="tabular-nums">{formatClock(new Date(p.at))}</span>
                      </div>
                      <div className="mt-0.5 flex justify-between gap-2">
                        <span className="truncate">{p.name}</span>
                        <span className="shrink-0 tabular-nums">{formatPrice(p.total)}</span>
                      </div>
                      <p className="mt-0.5 text-mute">
                        {p.items} {p.items === 1 ? "položka" : p.items < 5 ? "položky" : "položiek"} · {p.mode === "pickup" ? "vyzdvihnutie" : "rozvoz"}
                      </p>
                    </div>
                  ))}
                {!items.length && col.id !== "done" && <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-mute">Prázdne</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, now }: { order: Order; now: Date }) {
  const status = statusAt(order, now.getTime());
  const next = nextStatusOf(order, status);
  const eta = new Date(etaOf(order));
  const late = status !== "completed" && status !== "cancelled" && eta.getTime() < now.getTime();
  const fresh = now.getTime() - order.createdAt < 60_000;
  return (
    <article className={`rounded-xl border bg-paper p-3.5 shadow-sm ${fresh && status === "received" ? "animate-pop border-honey ring-2 ring-honey/30" : "border-line"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 font-semibold">
            {order.mode === "pickup" ? <Store size={15} className="text-mute" /> : <Truck size={15} className="text-mute" />}#{order.number}
          </p>
          <p className="text-xs text-mute">prijatá {formatClock(new Date(order.createdAt))}</p>
        </div>
        <Pill tone={status === "cancelled" ? "bad" : late ? "bad" : status === "completed" ? "off" : "info"}>
          <Clock size={11} /> {isSameDay(eta, now) ? formatClock(eta) : `${relativeDay(eta, now)} ${formatClock(eta)}`}
        </Pill>
      </div>
      <ul className="mt-2.5 space-y-0.5 text-[13px]">
        {order.lines.map((l) => (
          <li key={l.key}>
            <span className="font-semibold tabular-nums">{l.qty}×</span> {l.name}
            {l.options.length > 0 && <span className="block pl-5 text-xs text-mute">{l.options.map((o) => o.replace(/ \(\+.*\)$/, "")).join(", ")}</span>}
            {l.note && <span className="block pl-5 text-xs italic text-wine">„{l.note}“</span>}
          </li>
        ))}
      </ul>
      <div className="mt-2.5 border-t border-line pt-2 text-xs text-soft">
        <p className="font-medium text-ink">
          {order.customer.name} · {formatPhone(order.customer.phone)}
        </p>
        {order.address && (
          <p>
            {order.address.street}, {order.address.zone}
          </p>
        )}
        {order.note && <p className="italic">„{order.note}“</p>}
        <p className="mt-1 flex justify-between">
          <span>{order.payment === "card" ? "Zaplatené kartou" : order.payment === "voucher" ? "Poukážka" : "Platí pri prevzatí"}</span>
          <span className="font-semibold text-ink tabular-nums">{formatPrice(order.total)}</span>
        </p>
        {order.cutlery && <p>+ príbor</p>}
      </div>
      {next && status !== "cancelled" && (
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-primary flex-1 py-2 text-xs" onClick={() => setOrderStatus(order, next)}>
            {ACTION[status] ?? STATUS_LABEL[next]} <ArrowRight size={14} />
          </button>
          {(status === "received" || status === "accepted") && (
            <button type="button" className="btn-outline px-2.5 py-2 text-xs text-danger" onClick={() => setOrderStatus(order, "cancelled")} aria-label="Zrušiť objednávku">
              <X size={14} />
            </button>
          )}
        </div>
      )}
      {order.auto && status !== "completed" && <p className="mt-2 text-[11px] text-mute">Ukážka: posúva sa automaticky, kým nezasiahnete.</p>}
    </article>
  );
}
