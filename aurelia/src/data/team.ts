import { toMin } from "../config";
import type { PhotoKey } from "./photos";
import type { CategoryId } from "./services";

export type Level = "junior" | "senior" | "art";

export const LEVELS: Record<Level, { label: string; multiplier: number; text: string }> = {
  junior: { label: "Junior", multiplier: 0.85, text: "Po škole a ročnej praxi u nás, pod dohľadom seniora. Výhodnejšia cena." },
  senior: { label: "Senior", multiplier: 1, text: "Päť a viac rokov praxe a pravidelné školenia." },
  art: { label: "Art director", multiplier: 1.2, text: "Vedie tím, školí kolegov a robí najnáročnejšie premeny." },
};

export type Shift = { start: number; end: number };

export type Specialist = {
  id: string;
  name: string;
  firstName: string;
  /** "u Veroniky", "u Tomáša" */
  genitive: string;
  role: string;
  level: Level;
  cats: CategoryId[];
  photo: PhotoKey;
  bio: string;
  quote: string;
  specialties: string[];
  since: number;
  languages: string[];
  instagram?: string;
  rating: number;
  reviews: number;
  /** Indexed like Date.getDay(). */
  week: (Shift | null)[];
  /** Admin calendar column colour. */
  color: string;
};

const s = (a: string, b: string): Shift => ({ start: toMin(a), end: toMin(b) });

