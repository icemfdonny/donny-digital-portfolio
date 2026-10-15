import { quoteTotals } from "../lib/calc";
import { addDays, formatDateNumeric, formatPhone, formatPrice, fromISODate } from "../lib/format";
import { BIZ, TRADE } from "../lib/profile";
import type { Lead, Quote } from "../lib/types";
import { Icon } from "./icons";

/** The quote as an A4 document: used in the admin preview, on the customer's page and when printing. */
export function QuoteDocument({ quote, lead, vatPayer, town }: { quote: Quote; lead: Lead; vatPayer: boolean; town: string }) {
  const t = quoteTotals(quote.items, quote.discountPct, vatPayer);
  const issued = new Date(quote.sentAt ?? quote.createdAt);
  const groups = [
    { kind: "praca", label: "Práca" },
    { kind: "material", label: "Materiál" },
    { kind: "zariadenie", label: "Zariadenia" },
  ] as const;
  let n = 0;
  return (
    <article className="bg-white p-6 text-[13px] leading-relaxed text-ink sm:p-10">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-6">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-ink print:border print:border-ink">
            <Icon name={TRADE.icon} size={26} strokeWidth={2.3} />
          </span>
          <div>
            <p className="display text-xl leading-none">{BIZ.name}</p>
            <p className="mt-1 text-xs text-soft">{TRADE.tagline}</p>
          </div>
        </div>
        <div className="text-right text-xs text-soft">
          <p>
            {BIZ.street}, {BIZ.city}
          </p>
          <p>
            IČO {BIZ.ico} · DIČ {BIZ.dic}
          </p>
          <p>
            {BIZ.phoneLabel} · {BIZ.email}
          </p>
        </div>
      </header>
      <div className="mt-6 flex flex-wrap justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-mute">Cenová ponuka</p>
          <p className="display mt-1 text-2xl">{quote.code}</p>
          <p className="mt-1 font-semibold">{lead.jobTitle}</p>
        </div>
        <div className="text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-mute">Pre</p>
          <p className="mt-1 font-bold">{lead.name}</p>
          <p>{[lead.street, town].filter(Boolean).join(", ")}</p>
          <p>{formatPhone(lead.phone)}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-sm">
          <dt className="text-mute">Vystavená</dt>
          <dd className="font-semibold">{formatDateNumeric(issued)}</dd>
          <dt className="text-mute">Platná do</dt>
          <dd className="font-semibold">{formatDateNumeric(addDays(issued, quote.validDays))}</dd>
          {quote.startDate && (
            <>
              <dt className="text-mute">Začiatok prác</dt>
              <dd className="font-semibold">{formatDateNumeric(fromISODate(quote.startDate))}</dd>
            </>
          )}
        </dl>
      </div>

      <table className="mt-8 w-full">
        <thead>
          <tr className="border-b border-ink text-left text-[11px] uppercase tracking-wider text-mute">
            <th className="w-8 py-2 font-semibold">#</th>
            <th className="py-2 font-semibold">Položka</th>
            <th className="py-2 text-right font-semibold">Množstvo</th>
            <th className="hidden py-2 text-right font-semibold sm:table-cell print:table-cell">Cena / j.</th>
            <th className="py-2 text-right font-semibold">Spolu</th>
          </tr>
        </thead>
        {groups.map((g) => {
          const rows = quote.items.filter((i) => i.kind === g.kind);
          if (!rows.length) return null;
          return (
            <tbody key={g.kind}>
              <tr>
                <td colSpan={5} className="pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-accent-deep">
                  {g.label}
                </td>
              </tr>
              {rows.map((i) => (
                <tr key={i.id} className="border-b border-line align-top">
                  <td className="py-2 text-mute">{++n}</td>
                  <td className="py-2 pr-3">
                    {i.label}
                    <span className="block text-xs text-mute sm:hidden print:hidden">
                      {formatPrice(i.price)} / {i.unit}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right tabular-nums">
                    {i.qty.toLocaleString("sk-SK")} {i.unit}
                  </td>
                  <td className="hidden whitespace-nowrap py-2 text-right tabular-nums sm:table-cell print:table-cell">{formatPrice(i.price)}</td>
                  <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums">{formatPrice(i.qty * i.price)}</td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>

      <div className="mt-6 flex justify-end">
        <dl className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-soft">Medzisúčet</dt>
            <dd className="tabular-nums">{formatPrice(t.subtotal)}</dd>
          </div>
          {t.discount > 0 && (
            <div className="flex justify-between text-ok">
              <dt>Zľava {quote.discountPct.toLocaleString("sk-SK")} %</dt>
              <dd className="tabular-nums">−{formatPrice(t.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-soft">Základ dane</dt>
            <dd className="tabular-nums">{formatPrice(t.net)}</dd>
          </div>
          {vatPayer ? (
            <div className="flex justify-between">
              <dt className="text-soft">DPH 23 %</dt>
              <dd className="tabular-nums">{formatPrice(t.vat)}</dd>
            </div>
          ) : (
            <p className="text-xs text-mute">Nie sme platcami DPH.</p>
          )}
          <div className="flex justify-between border-t-2 border-ink pt-2 text-lg font-black">
            <dt>Spolu na úhradu</dt>
            <dd className="tabular-nums">{formatPrice(t.gross)}</dd>
          </div>
        </dl>
      </div>

      {quote.note && <p className="mt-6 whitespace-pre-line rounded-xl bg-bg p-4 text-sm">{quote.note}</p>}
      <footer className="mt-8 border-t border-line pt-4 text-xs text-soft">
        <p>
          Záloha 30 % pri podpise, zvyšok po odovzdaní diela. Záruka na prácu {TRADE.stats.warranty} rokov, na materiál podľa výrobcu. Práce nad rámec ponuky vykonáme len po vašom súhlase.
        </p>
      </footer>
    </article>
  );
}
