export type WineType = "sumive" | "biele" | "ruzove" | "cervene" | "dezertne";

export const WINE_TYPES: { id: WineType; name: string }[] = [
  { id: "sumive", name: "Šumivé" },
  { id: "biele", name: "Biele" },
  { id: "ruzove", name: "Ružové" },
  { id: "cervene", name: "Červené" },
  { id: "dezertne", name: "Dezertné" },
];

export type Wine = {
  id: string;
  type: WineType;
  name: string;
  region: string;
  vintage: string;
  notes: string;
  /** [volume, price] for a glass and for the bottle. */
  glass?: [string, number];
  bottle: [string, number];
  /** Sommelier's pick, shown with a badge. */
  pick?: boolean;
};

export const WINES: Wine[] = [
  { id: "sekt", type: "sumive", name: "Sekt Brut, tradičná metóda", region: "Malokarpatská oblasť", vintage: "2021", notes: "Jemné bublinky, brioška, zelené jablko", glass: ["0,1 l", 5.9], bottle: ["0,75 l", 39] },
  { id: "petnat", type: "sumive", name: "Pét-nat Frankovka ružová", region: "Južnoslovenská oblasť", vintage: "2024", notes: "Prirodzene šumivé, malina, kôrka chleba", glass: ["0,1 l", 5.5], bottle: ["0,75 l", 36] },
  { id: "veltlin", type: "biele", name: "Veltlínske zelené", region: "Malokarpatská oblasť", vintage: "2024", notes: "Biele korenie, grapefruit, svieža kyselina", glass: ["0,1 l", 4.5], bottle: ["0,75 l", 29], pick: true },
  { id: "rizling", type: "biele", name: "Rizling rýnsky", region: "Malokarpatská oblasť", vintage: "2023", notes: "Broskyňa, limetka, minerálny dojem", glass: ["0,1 l", 5.2], bottle: ["0,75 l", 34] },
  { id: "devin", type: "biele", name: "Devín", region: "Južnoslovenská oblasť", vintage: "2024", notes: "Slovenská odroda: ruža, hrozienka, liči", glass: ["0,1 l", 4.9], bottle: ["0,75 l", 32] },
  { id: "palava", type: "biele", name: "Pálava", region: "Nitrianska oblasť", vintage: "2024", notes: "Kvetinová, mandarínka, jemne polosuchá", glass: ["0,1 l", 4.9], bottle: ["0,75 l", 32] },
  { id: "chardonnay", type: "biele", name: "Chardonnay sur lie", region: "Nitrianska oblasť", vintage: "2022", notes: "Krémové, lieskový orech, zrené na kvasniciach", glass: ["0,1 l", 5.8], bottle: ["0,75 l", 38] },
  { id: "furmint", type: "biele", name: "Furmint suchý", region: "Vinohradnícka oblasť Tokaj", vintage: "2022", notes: "Dula, med, výrazná kyselina", glass: ["0,1 l", 6.2], bottle: ["0,75 l", 41] },
  { id: "rose", type: "ruzove", name: "Cabernet Sauvignon rosé", region: "Malokarpatská oblasť", vintage: "2024", notes: "Jahoda, ríbezľa, suché a šťavnaté", glass: ["0,1 l", 4.5], bottle: ["0,75 l", 29] },
  { id: "frankovka", type: "cervene", name: "Frankovka modrá", region: "Malokarpatská oblasť", vintage: "2022", notes: "Višňa, korenie, jemné triesloviny", glass: ["0,1 l", 4.9], bottle: ["0,75 l", 32], pick: true },
  { id: "svatovavrinecke", type: "cervene", name: "Svätovavrinecké", region: "Južnoslovenská oblasť", vintage: "2021", notes: "Čierna ríbezľa, slivka, zamatové", glass: ["0,1 l", 5.5], bottle: ["0,75 l", 36] },
  { id: "dunaj", type: "cervene", name: "Dunaj", region: "Južnoslovenská oblasť", vintage: "2021", notes: "Slovenská odroda: tmavé ovocie, kakao, plné telo", glass: ["0,1 l", 5.9], bottle: ["0,75 l", 38] },
  { id: "rulandske", type: "cervene", name: "Rulandské modré", region: "Malokarpatská oblasť", vintage: "2022", notes: "Malina, lesná podstielka, elegantné", glass: ["0,1 l", 6.5], bottle: ["0,75 l", 42] },
  { id: "cabernet", type: "cervene", name: "Cabernet Sauvignon barrique", region: "Južnoslovenská oblasť", vintage: "2020", notes: "Čierne ríbezle, cédrové drevo, dlhá dochuť", glass: ["0,1 l", 6.9], bottle: ["0,75 l", 46] },
  { id: "tokaj", type: "dezertne", name: "Tokajský výber 5-putňový", region: "Vinohradnícka oblasť Tokaj", vintage: "2017", notes: "Marhuľa, med, pomarančová kôra", glass: ["0,05 l", 7.9], bottle: ["0,5 l", 59], pick: true },
  { id: "ladove", type: "dezertne", name: "Ľadové víno, Rizling vlašský", region: "Malokarpatská oblasť", vintage: "2021", notes: "Hrozienka, karamel, živá kyselina", glass: ["0,05 l", 8.5], bottle: ["0,375 l", 49] },
];

