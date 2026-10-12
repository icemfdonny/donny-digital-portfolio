import { addDays, startOfDay, toISODate } from "../lib/format";
import { seeded } from "../lib/random";
import type { PhotoKey } from "./photos";

export type LipaEvent = {
  id: string;
  title: string;
  kind: string;
  date: Date;
  /** HH:MM */
  time: string;
  /** Per person; 0 means free entry with a table reservation. */
  price: number;
  capacity: number;
  /** Seats sold to other guests (generated). */
  sold: number;
  lead: string;
  includes: string[];
  photo: PhotoKey;
};

type Template = Omit<LipaEvent, "id" | "date" | "sold"> & { slug: string; occurs: (d: Date) => boolean };

const isoWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7);
};

const lastWeekdayOfMonth = (d: Date, weekday: number) => d.getDay() === weekday && addDays(d, 7).getMonth() !== d.getMonth();
const nthWeekdayOfMonth = (d: Date, weekday: number, n: number) => d.getDay() === weekday && Math.ceil(d.getDate() / 7) === n;
const onDate = (month: number, day: number) => (d: Date) => d.getMonth() === month && d.getDate() === day;

const TEMPLATES: Template[] = [
  {
    slug: "vinny-stvrtok",
    title: "Vínny štvrtok: Malé Karpaty",
    kind: "Degustácia",
    time: "19:00",
    price: 39,
    capacity: 24,
    lead: "Šesť vín od troch rodinných vinárstiev z Malých Karpát a k nim malé taniere z našej kuchyne. Večerom sprevádza naša sommeliérka Petra.",
    includes: ["6 vín po 0,05 l", "4 malé taniere", "Voda a káva"],
    photo: "eventWine",
    occurs: (d) => d.getDay() === 4 && isoWeek(d) % 2 === 0,
  },
  {
    slug: "jazz",
    title: "Jazz pod lipou",
    kind: "Hudba",
    time: "20:00",
    price: 0,
    capacity: 60,
    lead: "Živé trio, svetlá nad dvorom a celé menu ako obvykle. Vstup je voľný, stôl si však radšej rezervujte.",
    includes: ["Vstup voľný", "Celé menu a vínna karta", "Hrá Matej Šimko Trio"],
    photo: "eventJazz",
    occurs: (d) => d.getDay() === 3 && isoWeek(d) % 2 === 1,
  },
  {
    slug: "vecer-so-sefkucharom",
    title: "Večer so šéfkuchárom",
    kind: "Degustačné menu",
    time: "19:00",
    price: 89,
    capacity: 12,
    lead: "Sedem chodov pri jednom dlhom stole priamo v kuchyni. Tomáš Hudák varí zo surovín, ktoré v ten týždeň priniesli naši farmári.",
    includes: ["7-chodové menu", "Vínne párovanie", "Rozhovor so šéfkuchárom"],
    photo: "eventChef",
    occurs: (d) => lastWeekdayOfMonth(d, 5),
  },
  {
    slug: "kurz-kvasok",
    title: "Kurz: kváskový chlieb doma",
    kind: "Workshop",
    time: "10:00",
    price: 45,
    capacity: 10,
    lead: "Tri hodiny s naším pekárom: od kŕmenia kvásku po chrumkavú kôrku. Domov si odnesiete vlastný kvások a upečený bochník.",
    includes: ["Suroviny a zástera", "Vlastný kvások domov", "Brunch po kurze"],
    photo: "eventBread",
    occurs: (d) => nthWeekdayOfMonth(d, 6, 2),
  },
  {
    slug: "martinska-hus",
    title: "Martinská hus",
    kind: "Sezónne menu",
    time: "18:00",
    price: 49,
    capacity: 60,
    lead: "Pečená hus od farmára zo Záhoria, lokše, červená kapusta a svätomartinské víno. Tradícia, na ktorú sa tešíme celý rok.",
    includes: ["Trojchodové menu", "Pohár svätomartinského vína", "Hrá cimbalovka"],
    photo: "eventGoose",
    occurs: onDate(10, 11),
  },
  {
    slug: "silvester",
    title: "Silvester v Lipe",
    kind: "Slávnostná večera",
    time: "19:00",
    price: 129,
    capacity: 80,
    lead: "Päť chodov, sekt o polnoci, DJ a ohňostroj z nášho dvora. Rezervácie len celých stolov.",
    includes: ["5-chodové menu", "Sekt o polnoci", "DJ do 2:00"],
    photo: "eventNewYear",
    occurs: onDate(11, 31),
  },
  {
    slug: "valentin",
    title: "Valentínska večera",
    kind: "Menu pre dvoch",
    time: "18:30",
    price: 69,
    capacity: 40,
    lead: "Päť chodov pre dvoch, sviečky a pohár ružového šampanského na privítanie.",
    includes: ["5-chodové menu", "Aperitív", "Pamätná fotografia"],
    photo: "eventChef",
    occurs: onDate(1, 14),
  },
];

/**
 * Upcoming events computed from today, so the calendar never looks stale: regular evenings repeat on their rule
 * and seasonal ones (Martin's goose, New Year's Eve) appear as they come close.
 */
export function upcomingEvents(now: Date, days = 75, limit = 8): LipaEvent[] {
  const out: LipaEvent[] = [];
  const today = startOfDay(now);
  for (let i = 1; i <= days; i++) {
    const date = addDays(today, i);
    for (const t of TEMPLATES) {
      if (!t.occurs(date)) continue;
      const id = `${t.slug}-${toISODate(date)}`;
      const rand = seeded(id);
      // Some evenings sell out; far-off ones are still mostly free.
      const share = i > 45 ? 0.1 + rand() * 0.2 : rand() < 0.2 ? 1 : 0.3 + rand() * 0.6;
      out.push({
        id,
        date,
        sold: t.price === 0 ? 0 : Math.floor(t.capacity * share),
        title: t.title,
        kind: t.kind,
        time: t.time,
        price: t.price,
        capacity: t.capacity,
        lead: t.lead,
        includes: t.includes,
        photo: t.photo,
      });
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}
