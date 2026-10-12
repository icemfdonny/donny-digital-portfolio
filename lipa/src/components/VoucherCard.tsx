import { VOUCHER_DESIGNS } from "../data/content";
import { formatDateNumeric, formatPrice } from "../lib/format";
import { LeafMark, QrCode } from "./ui";

/** The voucher as the recipient sees it: live preview while building, printable once bought. */
export default function VoucherCard({
  design,
  title,
  amount,
  to,
  from,
  message,
  code,
  validUntil,
  large = false,
}: {
  design: string;
  title: string;
  amount: number;
  to: string;
  from: string;
  message: string;
  code?: string;
  validUntil?: number;
  large?: boolean;
}) {
  const d = VOUCHER_DESIGNS.find((v) => v.id === design) ?? VOUCHER_DESIGNS[0];
  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl transition-colors duration-500" style={{ background: d.bg, color: d.fg }}>
      <LeafMark className="pointer-events-none absolute -bottom-16 -right-12 size-64 opacity-[0.08]" />
      <div className={`relative flex flex-col ${large ? "gap-8 p-8 sm:p-10" : "gap-6 p-7"}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-3xl italic">Lipa</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-60">Kuchyňa &amp; vínny bar</p>
          </div>
          <span style={{ color: d.accent }}>
            <LeafMark className="size-10" />
          </span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] opacity-60">Darčeková poukážka</p>
          <p className={`mt-1 font-display leading-tight ${large ? "text-5xl" : "text-4xl"}`} style={{ color: d.accent }}>
            {amount ? formatPrice(amount) : "—"}
          </p>
          <p className="mt-1 text-sm opacity-75">{title}</p>
        </div>
        <div className="min-h-[3.5rem] border-t pt-4 text-sm" style={{ borderColor: `${d.fg}22` }}>
          {/* Labels instead of a sentence: names would need Slovak declension ("pre Zuzku od Peťa"). */}
          <dl className="flex gap-8">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] opacity-55">Pre</dt>
              <dd className="font-medium">{to || "…"}</dd>
            </div>
            {from && (
              <div>
                <dt className="text-[10px] uppercase tracking-[0.2em] opacity-55">Od</dt>
                <dd className="font-medium">{from}</dd>
              </div>
            )}
          </dl>
          {message && <p className="mt-1.5 font-display text-lg italic leading-snug">„{message}“</p>}
        </div>
        {code && (
          <div className="flex items-end justify-between gap-4">
            <div className="text-sm">
              <p className="opacity-60">Kód</p>
              <p className="font-medium tracking-wider tabular-nums">{code}</p>
              {validUntil && <p className="mt-1 text-xs opacity-60">Platí do {formatDateNumeric(new Date(validUntil))}</p>}
            </div>
            <div className="rounded-xl bg-white p-1.5">
              <QrCode value={`LIPA:${code}`} size={84} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
