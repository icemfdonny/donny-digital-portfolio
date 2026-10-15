import { useMemo, useState } from "react";
import { STATUS_LABEL } from "../../lib/labels";
import { Crown, Download, Phone, Plus, Search, Send } from "../../components/icons";
import { useToast } from "../../components/toast";
import { Avatar, Dialog, Initials } from "../../components/ui";
import { SPECIALIST_BY_ID } from "../../data/team";
import { formatDateNumeric, formatEuro, formatPhone, formatPrice, fromISODate, minutesToTime, plural, uid } from "../../lib/format";
import { loyaltyState } from "../../lib/loyalty";
import { updateDB, type DB } from "../../lib/store";
import { buildClients, clientTags, downloadCsv, type Client } from "./adminData";
import { Pill } from "./AdminUI";

type Filter = "all" | "vip" | "new" | "lapsed" | "account";
type Sort = "last" | "spent" | "visits";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Všetky" },
  { id: "vip", label: "VIP" },
  { id: "new", label: "Nové" },
  { id: "lapsed", label: "Dlho neboli" },
  { id: "account", label: "S účtom" },
];

export default function Clients({ db, now, initialClient }: { db: DB; now: Date; initialClient: string | null }) {
  const clients = useMemo(() => buildClients(db, now), [db, now]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("last");
  const [limit, setLimit] = useState(25);
  const [openKey, setOpenKey] = useState<string | null>(initialClient?.toLowerCase() ?? null);
  const q = query.trim().toLowerCase();

  const rows = clients
    .filter((c) => !q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q))
    .filter((c) => {
      const tags = clientTags(c, now).map((t) => t.label);
      if (filter === "vip") return tags.includes("VIP");
      if (filter === "new") return tags.includes("Nová");
      if (filter === "lapsed") return tags.includes("Dlho nebola");
      if (filter === "account") return !!c.accountId;
      return true;
    })
    .sort((a, b) => (sort === "spent" ? b.spent - a.spent : sort === "visits" ? b.visits - a.visits : (b.next ?? b.last ?? "").localeCompare(a.next ?? a.last ?? "")));
  const open = openKey ? clients.find((c) => c.key === openKey) : null;
  const total = clients.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium text-plum sm:text-5xl">Klientky</h1>
          <p className="mt-1 text-sm text-mute">
            {clients.length} klientok za posledných 6 mesiacov · {formatEuro(Math.round(total))} tržby
          </p>
        </div>
        <button
          type="button"
          className="btn-outline py-2.5 text-sm"
          onClick={() =>
            downloadCsv("aurelia-klientky.csv", [
              ["Meno", "E-mail", "Telefón", "Návštevy", "Útrata €", "Posledná návšteva", "Najbližší termín", "Obľúbená špecialistka"],
              ...rows.map((c) => [c.name, c.email, c.phone, c.visits, c.spent, c.last ?? "", c.next ?? "", SPECIALIST_BY_ID.get(c.favourite)?.name ?? ""]),
            ])
          }
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
          <label htmlFor="client-search" className="sr-only">
            Hľadať klientku
          </label>
          <input id="client-search" className="field rounded-full py-2.5 pl-11" placeholder="Meno, e-mail alebo telefón" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip py-1.5 text-[13px]" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-soft">
          Zoradiť
          <select className="field w-auto py-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="last">podľa návštevy</option>
            <option value="spent">podľa útraty</option>
            <option value="visits">podľa počtu návštev</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-4 py-3 font-medium">Klientka</th>
              <th className="px-4 py-3 font-medium">Štítky</th>
              <th className="px-4 py-3 text-right font-medium">Návštevy</th>
              <th className="px-4 py-3 text-right font-medium">Útrata</th>
              <th className="px-4 py-3 font-medium">Posledná</th>
              <th className="px-4 py-3 font-medium">Najbližšia</th>
              <th className="px-4 py-3 font-medium">Chodí k</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.slice(0, limit).map((c) => (
              <tr key={c.key} className="cursor-pointer hover:bg-blush/40" onClick={() => setOpenKey(c.key)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Initials name={c.name} className="size-9 text-xs" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{c.name}</p>
                      <p className="truncate text-xs text-mute">{c.email || formatPhone(c.phone)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {clientTags(c, now).map((t) => (
                      <Pill key={t.label} tone={t.tone}>
                        {t.label}
                      </Pill>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{c.visits}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatEuro(Math.round(c.spent))}</td>
                <td className="px-4 py-3 tabular-nums text-soft">{c.last ? formatDateNumeric(fromISODate(c.last)) : "–"}</td>
                <td className="px-4 py-3 tabular-nums text-soft">{c.next ? formatDateNumeric(fromISODate(c.next)) : "–"}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <Avatar id={c.favourite} size={24} /> {SPECIALIST_BY_ID.get(c.favourite)?.firstName}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-mute">
                  Nikoho sme nenašli.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {rows.length > limit && (
          <button type="button" className="w-full border-t border-line py-3 text-sm font-medium text-mauve hover:bg-blush/40" onClick={() => setLimit(limit + 25)}>
            Zobraziť ďalšie ({rows.length - limit})
          </button>
        )}
      </div>

      <ClientDrawer client={open ?? null} db={db} now={now} onClose={() => setOpenKey(null)} />
    </div>
  );
}

function ClientDrawer({ client, db, now, onClose }: { client: Client | null; db: DB; now: Date; onClose: () => void }) {
  const toast = useToast();
  const account = client?.accountId ? db.accounts.find((a) => a.id === client.accountId) : null;
  const loyalty = account ? loyaltyState(account, db, now) : null;
  const history = client ? [...client.history].sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`)) : [];
  const top = client ? Object.entries(client.services).sort((a, b) => b[1] - a[1]).slice(0, 3) : [];

  return (
    <Dialog open={!!client} onClose={onClose} variant="drawer" size="lg" title={client?.name}>
      {client && (
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-1.5">
            {clientTags(client, now).map((t) => (
              <Pill key={t.label} tone={t.tone}>
                {t.label}
              </Pill>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Návštevy", value: String(client.visits) },
              { label: "Útrata", value: formatEuro(Math.round(client.spent)) },
              { label: "Priemerne", value: client.visits ? formatEuro(Math.round(client.spent / client.visits)) : "–" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-blush/60 p-4">
                <p className="text-xs text-mute">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-medium text-plum">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href={`tel:${client.phone}`} className="btn-outline py-2">
              <Phone size={15} /> {formatPhone(client.phone)}
            </a>
            <button type="button" className="btn-outline py-2" onClick={() => toast(`SMS s ponukou termínu odoslaná: ${client.name.split(" ")[0]} (simulácia).`)}>
              <Send size={15} /> Poslať ponuku termínu
            </button>
          </div>

          {account && loyalty && (
            <div className="gold-card rounded-2xl p-5 text-plum">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Crown size={16} /> {loyalty.tier.name} · {loyalty.balance.toLocaleString("sk-SK")} bodov
              </p>
              {account.careNotes && <p className="mt-2 text-sm text-plum/80">Starostlivosť: {account.careNotes}</p>}
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1.5 text-xs font-medium"
                onClick={() => {
                  updateDB((d) => ({
                    ...d,
                    accounts: d.accounts.map((a) => (a.id === account.id ? { ...a, ledger: [...a.ledger, { id: uid(), at: Date.now(), points: 50, label: "Bonus od salónu" }] } : a)),
                  }));
                  toast("Pripísaných 50 bodov. Klientka ich vidí v účte.");
                }}
              >
                <Plus size={13} /> Pripísať 50 bodov
              </button>
            </div>
          )}

          {top.length > 0 && (
            <div>
              <p className="field-label">Najčastejšie služby</p>
              <div className="flex flex-wrap gap-1.5">
                {top.map(([name, n]) => (
                  <span key={name} className="rounded-full bg-blush px-3 py-1 text-xs text-plum">
                    {name} · {n}×
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="field-label">
              História ({history.length} {plural(history.length, ["záznam", "záznamy", "záznamov"])})
            </p>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {history.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <Avatar id={a.items[0].specialistId} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.items.map((i) => i.name).join(" + ")}</p>
                    <p className="text-xs text-mute">
                      {formatDateNumeric(fromISODate(a.date))} {minutesToTime(a.start)} · {SPECIALIST_BY_ID.get(a.items[0].specialistId)?.firstName}
                    </p>
                    {a.stylistNote && <p className="mt-1 text-xs text-soft">{a.stylistNote}</p>}
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums">{formatPrice(a.total)}</p>
                    <p className="text-xs text-mute">{STATUS_LABEL[a.status]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Dialog>
  );
}
