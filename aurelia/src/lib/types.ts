export type ApptStatus = "confirmed" | "arrived" | "completed" | "noshow" | "cancelled";

/** One service inside a visit, done by one specialist. Times are minutes after midnight. */
export type ApptItem = {
  serviceId: string;
  variantId?: string;
  name: string;
  specialistId: string;
  start: number;
  end: number;
  price: number;
};

export type Appointment = {
  id: string;
  /** Short code the client uses to manage the booking, e.g. AU-7KQ2. */
  code: string;
  date: string;
  start: number;
  end: number;
  items: ApptItem[];
  clientName: string;
  phone: string;
  email: string;
  note: string;
  accountId?: string;
  subtotal: number;
  discounts: { label: string; amount: number }[];
  total: number;
  deposit: number;
  depositPaid: boolean;
  status: ApptStatus;
  source: "web" | "phone";
  createdAt: number;
  cancelReason?: string;
  /** Change history shown to the client and in the admin. */
  log: { at: number; text: string }[];
  /** Specialist's note visible in the client's history, e.g. the colour formula. */
  stylistNote?: string;
  rewardCode?: string;
  referralCode?: string;
  /** Other clients' bookings made up for the demo. */
  generated?: boolean;
  firstVisit?: boolean;
};

export type LedgerEntry = { id: string; at: number; points: number; label: string };

export type RewardCode = { code: string; rewardId: string; createdAt: number; usedAt?: number; usedOn?: string };

export type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  /** MM-DD */
  birthday?: string;
  createdAt: number;
  favouriteSpecialist?: string;
  /** Allergies, sensitive skin, preferences. Shown to the specialist. */
  careNotes: string;
  marketing: boolean;
  reminders: boolean;
  referralCode: string;
  referredBy?: string;
  /** Points not tied to a visit: sign-up bonus, referrals, redemptions. */
  ledger: LedgerEntry[];
  rewards: RewardCode[];
};

export type WaitlistEntry = {
  id: string;
  date: string;
  services: string;
  specialistId: string;
  name: string;
  phone: string;
  email: string;
  createdAt: number;
  status: "waiting" | "offered";
};

export type Block = { id: string; specialistId: string; date: string; start: number; end: number; label: string };

export type ContactMessage = { id: string; name: string; email: string; phone?: string; topic: string; message: string; createdAt: number; read: boolean };

export type ServiceOverride = { price?: number; duration?: number; online?: boolean };
