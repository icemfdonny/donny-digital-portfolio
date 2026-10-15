import { Link } from "react-router-dom";
import AppointmentCard, { CalendarButtons } from "../../components/AppointmentCard";
import { ArrowRight, Check, Copy, Crown, Printer, Shield } from "../../components/icons";
import { useToast } from "../../components/toast";
import { LOYALTY } from "../../config";
import { formatDateLong, fromISODate } from "../../lib/format";
import { useNow } from "../../lib/hooks";
import { loyaltyState, visitPoints } from "../../lib/loyalty";
import { useAccount, useDB } from "../../lib/store";
import type { Appointment } from "../../lib/types";

export default function Confirmation({ appt, newAccount }: { appt: Appointment; newAccount: boolean }) {
  const account = useAccount();
  const db = useDB();
  const now = useNow();
  const toast = useToast();
  const loyalty = account ? loyaltyState(account, db, now) : null;
  const patch = appt.note.includes("test citlivosti");
  const testDay = fromISODate(appt.date);
  testDay.setDate(testDay.getDate() - 2);

  return (
    <>
      <section className="bg-plum pb-12 pt-28 text-ivory sm:pt-32">
        <div className="container-page">
          <span className="grid size-14 animate-pop place-items-center rounded-full bg-gold text-white">
            <Check size={28} strokeWidth={2} />
          </span>
          <h1 className="mt-6 animate-rise font-display text-[2.6rem] font-medium leading-none sm:text-6xl">Tešíme sa na vás, {appt.clientName.split(" ")[0]}.</h1>
          <p className="mt-4 max-w-xl animate-rise text-[17px] font-light text-ivory/75">
            Potvrdenie sme poslali na {appt.email}. Deň vopred príde SMS pripomienka na {appt.phone}.
          </p>
        </div>
      </section>
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AppointmentCard appt={appt} status="confirmed" />
          <CalendarButtons appt={appt} />
          {patch && (
            <p className="flex gap-3 rounded-2xl border border-line bg-paper p-4 text-sm text-soft">
              <Shield size={20} className="shrink-0 text-gold" />
              Test citlivosti: zastavte sa, prosím, najneskôr {formatDateLong(testDay)}. Stačí päť minút počas otváracích hodín.
            </p>
          )}
        </div>
        <aside className="space-y-4">
          <div className="card p-5">
            <p className="font-medium text-plum">Potrebujete niečo zmeniť?</p>
            <p className="mt-1 text-sm text-soft">Presun alebo zrušenie zadarmo do 24 hodín pred termínom.</p>
            <Link to={`/rezervacia/${appt.code}`} className="btn-primary mt-4 w-full">
              Spravovať rezerváciu <ArrowRight size={16} />
            </Link>
            <button type="button" className="btn mt-2 w-full text-soft hover:text-ink" onClick={() => window.print()}>
              <Printer size={16} /> Vytlačiť
            </button>
          </div>
          {account && loyalty ? (
            <div className="gold-card animate-shimmer rounded-[1.4rem] p-5 text-plum">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Crown size={17} /> {newAccount ? "Účet je pripravený" : `Člen ${loyalty.tier.name}`}
              </p>
              <p className="mt-2 font-display text-3xl font-medium">+{visitPoints(appt.total, account, appt.date)} bodov</p>
              <p className="mt-1 text-sm text-plum/75">
                pripíšeme po návšteve{newAccount ? ` · ${LOYALTY.signupBonus} bodov za registráciu už máte` : ""}
              </p>
              <div className="mt-4 rounded-xl bg-white/45 p-3 text-sm">
                <p className="font-medium">Pozvite kamarátku</p>
                <p className="text-plum/75">S kódom dostane {LOYALTY.referralFriendDiscount} € zľavu, vy {LOYALTY.referralPoints} bodov.</p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-plum px-3 py-1.5 text-xs font-medium tracking-wider text-ivory"
                  onClick={() => {
                    navigator.clipboard?.writeText(account.referralCode).catch(() => {});
                    toast("Kód je skopírovaný.");
                  }}
                >
                  {account.referralCode} <Copy size={13} />
                </button>
              </div>
              <Link to="/ucet" className="mt-4 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
                Môj účet <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="card p-5">
              <p className="font-medium text-plum">Body za túto návštevu?</p>
              <p className="mt-1 text-sm text-soft">Vytvorte si účet s rovnakým e-mailom a rezervácia sa pripíše automaticky.</p>
              <Link to="/ucet?registracia=1" className="btn-outline mt-4 w-full">
                Vytvoriť účet
              </Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
