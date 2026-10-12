import { LUNCH } from "../config";
import { addDays, startOfDay, toISODate } from "../lib/format";
import { seeded, shuffle } from "../lib/random";
import type { LunchDay, LunchDish } from "../lib/types";

type Soup = LunchDay["soup"];
type Template = Omit<LunchDish, "id">;

const SOUPS: Soup[] = [
  { name: "Hovädzí vývar s pečeňovými haluškami", detail: "0,33 l", allergens: [1, 3, 9] },
  { name: "Šošovicová polievka s údeným mäsom", detail: "0,33 l", allergens: [1, 9, 10] },
  { name: "Kurací vývar s domácimi rezancami", detail: "0,33 l", allergens: [1, 3, 9] },
  { name: "Krémová brokolicová polievka", detail: "0,33 l", allergens: [7, 9] },
  { name: "Fazuľová polievka s klobásou", detail: "0,33 l", allergens: [1, 9] },
  { name: "Paradajková polievka s bazalkou", detail: "0,33 l", allergens: [7, 9] },
  { name: "Kulajda s hubami a vajíčkom", detail: "0,33 l", allergens: [1, 3, 7, 9] },
  { name: "Gulášová polievka", detail: "0,33 l", allergens: [1, 9] },
  { name: "Cesnaková polievka so syrom a krutónmi", detail: "0,33 l", allergens: [1, 7, 9] },
  { name: "Hrachová polievka s opečenou slaninou", detail: "0,33 l", allergens: [1, 9] },
];

const MEAT: Template[] = [
  { name: "Hovädzí guláš, domáca knedľa", detail: "150 g", allergens: [1, 3, 7], price: 9.5 },
  { name: "Krkovička z grilu, opekané zemiaky, kyslá uhorka", detail: "150 g", allergens: [7, 10], price: 9.9 },
  { name: "Sviečková na smotane, karlovarská knedľa, brusnice", detail: "150 g", allergens: [1, 3, 7, 9, 10], price: 10.5 },
  { name: "Pečené kuracie stehno, ryža s hráškom", detail: "200 g", allergens: [7, 9], price: 8.9 },
  { name: "Kurací paprikáš, maslové halušky", detail: "150 g", allergens: [1, 3, 7], price: 9.2 },
  { name: "Morčacie prsia na šalvii, zemiaková kaša, pečená mrkva", detail: "150 g", allergens: [7, 9], price: 9.9 },
  { name: "Bravčový rezeň, zemiakový šalát", detail: "150 g", allergens: [1, 3, 7, 10], price: 9.9 },
  { name: "Segedínsky guláš, kysnutá knedľa", detail: "150 g", allergens: [1, 3, 7], price: 9.2 },
  { name: "Hovädzí burger, hranolky, BBQ majonéza", detail: "150 g", allergens: [1, 3, 7, 10, 11], price: 10.9 },
  { name: "Kačacie prsia, zemiakové lokše, dusená kapusta", detail: "150 g", allergens: [1, 7], price: 11.9 },
];

const LIGHT: Template[] = [
  { name: "Pečený losos, citrónové rizoto, rukola", detail: "120 g", allergens: [4, 7, 9], price: 11.5 },
  { name: "Treska v pivnom cestíčku, hranolky, tatárska omáčka", detail: "150 g", allergens: [1, 3, 4, 10], price: 10.5 },
  { name: "Caesar šalát s kuracím mäsom a parmezánom", detail: "150 g", allergens: [1, 3, 4, 7, 10], price: 9.5 },
  { name: "Grilovaný pstruh, maslové zemiaky s petržlenovou vňaťou", detail: "1 ks", allergens: [4, 7], price: 11.9 },
  { name: "Kuracie soté so zeleninou, jazmínová ryža", detail: "150 g", allergens: [6, 9], price: 9.2 },
  { name: "Penne s kuracím mäsom a sušenými paradajkami", detail: "300 g", allergens: [1, 3, 7], price: 9.2 },
];

