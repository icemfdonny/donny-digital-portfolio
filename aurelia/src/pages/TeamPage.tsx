import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Mail, Star } from "../components/icons";
import { CategoryIcon, PageHero, Photo, Reveal } from "../components/ui";
import { SALON } from "../config";
import { CATEGORIES, type CategoryId } from "../data/services";
import { LEVELS, TEAM } from "../data/team";
import { nextFree, signatureService } from "../lib/availability";
import { fromISODate, minutesToTime } from "../lib/format";
import { relativeDay } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { useDB } from "../lib/store";

export default function TeamPage() {
  usePageMeta("Tím", "Stylistky, koloristka, kozmetička a nechtové dizajnérky salónu Aurelia. Pozrite si ich práce a najbližšie voľné termíny.");
  const db = useDB();
  const now = useNow(60_000);
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const people = TEAM.filter((p) => cat === "all" || p.cats.includes(cat));
  const free = useMemo(
    () =>
      new Map(
        TEAM.map((p) => {
          const s = signatureService(p);
          return [p.id, { service: s, next: nextFree([{ serviceId: s.id, variantId: s.variants?.[0].id, specialistId: p.id }], db, now, 30) }];
        }),
      ),
    [db, now],
  );

  return (
    <>
      <PageHero
        eyebrow="Tím"
        photo="teamGroup"
        title={
          <>
            Ľudia, ku ktorým sa <em className="font-normal text-gold-soft">radi vraciate.</em>
          </>
        }
        text="Sedem špecialistiek a jeden stylista. Spolu viac ako 80 rokov praxe a stovky školení od Viedne po Londýn."
      />
      <div className="container-page py-14 sm:py-20">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="radiogroup" aria-label="Filtrovať podľa služby">
          <button type="button" role="radio" aria-checked={cat === "all"} className="chip shrink-0" onClick={() => setCat("all")}>
            Všetci
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={cat === c.id} className="chip shrink-0" onClick={() => setCat(c.id)}>
              <CategoryIcon cat={c.id} size={15} /> {c.short}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p, i) => {
            const f = free.get(p.id);
            return (
              <Reveal key={p.id} delay={(i % 3) * 60}>
                <article className="group">
                  <Link to={`/tim/${p.id}`} className="block overflow-hidden rounded-[1.6rem]">
                    <Photo name={p.photo} className="aspect-[4/5]" imgClassName="transition-transform duration-700 group-hover:scale-105">
                      <span className="absolute left-4 top-4 rounded-full bg-ivory/90 px-3 py-1 text-xs font-medium text-plum backdrop-blur-sm">{LEVELS[p.level].label}</span>
                    </Photo>
                  </Link>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-[1.9rem] font-medium leading-tight text-plum">
                        <Link to={`/tim/${p.id}`} className="link-underline">
                          {p.name}
                        </Link>
                      </h2>
                      <p className="text-sm text-mute">{p.role}</p>
                    </div>
                    <p className="flex shrink-0 items-center gap-1 text-sm text-soft">
                      <Star size={14} className="text-gold" /> {p.rating.toLocaleString("sk-SK")}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-3 text-[15px] font-light leading-relaxed text-soft">{p.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.specialties.map((s) => (
                      <span key={s} className="rounded-full bg-blush px-2.5 py-1 text-xs text-plum">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link to={`/rezervacia?specialista=${p.id}`} className="btn-primary py-2.5">
                      <Calendar size={16} /> Rezervovať
                    </Link>
                    {f?.next && (
                      <Link
                        to={`/rezervacia?sluzba=${f.service.id}&specialista=${p.id}&datum=${f.next.iso}&cas=${f.next.slot.start}`}
                        className="inline-flex items-center gap-2 text-sm text-soft hover:text-ink"
                      >
                        <span className="size-1.5 rounded-full bg-ok" /> voľno {relativeDay(fromISODate(f.next.iso), now)} {minutesToTime(f.next.slot.start)}
                      </Link>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <section className="mt-24 grid gap-8 overflow-hidden rounded-[2rem] bg-blush/70 lg:grid-cols-2">
          <Photo name="tools" className="min-h-64" />
          <div className="p-6 sm:p-10 lg:py-14">
            <p className="eyebrow text-gold">Kariéra</p>
            <h2 className="mt-3 font-display text-[2.3rem] font-medium leading-none text-plum sm:text-5xl">Hľadáme kolegyňu na nechty a riasy.</h2>
            <p className="mt-4 font-light leading-relaxed text-soft">
              Plný alebo čiastočný úväzok, platené školenia, vlastný rozvrh v rezervačnom systéme a tím, ktorý si pomáha. Prax aspoň dva roky a chuť učiť sa.
            </p>
            <a href={`mailto:${SALON.email}?subject=${encodeURIComponent("Práca v Aurelii")}`} className="btn-primary mt-6">
              <Mail size={16} /> Poslať portfólio <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
