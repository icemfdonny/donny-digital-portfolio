import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartPanel from "../components/CartPanel";
import DishOrderForm, { type OrderableItem } from "../components/DishOrder";
import { ArrowRight, Bag, Clock, Plus, Store, Truck } from "../components/icons";
import { useToast } from "../components/toast";
import { Allergens, DietBadges, Dialog, PageHero, Photo, Segmented } from "../components/ui";
import { LUNCH, ORDERING } from "../config";
import { FREE_DELIVERY_FROM } from "../data/content";
import { lunchFor } from "../data/lunch";
import { CATEGORIES, DISHES, type DietTag, type Dish } from "../data/menu";
import type { PhotoKey } from "../data/photos";
import { useCart } from "../lib/cart";
import { formatClock, formatPrice, minutesOfDay, minutesToTime, startOfDay } from "../lib/format";
import { isLunchDay, relativeDay } from "../lib/hours";
import { useMediaQuery, useNow, usePageMeta } from "../lib/hooks";
import { orderWindow } from "../lib/ordering";
import { useDB } from "../lib/store";

type Item = OrderableItem & { description: string; portion: string; allergens: number[]; diet: DietTag[]; photo?: PhotoKey; soldOut: boolean };

export default function OrderPage() {
  usePageMeta("Rozvoz a jedlo so sebou", "Objednajte si jedlo z Lipy domov alebo do kancelárie. Rozvoz po Bratislave, vyzdvihnutie do 20 minút.");
  const db = useDB();
  const now = useNow(30_000);
  const navigate = useNavigate();
  const toast = useToast();
  const { cart, totals, setMode, add } = useCart();
  const [open, setOpen] = useState<Item | null>(null);
  const [drawer, setDrawer] = useState(false);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const win = orderWindow(now, cart.mode);

  const lunch = useMemo(() => {
    const today = startOfDay(now);
    if (!isLunchDay(today) || minutesOfDay(now) >= LUNCH.to - ORDERING.pickupMinutes) return null;
    return lunchFor(today, db.lunch);
  }, [now, db.lunch]);

  const sections = useMemo(() => {
    const toItem = (d: Dish): Item => ({ ...d, soldOut: db.soldOut.includes(d.id) });
    const list: { id: string; name: string; note?: string; items: Item[] }[] = [];
    if (lunch) {
      list.push({
        id: "obed",
        name: "Dnešné obedové menu",
        note: `Polievka (${lunch.soup.name.toLowerCase()}) je v cene. Objednávky do ${minutesToTime(LUNCH.to - ORDERING.pickupMinutes)}.`,
        items: lunch.dishes.map((d) => ({
          id: d.id,
          name: d.name,
          description: `+ ${lunch.soup.name}`,
          portion: d.detail,
          price: d.price,
          allergens: [...new Set([...lunch.soup.allergens, ...d.allergens])].sort((a, b) => a - b),
          diet: (d.tags ?? []) as DietTag[],
          packaging: LUNCH.box,
          soldOut: db.soldOut.includes(d.id),
        })),
      });
    }
    for (const c of CATEGORIES) list.push({ id: c.id, name: c.name, note: c.note, items: DISHES.filter((d) => d.category === c.id).map(toItem) });
    return list;
  }, [lunch, db.soldOut]);


  const quickAdd = (item: Item) => {
    if (item.soldOut) return;
    if (item.options?.length) {
      setOpen(item);
      return;
    }
    add({ itemId: item.id, name: item.name, qty: 1, unitPrice: item.price, options: [], packaging: item.packaging ?? ORDERING.packaging });
    toast(<>{item.name} v košíku</>);
  };

  const toCheckout = () => navigate("/objednavka/pokladna");

  return (
    <>
      <PageHero
        eyebrow="Rozvoz a so sebou"
        title={
          <>
            Lipa aj <em className="text-honey-soft">u vás doma.</em>
          </>
        }
        text={`Vyzdvihnutie do ${ORDERING.pickupMinutes} minút, rozvoz po Bratislave do ${ORDERING.deliveryMinutes} minút. Balíme do kompostovateľných obalov, doprava zadarmo od ${formatPrice(FREE_DELIVERY_FROM)}.`}
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Segmented
            tone="dark"
            label="Spôsob prevzatia"
            value={cart.mode}
            onChange={setMode}
            options={[
              {
                value: "pickup",
                label: (
                  <>
                    <Store size={16} /> Vyzdvihnem si
                  </>
                ),
              },
              {
                value: "delivery",
                label: (
                  <>
                    <Truck size={16} /> Rozvoz
                  </>
                ),
              },
            ]}
          />
          <p className="flex items-center gap-2 text-sm text-cream/70">
            <Clock size={16} />
            {win.asap
              ? `Teraz ${cart.mode === "pickup" ? "pripravíme" : "privezieme"} za ~${cart.mode === "pickup" ? ORDERING.pickupMinutes : ORDERING.deliveryMinutes} min`
              : win.times.length
                ? `Kuchyňa je zatvorená. Objednávku prijmeme na ${relativeDay(win.day, now)} od ${formatClock(win.times[0])}.`
                : "Momentálne neprijímame objednávky."}
          </p>
        </div>
      </PageHero>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
        <div className="min-w-0">
          <nav aria-label="Kategórie" className="no-scrollbar sticky top-[72px] z-20 -mx-5 flex gap-1 overflow-x-auto border-b border-line bg-cream/95 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${s.id === "obed" ? "bg-honey-soft font-medium text-forest" : "text-soft hover:bg-sand hover:text-ink"}`}
              >
                {s.id === "obed" ? "Obed dnes" : s.name}
              </a>
            ))}
          </nav>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-36 pt-10">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-3xl text-forest">{section.name}</h2>
                {section.note && <p className="text-sm text-mute">{section.note}</p>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {section.items.map((item) => (
                  <article
                    key={item.id}
                    className={`group relative flex gap-4 rounded-2xl border border-line bg-paper p-4 transition-[border-color,box-shadow] ${
                      item.soldOut ? "opacity-55" : "hover:border-ink/25 hover:shadow-[0_8px_24px_-12px_rgb(27_35_29/0.25)]"
                    }`}
                  >
                    <button type="button" className="absolute inset-0 rounded-2xl" onClick={() => (item.soldOut ? null : setOpen(item))} aria-label={`${item.name}, detail`} disabled={item.soldOut} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium leading-snug">{item.name}</h3>
                      {item.description && <p className="mt-1 line-clamp-2 text-sm text-soft">{item.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-mute">{item.portion}</span>
                        <Allergens list={item.allergens} />
                        <DietBadges diet={item.diet} />
                      </div>
                      <p className="mt-3 font-medium tabular-nums">
                        {item.soldOut ? <span className="text-sm font-semibold text-wine">Dnes vypredané</span> : formatPrice(item.price)}
                        {item.options?.length ? <span className="ml-2 text-xs font-normal text-mute">s možnosťami</span> : null}
                      </p>
                    </div>
                    <div className="relative flex shrink-0 flex-col items-end justify-between gap-3">
                      {item.photo && <Photo name={item.photo} className="size-24 rounded-xl" showLabel={false} />}
                      <button
                        type="button"
                        onClick={() => quickAdd(item)}
                        disabled={item.soldOut || (!win.asap && !win.times.length)}
                        className="relative z-10 grid size-10 place-items-center rounded-full bg-forest text-cream transition-transform hover:scale-105 disabled:bg-line disabled:text-mute"
                        aria-label={`Pridať ${item.name} do košíka`}
                      >
                        <Plus size={19} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-2xl text-forest">Košík</h2>
              <span className="flex items-center gap-1.5 text-sm text-soft">
                {cart.mode === "pickup" ? <Store size={16} /> : <Truck size={16} />}
                {cart.mode === "pickup" ? "Vyzdvihnutie" : "Rozvoz"}
              </span>
            </div>
            <CartPanel onCheckout={toCheckout} />
          </div>
        </aside>
      </div>

      {totals.items > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 p-3 backdrop-blur-md lg:hidden">
          <button type="button" className="btn-primary w-full justify-between py-3.5" onClick={() => setDrawer(true)}>
            <span className="flex items-center gap-2">
              <Bag size={18} /> Košík · {totals.items}
            </span>
            <span className="flex items-center gap-2 tabular-nums">
              {formatPrice(totals.total)} <ArrowRight size={17} />
            </span>
          </button>
        </div>
      )}

      <Dialog open={drawer && !desktop} onClose={() => setDrawer(false)} variant="drawer" title="Košík">
        <CartPanel
          onCheckout={() => {
            setDrawer(false);
            toCheckout();
          }}
        />
      </Dialog>

      <Dialog open={!!open} onClose={() => setOpen(null)} size="md" labelledBy="order-item-title">
        {open && (
          <>
            {open.photo ? <Photo name={open.photo} className="aspect-[16/9]" /> : null}
            <div className="px-6 pt-6">
              <h2 id="order-item-title" className="font-display text-[1.7rem] leading-tight text-forest">
                {open.name}
              </h2>
              <p className="mt-1.5 text-soft">{open.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-mute">{open.portion}</span>
                <Allergens list={open.allergens} />
                <DietBadges diet={open.diet} />
              </div>
            </div>
            <DishOrderForm item={open} onDone={() => setOpen(null)} disabled={!win.asap && !win.times.length ? "Objednávky sú pozastavené" : null} />
          </>
        )}
      </Dialog>

    </>
  );
}
