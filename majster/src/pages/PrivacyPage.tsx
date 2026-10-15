import { PageHero } from "../components/ui";
import { usePageMeta } from "../lib/hooks";
import { BIZ } from "../lib/profile";

export default function PrivacyPage() {
  usePageMeta("Ochrana súkromia");
  const sections = [
    {
      title: "Kto spracúva vaše údaje",
      text: `Prevádzkovateľom je ${BIZ.name}, ${BIZ.street}, ${BIZ.city}, IČO ${BIZ.ico}. S otázkami k údajom nám píšte na ${BIZ.email}.`,
    },
    {
      title: "Aké údaje a prečo",
      text: "Meno, telefón, e-mail, adresu a fotky, ktoré nám pošlete cez kalkulačku, rezerváciu, hlásenie havárie alebo kontaktný formulár. Používame ich len na to, aby sme vám pripravili ponuku, prišli v dohodnutom termíne a vystavili doklady (čl. 6 ods. 1 písm. b) a c) GDPR).",
    },
    {
      title: "Ako dlho",
      text: "Dopyty, z ktorých nebola zákazka, mažeme po 12 mesiacoch. Údaje k zákazkám a faktúram uchovávame 10 rokov, ako vyžaduje zákon o účtovníctve.",
    },
    {
      title: "Komu ich posielame",
      text: "Nikomu na marketing. Údaje vidí len náš tím a dodávatelia, bez ktorých to nejde: poskytovateľ hostingu, účtovníčka a pri kúpeľniach na kľúč partnerské remeslá, ktoré s nami na zákazke pracujú.",
    },
    {
      title: "Cookies",
      text: "Nevyhnutné cookies ukladajú vaše rozpracované formuláre a nastavenia. Analytické a marketingové používame len s vaším súhlasom, ktorý môžete kedykoľvek zmeniť v pätičke webu.",
    },
    {
      title: "Vaše práva",
      text: "Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť a právo namietať. Sťažnosť môžete podať na Úrad na ochranu osobných údajov SR.",
    },
    {
      title: "Mapové údaje",
      text: "Zoznam obcí a ich polohy pochádza z projektu OpenStreetMap (© prispievatelia OpenStreetMap, licencia ODbL).",
    },
  ];
  return (
    <>
      <PageHero eyebrow="Právne informácie" title="Ochrana súkromia" text="Stručne a ľudsky: čo o vás vieme, prečo a ako dlho." />
      <section className="container-page max-w-3xl py-12 sm:py-16">
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="display text-xl">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
