import { useState } from "react";
import { Link } from "react-router-dom";
import LoyaltyCard from "../components/LoyaltyCard";
import { ArrowRight, Check, Crown, Gift, Heart, Sparkles, Users } from "../components/icons";
import { PageHero, Reveal, SectionHeading } from "../components/ui";
import { LOYALTY } from "../config";
import { tierFor } from "../lib/loyalty";
import { liveService } from "../lib/catalog";
import { formatEuro } from "../lib/format";
import { useNow, usePageMeta } from "../lib/hooks";
import { useAccount, useDB } from "../lib/store";

/** Typical habits for the calculator: service, how often per year by default, max per year. */
const HABITS = [
  { id: "farbenie-odrastov", label: "Farbenie odrastov", per: 6, max: 12 },
  { id: "damsky-strih", label: "Strih a fúkaná", per: 4, max: 12 },
  { id: "gel-lak", label: "Gél lak", per: 8, max: 17 },
  { id: "hydraglow", label: "HydraGlow pleť", per: 2, max: 12 },
  { id: "lash-lift", label: "Lash lifting", per: 3, max: 8 },
];

export default function LoyaltyPage() {
  usePageMeta("Vernostný program", "1 € = 1 bod, dvojnásobné body v mesiaci narodenín, statusy Gold a Platinum so zľavou až 10 %. Odmeny a odporúčania.");
  const account = useAccount();
  const db = useDB();
  const now = useNow(3_600_000);
  const [habits, setHabits] = useState<Record<string, number>>(() => Object.fromEntries(HABITS.map((h) => [h.id, h.per])));
  const yearly = HABITS.reduce((sum, h) => sum + habits[h.id] * liveService(h.id, db.serviceOverrides).price, 0);
  const points = Math.round(yearly * LOYALTY.pointsPerEuro) + LOYALTY.signupBonus;
  const { tier } = tierFor(points);
  const reachable = LOYALTY.rewards.filter((r) => r.points <= points);
  const savings = Math.round(yearly * tier.discount + (reachable.length ? Math.max(...reachable.map((r) => r.value)) : 0));

  return (
    <>
      <PageHero
        eyebrow="Vernostný program"
        photo="spaStill"
        title={
          <>
            Krása, ktorá sa <em className="font-normal text-gold-soft">vám vráti.</em>
          </>
        }
        text={`Zbierajte body za každú návštevu a vymieňajte ich za ošetrenia. Pri registrácii dostanete ${LOYALTY.signupBonus} bodov na privítanie.`}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={account ? "/ucet?karta=body" : "/ucet?registracia=1"} className="btn-gold">
            {account ? "Moje body" : "Pridať sa zadarmo"} <ArrowRight size={16} />
          </Link>
          {!account && (
            <Link to="/ucet" className="btn-ghost-light">
              Už mám účet
            </Link>
          )}
        </div>
      </PageHero>

      <section className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-3">
        {[
          { icon: Sparkles, title: "Pridajte sa", text: `Účet za 30 sekúnd a ${LOYALTY.signupBonus} bodov hneď. Všetky rezervácie máte na jednom mieste.` },
          { icon: Heart, title: "Zbierajte", text: `${LOYALTY.pointsPerEuro} bod za každé euro. V mesiaci narodenín dvojnásobok, za odporúčanie kamarátky ${LOYALTY.referralPoints} bodov.` },
          { icon: Gift, title: "Vymieňajte", text: "Zľavy, úprava obočia či Olaplex rituál. Kód odmeny zadáte pri rezervácii jedným klikom." },
        ].map((s, i) => (
          <Reveal key={s.title} delay={i * 80} className="relative">
            <span className="font-display text-[5rem] font-medium leading-none text-gold/25">0{i + 1}</span>
            <p className="-mt-6 flex items-center gap-2 font-display text-3xl font-medium text-plum">
              <s.icon size={22} className="text-gold" /> {s.title}
            </p>
            <p className="mt-3 font-light leading-relaxed text-soft">{s.text}</p>
          </Reveal>
        ))}
      </section>

      <section className="bg-blush/60 py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Statusy" title={<>Čím častejšie, <em className="font-normal text-mauve">tým krajšie.</em></>} text="Status sa počíta z bodov získaných za celý čas. Raz Gold, navždy Gold." />
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {LOYALTY.tiers.map((t, i) => (
              <Reveal key={t.id} delay={i * 80}>
                <div className={`flex h-full flex-col rounded-[1.6rem] p-7 ${t.id === "gold" ? "gold-card animate-shimmer text-plum shadow-xl" : t.id === "platinum" ? "bg-plum text-ivory" : "border border-line bg-paper"}`}>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                    <Crown size={15} /> {t.from ? `od ${t.from.toLocaleString("sk-SK")} bodov` : "od prvej návštevy"}
                  </p>
                  <p className="mt-3 font-display text-5xl font-medium">{t.name}</p>
                  <p className="mt-1 text-sm opacity-75">{t.discount ? `Zľava ${Math.round(t.discount * 100)} % na každú návštevu` : "Zbieranie bodov a odmeny"}</p>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {t.perks.map((p) => (
                      <li key={p} className="flex gap-2.5">
                        <Check size={16} className="mt-0.5 shrink-0 opacity-70" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid grid-cols-1 gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading eyebrow="Kalkulačka" title={<>Koľko bodov <em className="font-normal text-mauve">nazbierate?</em></>} text="Nastavte, ako často k nám chodíte. Rátame s cenami senior stylistky." />
          <div className="mt-8 space-y-5">
            {HABITS.map((h) => (
              <div key={h.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <label htmlFor={`habit-${h.id}`} className="font-medium text-ink">
                    {h.label}
                  </label>
                  <span className="tabular-nums text-soft">{habits[h.id]}× ročne</span>
                </div>
                <input
                  id={`habit-${h.id}`}
                  type="range"
                  min={0}
                  max={h.max}
                  value={habits[h.id]}
                  onChange={(e) => setHabits({ ...habits, [h.id]: Number(e.target.value) })}
                  className="mt-2 w-full accent-plum"
                />
              </div>
            ))}
          </div>
        </div>
        <Reveal className="lg:pt-10">
          <LoyaltyCard name={account?.name ?? "Vaše meno"} tier={tier.name} points={points} since={now.getFullYear()} />
          <div className="mt-12 grid grid-cols-2 gap-3">
            <div className="card p-5">
              <p className="text-sm text-mute">Za rok utratíte</p>
              <p className="mt-1 font-display text-3xl font-medium text-plum">{formatEuro(Math.round(yearly))}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-mute">Ušetríte až</p>
              <p className="mt-1 font-display text-3xl font-medium text-ok">{formatEuro(savings)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-soft">
            {reachable.length ? `Za body si môžete vybrať napríklad: ${reachable.slice(-2).map((r) => r.title.toLowerCase()).join(" alebo ")}.` : "Body sa vám budú hromadiť na prvú odmenu."}
          </p>
        </Reveal>
      </section>

      <section className="bg-plum py-16 text-ivory sm:py-24">
        <div className="container-page">
          <SectionHeading tone="light" eyebrow="Odmeny" title="Za body si vyberiete" />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LOYALTY.rewards.map((r, i) => (
              <Reveal key={r.id} delay={i * 50} className="flex flex-col rounded-[1.4rem] bg-ivory/[0.07] p-5 ring-1 ring-ivory/10">
                <p className="font-display text-4xl font-medium text-gold-soft">{r.points}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-ivory/50">bodov</p>
                <p className="mt-4 font-medium">{r.title}</p>
                <p className="mt-1 text-sm font-light text-ivory/60">{r.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid grid-cols-1 items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
        <SectionHeading
          eyebrow="Odporúčania"
          title={
            <>
              Krása sa delí <em className="font-normal text-mauve">vo dvojici.</em>
            </>
          }
          text={`Pošlite kamarátke svoj kód. Ona dostane ${LOYALTY.referralFriendDiscount} € zľavu na prvú návštevu, vy ${LOYALTY.referralPoints} bodov hneď, ako u nás bude.`}
        />
        <Reveal className="card flex flex-wrap items-center gap-5 p-6">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gold-soft text-gold">
            <Users size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-mute">{account ? "Váš kód odporúčania" : "Napríklad"}</p>
            <p className="font-display text-3xl font-medium tracking-wide text-plum">{account?.referralCode ?? "ZUZANA10"}</p>
          </div>
          <Link to={account ? "/ucet?karta=body" : "/ucet?registracia=1"} className="btn-primary shrink-0">
            {account ? "Zdieľať" : "Získať kód"}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
