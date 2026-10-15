import { useMemo, useState } from "react";
import { Copy, Download, External, Icon, Link as LinkIcon, Mail } from "../components/icons";
import { useToast } from "../components/toast";
import { TownInput, type TownPick } from "../components/TownInput";
import { Segmented, TextArea, TextField } from "../components/ui";
import { STUDIO } from "../config";
import { TRADE_LIST, TRADES, isTradeId, type TradeId } from "../data/trades";
import { findTown, useGeo } from "../lib/geo";
import { usePageMeta } from "../lib/hooks";
import { buildLink } from "../lib/profile";

/** Cold-mail helper for the studio: personalised demo links and a ready e-mail, one by one or in bulk. */
export default function GeneratorPage() {
  usePageMeta("Generátor odkazov");
  const toast = useToast();
  const geo = useGeo();
  const origin = window.location.origin;
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [trade, setTrade] = useState<TradeId>("elektrikar");
  const [name, setName] = useState("");
  const [town, setTown] = useState<TownPick | null>(null);
  const [phone, setPhone] = useState("");
  const [owner, setOwner] = useState("");
  const [bulk, setBulk] = useState("elektrikar; Novák Elektro; Žilina; 0905 123 456; Peter\nstolar; Drevo Kováč; Martin; ; \nmaliar; Farby Horváth; Poprad; 0911 222 333; ");

  const link = buildLink(origin, { trade, name, city: town?.name, phone, owner });
  const mail = emailFor(trade, name, link);
  const copy = (text: string, what: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => toast(`${what} skopírovaný.`),
      () => toast("Kopírovanie zlyhalo, označte text ručne.", "info"),
    );
  };

  const rows = useMemo(
    () =>
      bulk
        .split("\n")
        .map((l) => l.split(/[;\t]/).map((c) => c.trim()))
        .filter((c) => c.some(Boolean))
        .map(([t = "", firm = "", city = "", tel = "", own = ""]) => {
          const tradeId = isTradeId(t.toLowerCase()) ? (t.toLowerCase() as TradeId) : null;
          const known = !city || !geo || !!findTown(city, geo.towns);
          return { tradeId, firm, city, known, url: tradeId ? buildLink(origin, { trade: tradeId, name: firm, city, phone: tel, owner: own }) : "" };
        }),
    [bulk, geo, origin],
  );

  const csv = () => {
    const out = ["remeslo;firma;mesto;odkaz", ...rows.filter((r) => r.url).map((r) => [r.tradeId, r.firm, r.city, r.url].join(";"))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([`﻿${out}`], { type: "text/csv;charset=utf-8" }));
    a.download = "ukazky-odkazy.csv";
    a.click();
  };

  return (
    <div className="min-h-dvh bg-bg py-10">
      <div className="container-page max-w-5xl">
        <p className="eyebrow text-accent-deep">
          <LinkIcon size={14} /> {STUDIO.name} · interný nástroj
        </p>
        <h1 className="display mt-2 text-3xl sm:text-4xl">Generátor odkazov na ukážku</h1>
        <p className="mt-2 max-w-2xl text-soft">
          Vyplňte firmu z cold e-mailu a dostanete odkaz, po ktorom sa ukážka otvorí s jej názvom, mestom a farbami remesla. Táto stránka nie je nikde prelinkovaná.
        </p>
        <Segmented
          className="mt-6"
          label="Režim"
          value={mode}
          onChange={setMode}
          options={[
            { value: "single", label: "Jedna firma" },
            { value: "bulk", label: "Hromadne" },
          ]}
        />

        {mode === "single" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card space-y-5 p-6">
              <div>
                <p className="field-label">Remeslo</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TRADE_LIST.map((t) => (
                    <button key={t.id} type="button" aria-pressed={t.id === trade} onClick={() => setTrade(t.id)} className="option-tile items-center p-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: t.colors.accent, color: t.colors.ink }}>
                        <Icon name={t.icon} size={17} strokeWidth={2.4} />
                      </span>
                      <span className="text-sm font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <TextField label="Názov firmy" value={name} onChange={(e) => setName(e.target.value)} placeholder={TRADES[trade].defaults.name} />
              <TownInput value={town} onChange={setTown} label="Mesto firmy" />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Telefón (nepovinné)" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0905 123 456" hint="Ak ho vyplníte, tlačidlá Zavolať naozaj vytáčajú." />
                <TextField label="Krstné meno majiteľa" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder={TRADES[trade].defaults.owner} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="card p-6">
                <p className="field-label">Odkaz</p>
                <p className="break-all rounded-xl bg-bg p-3 font-mono text-sm">{link}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-dark btn-sm" onClick={() => copy(link, "Odkaz")}>
                    <Copy size={16} /> Kopírovať odkaz
                  </button>
                  <a href={link} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                    <External size={16} /> Otvoriť ukážku
                  </a>
                </div>
              </div>
              <div className="card p-6">
                <p className="field-label">E-mail</p>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-bg p-4 font-sans text-sm leading-relaxed">{mail}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-accent btn-sm" onClick={() => copy(mail, "E-mail")}>
                    <Copy size={16} /> Kopírovať e-mail
                  </button>
                  <a className="btn-outline btn-sm" href={`mailto:?subject=${encodeURIComponent(mail.split("\n")[0].replace("Predmet: ", ""))}&body=${encodeURIComponent(mail.split("\n").slice(2).join("\n"))}`}>
                    <Mail size={16} /> Otvoriť v pošte
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="card p-6">
              <TextArea
                label="Jedna firma na riadok: remeslo; firma; mesto; telefón; meno"
                rows={6}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                className="[&_textarea]:font-mono [&_textarea]:text-sm"
                hint={`Remeslo: ${TRADE_LIST.map((t) => t.id).join(", ")}. Stĺpce oddeľte bodkočiarkou alebo tabulátorom (kopírovanie z Excelu funguje).`}
              />
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg text-left text-xs uppercase tracking-wide text-mute">
                  <tr>
                    <th className="px-4 py-3">Firma</th>
                    <th className="px-4 py-3">Mesto</th>
                    <th className="px-4 py-3">Odkaz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-semibold">
                        {r.firm || "—"}
                        <span className="block text-xs font-normal text-mute">{r.tradeId ? TRADES[r.tradeId].label : "neznáme remeslo"}</span>
                      </td>
                      <td className={`px-4 py-3 ${r.known ? "" : "text-warn"}`}>{r.city ? `${r.city}${r.known ? "" : " (nenájdené)"}` : "—"}</td>
                      <td className="px-4 py-3">
                        {r.url ? (
                          <button type="button" className="break-all text-left font-mono text-xs text-accent-deep hover:underline" onClick={() => copy(r.url, "Odkaz")}>
                            {r.url}
                          </button>
                        ) : (
                          <span className="text-danger">Opravte remeslo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-dark btn-sm" onClick={() => copy(rows.map((r) => r.url).filter(Boolean).join("\n"), "Zoznam odkazov")}>
                <Copy size={16} /> Kopírovať všetky odkazy
              </button>
              <button type="button" className="btn-outline btn-sm" onClick={csv}>
                <Download size={16} /> Stiahnuť CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function emailFor(tradeId: TradeId, firm: string, link: string) {
  const t = TRADES[tradeId];
  const who = firm.trim() || "vašu firmu";
  const extras = t.emergency ? ", pri havárii nahlásia poruchu a na mape vidia, kde je technik" : "";
  return `Predmet: Ukážka webu pre ${who}

Dobrý deň,

pre ${who} mám pripravenú ukážku webu, ktorý zákazníkom ušetrí telefonovanie a vám prinesie viac dopytov:
${link}

Zákazníci si na ňom sami spočítajú orientačnú cenu, vyberú voľný termín obhliadky v kalendári${extras}. Vy všetky dopyty, termíny a cenové ponuky vidíte v jednoduchej administrácii a ponuku zákazník prijme jedným klikom.

Web už je s vaším názvom a mestom – stačí kliknúť a vyskúšať. Fotky, služby aj ceny vám potom prispôsobím na mieru.

Ak vás to zaujalo, stačí odpísať na tento e-mail.

S pozdravom
${STUDIO.author}
${STUDIO.name} · ${STUDIO.email}`;
}
