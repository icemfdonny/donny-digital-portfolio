export type CardState = { number: string; expiry: string; cvc: string; name: string };
export type CardErrors = Partial<Record<keyof CardState, string>>;

export const emptyCard: CardState = { number: "", expiry: "", cvc: "", name: "" };

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function validateCard(card: CardState): CardErrors {
  const errors: CardErrors = {};
  const digits = card.number.replace(/\D/g, "");
  if (digits.length < 13 || !luhn(digits)) errors.number = "Číslo karty nie je platné.";
  const [mm, yy] = card.expiry.split("/").map((v) => Number(v));
  const now = new Date();
  const expiry = new Date(2000 + (yy || 0), mm || 0, 1);
  if (!mm || mm > 12 || !yy || expiry <= now) errors.expiry = "Skontrolujte platnosť.";
  if (!/^\d{3,4}$/.test(card.cvc)) errors.cvc = "3 číslice zo zadnej strany.";
  if (card.name.trim().length < 3) errors.name = "Meno ako na karte.";
  return errors;
}

/** Pretends to talk to the bank for a moment. */
export const simulatePayment = () => new Promise<void>((resolve) => setTimeout(resolve, 1400));
