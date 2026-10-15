import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Instagram, X } from "../components/icons";
import { Avatar, CategoryIcon, PageHero, Photo, Reveal } from "../components/ui";
import { SALON } from "../config";
import { GALLERY } from "../data/content";
import { CATEGORIES, CATEGORY_BY_ID, type CategoryId } from "../data/services";
import { SPECIALIST_BY_ID } from "../data/team";
import { usePageMeta } from "../lib/hooks";

export default function GalleryPage() {
  usePageMeta("Galéria", "Balayage, strihy, nechty, mihalnice a pleť z nášho salónu. Pri každej práci vidíte, kto ju robil.");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [open, setOpen] = useState<number | null>(null);
  const shown = GALLERY.filter((g) => cat === "all" || g.cat === cat);
  const cats = CATEGORIES.filter((c) => GALLERY.some((g) => g.cat === c.id));

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % shown.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + shown.length) % shown.length));
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, shown.length]);

  const current = open !== null ? shown[open] : null;
  const person = current ? SPECIALIST_BY_ID.get(current.specialist) : null;

  return (
    <>
      <PageHero
        eyebrow="Galéria"
        photo="look2"
        title={
          <>
            Premeny, na ktoré <em className="font-normal text-gold-soft">sme hrdí.</em>
          </>
        }
        text="Pri každej fotke vidíte, kto ju robil. Páči sa vám look? Jedným klikom si rezervujete termín práve u nej."
      />
      <div className="container-page py-14 sm:py-20">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="radiogroup" aria-label="Filtrovať galériu">
          <button type="button" role="radio" aria-checked={cat === "all"} className="chip shrink-0" onClick={() => setCat("all")}>
            Všetko <span className="text-xs opacity-60">{GALLERY.length}</span>
          </button>
          {cats.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={cat === c.id} className="chip shrink-0" onClick={() => setCat(c.id)}>
              <CategoryIcon cat={c.id} size={15} /> {c.short} <span className="text-xs opacity-60">{GALLERY.filter((g) => g.cat === c.id).length}</span>
            </button>
          ))}
        </div>

        <div className="mt-10 columns-2 gap-3 sm:gap-4 lg:columns-3">
          {shown.map((g, i) => (
            <Reveal key={`${cat}-${g.photo}`} delay={(i % 3) * 50} className="mb-3 break-inside-avoid sm:mb-4">
              <button type="button" onClick={() => setOpen(i)} className="group relative block w-full overflow-hidden rounded-[1.3rem] text-left" aria-label={`Zväčšiť: ${g.title}`}>
                <Photo name={g.photo} className={g.tall ? "aspect-[3/4]" : "aspect-[4/3]"} imgClassName="transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgb(35_26_30/0.75))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="block font-display text-xl font-medium leading-tight">{g.title}</span>
                  <span className="text-xs text-ivory/75">{SPECIALIST_BY_ID.get(g.specialist)?.name}</span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 rounded-[2rem] bg-blush/70 px-6 py-12 text-center">
          <Instagram size={28} className="text-gold" />
          <p className="font-display text-[2.2rem] font-medium leading-none text-plum">Každý týždeň nové premeny</p>
          <p className="max-w-md font-light text-soft">Sledujte nás na Instagrame, kde zverejňujeme aj voľné termíny na poslednú chvíľu.</p>
          <a href={`https://instagram.com/${SALON.instagram}`} target="_blank" rel="noreferrer" className="btn-primary mt-2">
            @{SALON.instagram} <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {current && person && (
        <div className="fixed inset-0 z-[70] flex animate-rise flex-col bg-night/95 text-ivory backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={current.title}>
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <p className="text-sm tabular-nums text-ivory/60">
              {open! + 1} / {shown.length}
            </p>
            <button type="button" onClick={() => setOpen(null)} className="grid size-11 place-items-center rounded-full bg-ivory/10 hover:bg-ivory/20" aria-label="Zavrieť">
              <X />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
            <Photo name={current.photo} showLabel={false} className="h-full max-h-[70vh] w-full max-w-3xl rounded-2xl" imgClassName="!object-contain" />
            <button
              type="button"
              onClick={() => setOpen((open! - 1 + shown.length) % shown.length)}
              className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 hover:bg-ivory/20 sm:left-6"
              aria-label="Predchádzajúca"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => setOpen((open! + 1) % shown.length)}
              className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 hover:bg-ivory/20 sm:right-6"
              aria-label="Nasledujúca"
            >
              <ChevronRight />
            </button>
          </div>
          <div className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <Avatar id={person.id} size={44} />
              <div>
                <p className="font-display text-2xl font-medium leading-tight">{current.title}</p>
                <p className="text-sm text-ivory/60">
                  {person.name} · {CATEGORY_BY_ID.get(current.cat)?.name}
                </p>
              </div>
            </div>
            <Link to={`/rezervacia?specialista=${person.id}`} className="btn-gold" onClick={() => setOpen(null)}>
              <Calendar size={16} /> Chcem termín u {person.genitive}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
