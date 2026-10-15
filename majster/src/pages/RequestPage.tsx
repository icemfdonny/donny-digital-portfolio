import { Link, useParams } from "react-router-dom";
import { ArrowRight, Calendar, Check, FileText, Phone, Printer } from "../components/icons";
import { ContactLink } from "../components/ui";
import { URGENCY } from "../config";
import { stageLabel } from "../lib/actions";
import { windowLabel, windowOf } from "../lib/availability";
import { capitalize, formatDateLong, formatEuro, formatPrice, fromISODate } from "../lib/format";
import { usePageMeta } from "../lib/hooks";
import { BIZ } from "../lib/profile";
import { useDB } from "../lib/store";
import NotFound from "./NotFound";

const ORDER = ["novy", "obhliadka", "ponuka", "prijata", "realizacia", "hotovo"];

/** Confirmation and live status of a request sent from the calculator. */
export default function RequestPage() {
  const { code } = useParams();
  usePageMeta(`Dopyt ${code}`);
  const db = useDB();
  const lead = db.leads.find((l) => l.code === code);
  if (!lead) return <NotFound />;
  const visit = db.visits.find((v) => v.id === lead.visitId && v.status !== "cancelled");
  const quote = db.quotes.find((q) => q.id === lead.quoteId && q.status !== "koncept");
  const reached = Math.max(0, ORDER.indexOf(lead.stage));
  const steps = [
    { title: "Dopyt prijatý", text: "Máme všetko, čo ste vyplnili, aj fotky." },
    { title: "Obhliadka", text: visit ? `${capitalize(formatDateLong(fromISODate(visit.date)))}, ${windowLabel(windowOf(visit.date, visit.window) ?? { start: 0, end: 0 })}` : "Zavoláme vám do 2 hodín a dohodneme termín – alebo si ho vyberte sami." },
    { title: "Cenová ponuka", text: quote ? `Ponuka ${quote.code} je pripravená.` : "Do 48 hodín po obhliadke, po položkách." },
    { title: "Realizácia", text: lead.startDate ? `Začíname ${formatDateLong(fromISODate(lead.startDate))}.` : "V termíne, ktorý si spolu dohodneme." },
  ];
  const activeStep = Math.min(3, reached === 0 ? (visit ? 1 : 0) : reached >= 4 ? 3 : reached);

  return (
    <div className="bg-bg py-10 sm:py-16">
      <div className="container-page max-w-4xl">
        <div className="print-area rounded-3xl bg-paper p-6 shadow-sm ring-1 ring-line sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid size-14 animate-pop place-items-center rounded-2xl bg-ok text-white">
                <Check size={30} strokeWidth={3} />
              </span>
              <div>
                <p className="text-sm font-semibold text-mute">Dopyt {lead.code}</p>
                <h1 className="display text-2xl sm:text-3xl">Ďakujeme, {lead.name.split(" ")[0]}!</h1>
              </div>
            </div>
            <span className="rounded-full bg-sand px-3 py-1.5 text-sm font-bold">Stav: {stageLabel(lead.stage)}</span>
          </div>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-soft">
            Váš dopyt je u nás. {lead.contactPref === "email" ? "Ozveme sa e-mailom" : lead.contactPref === "whatsapp" ? "Napíšeme vám na WhatsApp" : "Zavoláme vám"} do 2 hodín v pracovnom čase. Táto stránka sa aktualizuje, keď sa s vaším dopytom
            niečo stane.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className={`rounded-2xl border-2 p-4 ${i < activeStep ? "border-ok/30 bg-ok-soft/50" : i === activeStep ? "border-ink" : "border-line"}`}>
                <span className={`grid size-7 place-items-center rounded-full text-sm font-black ${i < activeStep ? "bg-ok text-white" : i === activeStep ? "bg-accent text-accent-ink" : "bg-sand text-mute"}`}>
                  {i < activeStep ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <p className="mt-3 font-bold">{s.title}</p>
                <p className="mt-1 text-sm text-soft">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="no-print mt-6 flex flex-wrap gap-2">
            {quote ? (
              <Link to={`/ponuka/${quote.code}`} className="btn-accent">
                <FileText size={18} /> Zobraziť cenovú ponuku
              </Link>
            ) : !visit ? (
              <Link to={`/obhliadka?dopyt=${lead.code}`} className="btn-accent">
                <Calendar size={18} /> Vybrať termín obhliadky
              </Link>
            ) : (
              <Link to={`/termin/${visit.code}`} className="btn-accent">
                <Calendar size={18} /> Detail termínu
              </Link>
            )}
            <button type="button" className="btn-outline" onClick={() => window.print()}>
              <Printer size={18} /> Vytlačiť
            </button>
            <ContactLink kind="tel" className="btn-ghost">
              <Phone size={18} /> {BIZ.phoneLabel}
            </ContactLink>
          </div>

          {lead.estimate && (
            <div className="mt-10 grid gap-6 md:grid-cols-[1fr_1.4fr]">
              <div>
                <h2 className="display text-xl">{lead.jobTitle}</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-soft">Miesto</dt>
                    <dd className="font-semibold">
                      {lead.town}
                      {lead.km !== null && ` (${lead.km} km)`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-soft">Termín</dt>
                    <dd className="font-semibold">{URGENCY.find((u) => u.id === lead.urgency)?.label ?? "Bežný"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-soft">Trvanie</dt>
                    <dd className="font-semibold">{lead.estimate.days === 1 ? "1 deň" : `${lead.estimate.days} dní`}</dd>
                  </div>
                </dl>
                <div className="mt-5 rounded-2xl bg-ink p-5 text-white">
                  <p className="text-sm text-white/60">Orientačná cena</p>
                  <p className="display mt-1 text-2xl tabular-nums">
                    {formatEuro(lead.estimate.low)} – {formatEuro(lead.estimate.high)}
                  </p>
                </div>
                {lead.note && <p className="mt-4 rounded-xl bg-bg p-4 text-sm italic text-soft">„{lead.note}“</p>}
                {lead.photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {lead.photos.map((src, i) => (
                      <img key={i} src={src} alt={`Fotka ${i + 1}`} className="aspect-square rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
              {lead.lines && (
                <div className="overflow-hidden rounded-2xl border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-bg text-left text-xs uppercase tracking-wide text-mute">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Položka</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Spolu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {lead.lines.map((l, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5">
                            {l.label}
                            <span className="block text-xs text-mute">
                              {l.qty.toLocaleString("sk-SK")} {l.unit} × {formatPrice(l.price)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatPrice(l.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="border-t border-line bg-bg px-4 py-2.5 text-xs text-mute">Ceny bez DPH. Konečnú sumu potvrdíme v ponuke po obhliadke.</p>
                </div>
              )}
            </div>
          )}
        </div>
        <Link to="/" className="no-print mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-soft hover:text-ink">
          Späť na úvod <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
