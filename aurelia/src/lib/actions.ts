import { LOYALTY } from "../config";
import { findSlots, type Req, type Slot } from "./availability";
import { liveService } from "./catalog";
import { formatDateLong, fromISODate, makeCode, minutesToTime, uid } from "./format";
import { loyaltyState, quote, referralCodeFor, rewardCode } from "./loyalty";
import { getDB, updateDB } from "./store";
import type { Account, Appointment } from "./types";

/**
 * Everything that changes bookings and accounts goes through here, so the public site, the client account and the
 * admin all follow the same rules.
 */

const sameSlot = (a: Slot, b: Slot) => a.start === b.start && a.parts.every((p, i) => p.specialistId === b.parts[i]?.specialistId);

/** The slot may have been taken in another tab since it was shown; check again right before saving. */
export function slotStillFree(date: string, reqs: Req[], slot: Slot, now: Date, excludeId?: string, staff = false) {
  return findSlots(date, reqs, getDB(), now, { excludeId, staff }).some((s) => sameSlot(s, slot));
}

export type BookingDetails = { name: string; phone: string; email: string; note: string; firstVisit: boolean; patchTest?: "done" | "needed" };

export function createAppointment({
  reqs,
  date,
  slot,
  details,
  code,
  account,
  now,
  source = "web",
  depositPaid = false,
}: {
  reqs: Req[];
  date: string;
  slot: Slot;
  details: BookingDetails;
  code?: string;
  account: Account | null;
  now: Date;
  source?: "web" | "phone";
  depositPaid?: boolean;
}): Appointment {
  const db = getDB();
  const q = quote({
    lines: reqs.map((r, i) => ({ serviceId: r.serviceId, variantId: r.variantId, specialistId: slot.parts[i].specialistId })),
    account,
    code,
    db,
    now,
    date,
  });
  const note = [details.note.trim(), details.patchTest === "needed" ? "Potrebuje test citlivosti 48 h vopred." : ""].filter(Boolean).join(" ");
  const appt: Appointment = {
    id: uid(),
    code: makeCode("AU"),
    date,
    start: slot.start,
    end: slot.end,
    items: slot.parts.map((p, i) => ({
      serviceId: reqs[i].serviceId,
      variantId: reqs[i].variantId,
      name: liveService(reqs[i].serviceId, db.serviceOverrides).name,
      specialistId: p.specialistId,
      start: p.start,
      end: p.end,
      price: q.lines[i].price,
    })),
    clientName: details.name.trim(),
    phone: details.phone,
    email: details.email.trim().toLowerCase(),
    note,
    accountId: account?.id,
    subtotal: q.subtotal,
    discounts: q.discounts,
    total: q.total,
    deposit: q.deposit,
    depositPaid,
    status: "confirmed",
    source,
    createdAt: now.getTime(),
    log: [{ at: now.getTime(), text: source === "web" ? "Rezervované online" : "Zapísané telefonicky v salóne" }],
    rewardCode: q.code?.kind === "reward" ? code?.trim().toUpperCase() : undefined,
    referralCode: q.code?.kind === "referral" ? code?.trim().toUpperCase() : undefined,
    firstVisit: details.firstVisit,
  };
  updateDB((current) => ({
    ...current,
    appointments: [...current.appointments, appt],
    accounts: appt.rewardCode
      ? current.accounts.map((a) =>
          a.id === account?.id ? { ...a, rewards: a.rewards.map((r) => (r.code === appt.rewardCode ? { ...r, usedAt: now.getTime(), usedOn: appt.code } : r)) } : a,
        )
      : current.accounts,
  }));
  return appt;
}

export function rescheduleAppointment(appt: Appointment, date: string, slot: Slot, now: Date, by: "client" | "salon") {
  const when = `${formatDateLong(fromISODate(date))} o ${minutesToTime(slot.start)}`;
  updateDB((db) => ({
    ...db,
    appointments: db.appointments.map((a) =>
      a.id === appt.id
        ? {
            ...a,
            date,
            start: slot.start,
            end: slot.end,
            items: a.items.map((item, i) => ({ ...item, specialistId: slot.parts[i].specialistId, start: slot.parts[i].start, end: slot.parts[i].end })),
            status: "confirmed",
            log: [...a.log, { at: now.getTime(), text: `Presunuté ${by === "client" ? "klientkou" : "salónom"} na ${when}` }],
          }
        : a,
    ),
  }));
}

