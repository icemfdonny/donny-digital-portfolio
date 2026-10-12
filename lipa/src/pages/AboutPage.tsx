import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Flame, Instagram, Leaf, MapPin, Wine } from "../components/icons";
import { PageHero, Photo, Reveal, SectionHeading } from "../components/ui";
import { RESTAURANT } from "../config";
import { SUPPLIERS, TEAM } from "../data/content";
import type { PhotoKey } from "../data/photos";
import { plural } from "../lib/format";
import { useNow, usePageMeta } from "../lib/hooks";

const VALUES = [
  { icon: Leaf, title: "Podľa sezóny", text: "Jedálny lístok meníme štyrikrát do roka a obedové menu každý deň. Keď skončí sezóna špargle, skončí aj na tanieri." },
  { icon: MapPin, title: "Od ľudí, ktorých poznáme", text: "Väčšinu surovín berieme od šiestich farmárov do 200 km. Poznáme ich po mene a chodíme k nim na návštevy." },
  { icon: Flame, title: "Oheň a čas", text: "Gril na drevenom uhlí, pec na drevo a komora, kde zrejú steaky 28 dní. Žiadne skratky, žiadne polotovary." },
  { icon: Wine, title: "Len slovenské víno", text: "120 vín od malých rodinných vinárstiev, od Malých Karpát až po Tokaj. Sommeliérka ich pozná osobne." },
];

const TIMELINE = [
  { year: "2019", text: "Otvárame v dvore meštianskeho domu na Lipovej ulici. Dvanásť stolov a jedna lipa." },
  { year: "2021", text: "Prestavali sme dvor na vyhrievanú terasu a pridali obedové menu pre okolité kancelárie." },
  { year: "2023", text: "V pivnici pod reštauráciou otvárame vínny bar s 400 fľašami." },
  { year: "2025", text: "Chef's table: osem miest priamo pri kuchyni a sedem chodov podľa sezóny." },
];

const GALLERY: PhotoKey[] = ["dishTartare", "interior", "eventWine", "dishDessert", "terrace", "kitchen"];

export default function AboutPage() {
  const years = useNow(3_600_000).getFullYear() - RESTAURANT.founded;
  usePageMeta("O nás", "Príbeh reštaurácie Lipa: sezónna kuchyňa, suroviny od slovenských farmárov a vína od rodinných vinárstiev.");
  return (
    <>
      <PageHero
        eyebrow="O nás"
        title={
          <>
            Reštaurácia, ktorá vyrástla <em className="text-honey-soft">pod jednou lipou.</em>
          </>
        }
        text="Sme malý tím kuchárov, čašníkov a jednej sommeliérky. Varíme jednoducho, zo surovín, ktoré poznáme, a radi pri tom vidíme plné stoly."
      />

      <section className="py-20 sm:py-28">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Photo name="interior" className="aspect-[4/5] rounded-[2rem]" />
          </Reveal>
          <div>
            <SectionHeading eyebrow="Náš príbeh" title="Všetko sa začalo stromom" />
            <Reveal delay={80} className="mt-6 space-y-4 text-[17px] leading-relaxed text-soft">
              <p>
                Keď sme v roku {RESTAURANT.founded} prvýkrát vošli do dvora na Lipovej ulici, bol plný starých bicyklov a v strede rástla storočná lipa. Vedeli sme, že tu chceme
                variť.
              </p>
              <p>
                Šéfkuchár Tomáš Hudák sa sem vrátil po rokoch v kuchyniach v Kodani a vo Viedni. Zo zahraničia si priniesol cit pre detail, no varí to, na čom vyrástol: halušky,
                kačicu, šúľance. Len trochu inak.
              </p>
              <p>Dnes máme {RESTAURANT.seats} miest, terasu pod lipou, vínny bar v pivnici a stále ten istý cieľ: aby ste od nás odchádzali radšej, než ste prišli.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading eyebrow="Čomu veríme" title="Štyri veci, na ktorých nemeníme nič" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 70} className="rounded-3xl border border-line bg-cream p-6">
                <span className="grid size-12 place-items-center rounded-full bg-forest text-honey">
                  <v.icon size={22} />
                </span>
                <h3 className="mt-5 font-display text-2xl text-forest">{v.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-soft">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading eyebrow="Tím" title="Ľudia, ktorí sa o vás postarajú" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {TEAM.map((person, i) => (
              <Reveal key={person.name} delay={i * 80} as="article">
                <Photo name={person.photo} className="aspect-[4/5] rounded-3xl" />
                <h3 className="mt-5 font-display text-2xl text-forest">{person.name}</h3>
                <p className="text-sm font-medium uppercase tracking-[0.12em] text-moss">{person.role}</p>
                <p className="mt-3 leading-relaxed text-soft">{person.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest py-20 text-cream sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading
              tone="light"
              eyebrow="Naši dodávatelia"
              title="Odkiaľ prichádza to, čo jete"
              text="Šesť farmárov a remeselníkov, s ktorými spolupracujeme od prvého dňa. Ich mená nájdete aj na jedálnom lístku."
            />
            <Reveal delay={100}>
              <Photo name="farm" className="mt-10 aspect-[16/10] rounded-3xl" />
            </Reveal>
          </div>
          <ul className="grid gap-3 self-center sm:grid-cols-2">
            {SUPPLIERS.map((s, i) => (
              <Reveal key={s.name} delay={i * 50} as="li" className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-honey">
                  <MapPin size={13} /> {s.place}
                </p>
                <p className="mt-2 font-display text-xl">{s.name}</p>
                <p className="mt-1 text-sm text-cream/60">{s.what}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="Ako sme rástli" title={`${years} ${plural(years, ["rok", "roky", "rokov"])} v skratke`} />
          <ol className="relative space-y-8 border-l border-line pl-8">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={i * 70} as="li" className="relative">
                <span className="absolute -left-[41px] top-1 grid size-5 place-items-center rounded-full border-2 border-cream bg-moss" />
                <p className="font-display text-3xl text-forest">{t.year}</p>
                <p className="mt-1 max-w-lg text-soft">{t.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Instagram" title={`@${RESTAURANT.instagram}`} />
            <a href={`https://instagram.com/${RESTAURANT.instagram}`} target="_blank" rel="noreferrer" className="btn-outline">
              <Instagram size={17} /> Sledovať
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
            {GALLERY.map((photo, i) => (
              <Reveal key={photo} delay={i * 50}>
                <Photo name={photo} className="aspect-square rounded-2xl" />
              </Reveal>
            ))}
          </div>
          <div className="mt-16 flex flex-col items-center gap-5 rounded-[2rem] bg-sand/70 px-6 py-14 text-center">
            <p className="font-display text-3xl text-forest sm:text-4xl">Príďte nás spoznať osobne.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/rezervacia" className="btn-primary">
                <Calendar size={17} /> Rezervovať stôl
              </Link>
              <Link to="/menu" className="btn-outline">
                Pozrieť menu <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
