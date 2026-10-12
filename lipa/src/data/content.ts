import type { PhotoKey } from "./photos";

export const REVIEWS = [
  {
    name: "Zuzana K.",
    when: "pred 5 dňami",
    rating: 5,
    text: "Kačica bola najlepšia, akú sme v Bratislave jedli, a sommeliérka nám k nej našla Svätovavrinecké, ktoré si teraz kupujeme domov. Rezervácia cez web trvala minútu.",
  },
  {
    name: "Martin H.",
    when: "pred 2 týždňami",
    rating: 5,
    text: "Na obed chodíme s kolegami pravidelne. Menu sa mení každý deň, porcie sú poctivé a obsluha je rýchla aj v najväčšom zhone.",
  },
  {
    name: "Lucia V.",
    when: "pred 3 týždňami",
    rating: 5,
    text: "Robili sme tu oslavu tridsiatky v salóniku pre 18 ľudí. Ponuku sme mali do druhého dňa a všetko klaplo na minútu.",
  },
  {
    name: "Peter Š.",
    when: "pred mesiacom",
    rating: 4,
    text: "Výborný steak a skvelá vínna karta zo slovenských vinárstiev. V piatok večer je tu rušno, takže odporúčam rezervovať vopred.",
  },
  {
    name: "Eva M.",
    when: "pred mesiacom",
    rating: 5,
    text: "Konečne podnik, kde majú alergény prehľadne pri každom jedle a vedia poradiť. Ako celiatička som sa tu cítila bezpečne.",
  },
  {
    name: "Jakub T.",
    when: "pred 2 mesiacmi",
    rating: 5,
    text: "Darčeková poukážka pre rodičov k výročiu, kúpená večer o jedenástej a hneď v e-maile. Rodičia boli nadšení z degustačného menu.",
  },
];

export const RATING = { score: 4.8, count: 1287 };

export const TEAM: { name: string; role: string; photo: PhotoKey; text: string }[] = [
  {
    name: "Tomáš Hudák",
    role: "Šéfkuchár a spolumajiteľ",
    photo: "chef",
    text: "Vyučil sa v Bratislave, varil v Kodani a vo Viedni. Domov sa vrátil s jednoduchou myšlienkou: variť to, čo práve rastie okolo nás.",
  },
  {
    name: "Petra Kollárová",
    role: "Sommeliérka",
    photo: "sommelier",
    text: "Pozná osobne väčšinu vinárov na našej karte. Na otázku „čo by ste mi odporučili“ odpovedá otázkou, čo budete jesť.",
  },
  {
    name: "Lucia Mrázová",
    role: "Prevádzková manažérka",
    photo: "manager",
    text: "Stará sa o to, aby ste sa u nás cítili ako doma, od prvého telefonátu až po posledný pohárik na dvore.",
  },
];

export const SUPPLIERS = [
  { name: "Farma pod Babou", place: "Pezinok", what: "Zelenina a bylinky" },
  { name: "Salaš Pod Chočom", place: "Liptov", what: "Bryndza a ovčie syry" },
  { name: "Rybárstvo Biely Váh", place: "Liptovský Hrádok", what: "Pstruhy a sivene" },
  { name: "Hontianske stádo", place: "Hont", what: "Hovädzie mäso" },
  { name: "Mangalica Záhorie", place: "Malacky", what: "Mangalica a husi" },
  { name: "Pekáreň Kvások", place: "Bratislava", what: "Múka a kvások" },
];

export const SPACES: { id: string; name: string; capacity: string; text: string; photo: PhotoKey }[] = [
  { id: "interier", name: "Jedáleň", capacity: "44 miest", text: "Dubové stoly, otvorená kuchyňa a pec na drevo.", photo: "interior" },
  { id: "bar", name: "Vínny bar", capacity: "12 miest", text: "Pohár vína a malé taniere pri pulte.", photo: "bar" },
  { id: "terasa", name: "Dvor pod lipou", capacity: "30 miest", text: "Vyhrievaná terasa od apríla do októbra.", photo: "terrace" },
  { id: "salonik", name: "Salónik", capacity: "do 20 hostí", text: "Súkromná miestnosť na oslavy a firemné večere.", photo: "privateRoom" },
];

export const FAQ = [
  {
    q: "Potrebujem rezerváciu?",
    a: "Na obed väčšinou nie. Na večer od štvrtka do soboty ju odporúčame. Pár stolov si vždy necháme pre hostí, ktorí prídu bez rezervácie.",
  },
  {
    q: "Máte jedlá bez lepku a pre vegánov?",
    a: "Áno. Pri každom jedle uvádzame alergény a na jedálnom lístku si môžete jedlá vyfiltrovať. Kuchyňa vie väčšinu jedál upraviť, stačí to napísať do poznámky k rezervácii.",
  },
  {
    q: "Môžem prísť so psom?",
    a: "Psíkov radi privítame na terase aj v bare. Misku s vodou prinesieme sami.",
  },
  {
    q: "Môžeme si priniesť vlastnú tortu?",
    a: "Áno, za tortovné 2 € na osobu ju nakrájame, naservírujeme a ozdobíme sviečkami.",
  },
  {
    q: "Je reštaurácia bezbariérová?",
    a: "Vstup z ulice aj toalety sú bezbariérové. Terasa je na rovnakej úrovni ako jedáleň.",
  },
  {
    q: "Kde zaparkujem?",
    a: "Najbližšie platené parkovanie je v garáži na Lipovej ulici, 3 minúty pešo. Hostia s rezerváciou nad 50 € majú 2 hodiny parkovania zadarmo.",
  },
];

