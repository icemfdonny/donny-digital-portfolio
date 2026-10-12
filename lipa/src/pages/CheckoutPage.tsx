import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartPanel from "../components/CartPanel";
import { ArrowLeft, Card, Cash, Check, Clock, Gift, Lock, MapPin, Store, Truck } from "../components/icons";
import { CardForm, Spinner } from "../components/Payment";
import { emptyCard, simulatePayment, validateCard, type CardErrors, type CardState } from "../lib/payment";
import { Checkbox, PageHero, TextArea, TextField } from "../components/ui";
import { RESTAURANT } from "../config";
import { zoneForZip } from "../data/content";
import { useCart } from "../lib/cart";
import { formatClock, formatPrice, isEmail, normalizePhone, roundMoney, uid } from "../lib/format";
import { relativeDay } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { orderWindow } from "../lib/ordering";
import { getDB, updateDB } from "../lib/store";
import type { Order } from "../lib/types";

export default function CheckoutPage() {
  usePageMeta("Pokladňa");
  const now = useNow(30_000);
  const navigate = useNavigate();
  const { cart, totals, clear, setZip } = useCart();
  const win = orderWindow(now, cart.mode);
  const [form, setForm] = useState({ name: "", phone: "", email: "", street: "", zip: cart.zip ?? "", floor: "", note: "" });
  const [when, setWhen] = useState<string>(win.asap ? "asap" : String(win.times[0]?.getTime() ?? ""));
  const [payment, setPayment] = useState<"card" | "cash">("card");
  const [cutlery, setCutlery] = useState(false);
  const [terms, setTerms] = useState(false);
  const [card, setCard] = useState<CardState>(emptyCard);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [busy, setBusy] = useState(false);
  // Set just before the cart is cleared, so the "empty cart" screen never flashes on the way to tracking.
  const [placed, setPlaced] = useState(false);

  if (placed) return <div className="min-h-[70vh] bg-forest" aria-busy="true" />;

  if (!cart.lines.length) {
    return (
      <>
        <PageHero eyebrow="Pokladňa" title="Košík je prázdny" text="Najprv si vyberte, na čo máte chuť.">
          <Link to="/objednavka" className="btn-honey mt-8">
            Prejsť na menu
          </Link>
        </PageHero>
        <div className="h-24" />
      </>
    );
  }

  const paidByVoucher = totals.total === 0;
  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "zip" && value.replace(/\s/g, "").length === 5) setZip(value);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (form.name.trim().length < 3) found.name = "Napíšte meno a priezvisko.";
    if (!normalizePhone(form.phone)) found.phone = "Kuriér vám zavolá, ak nebude vedieť nájsť adresu.";
    if (!isEmail(form.email)) found.email = "Pošleme naň potvrdenie a bloček.";
    if (cart.mode === "delivery") {
      if (form.street.trim().length < 4) found.street = "Ulica a číslo domu.";
      if (!zoneForZip(form.zip)) found.zip = "Na toto PSČ zatiaľ nevozíme.";
    }
    if (!when || (when === "asap" && !win.asap)) found.when = "Vyberte čas.";
    if (!terms) found.terms = "Potrebujeme váš súhlas s obchodnými podmienkami.";
    const foundCard = payment === "card" && !paidByVoucher ? validateCard(card) : {};
    setErrors(found);
    setCardErrors(foundCard);
    if (Object.keys(found).length || Object.keys(foundCard).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    if (totals.missingForMin > 0) return;
    setBusy(true);
    if (payment === "card" && !paidByVoucher) await simulatePayment();
    else await new Promise((r) => setTimeout(r, 600));

    const createdAt = Date.now();
    const zone = cart.mode === "delivery" ? zoneForZip(form.zip) : null;
    const order: Order = {
      id: uid(),
      number: getDB().nextOrderNumber,
      mode: cart.mode,
      lines: cart.lines.map(({ packaging: _packaging, ...line }) => line),
      subtotal: totals.subtotal,
      packaging: totals.packaging,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      promoCode: totals.discount || (cart.promo && totals.promo?.freeDelivery) ? cart.promo : undefined,
      voucherCode: totals.voucherUsed ? cart.voucher : undefined,
      voucherUsed: totals.voucherUsed,
      total: totals.total,
      customer: { name: form.name.trim(), phone: normalizePhone(form.phone)!, email: form.email.trim() },
      address: zone ? { street: form.street.trim(), zip: form.zip.trim(), city: RESTAURANT.city, floor: form.floor.trim() || undefined, zone: zone.name } : undefined,
      scheduledFor: when === "asap" ? undefined : Number(when),
      payment: paidByVoucher ? "voucher" : payment,
      note: form.note.trim() || undefined,
      cutlery,
      createdAt,
      auto: true,
      history: [{ status: "received", at: createdAt }],
    };
    updateDB((db) => ({
      ...db,
      orders: [...db.orders, order],
      nextOrderNumber: db.nextOrderNumber + 1,
      vouchers: order.voucherCode
        ? db.vouchers.map((v) => (v.code === order.voucherCode ? { ...v, balance: roundMoney(v.balance - order.voucherUsed) } : v))
        : db.vouchers,
    }));
    setPlaced(true);
    navigate(`/objednavka/${order.id}`);
    clear();
  };

  return (
    <>
      <PageHero eyebrow="Pokladňa" title="Ešte pár údajov a varíme." />
      <form onSubmit={submit} noValidate className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_400px] lg:py-14">
        <div className="space-y-10">
          <Link to="/objednavka" className="inline-flex items-center gap-2 text-sm text-soft hover:text-ink">
            <ArrowLeft size={16} /> Späť na menu
          </Link>

          <Section n={1} title="Kontakt">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Meno a priezvisko" required autoComplete="name" value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} className="sm:col-span-2" />
              <TextField label="Telefón" required type="tel" autoComplete="tel" placeholder="0905 123 456" value={form.phone} error={errors.phone} onChange={(e) => set("phone", e.target.value)} />
              <TextField label="E-mail" required type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </Section>

          <Section n={2} title={cart.mode === "delivery" ? "Kam vám to privezieme" : "Kde si to vyzdvihnete"}>
            {cart.mode === "delivery" ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                <TextField label="Ulica a číslo" required autoComplete="street-address" value={form.street} error={errors.street} onChange={(e) => set("street", e.target.value)} />
                <TextField
                  label="PSČ"
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={form.zip}
                  error={errors.zip}
                  hint={zoneForZip(form.zip) ? `${zoneForZip(form.zip)!.name} ✓` : undefined}
                  onChange={(e) => set("zip", e.target.value)}
                />
                <TextField label="Poschodie, zvonček, firma" value={form.floor} onChange={(e) => set("floor", e.target.value)} className="sm:col-span-2" />
              </div>
            ) : (
              <div className="flex items-start gap-4 rounded-2xl border border-line bg-paper p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest/[0.06] text-moss">
                  <Store size={19} />
                </span>
                <div className="text-[15px]">
                  <p className="font-medium">
                    {RESTAURANT.fullName}, {RESTAURANT.street}
                  </p>
                  <p className="mt-1 text-sm text-soft">Objednávka bude čakať pri bare na vaše meno. Parkovať môžete 2 minúty pred vchodom.</p>
                </div>
              </div>
            )}
          </Section>

          <Section n={3} title="Kedy">
            {!win.asap && (
              <p className="mb-4 flex items-start gap-2 rounded-2xl bg-honey-soft/60 p-4 text-sm text-forest">
                <Clock size={17} className="mt-0.5 shrink-0" />
                Kuchyňa je teraz zatvorená. Objednávku pripravíme {relativeDay(win.day, now)} v čase, ktorý si vyberiete.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {win.asap && (
                <button type="button" className="chip" aria-pressed={when === "asap"} onClick={() => setWhen("asap")}>
                  Čo najskôr
                </button>
              )}
              <select
                aria-label="Konkrétny čas"
                className={`chip appearance-none pr-8 ${when !== "asap" ? "border-forest bg-forest text-cream" : ""}`}
                value={when === "asap" ? "" : when}
                onChange={(e) => setWhen(e.target.value || "asap")}
              >
                <option value="">{win.asap ? "Na konkrétny čas…" : "Vyberte čas"}</option>
                {win.times.map((t) => (
                  <option key={t.getTime()} value={t.getTime()}>
                    {relativeDay(t, now)} {formatClock(t)}
                  </option>
                ))}
              </select>
            </div>
            {errors.when && <p className="mt-2 text-sm text-danger">{errors.when}</p>}
            <TextArea label="Poznámka" placeholder={cart.mode === "delivery" ? "Napr. zvoňte na recepciu" : "Napr. prídem o 5 minút neskôr"} value={form.note} onChange={(e) => set("note", e.target.value)} className="mt-5" />
          </Section>

          <Section n={4} title="Platba">
            {paidByVoucher ? (
              <p className="flex items-center gap-3 rounded-2xl bg-moss/10 p-4 text-[15px] text-moss">
                <Gift size={19} /> Celú objednávku hradíte poukážkou {cart.voucher}.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <PayOption active={payment === "card"} onClick={() => setPayment("card")} icon={<Card size={20} />} title="Kartou online" text="Visa, Mastercard, Apple Pay, Google Pay" />
                  <PayOption
                    active={payment === "cash"}
                    onClick={() => setPayment("cash")}
                    icon={<Cash size={20} />}
                    title={cart.mode === "delivery" ? "Pri prevzatí" : "Pri vyzdvihnutí"}
                    text="Kartou alebo v hotovosti"
                  />
                </div>
                {payment === "card" && <CardForm card={card} onChange={setCard} errors={cardErrors} />}
              </div>
            )}
          </Section>

          <div className="space-y-3">
            <Checkbox checked={cutlery} onChange={setCutlery}>
              Pribaliť príbor a servítky (šetríme prírodu, preto len na požiadanie)
            </Checkbox>
            <Checkbox checked={terms} onChange={setTerms} error={errors.terms}>
              Súhlasím s obchodnými podmienkami a so spracovaním údajov na vybavenie objednávky. <span className="text-honey">*</span>
            </Checkbox>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-2xl text-forest">Vaša objednávka</h2>
              <span className="flex items-center gap-1.5 text-sm text-soft">
                {cart.mode === "pickup" ? <Store size={16} /> : <Truck size={16} />}
                {cart.mode === "pickup" ? "Vyzdvihnutie" : "Rozvoz"}
              </span>
            </div>
            <CartPanel showZip={false} />
            <div className="border-t border-line px-6 py-5">
              <button type="submit" className="btn-honey w-full py-4 text-base" disabled={busy || totals.missingForMin > 0}>
                {busy ? (
                  <>
                    <Spinner /> {payment === "card" && !paidByVoucher ? "Overujeme platbu…" : "Odosielame…"}
                  </>
                ) : payment === "card" && !paidByVoucher ? (
                  <>
                    <Lock size={17} /> Zaplatiť {formatPrice(totals.total)}
                  </>
                ) : (
                  <>
                    <Check size={17} /> Objednať za {formatPrice(totals.total)}
                  </>
                )}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-mute">
                <MapPin size={13} /> Ukážka: nič sa neúčtuje ani neodosiela
              </p>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-3 font-display text-2xl text-forest">
        <span className="grid size-8 place-items-center rounded-full bg-forest font-sans text-sm font-semibold text-cream">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function PayOption({ active, onClick, icon, title, text }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${active ? "border-forest bg-forest/[0.04] ring-1 ring-forest" : "border-line bg-paper hover:border-ink/30"}`}
    >
      <span className={active ? "text-forest" : "text-mute"}>{icon}</span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="text-sm text-soft">{text}</span>
      </span>
    </button>
  );
}
