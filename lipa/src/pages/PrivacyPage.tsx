import { PageHero } from "../components/ui";
import { RESTAURANT } from "../config";
import { usePageMeta } from "../lib/hooks";

const SECTIONS = [
  {
    title: "Kto spracúva vaše údaje",
    body: `Prevádzkovateľom je ${RESTAURANT.fullName}, ${RESTAURANT.street}, ${RESTAURANT.zip} ${RESTAURANT.city}. Kontakt pre otázky k osobným údajom: ${RESTAURANT.email}. (Lipa je fiktívna reštaurácia, tento text je ukážkový.)`,
  },
  {
    title: "Aké údaje a prečo",
    body: "Pri rezervácii, objednávke, kúpe poukážky alebo vstupenky potrebujeme meno, e-mail a telefón, pri rozvoze aj adresu. Používame ich len na vybavenie vašej požiadavky (čl. 6 ods. 1 písm. b GDPR). Newsletter posielame len so súhlasom, ktorý môžete kedykoľvek odvolať.",
  },
  {
    title: "Ako dlho ich uchovávame",
    body: "Údaje k rezerváciám mažeme 12 mesiacov po návšteve. Doklady k platbám uchovávame 10 rokov, ako vyžaduje zákon o účtovníctve.",
  },
  {
    title: "Platby",
    body: "Platby kartou spracúva certifikovaná platobná brána. Údaje o karte k nám vôbec neprichádzajú.",
  },
  {
    title: "Cookies",
    body: "Nevyhnutné cookies a lokálne úložisko používame na košík, rezervácie a nastavenia webu. Analytické a marketingové cookies len s vaším súhlasom, ktorý môžete zmeniť v pätičke cez Nastavenia cookies.",
  },
  {
    title: "Vaše práva",
    body: "Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť a námietku. Sťažnosť môžete podať Úradu na ochranu osobných údajov SR.",
  },
];

export default function PrivacyPage() {
  usePageMeta("Ochrana súkromia");
  return (
    <>
      <PageHero eyebrow="Právne informácie" title="Ochrana súkromia" text="Stručne a zrozumiteľne: aké údaje zbierame, prečo a ako s nimi zaobchádzame." />
      <div className="container-page max-w-3xl py-14 sm:py-20">
        <div className="space-y-10">
          {SECTIONS.map((s, i) => (
            <section key={s.title}>
              <h2 className="font-display text-2xl text-forest">
                <span className="mr-2 text-moss">{i + 1}.</span>
                {s.title}
              </h2>
              <p className="mt-3 text-[17px] leading-relaxed text-soft">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
