import type { PhotoKey } from "./photos";

export type CategoryId = "strih" | "farba" | "nechty" | "riasy" | "plet" | "telo" | "licenie";

export type Category = {
  id: CategoryId;
  name: string;
  short: string;
  text: string;
  photo: PhotoKey;
  /** Tailwind background class of the category tint. */
  tint: string;
};

export const CATEGORIES: Category[] = [
  { id: "strih", name: "Strih a styling", short: "Strih", text: "Strihy na mieru tvaru tváre, fúkané a účesy na veľké chvíle.", photo: "hairBlowdry", tint: "bg-cat-cut" },
  { id: "farba", name: "Farbenie vlasov", short: "Farba", text: "Balayage, melír aj krycie farbenie. Vždy s ochranou vlasového vlákna.", photo: "hairColor", tint: "bg-cat-color" },
  { id: "nechty", name: "Nechty", short: "Nechty", text: "Manikúra, gél lak, modeláž a pedikúra v sterilnom prostredí.", photo: "nailsSoft", tint: "bg-cat-nails" },
  { id: "riasy", name: "Mihalnice a obočie", short: "Riasy a obočie", text: "Lash lifting, predlžovanie a laminácia pre otvorený pohľad.", photo: "lashes", tint: "bg-cat-brows" },
  { id: "plet", name: "Starostlivosť o pleť", short: "Pleť", text: "Ošetrenia s analýzou pleti, ktoré vidieť hneď aj o mesiac.", photo: "facial", tint: "bg-cat-skin" },
  { id: "telo", name: "Masáže", short: "Masáže", text: "Hodina len pre vás. Teplé oleje, lávové kamene a ticho.", photo: "massage", tint: "bg-cat-body" },
  { id: "licenie", name: "Líčenie", short: "Líčenie", text: "Denné, večerné aj svadobné líčenie, ktoré vydrží do rána.", photo: "makeup", tint: "bg-cat-makeup" },
];

export type Variant = { id: string; label: string; duration: number; price: number };

export type Service = {
  id: string;
  cat: CategoryId;
  name: string;
  desc: string;
  /** Minutes; the first variant's value when the service has variants. */
  duration: number;
  /** Euros for a senior specialist. */
  price: number;
  variants?: Variant[];
  /** Price follows the specialist's level (junior cheaper, art director dearer). */
  levelPricing?: boolean;
  /** Always needs a deposit, whatever the total. */
  deposit?: boolean;
  /** Needs a skin sensitivity test 48 h before the first visit. */
  patchTest?: boolean;
  /** Minutes the specialist needs after the service to clean up. */
  bufferAfter?: number;
  popular?: boolean;
  isNew?: boolean;
  /** Services clients often add to this one. */
  pairsWith?: string[];
  includes?: string[];
};

const LENGTHS = (d: [number, number, number], p: [number, number, number]): Variant[] => [
  { id: "kratke", label: "Krátke vlasy", duration: d[0], price: p[0] },
  { id: "polodlhe", label: "Polodlhé vlasy", duration: d[1], price: p[1] },
  { id: "dlhe", label: "Dlhé vlasy", duration: d[2], price: p[2] },
];

