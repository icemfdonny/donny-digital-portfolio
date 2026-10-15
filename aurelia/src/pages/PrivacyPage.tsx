import { PageHero } from "../components/ui";
import { SALON } from "../config";
import { usePageMeta } from "../lib/hooks";

const SECTIONS = [
  {
    title: "Kto spracúva vaše údaje",
    body: `Prevádzkovateľom je ${SALON.fullName}, ${SALON.street}, ${SALON.zip} ${SALON.city}. Kontakt pre otázky k osobným údajom: ${SALON.email}. (Aurelia je fiktívny salón, tento text je ukážkový.)`,
  },
  {
    title: "Aké údaje a prečo",
    body: "Pri rezervácii potrebujeme meno, e-mail a telefón, s účtom aj dátum narodenín (nepovinný) a poznámky k starostlivosti, napríklad alergie. Používame ich len na vybavenie rezervácie a vedenie vernostného účtu (čl. 6 ods. 1 písm. b GDPR). Údaje o zdraví, ako alergie, spracúvame len s vaším výslovným súhlasom. Beauty list posielame len so súhlasom, ktorý môžete kedykoľvek odvolať.",
  },
  {
    title: "Ako dlho ich uchovávame",
    body: "Históriu návštev uchovávame, kým máte účet. Bez účtu mažeme údaje k rezervácii 12 mesiacov po návšteve. Doklady k platbám uchovávame 10 rokov, ako vyžaduje zákon o účtovníctve.",
  },
  {
    title: "Platby",
    body: "Platby kartou spracúva certifikovaná platobná brána. Údaje o karte k nám vôbec neprichádzajú.",
  },
  {
    title: "Cookies",
    body: "Nevyhnutné cookies a lokálne úložisko používame na rezervácie, prihlásenie a nastavenia webu. Analytické a marketingové cookies len s vaším súhlasom, ktorý môžete zmeniť v pätičke cez Nastavenia cookies.",
  },
  {
    title: "Vaše práva",
    body: "Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť a námietku. V profile si údaje stiahnete alebo účet zmažete jedným klikom. Sťažnosť môžete podať Úradu na ochranu osobných údajov SR.",
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
              <h2 className="font-display text-3xl font-medium text-plum">
                <span className="mr-2 text-gold">{i + 1}.</span>
                {s.title}
              </h2>
              <p className="mt-3 text-[17px] font-light leading-relaxed text-soft">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