export const TEAM: Specialist[] = [
  {
    id: "veronika",
    name: "Veronika Hudáková",
    firstName: "Veronika",
    genitive: "Veroniky",
    role: "Zakladateľka a art director",
    level: "art",
    cats: ["strih", "farba"],
    photo: "team1",
    bio: "Strihala v Londýne a Viedni, Aureliu otvorila v roku 2017. Miluje odvážne premeny, no ešte viac klientky, ktoré sa po nich nemusia každé ráno trápiť so styling-om.",
    quote: "Dobrý strih vyzerá skvele aj vtedy, keď ho ráno len prehrabnete prstami.",
    specialties: ["Precízne strihy", "Premeny", "Krátke vlasy", "Svadobné účesy"],
    since: 2009,
    languages: ["slovenčina", "angličtina", "nemčina"],
    instagram: "veronika.hair",
    rating: 4.97,
    reviews: 412,
    week: [null, null, s("09:00", "17:00"), s("09:00", "17:00"), s("11:00", "19:00"), s("09:00", "17:00"), s("08:00", "13:00")],
    color: "#b38f5a",
  },
  {
    id: "simona",
    name: "Simona Balážová",
    firstName: "Simona",
    genitive: "Simony",
    role: "Senior koloristka",
    level: "senior",
    cats: ["farba", "strih"],
    photo: "team2",
    bio: "Blond je jej veda. Balayage robí ručne, bez šablón, a vždy s Olaplexom. Klientky k nej chodia aj z Viedne a Brna.",
    quote: "Najkrajšia farba je tá, ktorá prerastá bez ostrej hranice.",
    specialties: ["Balayage a airtouch", "Studené blond", "Korekcie farby"],
    since: 2014,
    languages: ["slovenčina", "angličtina"],
    instagram: "simona.colors",
    rating: 4.95,
    reviews: 356,
    week: [null, s("10:00", "19:00"), s("12:00", "20:00"), s("08:00", "16:00"), s("12:00", "20:00"), s("08:00", "16:00"), null],
    color: "#9a6a74",
  },
  {
    id: "tomas",
    name: "Tomáš Kollár",
    firstName: "Tomáš",
    genitive: "Tomáša",
    role: "Senior stylista",
    level: "senior",
    cats: ["strih"],
    photo: "team6",
    bio: "Pánske strihy, textúrované mikádá a večerné účesy. Ex-barber, ktorý sa zamiloval do dlhých vlasov.",
    quote: "Strih má fungovať s vašimi vlasmi, nie proti nim.",
    specialties: ["Pánske strihy", "Mikádo a pixie", "Spoločenské účesy"],
    since: 2015,
    languages: ["slovenčina", "angličtina"],
    rating: 4.93,
    reviews: 288,
    week: [null, null, s("08:00", "16:00"), s("12:00", "20:00"), s("08:00", "16:00"), s("12:00", "20:00"), s("08:00", "15:00")],
    color: "#6f7f8c",
  },
  {
    id: "natalia",
    name: "Natália Poláková",
    firstName: "Natália",
    genitive: "Natálie",
    role: "Junior stylistka",
    level: "junior",
    cats: ["strih", "farba"],
    photo: "team4",
    bio: "Najmladšia v tíme a najrýchlejšia s fénom. Pod Veronikiným vedením robí strihy aj farbenie za výhodnejšiu cenu.",
    quote: "Fúkaná je malá terapia. Odchádzate s inou náladou.",
    specialties: ["Fúkané a vlny", "Farbenie odrastov", "Zapletané účesy"],
    since: 2023,
    languages: ["slovenčina", "angličtina"],
    instagram: "nati.hairs",
    rating: 4.9,
    reviews: 96,
    week: [null, s("10:00", "19:00"), null, s("08:00", "16:00"), s("12:00", "20:00"), s("12:00", "20:00"), s("08:00", "15:00")],
    color: "#c48a7a",
  },
  {
    id: "eva",
    name: "Eva Szabová",
    firstName: "Eva",
    genitive: "Evy",
    role: "Kozmetička a vizážistka",
    level: "senior",
    cats: ["plet", "telo", "licenie", "riasy"],
    photo: "team5",
    bio: "Dvadsať rokov v kozmetike, certifikovaná vizážistka a masérka. Pleť číta ako knihu a nikdy vám nepredá krém, ktorý nepotrebujete.",
    quote: "Krásna pleť nie je o filtroch, ale o pravidelnosti.",
    specialties: ["HydraGlow", "Problematická pleť", "Svadobné líčenie", "Lávové kamene"],
    since: 2005,
    languages: ["slovenčina", "maďarčina", "angličtina"],
    rating: 4.98,
    reviews: 337,
    week: [null, s("10:00", "18:00"), s("08:00", "16:00"), s("12:00", "20:00"), null, s("08:00", "16:00"), s("08:00", "14:00")],
    color: "#6f927f",
  },
  {
    id: "laura",
    name: "Laura Mrázová",
    firstName: "Laura",
    genitive: "Laury",
    role: "Nechtová dizajnérka a lash artist",
    level: "senior",
    cats: ["nechty", "riasy", "licenie"],
    photo: "team3",
    bio: "Precízna až do posledného nechta. Jej nail art nájdete na Instagrame, jej lash lifting na najkrajších pohľadoch v Starom Meste.",
    quote: "Detaily nie sú detaily. Sú to celé dojmy.",
    specialties: ["Nail art", "Lash lifting", "Predlžovanie mihalníc"],
    since: 2016,
    languages: ["slovenčina", "angličtina", "taliančina"],
    instagram: "laura.nails.lashes",
    rating: 4.96,
    reviews: 301,
    week: [null, null, s("10:00", "20:00"), s("08:00", "16:00"), s("08:00", "18:00"), s("10:00", "20:00"), s("08:00", "15:00")],
    color: "#8a76a6",
  },
  {
    id: "kristina",
    name: "Kristína Šimková",
    firstName: "Kristína",
    genitive: "Kristíny",
    role: "Junior nechtová dizajnérka",
    level: "junior",
    cats: ["nechty"],
    photo: "team7",
    bio: "Gél lak, ktorý vydrží tri týždne, a pedikúra, po ktorej chcete chodiť bosá. Učí sa od Laury a je čoraz žiadanejšia.",
    quote: "Upravené ruky sú najlepší doplnok.",
    specialties: ["Gél lak", "Pedikúra", "Francúzska manikúra"],
    since: 2024,
    languages: ["slovenčina", "angličtina"],
    rating: 4.88,
    reviews: 64,
    week: [null, s("10:00", "19:00"), s("08:00", "16:00"), s("12:00", "20:00"), s("12:00", "20:00"), null, s("08:00", "15:00")],
    color: "#c2a274",
  },
];

export const SPECIALIST_BY_ID = new Map(TEAM.map((p) => [p.id, p]));

export const canDo = (person: Specialist, cat: CategoryId) => person.cats.includes(cat);