export const SERVICES: Service[] = [
  // Strih a styling
  {
    id: "damsky-strih",
    cat: "strih",
    name: "Dámsky strih a fúkaná",
    desc: "Konzultácia, umytie s masážou hlavy, strih na mieru a fúkaná.",
    duration: 45,
    price: 42,
    variants: LENGTHS([45, 60, 75], [42, 48, 56]),
    levelPricing: true,
    popular: true,
    pairsWith: ["olaplex", "farbenie-odrastov", "gloss"],
    includes: ["Konzultácia tvaru a štýlu", "Umytie a masáž hlavy", "Fúkaná a finálny styling"],
  },
  {
    id: "pansky-strih",
    cat: "strih",
    name: "Pánsky strih",
    desc: "Strih nožnicami aj strojčekom, umytie a styling.",
    duration: 40,
    price: 28,
    levelPricing: true,
    pairsWith: ["uprava-obocia"],
  },
  {
    id: "fukana",
    cat: "strih",
    name: "Umytie a fúkaná",
    desc: "Na rande, pracovný obed alebo len tak. Hladko, vlny alebo objem.",
    duration: 30,
    price: 25,
    variants: LENGTHS([30, 40, 50], [25, 29, 34]),
    levelPricing: true,
    pairsWith: ["olaplex", "denne-licenie"],
  },
  {
    id: "spolocensky-uces",
    cat: "strih",
    name: "Spoločenský účes",
    desc: "Drdol, vlny alebo zapletaný účes na ples, promócie či večierok.",
    duration: 60,
    price: 55,
    levelPricing: true,
    pairsWith: ["vecerne-licenie"],
  },
  {
    id: "svadobny-uces",
    cat: "strih",
    name: "Svadobný účes so skúškou",
    desc: "Skúška účesu vopred a ráno svadby u nás alebo u vás. Spona a lak na opravy v cene.",
    duration: 150,
    price: 160,
    levelPricing: true,
    deposit: true,
    pairsWith: ["svadobne-licenie"],
    includes: ["Skúšobný účes", "Svadobný účes v deň D", "Fixácia na celý deň"],
  },
  {
    id: "olaplex",
    cat: "strih",
    name: "Regeneračná kúra Olaplex",
    desc: "Obnoví poškodené väzby vo vlasoch. Ideálne k farbeniu alebo zosvetľovaniu.",
    duration: 30,
    price: 30,
  },

  // Farbenie
  {
    id: "farbenie-odrastov",
    cat: "farba",
    name: "Farbenie odrastov a fúkaná",
    desc: "Odrasty do 3 cm v jednom odtieni, s ošetrením a fúkanou.",
    duration: 90,
    price: 62,
    levelPricing: true,
    patchTest: true,
    popular: true,
    pairsWith: ["damsky-strih", "olaplex"],
  },
  {
    id: "farbenie-celych",
    cat: "farba",
    name: "Farbenie celých vlasov",
    desc: "Jednotný odtieň od korienkov po končeky, krytie šedín, lesk a fúkaná.",
    duration: 105,
    price: 72,
    variants: LENGTHS([105, 120, 150], [72, 84, 98]),
    levelPricing: true,
    patchTest: true,
    pairsWith: ["damsky-strih", "olaplex"],
  },
  {
    id: "balayage",
    cat: "farba",
    name: "Balayage / Airtouch",
    desc: "Ručne maľované, prirodzene prerastajúce zosvetlenie. Tónovanie a Olaplex v cene.",
    duration: 180,
    price: 150,
    variants: LENGTHS([180, 210, 240], [150, 175, 210]),
    levelPricing: true,
    patchTest: true,
    deposit: true,
    popular: true,
    pairsWith: ["damsky-strih"],
    includes: ["Konzultácia a test pramienka", "Zosvetlenie s Olaplexom", "Tónovanie a fúkaná"],
  },
  {
    id: "melir",
    cat: "farba",
    name: "Melír fóliami",
    desc: "Klasické prameňové zosvetlenie s tónovaním a fúkanou.",
    duration: 150,
    price: 98,
    variants: LENGTHS([150, 165, 180], [98, 115, 135]),
    levelPricing: true,
    patchTest: true,
    pairsWith: ["damsky-strih", "olaplex"],
  },
  {
    id: "gloss",
    cat: "farba",
    name: "Tónovanie a gloss",
    desc: "Osvieži odtieň, dodá lesk a neutralizuje žlté tóny.",
    duration: 45,
    price: 38,
    levelPricing: true,
    pairsWith: ["damsky-strih"],
  },

  // Nechty
  {
    id: "manikura",
    cat: "nechty",
    name: "Klasická manikúra",
    desc: "Tvarovanie, ošetrenie kožičiek, masáž rúk a lak podľa výberu.",
    duration: 45,
    price: 25,
    pairsWith: ["pedikura"],
  },
  {
    id: "gel-lak",
    cat: "nechty",
    name: "Gél lak na ruky",
    desc: "Prístrojová manikúra a gél lak, ktorý drží tri týždne.",
    duration: 60,
    price: 32,
    popular: true,
    pairsWith: ["pedikura", "nail-art"],
  },
  {
    id: "gelove-nechty",
    cat: "nechty",
    name: "Gélové nechty – nová modeláž",
    desc: "Predĺženie na šablónu, tvar a dĺžka podľa vás, farba v cene.",
    duration: 120,
    price: 52,
    pairsWith: ["nail-art"],
  },
  {
    id: "doplnenie-nechtov",
    cat: "nechty",
    name: "Doplnenie gélových nechtov",
    desc: "Do štyroch týždňov od modeláže, vrátane farby.",
    duration: 90,
    price: 42,
    pairsWith: ["nail-art"],
  },
  {
    id: "pedikura",
    cat: "nechty",
    name: "Mokrá pedikúra s gél lakom",
    desc: "Kúpeľ, ošetrenie päty, kožičiek a gél lak. Jednorazové pilníky.",
    duration: 75,
    price: 45,
    bufferAfter: 10,
    pairsWith: ["gel-lak"],
  },
  {
    id: "nail-art",
    cat: "nechty",
    name: "Nail art",
    desc: "Zdobenie, chróm, francúzska manikúra alebo kresba. Príplatok k nechtom.",
    duration: 15,
    price: 8,
  },

  // Riasy a obočie
  {
    id: "uprava-obocia",
    cat: "riasy",
    name: "Úprava a farbenie obočia",
    desc: "Tvar podľa proporcií tváre, vosk aj pinzeta, farba henna alebo klasická.",
    duration: 30,
    price: 18,
    pairsWith: ["lash-lift", "laminacia-obocia"],
  },
  {
    id: "laminacia-obocia",
    cat: "riasy",
    name: "Laminácia obočia",
    desc: "Učesané, plné obočie na šesť týždňov. Úprava tvaru a farba v cene.",
    duration: 50,
    price: 39,
    patchTest: true,
    pairsWith: ["lash-lift"],
  },
  {
    id: "lash-lift",
    cat: "riasy",
    name: "Lash lifting a farbenie mihalníc",
    desc: "Natočené a zvýraznené vlastné mihalnice na šesť až osem týždňov.",
    duration: 60,
    price: 45,
    patchTest: true,
    popular: true,
    pairsWith: ["uprava-obocia", "laminacia-obocia"],
  },
  {
    id: "predlzovanie-rias",
    cat: "riasy",
    name: "Predlžovanie mihalníc 1:1",
    desc: "Prirodzený objem, ľahké hodvábne riasy. Prvá aplikácia.",
    duration: 120,
    price: 75,
    patchTest: true,
    isNew: true,
  },
  {
    id: "doplnenie-rias",
    cat: "riasy",
    name: "Doplnenie mihalníc",
    desc: "Do troch týždňov od poslednej aplikácie.",
    duration: 75,
    price: 45,
  },

  // Pleť
  {
    id: "hydraglow",
    cat: "plet",
    name: "HydraGlow ošetrenie pleti",
    desc: "Vákuové čistenie, exfoliácia a sérum s kyselinou hyalurónovou. Pleť žiari hneď po ošetrení.",
    duration: 75,
    price: 89,
    popular: true,
    isNew: true,
    pairsWith: ["uprava-obocia"],
    includes: ["Analýza pleti kamerou", "Hydradermabrázia", "Sérum a LED maska"],
  },
  {
    id: "cistenie-pleti",
    cat: "plet",
    name: "Hĺbkové čistenie pleti",
    desc: "Ultrazvuková špachtľa, manuálne čistenie, maska podľa typu pleti.",
    duration: 90,
    price: 69,
    pairsWith: ["uprava-obocia"],
  },
  {
    id: "peeling",
    cat: "plet",
    name: "Chemický peeling",
    desc: "Kyseliny na mieru pre pigmentácie, jazvičky a unavenú pleť. Odporúčame sériu troch.",
    duration: 45,
    price: 65,
    patchTest: true,
  },
  {
    id: "konzultacia-plet",
    cat: "plet",
    name: "Konzultácia pleti s analýzou",
    desc: "Diagnostika kamerou a plán domácej starostlivosti. Bez záväzku a zadarmo.",
    duration: 30,
    price: 0,
  },

  // Masáže
  {
    id: "masaz-relax",
    cat: "telo",
    name: "Relaxačná masáž celého tela",
    desc: "Pomalé ťahy s teplým mandľovým olejom. Uvoľní šiju, chrbát aj hlavu.",
    duration: 60,
    price: 55,
    variants: [
      { id: "60", label: "60 minút", duration: 60, price: 55 },
      { id: "90", label: "90 minút", duration: 90, price: 75 },
    ],
    bufferAfter: 15,
  },
  {
    id: "lavove-kamene",
    cat: "telo",
    name: "Masáž lávovými kameňmi",
    desc: "Teplo bazaltových kameňov prenikne hlboko do svalov. Ideálne v zime.",
    duration: 90,
    price: 85,
    bufferAfter: 15,
  },

  // Líčenie
  {
    id: "denne-licenie",
    cat: "licenie",
    name: "Denné líčenie",
    desc: "Svieži, prirodzený make-up na fotenie, pohovor alebo stretnutie.",
    duration: 45,
    price: 45,
    pairsWith: ["fukana"],
  },
  {
    id: "vecerne-licenie",
    cat: "licenie",
    name: "Večerné líčenie",
    desc: "Výraznejšie oči, kontúrovanie a riasy na ples či oslavu.",
    duration: 60,
    price: 60,
    pairsWith: ["spolocensky-uces"],
  },
  {
    id: "svadobne-licenie",
    cat: "licenie",
    name: "Svadobné líčenie so skúškou",
    desc: "Skúška vopred, líčenie v deň svadby a balíček na opravy počas dňa.",
    duration: 120,
    price: 140,
    deposit: true,
    pairsWith: ["svadobny-uces"],
  },
];

export const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]));
export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

/** Combo discounts applied automatically when the visit contains one service from each group. */
export const BUNDLES: { id: string; label: string; groups: string[][]; amount: number }[] = [
  { id: "farba-strih", label: "Farba so strihom", groups: [["farbenie-odrastov", "farbenie-celych", "balayage", "melir"], ["damsky-strih"]], amount: 10 },
  { id: "ruky-nohy", label: "Ruky aj nohy", groups: [["manikura", "gel-lak"], ["pedikura"]], amount: 7 },
  { id: "pohlad", label: "Otvorený pohľad", groups: [["lash-lift"], ["uprava-obocia", "laminacia-obocia"]], amount: 6 },
  { id: "nevesta", label: "Svadobný balík", groups: [["svadobny-uces"], ["svadobne-licenie"]], amount: 25 },
];