export function cancelAppointment(appt: Appointment, now: Date, by: "client" | "salon", reason?: string) {
  updateDB((db) => ({
    ...db,
    appointments: db.appointments.map((a) =>
      a.id === appt.id
        ? { ...a, status: "cancelled", cancelReason: reason, log: [...a.log, { at: now.getTime(), text: by === "client" ? `Zrušené klientkou${reason ? `: ${reason}` : ""}` : "Zrušené salónom" }] }
        : a,
    ),
    // A reward used on a cancelled visit goes back to the client.
    accounts: appt.rewardCode
      ? db.accounts.map((acc) => (acc.id === appt.accountId ? { ...acc, rewards: acc.rewards.map((r) => (r.code === appt.rewardCode ? { ...r, usedAt: undefined, usedOn: undefined } : r)) } : acc))
      : db.accounts,
  }));
}

export function updateNote(appt: Appointment, note: string, now: Date) {
  updateDB((db) => ({
    ...db,
    appointments: db.appointments.map((a) => (a.id === appt.id ? { ...a, note, log: [...a.log, { at: now.getTime(), text: "Upravená poznámka" }] } : a)),
  }));
}

// ---------------------------------------------------------------------------------------------------------------
// Accounts

export function login(email: string, password: string): Account | null {
  const account = getDB().accounts.find((a) => a.email === email.trim().toLowerCase() && a.password === password);
  if (account) updateDB((db) => ({ ...db, sessionAccountId: account.id }));
  return account ?? null;
}

export const logout = () => updateDB((db) => ({ ...db, sessionAccountId: null }));

export function emailTaken(email: string) {
  return getDB().accounts.some((a) => a.email === email.trim().toLowerCase());
}

export function register(data: { name: string; email: string; phone: string; password: string; birthday?: string; marketing?: boolean }, now: Date): Account {
  const account: Account = {
    id: uid(),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone,
    password: data.password,
    birthday: data.birthday || undefined,
    createdAt: now.getTime(),
    careNotes: "",
    marketing: !!data.marketing,
    reminders: true,
    referralCode: referralCodeFor(data.name),
    ledger: [{ id: uid(), at: now.getTime(), points: LOYALTY.signupBonus, label: "Bonus za registráciu" }],
    rewards: [],
  };
  updateDB((db) => ({
    ...db,
    accounts: [...db.accounts, account],
    sessionAccountId: account.id,
    // Earlier bookings made with the same e-mail join the new account and start earning points.
    appointments: db.appointments.map((a) => (!a.generated && !a.accountId && a.email === account.email ? { ...a, accountId: account.id } : a)),
  }));
  return account;
}

export function updateAccount(id: string, patch: Partial<Account>) {
  updateDB((db) => ({ ...db, accounts: db.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
}

export function deleteAccount(id: string) {
  updateDB((db) => ({
    ...db,
    sessionAccountId: db.sessionAccountId === id ? null : db.sessionAccountId,
    accounts: db.accounts.filter((a) => a.id !== id),
    appointments: db.appointments.map((a) => (a.accountId === id ? { ...a, accountId: undefined } : a)),
  }));
}

/** Swaps points for a reward code. Returns the code, or null when the balance is too low. */
export function redeemReward(account: Account, rewardId: string, now: Date): string | null {
  const reward = LOYALTY.rewards.find((r) => r.id === rewardId);
  if (!reward) return null;
  const { balance } = loyaltyState(account, getDB(), now);
  if (balance < reward.points) return null;
  const code = rewardCode();
  updateDB((db) => ({
    ...db,
    accounts: db.accounts.map((a) =>
      a.id === account.id
        ? {
            ...a,
            ledger: [...a.ledger, { id: uid(), at: now.getTime(), points: -reward.points, label: `Výmena za odmenu: ${reward.title}` }],
            rewards: [...a.rewards, { code, rewardId, createdAt: now.getTime() }],
          }
        : a,
    ),
  }));
  return code;
}