export const PRIVATE_SPACES = [
  { id: "salonik", name: "Salónik", min: 8, max: 20, fee: 0, minSpend: 600, text: "Súkromná miestnosť s vlastným vchodom a projektorom." },
  { id: "pivnica", name: "Vínna pivnica", min: 6, max: 14, fee: 80, minSpend: 500, text: "Tehlová klenba a 400 fliaš okolo vás." },
  { id: "terasa", name: "Terasa", min: 15, max: 40, fee: 0, minSpend: 1200, text: "Celý dvor len pre vás, apríl – október." },
  { id: "cela", name: "Celá reštaurácia", min: 30, max: 90, fee: 0, minSpend: 3500, text: "Exkluzívne pre vašu akciu, vrátane baru a dvora." },
];

export const PACKAGES = [
  { id: "aperitiv", name: "Aperitív a malé taniere", price: 32, text: "Šesť druhov chuťoviek podávaných postupne, ideálne na stojato." },
  { id: "vecera", name: "Trojchodová večera", price: 49, text: "Predjedlo, hlavný chod na výber z troch a dezert." },
  { id: "degustacia", name: "Degustačné menu", price: 75, text: "Päť chodov podľa sezóny, ktoré šéfkuchár pripraví na mieru." },
  { id: "bufet", name: "Bufet", price: 38, text: "Teplý a studený bufet, vhodný pre firemné akcie a svadby." },
];

export const WINE_PAIRING_PRICE = 22;

export const EVENT_TYPES = ["Narodeniny", "Firemná večera", "Svadba", "Krstiny", "Teambuilding", "Iné"];

export const DELIVERY_ZONES = [
  { id: "a", name: "Staré Mesto", zips: ["811"], fee: 1.9, min: 15, minutes: 30 },
  { id: "b", name: "Nové Mesto, Ružinov", zips: ["821", "831"], fee: 2.9, min: 20, minutes: 40 },
  { id: "c", name: "Karlova Ves, Petržalka, Rača", zips: ["841", "851", "831 06", "831 07"], fee: 3.9, min: 25, minutes: 50 },
];

/** Free delivery from this order value. */
export const FREE_DELIVERY_FROM = 45;

/** Matches a Bratislava postcode ("811 01", "81101") to a delivery zone. */
export function zoneForZip(zip: string) {
  const digits = zip.replace(/\s/g, "");
  if (!/^\d{5}$/.test(digits)) return null;
  const spaced = `${digits.slice(0, 3)} ${digits.slice(3)}`;
  // Longer, more specific prefixes win: "831 06" (Rača) is zone C even though "831" is zone B.
  let best: (typeof DELIVERY_ZONES)[number] | null = null;
  let bestLen = 0;
  for (const zone of DELIVERY_ZONES) {
    for (const prefix of zone.zips) {
      if (spaced.startsWith(prefix) && prefix.length > bestLen) {
        best = zone;
        bestLen = prefix.length;
      }
    }
  }
  return best;
}

export const VOUCHER_AMOUNTS = [30, 50, 80, 100, 150];

export const VOUCHER_EXPERIENCES = [
  { id: "degustacia-2", title: "Degustačné menu pre dvoch", price: 150, text: "Sedem chodov podľa sezóny a aperitív na privítanie." },
  { id: "chefs-2", title: "Chef's table pre dvoch", price: 190, text: "Miesto pri kuchyni, sedem chodov a vínne párovanie." },
  { id: "vino-2", title: "Degustácia vín pre dvoch", price: 78, text: "Vstupenky na Vínny štvrtok podľa vlastného výberu." },
  { id: "kurz", title: "Kurz kváskového chleba", price: 45, text: "Trojhodinový kurz s naším pekárom a brunch." },
];

export const VOUCHER_DESIGNS = [
  { id: "linden", name: "Lipa", bg: "#1c2b21", fg: "#f4efe5", accent: "#c99a3e" },
  { id: "cream", name: "Krém", bg: "#f1e2bf", fg: "#1c2b21", accent: "#7b2d33" },
  { id: "night", name: "Noc", bg: "#121a15", fg: "#f4efe5", accent: "#9fb39a" },
  { id: "wine", name: "Víno", bg: "#5e2228", fg: "#f4efe5", accent: "#f1e2bf" },
];
