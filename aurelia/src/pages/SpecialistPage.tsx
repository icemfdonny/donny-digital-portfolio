import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Instagram, Star } from "../components/icons";
import { Photo, Reveal, SelectField, Stars } from "../components/ui";
import { GALLERY, REVIEWS } from "../data/content";
import { SERVICES } from "../data/services";
import { LEVELS, SPECIALIST_BY_ID } from "../data/team";
import { findSlots, signatureService } from "../lib/availability";
import { liveService, priceFor } from "../lib/catalog";
import { addDays, capitalize, durationLabel, formatEuro, minutesToTime, toISODate } from "../lib/format";
import { relativeDay } from "../lib/hours";
import { useNow, usePageMeta } from "../lib/hooks";
import { useDB } from "../lib/store";
import NotFound from "./NotFound";

export default function SpecialistPage() {
  const { id = "" } = useParams();
  const person = SPECIALIST_BY_ID.get(id);
  usePageMeta(person ? `${person.name}, ${person.role.toLowerCase()}` : "Tím", person?.bio);
  const db = useDB();
  const now = useNow(60_000);
  const [serviceId, setServiceId] = useState(() => (person ? signatureService(person).id : ""));
  const theirs = person ? SERVICES.filter((s) => person.cats.includes(s.cat) && liveService(s.id, db.serviceOverrides).online) : [];

  // The next seven working days with this person's free start times for the chosen service.
  const days = useMemo(() => {
    if (!person || !serviceId) return [];
    const s = liveService(serviceId, db.serviceOverrides);
    const out: { iso: string; date: Date; times: number[] }[] = [];
    for (let i = 0; i < 30 && out.length < 6; i++) {
      const date = addDays(now, i);
      const iso = toISODate(date);
      const slots = findSlots(iso, [{ serviceId, variantId: s.variants?.[0].id, specialistId: person.id }], db, now);
      if (slots.length) out.push({ iso, date, times: slots.map((x) => x.start) });
    }
    return out;
  }, [person, serviceId, db, now]);

  if (!person) return <NotFound />;
  const work = GALLERY.filter((g) => g.specialist === person.id);
  const reviews = REVIEWS.filter((r) => r.specialist === person.id);
  const chosen = liveService(serviceId, db.serviceOverrides);

  return (
    <>
      <section className="bg-plum pt-24 text-ivory sm:pt-28">
        <div className="container-page grid items-end gap-10 lg:grid-cols-[1fr_440px]">
          <div className="pb-10 lg:pb-16">
            <Link to="/tim" className="inline-flex items-center gap-2 text-sm text-ivory/60 hover:text-ivory">
              <ArrowLeft size={15} /> Celý tím
            </Link>
            <p className="eyebrow mt-8 text-gold-soft">
              {person.role} · {LEVELS[person.level].label}
            </p>
            <h1 className="mt-3 animate-rise font-display text-[3rem] font-medium leading-none sm:text-7xl">{person.name}</h1>
            <p className="mt-6 max-w-xl animate-rise font-display text-2xl italic leading-snug text-gold-soft">„{person.quote}“</p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <p>
                <span className="block font-display text-3xl font-medium">{now.getFullYear() - person.since}</span>
                <span className="text-ivory/60">rokov praxe</span>
              </p>
              <p>
                <span className="flex items-center gap-1.5 font-display text-3xl font-medium">
                  {person.rating.toLocaleString("sk-SK")} <Star size={18} className="text-gold" />
                </span>
                <span className="text-ivory/60">{person.reviews} hodnotení</span>
              </p>
              <p>
                <span className="block font-display text-3xl font-medium">{person.languages.length}</span>
                <span className="text-ivory/60">{person.languages.join(", ")}</span>
              </p>
            </div>
          </div>
          <Photo name={person.photo} priority className="aspect-[4/5] rounded-t-[2rem]" />
        </div>
      </section>

      <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_440px] lg:gap-16">
        <div className="space-y-14">
          <section>
            <h2 className="font-display text-3xl font-medium text-plum">O mne</h2>
            <p className="mt-4 text-[17px] font-light leading-relaxed text-soft">{person.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {person.specialties.map((s) => (
                <span key={s} className="rounded-full bg-blush px-3 py-1.5 text-sm text-plum">
                  {s}
                </span>
              ))}
            </div>
            {person.instagram && (
              <a href={`https://instagram.com/${person.instagram}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-soft hover:text-ink">
                <Instagram size={16} /> @{person.instagram}
              </a>
            )}
          </section>

          <section>
            <h2 className="font-display text-3xl font-medium text-plum">Služby a ceny u {person.genitive}</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {theirs.map((s) => (
                <li key={s.id} className="flex items-center gap-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-mute">{durationLabel(liveService(s.id, db.serviceOverrides).duration)}</p>
                  </div>
                  <p className="tabular-nums text-plum">
                    {s.variants ? "od " : ""}
                    {formatEuro(priceFor(s.id, s.variants?.[0].id, person.id, db.serviceOverrides))}
                  </p>
                  <Link to={`/rezervacia?sluzba=${s.id}&specialista=${person.id}`} className="grid size-9 place-items-center rounded-full border border-line text-plum hover:border-plum" aria-label={`Rezervovať ${s.name}`}>
                    <ArrowRight size={15} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {work.length > 0 && (
            <section>
              <h2 className="font-display text-3xl font-medium text-plum">Z portfólia</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {work.map((g) => (
                  <Reveal key={g.photo}>
                    <Photo name={g.photo} className="aspect-[3/4] rounded-2xl" />
                    <p className="mt-2 text-xs text-mute">{g.title}</p>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {reviews.length > 0 && (
            <section>
              <h2 className="font-display text-3xl font-medium text-plum">Čo hovoria klientky</h2>
              <div className="mt-5 space-y-4">
                {reviews.map((r) => (
                  <blockquote key={r.name} className="card p-6">
                    <Stars value={r.rating} size={14} />
                    <p className="mt-3 font-display text-xl leading-snug text-ink">„{r.text}“</p>
                    <footer className="mt-4 text-sm text-mute">
                      {r.name} · {r.service}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <p className="font-display text-2xl font-medium text-plum">Voľné termíny</p>
            <SelectField label="Služba" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="mt-4">
              {theirs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
            <p className="mt-2 text-xs text-mute">
              {durationLabel(chosen.variants?.[0].duration ?? chosen.duration)} · {formatEuro(priceFor(chosen.id, chosen.variants?.[0].id, person.id, db.serviceOverrides))}
            </p>
            <div className="mt-5 space-y-4">
              {days.length ? (
                days.map((d) => (
                  <div key={d.iso}>
                    <p className="text-sm font-medium text-ink">{capitalize(relativeDay(d.date, now))}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {d.times.slice(0, 6).map((t) => (
                        <Link
                          key={t}
                          to={`/rezervacia?sluzba=${serviceId}&specialista=${person.id}&datum=${d.iso}&cas=${t}`}
                          className="rounded-lg border border-line px-2.5 py-1.5 text-sm tabular-nums hover:border-plum hover:bg-plum hover:text-ivory"
                        >
                          {minutesToTime(t)}
                        </Link>
                      ))}
                      {d.times.length > 6 && <span className="self-center px-1 text-xs text-mute">+{d.times.length - 6}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-soft">Najbližší mesiac je plne obsadený. Skúste inú službu alebo čakaciu listinu.</p>
              )}
            </div>
            <Link to={`/rezervacia?sluzba=${serviceId}&specialista=${person.id}`} className="btn-primary mt-6 w-full">
              <Calendar size={16} /> Celý kalendár
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
