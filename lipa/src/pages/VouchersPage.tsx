import { useState, type FormEvent, type ReactNode } from "react";
import { Check, Copy, Gift, Mail, Printer, Search, Sparkles } from "../components/icons";
import { CardForm, Spinner } from "../components/Payment";
import { emptyCard, simulatePayment, validateCard, type CardErrors, type CardState } from "../lib/payment";
import { useToast } from "../components/toast";
import { PageHero, Segmented, TextArea, TextField } from "../components/ui";
import VoucherCard from "../components/VoucherCard";
import { VOUCHER_AMOUNTS, VOUCHER_DESIGNS, VOUCHER_EXPERIENCES } from "../data/content";
import { addDays, formatDateFull, formatDateNumeric, formatPrice, isEmail, toISODate } from "../lib/format";
import { useNow, usePageMeta } from "../lib/hooks";
import { getDB, updateDB } from "../lib/store";
import type { Voucher } from "../lib/types";

const POSTAGE = 3;
const MAX_MESSAGE = 160;

export default function VouchersPage() {
  usePageMeta("Darčekové poukážky", "Darčekové poukážky do Lipy: hodnotové alebo zážitkové, s vlastným venovaním. Doručenie e-mailom ihneď alebo v deň oslavy.");
  const now = useNow(3_600_000);
  const toast = useToast();
  const [kind, setKind] = useState<"value" | "experience">("value");
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");
  const [experience, setExperience] = useState(VOUCHER_EXPERIENCES[0].id);
  const [design, setDesign] = useState(VOUCHER_DESIGNS[0].id);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [delivery, setDelivery] = useState<Voucher["delivery"]>("email");
  const [sendOn, setSendOn] = useState(toISODate(addDays(now, 7)));
  const [buyerEmail, setBuyerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [card, setCard] = useState<CardState>(emptyCard);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [busy, setBusy] = useState(false);
  const [bought, setBought] = useState<Voucher | null>(null);

  const exp = VOUCHER_EXPERIENCES.find((e) => e.id === experience)!;
  const customValue = Number(custom.replace(",", "."));
  const value = kind === "experience" ? exp.price : custom ? customValue : amount;
  const title = kind === "experience" ? exp.title : "Na čokoľvek z menu aj vínnej karty";
  const total = value + (delivery === "post" ? POSTAGE : 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (kind === "value" && custom && (!(customValue >= 20) || customValue > 500)) found.custom = "Zadajte sumu od 20 do 500 €.";
    if (to.trim().length < 2) found.to = "Komu poukážku darujete?";
    if (!isEmail(buyerEmail)) found.buyerEmail = "Pošleme naň poukážku a doklad.";
    if (delivery === "scheduled" && (!sendOn || sendOn < toISODate(addDays(now, 1)))) found.sendOn = "Vyberte deň v budúcnosti.";
    if (delivery === "post" && address.trim().length < 10) found.address = "Ulica, číslo, PSČ a mesto.";
    const foundCard = validateCard(card);
    setErrors(found);
    setCardErrors(foundCard);
    if (Object.keys(found).length || Object.keys(foundCard).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setBusy(true);
    await simulatePayment();
    let code = "";
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    do {
      const part = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
      code = `LIPA-${part()}-${part()}`;
    } while (getDB().vouchers.some((v) => v.code === code));
    const created = Date.now();
    const voucher: Voucher = {
      code,
      kind,
      title: kind === "experience" ? exp.title : `Poukážka v hodnote ${formatPrice(value)}`,
      amount: value,
      balance: value,
      design,
      to: to.trim(),
      from: from.trim(),
      message: message.trim(),
      delivery,
      sendOn: delivery === "scheduled" ? sendOn : undefined,
      buyerEmail: buyerEmail.trim(),
      createdAt: created,
      validUntil: addDays(new Date(created), 365).getTime(),
    };
    updateDB((db) => ({ ...db, vouchers: [voucher, ...db.vouchers] }));
    setBusy(false);
    setBought(voucher);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (bought) {
    return (
      <>
        <PageHero
          eyebrow="Hotovo"
          title={
            <>
              Darček je <em className="text-honey-soft">pripravený.</em>
            </>
          }
          text={
            bought.delivery === "email"
              ? `Poslali sme ju na ${bought.buyerEmail}. Môžete ju aj hneď vytlačiť.`
              : bought.delivery === "scheduled"
                ? `Doručíme ju e-mailom ${formatDateFull(new Date(bought.sendOn!))} ráno. Kópiu máte v schránke ${bought.buyerEmail}.`
                : "Vytlačíme ju na hrubý papier a do 2 pracovných dní pošleme v darčekovej obálke."
          }
        >
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream/10 px-4 py-2 text-sm text-cream/75">
            <Sparkles size={16} /> Ukážka: kód funguje aj v online objednávke. Skúste ho v košíku.
          </p>
        </PageHero>
        <div className="container-page grid items-start gap-10 py-14 lg:grid-cols-[minmax(0,520px)_1fr]">
          <div className="print-area">
            <VoucherCard design={bought.design} title={bought.title} amount={bought.amount} to={bought.to} from={bought.from} message={bought.message} code={bought.code} validUntil={bought.validUntil} large />
          </div>
          <div className="no-print space-y-4">
            <div className="card p-6">
              <p className="text-sm text-mute">Kód poukážky</p>
              <p className="mt-1 font-display text-3xl tracking-wide tabular-nums text-forest">{bought.code}</p>
              <p className="mt-2 text-sm text-soft">Platí 12 mesiacov, do {formatDateFull(new Date(bought.validUntil))}. Dá sa uplatniť v reštaurácii aj pri objednávke cez web, aj po častiach.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={() => window.print()}>
                  <Printer size={17} /> Vytlačiť alebo PDF
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(bought.code).catch(() => {});
                    toast("Kód je skopírovaný.");
                  }}
                >
                  <Copy size={17} /> Kopírovať kód
                </button>
              </div>
            </div>
            <button type="button" className="btn-outline" onClick={() => setBought(null)}>
              <Gift size={17} /> Kúpiť ďalšiu poukážku
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Darčekové poukážky"
        title={
          <>
            Darček, ktorý <em className="text-honey-soft">sa zje s radosťou.</em>
          </>
        }
        text="Hodnotová poukážka na čokoľvek, alebo zážitok ako degustačné menu pre dvoch. S vlastným venovaním, doručená hneď, v deň oslavy alebo poštou."
      />
      <form onSubmit={submit} noValidate className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_440px] lg:gap-14 lg:py-16">
        <div className="space-y-10">
          <Step n={1} title="Čo darujete">
            <Segmented
              label="Typ poukážky"
              value={kind}
              onChange={setKind}
              options={[
                { value: "value", label: "Hodnotová" },
                { value: "experience", label: "Zážitok" },
              ]}
            />
            {kind === "value" ? (
              <div className="mt-5">
                <div className="flex flex-wrap gap-2">
                  {VOUCHER_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className="chip min-w-20 justify-center py-3 text-base"
                      aria-pressed={!custom && amount === a}
                      onClick={() => {
                        setAmount(a);
                        setCustom("");
                      }}
                    >
                      {a} €
                    </button>
                  ))}
                </div>
                <TextField
                  label="Alebo vlastná suma"
                  inputMode="decimal"
                  placeholder="20 – 500 €"
                  value={custom}
                  error={errors.custom}
                  onChange={(e) => setCustom(e.target.value.replace(/[^\d,.]/g, ""))}
                  className="mt-4 max-w-xs"
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {VOUCHER_EXPERIENCES.map((x) => {
                  const on = experience === x.id;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setExperience(x.id)}
                      className={`rounded-2xl border p-4 text-left transition-colors ${on ? "border-forest bg-forest text-cream" : "border-line bg-paper hover:border-ink/30"}`}
                    >
                      <span className="flex justify-between gap-3 font-medium">
                        {x.title} <span className="tabular-nums">{formatPrice(x.price)}</span>
                      </span>
                      <span className={`mt-1 block text-sm ${on ? "text-cream/70" : "text-soft"}`}>{x.text}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          <Step n={2} title="Dizajn">
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Dizajn poukážky">
              {VOUCHER_DESIGNS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={design === d.id}
                  onClick={() => setDesign(d.id)}
                  className={`flex items-center gap-3 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition-colors ${design === d.id ? "border-forest ring-1 ring-forest" : "border-line hover:border-ink/30"}`}
                >
                  <span className="grid size-8 place-items-center rounded-full" style={{ background: d.bg, color: d.accent }}>
                    {design === d.id && <Check size={15} />}
                  </span>
                  {d.name}
                </button>
              ))}
            </div>
          </Step>

          <Step n={3} title="Venovanie">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Pre koho" required placeholder="Zuzka" value={to} error={errors.to} maxLength={40} onChange={(e) => setTo(e.target.value)} />
              <TextField label="Od koho" placeholder="Peter" value={from} maxLength={40} onChange={(e) => setFrom(e.target.value)} />
              <TextArea
                label="Venovanie"
                placeholder="Všetko najlepšie k narodeninám!"
                value={message}
                maxLength={MAX_MESSAGE}
                onChange={(e) => setMessage(e.target.value)}
                hint={`${message.length}/${MAX_MESSAGE}`}
                className="sm:col-span-2"
              />
            </div>
          </Step>

          <Step n={4} title="Doručenie a platba">
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "email", title: "E-mailom hneď", text: "PDF do pár sekúnd" },
                  { id: "scheduled", title: "E-mailom v deň", text: "Napr. ráno na narodeniny" },
                  { id: "post", title: "Poštou", text: `Darčeková obálka +${formatPrice(POSTAGE)}` },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={delivery === o.id}
                  onClick={() => setDelivery(o.id)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${delivery === o.id ? "border-forest bg-forest text-cream" : "border-line bg-paper hover:border-ink/30"}`}
                >
                  <span className="block font-medium">{o.title}</span>
                  <span className={`text-sm ${delivery === o.id ? "text-cream/70" : "text-soft"}`}>{o.text}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextField label="Váš e-mail" required type="email" autoComplete="email" value={buyerEmail} error={errors.buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
              {delivery === "scheduled" && (
                <TextField label="Kedy poslať" type="date" required min={toISODate(addDays(now, 1))} value={sendOn} error={errors.sendOn} onChange={(e) => setSendOn(e.target.value)} />
              )}
              {delivery === "post" && (
                <TextField label="Adresa" required placeholder="Ulica 1, 811 01 Bratislava" value={address} error={errors.address} onChange={(e) => setAddress(e.target.value)} className="sm:col-span-2" />
              )}
            </div>
            <div className="mt-5">
              <CardForm card={card} onChange={setCard} errors={cardErrors} />
            </div>
          </Step>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow mb-4 text-moss">Náhľad</p>
          <VoucherCard design={design} title={title} amount={value || 0} to={to} from={from} message={message} />
          <div className="card mt-6 p-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-soft">{kind === "experience" ? exp.title : "Hodnota poukážky"}</dt>
                <dd className="tabular-nums">{formatPrice(value || 0)}</dd>
              </div>
              {delivery === "post" && (
                <div className="flex justify-between">
                  <dt className="text-soft">Poštovné a obálka</dt>
                  <dd className="tabular-nums">{formatPrice(POSTAGE)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-medium">Spolu</dt>
                <dd className="font-display text-2xl tabular-nums text-forest">{formatPrice(total || 0)}</dd>
              </div>
            </dl>
            <button type="submit" className="btn-honey mt-5 w-full py-4 text-base" disabled={busy}>
              {busy ? (
                <>
                  <Spinner /> Overujeme platbu…
                </>
              ) : (
                <>
                  <Gift size={18} /> Zaplatiť a vytvoriť poukážku
                </>
              )}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-mute">
              <Mail size={13} /> Platnosť 12 mesiacov · dá sa čerpať po častiach
            </p>
          </div>
          <BalanceCheck />
        </aside>
      </form>
    </>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
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

function BalanceCheck() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const check = () => {
    const v = getDB().vouchers.find((x) => x.code === code.trim().toUpperCase());
    if (!v) setResult({ ok: false, text: "Takúto poukážku nepoznáme." });
    else if (v.validUntil < Date.now()) setResult({ ok: false, text: `Platnosť skončila ${formatDateNumeric(new Date(v.validUntil))}.` });
    else
      setResult({
        ok: true,
        text: v.kind === "experience" ? `${v.title}, platí do ${formatDateNumeric(new Date(v.validUntil))}.` : `Zostatok ${formatPrice(v.balance)} z ${formatPrice(v.amount)}, platí do ${formatDateNumeric(new Date(v.validUntil))}.`,
      });
  };
  return (
    <div className="mt-6 rounded-2xl border border-line p-5">
      <label htmlFor="balance-code" className="text-sm font-medium">
        Overiť zostatok poukážky
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="balance-code"
          className="field py-2.5 uppercase placeholder:normal-case"
          placeholder="napr. LIPA-DEMO-0100"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              check();
            }
          }}
        />
        <button type="button" className="btn-outline shrink-0 px-4 py-2.5" onClick={check} aria-label="Overiť">
          <Search size={17} />
        </button>
      </div>
      {result && <p className={`mt-2 text-sm ${result.ok ? "text-ok" : "text-danger"}`}>{result.text}</p>}
    </div>
  );
}
