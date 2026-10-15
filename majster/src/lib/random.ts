/** Deterministic randomness, so generated demo data (other clients' bookings) is stable per day. */

export function hashString(input: string) {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32: a small, fast PRNG returning floats in [0, 1). */
export function seeded(seed: string | number) {
  let a = typeof seed === "number" ? seed : hashString(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(rand: () => number, items: readonly T[]) => items[Math.floor(rand() * items.length)];

export function shuffle<T>(rand: () => number, items: readonly T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const FIRST_M = ["Martin", "Peter", "Tomáš", "Michal", "Jakub", "Lukáš", "Andrej", "Marek", "Filip", "Juraj", "Matej", "Samuel", "Roman", "Pavol"];
const FIRST_F = ["Lucia", "Zuzana", "Katarína", "Jana", "Veronika", "Simona", "Barbora", "Eva", "Natália", "Petra", "Monika", "Ivana", "Kristína", "Laura", "Dominika", "Alexandra", "Michaela", "Adriana", "Tereza", "Nikola", "Sofia", "Romana"];
const SURNAMES: [string, string][] = [
  ["Novák", "Nováková"],
  ["Horváth", "Horváthová"],
  ["Kováč", "Kováčová"],
  ["Varga", "Vargová"],
  ["Tóth", "Tóthová"],
  ["Baláž", "Balážová"],
  ["Szabó", "Szabová"],
  ["Molnár", "Molnárová"],
  ["Lukáč", "Lukáčová"],
  ["Kollár", "Kollárová"],
  ["Hudák", "Hudáková"],
  ["Polák", "Poláková"],
  ["Krajčír", "Krajčírová"],
  ["Šimko", "Šimková"],
  ["Mráz", "Mrázová"],
];

export function slovakName(rand: () => number, femaleShare = 0.5) {
  const female = rand() < femaleShare;
  const first = pick(rand, female ? FIRST_F : FIRST_M);
  const [m, f] = pick(rand, SURNAMES);
  return `${first} ${female ? f : m}`;
}
