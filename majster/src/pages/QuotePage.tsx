import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, Info, Printer, X } from "../components/icons";
import { QuoteDocument } from "../components/QuoteDocument";
import { useToast } from "../components/toast";
import { Checkbox, Dialog, TextArea, TextField } from "../components/ui";
import { decideQuote, markQuoteViewed, useTownOf } from "../lib/actions";
import { quoteTotals } from "../lib/calc";
import { formatDateNumeric, formatPrice } from "../lib/format";
import { usePageMeta } from "../lib/hooks";
import { BIZ } from "../lib/profile";
import { markProgress, useDB } from "../lib/store";
import NotFound from "./NotFound";

/** What the customer opens from the e-mail: the quote, with accept and decline online. */
export default function QuotePage() {
  const { code } = useParams();
  usePageMeta(`Cenová ponuka ${code}`);
  const db = useDB();
  const toast = useToast();
  const townOf = useTownOf();
  const [params] = useSearchParams();
  const preview = params.get("nahlad") === "1";
  const quote = db.quotes.find((q) => q.code === code);
  const lead = quote ? db.leads.find((l) => l.id === quote.leadId) : undefined;
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [sign, setSign] = useState({ name: "", agree: false, reason: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quote && !preview) markQuoteViewed(quote.id);
  }, [quote, preview]);

  if (!quote || !lead) return <NotFound />;
  const totals = quoteTotals(quote.items, quote.discountPct, db.settings.vatPayer);
  const open = quote.status === "odoslana" || quote.status === "zobrazena";

  return (
    <div className="bg-bg pb-16 pt-8 sm:pt-12">
      <div className="container-page max-w-4xl">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mute">
              Cenová ponuka od {BIZ.name} pre {lead.name}
            </p>
            <h1 className="display text-2xl sm:text-3xl">{lead.jobTitle}</h1>
          </div>
          <button type="button" className="btn-outline btn-sm" onClick={() => window.print()}>
            <Printer size={16} /> Stiahnuť PDF
          </button>
        </div>

        {preview && quote.status === "koncept" && (
          <p className="no-print mb-4 flex items-center gap-2 rounded-xl bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">
            <Info size={17} /> Náhľad konceptu – zákazník ponuku zatiaľ nevidí.
          </p>
        )}
        {quote.status === "prijata" && (
          <p className="no-print mb-4 flex items-center gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm font-semibold text-ok">
            <Check size={17} /> Ponuku prijal {quote.acceptedBy} dňa {formatDateNumeric(new Date(quote.decidedAt!))}. Ozveme sa s potvrdením termínu.
          </p>
        )}
        {quote.status === "odmietnuta" && (
          <p className="no-print mb-4 flex items-center gap-2 rounded-xl bg-sand px-4 py-3 text-sm font-semibold text-soft">
            <X size={17} /> Ponuka bola odmietnutá. Ak ste si to rozmysleli, zavolajte nám.
          </p>
        )}

        <div className="print-area overflow-hidden rounded-2xl shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)] ring-1 ring-line">
          <QuoteDocument quote={quote} lead={lead} vatPayer={db.settings.vatPayer} town={townOf(lead)} />
        </div>

        {open && !preview && (
          <div className="no-print sticky bottom-4 mt-6 flex flex-col items-center gap-3 rounded-2xl bg-ink p-4 text-white shadow-2xl sm:flex-row sm:justify-between sm:p-5">
            <p className="text-sm">
              Spolu <strong className="text-lg">{formatPrice(totals.gross)}</strong> {db.settings.vatPayer && "s DPH"}
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button type="button" className="btn btn-sm flex-1 border border-white/20 text-white hover:bg-white/10" onClick={() => setDeclining(true)}>
                Odmietnuť
              </button>
              <button type="button" className="btn-accent btn-sm flex-1 whitespace-nowrap px-5" onClick={() => setAccepting(true)}>
                <Check size={17} /> Prijať ponuku
              </button>
            </div>
          </div>
        )}
        <Link to="/" className="no-print mt-6 block text-center text-sm font-semibold text-soft hover:text-ink">
          {BIZ.web}
        </Link>
      </div>

      <Dialog
        open={accepting}
        onClose={() => setAccepting(false)}
        title="Prijať ponuku"
        size="sm"
        footer={
          <button
            type="button"
            className="btn-accent w-full"
            onClick={() => {
              if (sign.name.trim().length < 3) return setError("Napíšte celé meno ako podpis.");
              if (!sign.agree) return setError("Potvrďte súhlas s podmienkami.");
              decideQuote(quote.id, true, sign.name.trim(), undefined, totals.gross);
              markProgress("ponuka");
              setAccepting(false);
              toast("Ďakujeme! Ponuka je prijatá, firma to už vidí.");
            }}
          >
            <Check size={18} /> Záväzne prijať za {formatPrice(totals.gross)}
          </button>
        }
      >
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-soft">Prijatím potvrdzujete objednávku prác podľa ponuky {quote.code}. Záloha 30 % sa platí pri začatí prác.</p>
          <TextField label="Podpis – vaše celé meno" value={sign.name} onChange={(e) => setSign({ ...sign, name: e.target.value })} placeholder={lead.name} className="[&_input]:font-[cursive] [&_input]:text-lg" />
          <Checkbox checked={sign.agree} onChange={(agree) => setSign({ ...sign, agree })}>
            Súhlasím s rozsahom prác, cenou a podmienkami uvedenými v ponuke.
          </Checkbox>
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
        </div>
      </Dialog>

      <Dialog
        open={declining}
        onClose={() => setDeclining(false)}
        title="Odmietnuť ponuku"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setDeclining(false)}>
              Späť
            </button>
            <button
              type="button"
              className="btn-dark btn-sm"
              onClick={() => {
                decideQuote(quote.id, false, lead.name, sign.reason.trim());
                setDeclining(false);
                toast("Ďakujeme za odpoveď.", "info");
              }}
            >
              Odmietnuť
            </button>
          </div>
        }
      >
        <div className="p-5 sm:p-6">
          <TextArea label="Čo by vás presvedčilo? (nepovinné)" value={sign.reason} onChange={(e) => setSign({ ...sign, reason: e.target.value })} placeholder="Cena, termín, rozsah…" />
        </div>
      </Dialog>
    </div>
  );
}
