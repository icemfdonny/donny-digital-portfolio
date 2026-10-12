import type { PhotoKey } from "./photos";

/** The 14 allergens every Slovak menu lists by number (EU regulation 1169/2011). */
export const ALLERGENS: { n: number; name: string; short: string }[] = [
  { n: 1, name: "Obilniny obsahujúce lepok", short: "Lepok" },
  { n: 2, name: "Kôrovce a výrobky z nich", short: "Kôrovce" },
  { n: 3, name: "Vajcia a výrobky z nich", short: "Vajcia" },
  { n: 4, name: "Ryby a výrobky z nich", short: "Ryby" },
  { n: 5, name: "Arašidy a výrobky z nich", short: "Arašidy" },
  { n: 6, name: "Sójové zrná a výrobky z nich", short: "Sója" },
  { n: 7, name: "Mlieko a výrobky z neho", short: "Mlieko" },
  { n: 8, name: "Orechy (škrupinové plody)", short: "Orechy" },
  { n: 9, name: "Zeler a výrobky z neho", short: "Zeler" },
  { n: 10, name: "Horčica a výrobky z nej", short: "Horčica" },
  { n: 11, name: "Sezamové semená", short: "Sezam" },
  { n: 12, name: "Oxid siričitý a siričitany", short: "Siričitany" },
  { n: 13, name: "Vlčí bôb (lupina)", short: "Vlčí bôb" },
  { n: 14, name: "Mäkkýše a výrobky z nich", short: "Mäkkýše" },
];

export type DietTag = "vegetarian" | "vegan" | "glutenFree" | "spicy";
export type HighlightTag = "signature" | "seasonal" | "new" | "local";

export const DIET_LABELS: Record<DietTag, string> = {
  vegetarian: "Vegetariánske",
  vegan: "Vegánske",
  glutenFree: "Bez lepku",
  spicy: "Pikantné",
};

export const HIGHLIGHT_LABELS: Record<HighlightTag, string> = {
  signature: "Podpisové jedlo",
  seasonal: "Sezónne",
  new: "Novinka",
  local: "Zo Slovenska",
};

export type OptionGroup = {
  id: string;
  label: string;
  type: "single" | "multi";
  required?: boolean;
  choices: { id: string; label: string; price?: number }[];
};

export type CategoryId = "predjedla" | "polievky" | "hlavne" | "gril" | "prilohy" | "dezerty" | "deti";

export const CATEGORIES: { id: CategoryId; name: string; note?: string }[] = [
  { id: "predjedla", name: "Predjedlá a malé taniere", note: "Na zdieľanie alebo k poháru vína" },
  { id: "polievky", name: "Polievky" },
  { id: "hlavne", name: "Hlavné jedlá" },
  { id: "gril", name: "Z grilu na drevenom uhlí", note: "Mäso od farmárov z Hontu a Liptova, zrené v našej komore" },
  { id: "prilohy", name: "Prílohy" },
  { id: "dezerty", name: "Dezerty" },
  { id: "deti", name: "Pre malých hostí", note: "Polovičné porcie hlavných jedál pripravíme na požiadanie" },
];

export type Dish = {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  /** Portion as printed on Slovak menus: "150 g", "0,33 l", "2 ks". */
  portion: string;
  price: number;
  allergens: number[];
  diet: DietTag[];
  highlight?: HighlightTag[];
  photo?: PhotoKey;
  /** Wine id from the drinks list. */
  pairing?: string;
  options?: OptionGroup[];
};

const DONENESS: OptionGroup = {
  id: "doneness",
  label: "Stupeň prepečenia",
  type: "single",
  required: true,
  choices: [
    { id: "rare", label: "Krvavý (rare)" },
    { id: "medium-rare", label: "Stredne krvavý (medium rare)" },
    { id: "medium", label: "Stredne prepečený (medium)" },
    { id: "medium-well", label: "Takmer prepečený (medium well)" },
    { id: "well", label: "Prepečený (well done)" },
  ],
};

const STEAK_SAUCE: OptionGroup = {
  id: "sauce",
  label: "Omáčka",
  type: "single",
  required: true,
  choices: [
    { id: "butter", label: "Bylinkové maslo (v cene)" },
    { id: "pepper", label: "Omáčka zo zeleného korenia", price: 2.5 },
    { id: "chimichurri", label: "Chimichurri", price: 2 },
  ],
};

