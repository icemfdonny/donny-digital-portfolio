import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Calendar, Check, Download, External, Info, MapPin, Printer, Wine, X } from "../components/icons";
import { Dialog, PageHero, QrCode, TextArea } from "../components/ui";
import { useToast } from "../components/toast";
import { RESTAURANT } from "../config";
import { areaById, durationAt } from "../lib/availability";
import { downloadIcs, googleCalendarUrl } from "../lib/calendar";
import { capitalize, formatDateLong, formatPhone, formatPrice, fromISODate, guestsLabel, timeToMinutes } from "../lib/format";
import { useNow, usePageMeta } from "../lib/hooks";
import { updateDB, useDB } from "../lib/store";
import { RESERVATION_STATUS } from "../lib/labels";

export default function ManageReservationPage() {
  const { code = "" } = useParams();
  const [params] = useSearchParams();
  const db = useDB();
  const now = useNow();
  const toast = useToast();
  const reservation = db.reservations.find((r) => r.code === code.toUpperCase());
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(reservation?.note ?? "");
  usePageMeta(reservation ? `Rezervácia ${reservation.code}` : "Rezervácia");

  if (!reservation) {
    return (
      <>
        <PageHero eyebrow="Rezervácia" title="Túto rezerváciu nevidíme" text={`Kód ${code} sme nenašli. Skontrolujte, prosím, potvrdzujúci e-mail, alebo nám zavolajte.`}>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/rezervacia" className="btn-honey">
              Nová rezervácia
            </Link>
            <a href={RESTAURANT.phoneHref} className="btn-ghost-light">
              {RESTAURANT.phone}
            </a>
          </div>
        </PageHero>
        <div className="h-24" />
      </>
    );
  }

  const fresh = params.get("nova") === "1";
  const date = fromISODate(reservation.date);
  const start = new Date(date);
  start.setMinutes(timeToMinutes(reservation.time));
  const area = areaById(reservation.area);
  const cancelled = reservation.status === "cancelled";
  const past = start.getTime() < now.getTime();
  const hoursLeft = (start.getTime() - now.getTime()) / 3_600_000;
  const firstName = reservation.name.split(" ")[0];
  const calendarEvent = {
    title: `Večera v reštaurácii ${RESTAURANT.name} (${guestsLabel(reservation.guests)})`,
    start,
    minutes: durationAt(timeToMinutes(reservation.time)),
    description: `Rezervácia ${reservation.code}, ${area.name}. Zmena alebo zrušenie: ${window.location.origin}/rezervacia/${reservation.code}`,
    uid: `lipa-${reservation.code}`,
  };

  const cancel = () => {
    updateDB((d) => ({ ...d, reservations: d.reservations.map((r) => (r.id === reservation.id ? { ...r, status: "cancelled" } : r)) }));
    setCancelOpen(false);
    toast("Rezerváciu sme zrušili.", "info");
  };

  return (
    <>
      <PageHero
        eyebrow={cancelled ? "Rezervácia zrušená" : fresh ? "Rezervácia potvrdená" : "Vaša rezervácia"}
        title={
          cancelled ? (
            "Škoda, možno nabudúce."
          ) : fresh ? (
            <>
              Tešíme sa na vás, <em className="text-honey-soft">{firstName}!</em>
            </>
          ) : (
            <>
              Rezervácia <span className="tabular-nums">{reservation.code}</span>
            </>
          )
        }
        text={
          cancelled
            ? "Stôl sme uvoľnili pre ďalších hostí. Ak sa rozhodnete inak, novú rezerváciu urobíte za minútu."
            : `Potvrdenie sme poslali na ${reservation.email} a deň vopred vám pošleme pripomienku.`
        }
      >
        {fresh && !cancelled && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream/10 px-4 py-2 text-sm text-cream/75">
            <Info size={16} /> Ukážka: e-mail ani SMS sa v skutočnosti neodosielajú.
          </p>
        )}
      </PageHero>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_340px] lg:py-16">
        <div>
          <article className={`print-area card relative overflow-hidden ${cancelled ? "opacity-70" : ""}`}>
            <div className="grid sm:grid-cols-[1fr_auto]">
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      cancelled ? "bg-danger/10 text-danger" : "bg-[#4cbf7a]/15 text-ok"
                    }`}
                  >
                    {cancelled ? <X size={13} /> : <Check size={13} />} {RESERVATION_STATUS[reservation.status]}
                  </span>
                  <span className="text-sm text-mute">Kód {reservation.code}</span>
                </div>
                <p className="mt-5 font-display text-3xl text-forest sm:text-4xl">{capitalize(formatDateLong(date))}</p>
                <p className="mt-1 font-display text-2xl text-moss">o {reservation.time}</p>
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-[15px]">
                  <div>
                    <dt className="text-sm text-mute">Hostia</dt>
                    <dd>{guestsLabel(reservation.guests)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-mute">Miesto</dt>
                    <dd>{area.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-mute">Na meno</dt>
                    <dd>{reservation.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-mute">Telefón</dt>
                    <dd className="tabular-nums">{formatPhone(reservation.phone)}</dd>
                  </div>
                  {reservation.occasion && (
                    <div>
                      <dt className="text-sm text-mute">Príležitosť</dt>
                      <dd>{reservation.occasion}</dd>
                    </div>
                  )}
                  {reservation.extras.length > 0 && (
                    <div>
                      <dt className="text-sm text-mute">Prosíme pripraviť</dt>
                      <dd>{reservation.extras.join(", ")}</dd>
                    </div>
                  )}
                  {reservation.deposit && (
                    <div>
                      <dt className="text-sm text-mute">Zaplatená záloha</dt>
                      <dd>{formatPrice(reservation.deposit)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-6 border-t border-line pt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-mute">Poznámka</p>
                    {!cancelled && !past && !editingNote && (
                      <button type="button" className="no-print text-sm font-medium text-moss underline underline-offset-2" onClick={() => setEditingNote(true)}>
                        {reservation.note ? "Upraviť" : "Pridať"}
                      </button>
                    )}
                  </div>
                  {editingNote ? (
                    <div className="mt-2">
                      <TextArea label="Poznámka pre reštauráciu" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="btn-primary py-2"
                          onClick={() => {
                            updateDB((d) => ({ ...d, reservations: d.reservations.map((r) => (r.id === reservation.id ? { ...r, note: note.trim() || undefined } : r)) }));
                            setEditingNote(false);
                            toast("Poznámku sme uložili, kuchyňa ju uvidí.");
                          }}
                        >
                          Uložiť
                        </button>
                        <button type="button" className="btn-outline py-2" onClick={() => setEditingNote(false)}>
                          Zrušiť
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[15px]">{reservation.note ?? "—"}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-line bg-cream/60 p-6 sm:border-l sm:border-t-0 sm:p-8">
                <QrCode value={`LIPA:${reservation.code}`} size={140} />
                <p className="max-w-[160px] text-center text-xs text-mute">Pri príchode stačí ukázať kód obsluhe</p>
              </div>
            </div>
          </article>

          {!cancelled && !past && (
            <div className="no-print mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => downloadIcs(calendarEvent)}>
                <Download size={17} /> Pridať do kalendára
              </button>
              <a href={googleCalendarUrl(calendarEvent)} target="_blank" rel="noreferrer" className="btn-outline">
                <Calendar size={17} /> Google Kalendár <External size={14} />
              </a>
              <button type="button" className="btn-outline" onClick={() => window.print()}>
                <Printer size={17} /> Vytlačiť
              </button>
              <button type="button" className="btn ml-auto text-danger hover:bg-danger/5" onClick={() => setCancelOpen(true)}>
                Zrušiť rezerváciu
              </button>
            </div>
          )}
          {cancelled && (
            <Link to="/rezervacia" className="btn-primary mt-6">
              Nová rezervácia <ArrowRight size={17} />
            </Link>
          )}
        </div>

        <aside className="no-print space-y-4">
          <p className="eyebrow text-moss">Kým prídete</p>
          {[
            { to: "/menu", icon: ArrowRight, title: "Pozrite si menu", text: "Aj s alergénmi a odporúčaním vína." },
            { to: "/menu?karta=napoje", icon: Wine, title: "Vínna karta", text: "Len slovenské vína, 16 na pohár." },
            { to: "/kontakt#mapa", icon: MapPin, title: "Ako sa k nám dostanete", text: `${RESTAURANT.street}, parkovanie 3 minúty pešo.` },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="card group flex items-center gap-4 p-5 hover:border-ink/25">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest/[0.06] text-moss">
                <item.icon size={18} />
              </span>
              <span>
                <span className="block font-medium">{item.title}</span>
                <span className="text-sm text-soft">{item.text}</span>
              </span>
            </Link>
          ))}
        </aside>
      </div>

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Zrušiť rezerváciu?"
        size="sm"
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn-outline flex-1" onClick={() => setCancelOpen(false)}>
              Ponechať
            </button>
            <button type="button" className="btn flex-1 bg-danger text-cream hover:bg-danger/90" onClick={cancel}>
              Áno, zrušiť
            </button>
          </div>
        }
      >
        <div className="space-y-3 px-6 py-5 text-[15px] text-soft">
          <p>
            Rezerváciu na {formatDateLong(date)} o {reservation.time} ({guestsLabel(reservation.guests)}) zrušíme a stôl uvoľníme pre ďalších hostí.
          </p>
          {reservation.deposit ? (
            <p className="rounded-xl bg-honey-soft/60 p-3 text-sm text-forest">
              {hoursLeft >= 48
                ? `Zálohu ${formatPrice(reservation.deposit)} vám vrátime na kartu do 3 pracovných dní.`
                : `Do rezervácie zostáva menej ako 48 hodín, záloha ${formatPrice(reservation.deposit)} je preto nevratná.`}
            </p>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}