const VEGETARIAN: Template[] = [
  { name: "Bryndzové halušky so smotanou a pažítkou", detail: "300 g", allergens: [1, 3, 7], price: 8.9, tags: ["vegetarian"] },
  { name: "Šošovicové karí s kokosom, basmati ryža", detail: "350 g", allergens: [], price: 8.5, tags: ["vegetarian", "vegan", "glutenFree", "spicy"] },
  { name: "Vyprážaný syr, varené zemiaky, tatárska omáčka", detail: "120 g", allergens: [1, 3, 7, 10], price: 9.2, tags: ["vegetarian"] },
  { name: "Hubové rizoto s parmezánom", detail: "300 g", allergens: [7, 9], price: 8.9, tags: ["vegetarian", "glutenFree"] },
  { name: "Gnocchi so špenátom a gorgonzolou", detail: "300 g", allergens: [1, 3, 7], price: 9.2, tags: ["vegetarian"] },
  { name: "Zeleninové lečo s vajíčkom a chlebom", detail: "350 g", allergens: [1, 3], price: 7.9, tags: ["vegetarian"] },
];

const SWEET: Template[] = [
  { name: "Šúľance s makom a maslom", detail: "300 g", allergens: [1, 3, 7], price: 7.9, tags: ["vegetarian"] },
  { name: "Tvarohové pirohy, maslo, opražená strúhanka", detail: "300 g", allergens: [1, 3, 7], price: 7.9, tags: ["vegetarian"] },
  { name: "Palacinky s tvarohom a domácim džemom", detail: "2 ks", allergens: [1, 3, 7], price: 7.5, tags: ["vegetarian"] },
  { name: "Ovocné knedle, maslo, strúhanka, cukor", detail: "4 ks", allergens: [1, 3, 7], price: 7.9, tags: ["vegetarian"] },
];

/** Monday of the week containing `d`. */
export function weekStart(d: Date) {
  const day = startOfDay(d);
  return addDays(day, -((day.getDay() + 6) % 7));
}

const weekCache = new Map<string, Record<string, LunchDay>>();

/**
 * The generated lunch menu for a whole week. Each week is a fresh shuffle of the pools, so the menu changes every
 * Monday without anyone typing it in, and nothing repeats within a week.
 */
function generatedWeek(monday: Date) {
  const key = toISODate(monday);
  const cached = weekCache.get(key);
  if (cached) return cached;
  const rand = seeded(`lunch:${key}`);
  const soups = shuffle(rand, SOUPS);
  const meat = shuffle(rand, MEAT);
  const light = shuffle(rand, LIGHT);
  const veg = shuffle(rand, VEGETARIAN);
  const sweet = shuffle(rand, SWEET);
  const week: Record<string, LunchDay> = {};
  let m = 0;
  LUNCH.days.forEach((weekday, i) => {
    const date = addDays(monday, weekday - 1);
    const iso = toISODate(date);
    const fourth = weekday === 3 || weekday === 5 ? sweet[i % sweet.length] : meat[5 + (m++ % 5)];
    const picks = [meat[i], light[i % light.length], veg[i % veg.length], fourth];
    week[iso] = {
      soup: soups[i],
      dishes: picks.map((t, n) => ({ ...t, id: `lunch-${iso}-${n + 1}` })),
    };
  });
  weekCache.set(key, week);
  return week;
}

/** Lunch for a date: the admin's edit if there is one, otherwise the generated menu. Null at weekends. */
export function lunchFor(date: Date, overrides: Record<string, LunchDay>): LunchDay | null {
  const iso = toISODate(date);
  if (overrides[iso]) return overrides[iso];
  return generatedWeek(weekStart(date))[iso] ?? null;
}

/** Monday to Friday of the week containing `date`. */
export function lunchWeek(date: Date, overrides: Record<string, LunchDay>) {
  const monday = weekStart(date);
  return LUNCH.days.map((weekday) => {
    const day = addDays(monday, weekday - 1);
    return { date: day, menu: lunchFor(day, overrides) };
  });
}
