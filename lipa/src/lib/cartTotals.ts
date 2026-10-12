import { PROMO_CODES } from "../config";
import { DELIVERY_ZONES, FREE_DELIVERY_FROM, zoneForZip } from "../data/content";
import { roundMoney } from "./format";
import type { DB } from "./store";
import type { OrderLine } from "./types";

export type CartLine = OrderLine & { packaging: number };

export type CartState = {
  lines: CartLine[];
  mode: "pickup" | "delivery";
  promo?: string;
  voucher?: string;
  zip?: string;
};

export function cartTotals(cart: CartState, db: DB) {
  const subtotal = roundMoney(cart.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0));
  const packaging = roundMoney(cart.lines.reduce((sum, l) => sum + l.packaging * l.qty, 0));
  const items = cart.lines.reduce((sum, l) => sum + l.qty, 0);
  const promo = cart.promo ? PROMO_CODES[cart.promo] : undefined;
  const promoBlocked = !!promo?.minSubtotal && subtotal < promo.minSubtotal;
  const discount = promo?.percent && !promoBlocked ? roundMoney((subtotal * promo.percent) / 100) : 0;
  const zone = cart.mode === "delivery" && cart.zip ? zoneForZip(cart.zip) : null;
  const freeDelivery = !!promo?.freeDelivery || subtotal >= FREE_DELIVERY_FROM;
  const deliveryFee = cart.mode === "delivery" && !freeDelivery ? (zone?.fee ?? DELIVERY_ZONES[0].fee) : 0;
  const beforeVoucher = roundMoney(subtotal + packaging + deliveryFee - discount);
  const voucher = cart.voucher ? db.vouchers.find((v) => v.code === cart.voucher) : undefined;
  const voucherUsed = voucher ? roundMoney(Math.min(voucher.balance, beforeVoucher)) : 0;
  const total = roundMoney(beforeVoucher - voucherUsed);
  const minOrder = cart.mode === "delivery" ? (zone?.min ?? DELIVERY_ZONES[0].min) : 0;
  return {
    items,
    subtotal,
    packaging,
    discount,
    promo,
    promoBlocked,
    zone,
    deliveryFee,
    freeDelivery,
    voucher,
    voucherUsed,
    total,
    minOrder,
    missingForMin: roundMoney(Math.max(0, minOrder - subtotal)),
    missingForFree: cart.mode === "delivery" && !freeDelivery ? roundMoney(FREE_DELIVERY_FROM - subtotal) : 0,
  };
}
