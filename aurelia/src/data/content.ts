import type { PhotoKey } from "./photos";
import type { CategoryId } from "./services";

export const RATING = { score: 4.9, count: 1854, google: 4.9, googleCount: 1210 };

export const REVIEWS: { name: string; text: string; rating: number; service: string; specialist: string; when: string }[] = [
  {
    name: "Katarína M.",
    text: "Konečne balayage, ktoré prerastá krásne aj po troch mesiacoch. Simona si dala na čas, vysvetlila každý krok a vlasy sú po zosvetlení mäkšie než predtým.",
    rating: 5,
    service: "Balayage / Airtouch",
    specialist: "simona",
    when: "pred 2 týždňami",
  },
  {
    name: "Lucia H.",
    text: "Rezervácia online za minútu, SMS deň vopred a v salóne voňavá káva. Gél lak od Laury drží už štvrtý týždeň.",
    rating: 5,
    service: "Gél lak na ruky",
    specialist: "laura",
    when: "pred mesiacom",
  },
  {
    name: "Petra K.",
    text: "HydraGlow pred svadbou kamarátky bola najlepšia investícia. Eva mi zároveň poradila, čo prestať používať. Pleť je po rokoch pokojná.",
    rating: 5,
    service: "HydraGlow ošetrenie pleti",
    specialist: "eva",
    when: "pred 3 týždňami",
  },
  {
    name: "Martin V.",
    text: "Chodím k Tomášovi každých päť týždňov. Strih presne podľa dohody, bez čakania a s rezerváciou na mobile medzi dvoma meetingami.",
    rating: 5,
    service: "Pánsky strih",
    specialist: "tomas",
    when: "pred 5 dňami",
  },
  {
    name: "Simona T.",
    text: "Veronika ma ostrihala na krátko po pätnástich rokoch dlhých vlasov. Bála som sa, teraz to ľutujem len preto, že som to neurobila skôr.",
    rating: 5,
    service: "Dámsky strih a fúkaná",
    specialist: "veronika",
    when: "pred 2 mesiacmi",
  },
  {
    name: "Zuzana P.",
    text: "Vernostný program reálne funguje, za body som mala Olaplex k farbe zadarmo. A pripomienka, že je čas na odrasty, prišla presne vtedy, keď som to potrebovala.",
    rating: 5,
    service: "Farbenie odrastov",
    specialist: "natalia",
    when: "pred týždňom",
  },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Môžem si termín presunúť alebo zrušiť?",
    a: "Áno, bezplatne do 24 hodín pred termínom cez odkaz v potvrdení alebo vo svojom účte. Neskôr prepadá záloha, ak ste ju platili. Ak sa niečo stane na poslednú chvíľu, zavolajte nám, vždy sa dohodneme.",
  },
  {
    q: "Prečo pri niektorých službách platím zálohu?",
    a: "Pri dlhých službách ako balayage alebo svadobné účesy blokujeme celé dopoludnie. Záloha 30 % (najmenej 20 €) sa vám odpočíta z ceny, takže nič nepreplácate.",
  },
  {
    q: "Čo je test citlivosti a kedy ho potrebujem?",
    a: "Pri prvom farbení vlasov, lash liftingu, laminácii a peelingoch spravíme 48 hodín vopred krátky test na koži za uchom. Trvá päť minút, je zadarmo a môžete prísť kedykoľvek počas otváracích hodín.",
  },
  {
    q: "Prečo sa ceny líšia podľa stylistky?",
    a: "Pri vlasoch máme tri úrovne: Junior (výhodnejšia cena), Senior a Art director. Všetky robia rovnakú kvalitu, rozdiel je v praxi a náročnosti premien, ktoré zvládnu. Presnú cenu vidíte hneď pri výbere.",
  },
  {
    q: "Ako funguje vernostný program?",
    a: "Za každé 1 € získate 1 bod, v mesiaci narodenín dvojnásobok. Body vymeníte za zľavy alebo služby a po 600 bodoch získate status Gold so zľavou 5 % na každú návštevu.",
  },
  {
    q: "Dá sa u vás parkovať?",
    a: "Najbližšie je garáž Kapitulská (4 min pešo) a modrá zóna na Palisádach. Električka zastavuje na Kapucínskej, dve minúty od nás.",
  },
];

export const GALLERY: { photo: PhotoKey; cat: CategoryId; title: string; specialist: string; tall?: boolean }[] = [
  { photo: "hairColor", cat: "farba", title: "Levanduľový pastel s Olaplexom", specialist: "simona", tall: true },
  { photo: "nailsSoft", cat: "nechty", title: "Sivá, biela a trblietky", specialist: "laura" },
  { photo: "hairBob", cat: "strih", title: "Medené mikádo", specialist: "veronika" },
  { photo: "look2", cat: "farba", title: "Teplý čokoládový balayage", specialist: "simona", tall: true },
  { photo: "lashes", cat: "riasy", title: "Predlžovanie 1:1, efekt mačacie oko", specialist: "laura", tall: true },
  { photo: "nailsDark", cat: "nechty", title: "Korytnačí vzor a čierna", specialist: "kristina", tall: true },
  { photo: "look5", cat: "plet", title: "Pleť po sérii peelingov", specialist: "eva", tall: true },
  { photo: "hero", cat: "farba", title: "Karamelové vlny", specialist: "natalia" },
  { photo: "look3", cat: "strih", title: "Tvarovanie prírodných kučier", specialist: "tomas" },
  { photo: "makeup", cat: "licenie", title: "Večerné líčenie s ružovým leskom", specialist: "eva" },
  { photo: "nailsNude", cat: "nechty", title: "Nude mandle", specialist: "kristina" },
  { photo: "look4", cat: "plet", title: "Žiarivá pleť po HydraGlow", specialist: "eva", tall: true },
  { photo: "look6", cat: "strih", title: "Uhladený sleek look", specialist: "tomas", tall: true },
  { photo: "hairStyling", cat: "strih", title: "Objemná fúkaná", specialist: "natalia" },
  { photo: "facialMask", cat: "plet", title: "Detoxikačná ílová maska", specialist: "eva" },
  { photo: "nailsWork", cat: "nechty", title: "Prístrojová manikúra", specialist: "kristina" },
  { photo: "stones", cat: "telo", title: "Rituál s lávovými kameňmi", specialist: "eva" },
];

export const BRANDS = ["Wella Professionals", "Olaplex", "Kérastase", "OPI", "Dermalogica", "Elleebana", "Davines"];