const STEAK_SIDE: OptionGroup = {
  id: "side",
  label: "Príloha",
  type: "single",
  required: true,
  choices: [
    { id: "fries", label: "Hranolky s rozmarínovou soľou", price: 4.5 },
    { id: "puree", label: "Zemiakové pyré s maslom", price: 4.2 },
    { id: "veg", label: "Grilovaná sezónna zelenina", price: 5.5 },
    { id: "none", label: "Bez prílohy" },
  ],
};

export const DISHES: Dish[] = [
  // Predjedlá
  {
    id: "tatarak",
    category: "predjedla",
    name: "Tatarák z hovädzej sviečkovice",
    description: "Kapary, šalotka, údený žĺtok, chrumky z kváskového chleba",
    portion: "120 g",
    price: 15.9,
    allergens: [1, 3, 10],
    diet: [],
    highlight: ["signature"],
    photo: "dishTartare",
    pairing: "frankovka",
  },
  {
    id: "cvikla",
    category: "predjedla",
    name: "Pečená cvikla a kozí syr",
    description: "Lieskové orechy, akáciový med, tymián, mladá rukola",
    portion: "160 g",
    price: 10.9,
    allergens: [7, 8],
    diet: ["vegetarian", "glutenFree"],
    highlight: ["seasonal"],
    photo: "dishBeetroot",
    pairing: "rose",
  },
  {
    id: "pstruh",
    category: "predjedla",
    name: "Údený pstruh z Liptova",
    description: "Chrenový krém, kyslá jablková salsa, zemiaková placka",
    portion: "110 g",
    price: 12.5,
    allergens: [1, 3, 4, 7],
    diet: [],
    highlight: ["local"],
    pairing: "rizling",
  },
  {
    id: "bryndza",
    category: "predjedla",
    name: "Bryndzová pena",
    description: "Reďkovky, pažítkový olej, opekaný kváskový chlieb",
    portion: "140 g",
    price: 8.9,
    allergens: [1, 7],
    diet: ["vegetarian"],
    highlight: ["local"],
    pairing: "veltlin",
  },
  {
    id: "pastika",
    category: "predjedla",
    name: "Paštéta z mangalice",
    description: "Cibuľový džem, nakladané uhorky, maslová brioška",
    portion: "100 g",
    price: 9.9,
    allergens: [1, 3, 7, 10, 12],
    diet: [],
    pairing: "devin",
  },
  {
    id: "syry",
    category: "predjedla",
    name: "Syry slovenských farmárov",
    description: "Štyri syry, figová horčica, vlašské orechy, domáci chlieb",
    portion: "180 g",
    price: 14.9,
    allergens: [1, 7, 8, 10],
    diet: ["vegetarian"],
    highlight: ["local"],
    photo: "dishCheese",
    pairing: "tokaj",
  },

  // Polievky
  {
    id: "kapustnica",
    category: "polievky",
    name: "Kapustnica s klobásou a hríbmi",
    description: "Kyslá smotana, krajec domáceho chleba",
    portion: "0,33 l",
    price: 5.9,
    allergens: [1, 7, 9],
    diet: [],
    highlight: ["seasonal"],
  },
  {
    id: "tekvica",
    category: "polievky",
    name: "Krémová tekvicová polievka",
    description: "Pražené tekvicové semienka, tekvicový olej, kokosové mlieko",
    portion: "0,33 l",
    price: 5.5,
    allergens: [],
    diet: ["vegetarian", "vegan", "glutenFree"],
    highlight: ["seasonal"],
  },
  {
    id: "vyvar",
    category: "polievky",
    name: "Hovädzí vývar",
    description: "Varené mäso, koreňová zelenina, domáce rezance",
    portion: "0,33 l",
    price: 5.2,
    allergens: [1, 3, 9],
    diet: [],
  },

  // Hlavné jedlá
  {
    id: "halusky",
    category: "hlavne",
    name: "Bryndzové halušky po našom",
    description: "Bryndza z Liptova, chrumkavá slanina z mangalice, pažítka, zakysanka",
    portion: "300 g",
    price: 13.9,
    allergens: [1, 3, 7],
    diet: [],
    highlight: ["signature", "local"],
    photo: "dishHalusky",
    pairing: "veltlin",
    options: [
      {
        id: "bacon",
        label: "Slanina",
        type: "single",
        required: true,
        choices: [
          { id: "with", label: "So slaninou" },
          { id: "without", label: "Bez slaniny (vegetariánske)" },
        ],
      },
    ],
  },
  {
    id: "kacica",
    category: "hlavne",
    name: "Konfitované kačacie stehno",
    description: "Červená kapusta s brusnicami, zemiakové lokše, výpek",
    portion: "350 g",
    price: 19.9,
    allergens: [1, 7, 9, 12],
    diet: [],
    highlight: ["signature"],
    photo: "dishDuck",
    pairing: "svatovavrinecke",
  },
  {
    id: "licka",
    category: "hlavne",
    name: "Hovädzie líčka na červenom víne",
    description: "Zemiakové pyré s maslom, glazovaná mrkva, perlová cibuľka",
    portion: "250 g",
    price: 22.9,
    allergens: [7, 9, 12],
    diet: ["glutenFree"],
    photo: "dishCheeks",
    pairing: "cabernet",
  },
  {
    id: "zubac",
    category: "hlavne",
    name: "Zubáč na masle",
    description: "Beluga šošovica, pečený fenikel, omáčka beurre blanc",
    portion: "180 g",
    price: 24.5,
    allergens: [4, 7, 9, 12],
    diet: ["glutenFree"],
    photo: "dishFish",
    pairing: "rizling",
  },
  {
    id: "rizoto",
    category: "hlavne",
    name: "Rizoto s lesnými hubami",
    description: "Parmezán, tymián, kvapka hľuzovkového oleja",
    portion: "320 g",
    price: 16.9,
    allergens: [7, 9, 12],
    diet: ["vegetarian", "glutenFree"],
    highlight: ["seasonal"],
    pairing: "chardonnay",
  },
  {
    id: "kura",
    category: "hlavne",
    name: "Kuracie supreme sous-vide",
    description: "Krémová polenta, pečené hrozno, šalviová omáčka",
    portion: "200 g",
    price: 18.5,
    allergens: [7, 9, 12],
    diet: ["glutenFree"],
    pairing: "palava",
  },
  {
    id: "karfiol",
    category: "hlavne",
    name: "Celý karfiol z pece",
    description: "Tahini, granátové jablko, pražený cícer, harissa, bylinky",
    portion: "350 g",
    price: 15.5,
    allergens: [11],
    diet: ["vegetarian", "vegan", "glutenFree", "spicy"],
    highlight: ["new"],
    pairing: "devin",
  },
  {
    id: "burger",
    category: "hlavne",
    name: "Lipa burger",
    description: "Hovädzie z Hontu, cheddar, slaninový džem, chipotle majonéza, hranolky",
    portion: "200 g",
    price: 16.9,
    allergens: [1, 3, 7, 10, 11],
    diet: ["spicy"],
    photo: "dishBurger",
    pairing: "dunaj",
    options: [
      {
        id: "doneness",
        label: "Mäso",
        type: "single",
        required: true,
        choices: [
          { id: "medium", label: "Šťavnaté (medium)" },
          { id: "well", label: "Prepečené (well done)" },
        ],
      },
      {
        id: "extras",
        label: "Navyše",
        type: "multi",
        choices: [
          { id: "bacon", label: "Extra slanina", price: 1.5 },
          { id: "cheese", label: "Extra cheddar", price: 1 },
          { id: "egg", label: "Volské oko", price: 1.2 },
          { id: "gf", label: "Bezlepková žemľa", price: 1.5 },
        ],
      },
    ],
  },

  // Gril
  {
    id: "ribeye",
    category: "gril",
    name: "Rib-eye steak, zrený 28 dní",
    description: "Slovenské hovädzie, pečený cesnak, vločková soľ",
    portion: "300 g",
    price: 38,
    allergens: [7],
    diet: ["glutenFree"],
    highlight: ["signature"],
    photo: "dishSteak",
    pairing: "cabernet",
    options: [DONENESS, STEAK_SAUCE, STEAK_SIDE],
  },
  {
    id: "flank",
    category: "gril",
    name: "Flank steak",
    description: "Grilovaná jarná cibuľka, chimichurri, citrón",
    portion: "250 g",
    price: 26.9,
    allergens: [],
    diet: ["glutenFree"],
    pairing: "dunaj",
    options: [DONENESS, STEAK_SIDE],
  },
  {
    id: "panenka",
    category: "gril",
    name: "Bravčová panenka z mangalice",
    description: "Jablkové pyré, údená paprika, horčicová omáčka",
    portion: "220 g",
    price: 21.9,
    allergens: [7, 10],
    diet: ["glutenFree"],
    pairing: "frankovka",
    options: [STEAK_SIDE],
  },

  // Prílohy
  { id: "hranolky", category: "prilohy", name: "Hranolky s rozmarínovou soľou", description: "Smažené v samostatnej fritéze", portion: "150 g", price: 4.5, allergens: [], diet: ["vegetarian", "vegan", "glutenFree"] },
  { id: "pyre", category: "prilohy", name: "Zemiakové pyré s maslom", description: "", portion: "150 g", price: 4.2, allergens: [7], diet: ["vegetarian", "glutenFree"] },
  { id: "zelenina", category: "prilohy", name: "Grilovaná sezónna zelenina", description: "", portion: "150 g", price: 5.5, allergens: [], diet: ["vegetarian", "vegan", "glutenFree"] },
  { id: "salat", category: "prilohy", name: "Listový šalát", description: "Horčicový dresing, semienka", portion: "120 g", price: 4.9, allergens: [10, 12], diet: ["vegetarian", "vegan", "glutenFree"] },
  { id: "chlieb", category: "prilohy", name: "Domáci kváskový chlieb", description: "Šľahané maslo s morskou soľou", portion: "2 ks", price: 3.5, allergens: [1, 7], diet: ["vegetarian"] },

  // Dezerty
  {
    id: "sulance",
    category: "dezerty",
    name: "Makové šúľance",
    description: "Hruškové ragú, vanilková omáčka, maslová strúhanka",
    portion: "200 g",
    price: 7.9,
    allergens: [1, 3, 7],
    diet: ["vegetarian"],
    highlight: ["signature", "local"],
    photo: "dishDessert",
    pairing: "tokaj",
  },
  {
    id: "fondant",
    category: "dezerty",
    name: "Čokoládový fondant",
    description: "Slaný karamel, zmrzlina z kyslej smotany",
    portion: "140 g",
    price: 8.5,
    allergens: [1, 3, 7],
    diet: ["vegetarian"],
    pairing: "ladove",
  },
  {
    id: "knedlicky",
    category: "dezerty",
    name: "Tvarohové knedličky",
    description: "Jahodový kompót, maslová strúhanka, mäta",
    portion: "220 g",
    price: 7.5,
    allergens: [1, 3, 7],
    diet: ["vegetarian"],
  },
  { id: "sorbet", category: "dezerty", name: "Sezónny sorbet", description: "Dve guľky, na príchuť sa opýtajte obsluhy", portion: "100 g", price: 4.9, allergens: [], diet: ["vegetarian", "vegan", "glutenFree"] },

  // Deti
  { id: "rezen", category: "deti", name: "Kurací rezníček so zemiakovým pyré", description: "", portion: "100 g", price: 8.9, allergens: [1, 3, 7], diet: [] },
  { id: "palacinky", category: "deti", name: "Palacinky s domácim džemom", description: "", portion: "2 ks", price: 5.9, allergens: [1, 3, 7], diet: ["vegetarian"] },
];

export const dishById = (id: string) => DISHES.find((d) => d.id === id);

/** Vegan dishes are vegetarian too, so the vegetarian filter includes them. */
export function dishMatchesDiet(dish: { diet?: DietTag[]; tags?: string[] }, diet: DietTag) {
  const tags = dish.diet ?? (dish.tags as DietTag[] | undefined) ?? [];
  if (diet === "vegetarian") return tags.includes("vegetarian") || tags.includes("vegan");
  return tags.includes(diet);
}
