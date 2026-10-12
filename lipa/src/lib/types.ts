export type AreaId = "interier" | "terasa" | "bar" | "chefs";

export type ReservationStatus = "confirmed" | "seated" | "completed" | "noshow" | "cancelled";

export type Reservation = {
  id: string;
  code: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  guests: number;
  area: AreaId;
  name: string;
  email: string;
  phone: string;
  occasion?: string;
  note?: string;
  extras: string[];
  status: ReservationStatus;
  source: "web" | "phone" | "walkin";
  createdAt: number;
  /** Paid deposit in euros (chef's table). */
  deposit?: number;
  /** True for bookings generated to make the demo restaurant look busy. */
  generated?: boolean;
};

export type OrderStatus = "received" | "accepted" | "preparing" | "ready" | "delivering" | "completed" | "cancelled";

export type OrderLine = {
  key: string;
  itemId: string;
  name: string;
  qty: number;
  /** Price of one portion including options. */
  unitPrice: number;
  options: string[];
  note?: string;
};

export type Order = {
  id: string;
  number: number;
  mode: "pickup" | "delivery";
  lines: OrderLine[];
  subtotal: number;
  packaging: number;
  deliveryFee: number;
  discount: number;
  voucherCode?: string;
  voucherUsed: number;
  promoCode?: string;
  total: number;
  customer: { name: string; phone: string; email: string };
  address?: { street: string; zip: string; city: string; floor?: string; zone: string };
  /** Epoch ms of the requested time; undefined means as soon as possible. */
  scheduledFor?: number;
  payment: "card" | "cash" | "voucher";
  note?: string;
  cutlery: boolean;
  createdAt: number;
  /** While true, the status advances on the demo timeline; staff changes in the admin switch it off. */
  auto: boolean;
  history: { status: OrderStatus; at: number }[];
};

export type Voucher = {
  code: string;
  kind: "value" | "experience";
  title: string;
  amount: number;
  balance: number;
  design: string;
  to: string;
  from: string;
  message: string;
  delivery: "email" | "scheduled" | "post";
  sendOn?: string;
  buyerEmail: string;
  createdAt: number;
  validUntil: number;
};

export type TicketPurchase = {
  id: string;
  code: string;
  eventId: string;
  qty: number;
  name: string;
  email: string;
  total: number;
  createdAt: number;
};

export type InquiryStatus = "new" | "offer" | "confirmed" | "declined";

export type Inquiry = {
  id: string;
  ref: string;
  type: string;
  date: string;
  guests: number;
  space: string;
  pkg: string;
  wine: boolean;
  estimate: number;
  name: string;
  company?: string;
  email: string;
  phone: string;
  message?: string;
  status: InquiryStatus;
  createdAt: number;
};

export type LunchDish = { id: string; name: string; detail: string; allergens: number[]; price: number; tags?: string[] };
export type LunchDay = { soup: { name: string; detail: string; allergens: number[] }; dishes: LunchDish[] };

export type ContactMessage = { id: string; name: string; email: string; topic: string; message: string; createdAt: number };