export const wineById = (id: string) => WINES.find((w) => w.id === id);

export type DrinkItem = { name: string; detail?: string; prices: [string, number][] };

export const DRINK_GROUPS: { id: string; name: string; items: DrinkItem[] }[] = [
  {
    id: "kokteily",
    name: "Kokteily",
    items: [
      { name: "Lipový spritz", detail: "Domáci lipový sirup, sekt, sóda, citrón", prices: [["", 7.9]] },
      { name: "Borovička tonic", detail: "Borovička, tonik, borievky, rozmarín", prices: [["", 7.5]] },
      { name: "Hruškovica sour", detail: "Hruškovica, citrón, med, bielok", prices: [["", 8.5]] },
      { name: "Negroni", detail: "Gin, bitter, vermút", prices: [["", 9.5]] },
      { name: "Nealko: Bazový fizz", detail: "Bazový kvet, limetka, tonik", prices: [["", 5.5]] },
    ],
  },
  {
    id: "pivo",
    name: "Pivo",
    items: [
      { name: "Svetlý ležiak 10° čapovaný", prices: [["0,3 l", 2.6], ["0,5 l", 3.4]] },
      { name: "Remeselná IPA z Bratislavy", prices: [["0,33 l", 4.9]] },
      { name: "Nealkoholické pivo", prices: [["0,33 l", 3.2]] },
    ],
  },
  {
    id: "nealko",
    name: "Nealko",
    items: [
      { name: "Domáca limonáda", detail: "Baza a citrón · malina a mäta · zázvor", prices: [["0,4 l", 4.5], ["1 l", 8.9]] },
      { name: "Kofola čapovaná", prices: [["0,3 l", 2.4], ["0,5 l", 3.2]] },
      { name: "Fresh pomaranč", prices: [["0,25 l", 4.9]] },
      { name: "Minerálna voda, perlivá alebo tichá", prices: [["0,33 l", 2.5], ["0,75 l", 5.5]] },
      { name: "Filtrovaná voda s citrónom", detail: "Pre hostí zdarma", prices: [["1 l", 0]] },
    ],
  },
  {
    id: "kava",
    name: "Káva a čaj",
    items: [
      { name: "Espresso", detail: "Výberová káva z bratislavskej pražiarne", prices: [["", 2.4]] },
      { name: "Cappuccino", prices: [["", 3.4]] },
      { name: "Flat white", prices: [["", 3.9]] },
      { name: "Bylinkový čaj zo slovenských lúk", prices: [["", 3.2]] },
    ],
  },
  {
    id: "destilaty",
    name: "Pálenky",
    items: [
      { name: "Slivovica 52 %", prices: [["0,04 l", 4.5]] },
      { name: "Hruškovica 45 %", prices: [["0,04 l", 4.9]] },
      { name: "Borovička 40 %", prices: [["0,04 l", 3.9]] },
    ],
  },
];
