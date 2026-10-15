import { useState } from "react";
import { Link } from "react-router-dom";
import type { Project, Review } from "../data/trades";
import { useEmergencyOn } from "./layout/nav";
import { formatEuro } from "../lib/format";
import { placeName, useGeo } from "../lib/geo";
import { BIZ, TRADE } from "../lib/profile";
import { ArrowUpRight, Calculator, Calendar, ChevronDown, Clock, MapPin, Phone, Siren } from "./icons";
import { ContactLink, Initials, Photo, Reveal, Stars } from "./ui";

const monthsLabel = (m: number) => (m === 0 ? "tento mesiac" : m === 1 ? "pred mesiacom" : m < 5 ? `pred ${m} mesiacmi` : `pred ${m} mesiacmi`);

export function ReviewCard({ review }: { review: Review }) {
  const geo = useGeo();
  return (
    <figure className="card flex h-full flex-col p-6">
      <div className="flex items-center justify-between gap-3">
        <Stars value={review.rating} />
        <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-soft">{review.service}</span>
      </div>
      <blockquote className="mt-4 flex-1 text-[15.5px] leading-relaxed text-ink">„{review.text}“</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <Initials name={review.name} className="size-10 text-sm" />
        <span className="text-sm leading-tight">
          <span className="block font-bold text-ink">{review.name}</span>
          <span className="text-mute">
            {placeName(review.place, geo)} · {monthsLabel(review.monthsAgo)}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const geo = useGeo();
  const service = TRADE.services.find((s) => s.id === project.service);
  return (
    <button type="button" onClick={onOpen} className="group card flex h-full w-full flex-col overflow-hidden text-left transition-shadow hover:shadow-[0_20px_40px_-24px_rgb(0_0_0/0.35)]">
      <Photo src={project.photo} alt={project.title} className="aspect-[4/3]" imgClassName="transition-transform duration-700 group-hover:scale-[1.04]">
        <span className="absolute left-3 top-3 rounded-lg bg-paper/95 px-2.5 py-1 text-xs font-bold text-ink">{service?.title}</span>
      </Photo>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-mute">
          <MapPin size={13} /> {placeName(project.place, geo)} <span aria-hidden="true">·</span> <Clock size={13} /> {project.days === 1 ? "1 deň" : `${project.days} dní`}
        </p>
        <h3 className="display mt-2 text-lg leading-snug">{project.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-sm text-soft">
            cca <strong className="text-ink">{formatEuro(Math.round(project.price / 10) * 10)}</strong>
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-sand text-ink transition-colors group-hover:bg-accent group-hover:text-accent-ink">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </button>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-paper">
      {items.map((item, i) => (
        <div key={item.q}>
          <h3>
            <button type="button" className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-[16px] font-bold sm:px-6" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {item.q}
              <ChevronDown size={20} className={`shrink-0 text-mute transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
          </h3>
          {open === i && <p className="animate-rise px-5 pb-5 text-[15px] leading-relaxed text-soft sm:px-6">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

/** Closing call to action on most pages. */
export function CtaBand() {
  const emergency = useEmergencyOn();
  return (
    <section className="container-page py-16 sm:py-24">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-accent px-6 py-12 text-accent-ink sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-10 -top-10 size-64 rounded-full bg-white/15" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 right-32 size-56 rounded-full bg-black/10" aria-hidden="true" />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <h2 className="display text-[2rem] leading-[1.05] sm:text-[2.8rem]">Povedzte nám, čo treba urobiť. Cenu máte do 48 hodín.</h2>
            <p className="mt-4 max-w-xl text-[17px] opacity-80">Orientačnú cenu si spočítate hneď online. Presnú ponuku pošleme po bezplatnej obhliadke, bez záväzkov.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/kalkulacka" className="btn bg-ink py-4 text-white hover:bg-steel">
              <Calculator size={19} /> Spočítať cenu online
            </Link>
            <Link to="/obhliadka" className="btn border-2 border-current/25 py-4 hover:bg-white/15">
              <Calendar size={19} /> Objednať obhliadku
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1 text-sm font-semibold">
              <ContactLink kind="tel" className="inline-flex items-center gap-1.5 hover:underline">
                <Phone size={16} /> {BIZ.phoneLabel}
              </ContactLink>
              {emergency && (
                <Link to="/havaria" className="inline-flex items-center gap-1.5 hover:underline">
                  <Siren size={16} /> Havária 24/7
                </Link>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
