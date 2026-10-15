import { useNavigate } from "react-router-dom";
import { ArrowRight, Copy, Gift, Mail, Send, Users } from "../../components/icons";
import { useToast } from "../../components/toast";
import { LOYALTY, SALON } from "../../config";
import { redeemReward } from "../../lib/actions";
import { formatDateNumeric, plural } from "../../lib/format";
import type { loyaltyState } from "../../lib/loyalty";
import type { Account } from "../../lib/types";

type Loyalty = ReturnType<typeof loyaltyState>;

export default function Points({ account, loyalty, now }: { account: Account; loyalty: Loyalty; now: Date }) {
  const toast = useToast();
  const navigate = useNavigate();
  const open = account.rewards.filter((r) => !r.usedAt);
  const copy = (text: string, msg = "Skopírované.") => {
    navigator.clipboard?.writeText(text).catch(() => {});
    toast(msg);
  };
  const shareText = `Skús Aurelia beauty atelier v Bratislave! S mojím kódom ${account.referralCode} máš ${LOYALTY.referralFriendDiscount} € zľavu na prvú návštevu: ${window.location.origin}/rezervacia`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-10">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-medium text-plum">Odmeny</h2>
            <p className="text-sm text-soft">
              Máte <strong className="font-medium text-plum">{loyalty.balance.toLocaleString("sk-SK")}</strong> {plural(loyalty.balance, ["bod", "body", "bodov"])}
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {LOYALTY.rewards.map((r) => {
              const enough = loyalty.balance >= r.points;
              return (
                <div key={r.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${enough ? "border-gold/40 bg-paper" : "border-line bg-paper/60"}`}>
                  <span className={`grid size-12 shrink-0 place-items-center rounded-full ${enough ? "bg-gold-soft text-gold" : "bg-blush text-mute"}`}>
                    <Gift size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{r.title}</p>
                    <p className="text-xs text-mute">
                      {r.points} bodov · {r.text}
                    </p>
                    {!enough && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-blush">
                        <div className="h-full rounded-full bg-gold/60" style={{ width: `${Math.max(4, (loyalty.balance / r.points) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!enough}
                    className="btn-primary px-4 py-2 text-sm"
                    onClick={() => {
                      const code = redeemReward(account, r.id, now);
                      if (code) toast(<>Hotovo! Kód {code} použijete pri rezervácii.</>);
                    }}
                  >
                    {enough ? "Vymeniť" : `${r.points - loyalty.balance} b.`}
                  </button>
                </div>
              );
            })}
          </div>
          {open.length > 0 && (
            <div className="mt-6 rounded-2xl bg-gold-soft/50 p-5">
              <p className="font-medium text-plum">Moje nevyužité odmeny</p>
              <ul className="mt-3 space-y-2">
                {open.map((r) => {
                  const def = LOYALTY.rewards.find((x) => x.id === r.rewardId);
                  return (
                    <li key={r.code} className="flex flex-wrap items-center gap-3 rounded-xl bg-paper px-4 py-3">
                      <span className="font-mono text-sm font-semibold tracking-wider text-plum">{r.code}</span>
                      <span className="flex-1 text-sm text-soft">{def?.title}</span>
                      <button type="button" className="inline-flex items-center gap-1 text-sm text-soft hover:text-ink" onClick={() => copy(r.code)}>
                        <Copy size={14} /> Kopírovať
                      </button>
                      <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-plum" onClick={() => navigate("/rezervacia")}>
                        Použiť <ArrowRight size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-3xl font-medium text-plum">História bodov</h2>
          <div className="card mt-5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blush/50 text-left text-xs uppercase tracking-wider text-mute">
                <tr>
                  <th className="px-4 py-3 font-medium">Dátum</th>
                  <th className="px-4 py-3 font-medium">Pohyb</th>
                  <th className="px-4 py-3 text-right font-medium">Body</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loyalty.pending > 0 && (
                  <tr className="text-mute">
                    <td className="px-4 py-3">čaká</td>
                    <td className="px-4 py-3">Nadchádzajúce návštevy</td>
                    <td className="px-4 py-3 text-right tabular-nums">+{loyalty.pending}</td>
                  </tr>
                )}
                {loyalty.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-mute">{formatDateNumeric(new Date(e.at))}</td>
                    <td className="px-4 py-3 text-ink">{e.label}</td>
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${e.points < 0 ? "text-danger" : "text-ok"}`}>
                      {e.points > 0 ? "+" : ""}
                      {e.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[1.6rem] bg-plum p-6 text-ivory">
          <Users size={26} className="text-gold" />
          <p className="mt-4 font-display text-3xl font-medium leading-tight">Pozvite kamarátku</p>
          <p className="mt-2 text-sm font-light text-ivory/70">
            Ona dostane {LOYALTY.referralFriendDiscount} € zľavu na prvú návštevu, vy {LOYALTY.referralPoints} bodov, keď u nás bude.
          </p>
          <button type="button" onClick={() => copy(account.referralCode, "Kód je skopírovaný.")} className="mt-5 flex w-full items-center justify-between rounded-xl bg-ivory/10 px-4 py-3 ring-1 ring-ivory/15 hover:bg-ivory/15">
            <span className="font-mono text-lg font-semibold tracking-[0.12em]">{account.referralCode}</span>
            <Copy size={17} />
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="btn-gold py-2.5 text-sm">
              <Send size={15} /> WhatsApp
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(`Tip na salón: ${SALON.name}`)}&body=${encodeURIComponent(shareText)}`} className="btn-ghost-light py-2.5 text-sm">
              <Mail size={15} /> E-mail
            </a>
          </div>
        </div>
        <div className="card p-5 text-sm text-soft">
          <p className="font-medium text-plum">Ako body fungujú</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{LOYALTY.pointsPerEuro} bod za každé zaplatené euro, pripíšeme po návšteve.</li>
            <li>V mesiaci narodenín dvojnásobok.</li>
            <li>Status sa počíta zo všetkých získaných bodov, výmena ho neznižuje.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
