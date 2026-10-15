import { Link } from "react-router-dom";
import type { Project } from "../data/trades";
import { formatEuro } from "../lib/format";
import { useNow } from "../lib/hooks";
import { placeName, useGeo } from "../lib/geo";
import { TRADE } from "../lib/profile";
import { ArrowRight, Calendar, Check, Clock, Euro, MapPin } from "./icons";
import { Dialog, Photo } from "./ui";

export function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const geo = useGeo();
  const service = project ? TRADE.services.find((s) => s.id === project.service) : null;
  const now = useNow(3_600_000);
  const date = project ? new Date(now.getFullYear(), now.getMonth() - project.monthsAgo, 1) : null;
  return (
    <Dialog open={!!project} onClose={onClose} size="lg">
      {project && (
        <div>
          <Photo src={project.photo} alt={project.title} className="aspect-[16/9]" priority>
            <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full bg-paper/95 px-3 py-1.5 text-sm font-semibold shadow">
              Zavrieť
            </button>
          </Photo>
          <div className="p-5 sm:p-8">
            <p className="text-sm font-bold text-accent-deep">{service?.title}</p>
            <h2 className="display mt-1 text-2xl sm:text-3xl">{project.title}</h2>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: MapPin, label: "Miesto", value: placeName(project.place, geo) },
                { icon: Calendar, label: "Dokončené", value: date?.toLocaleDateString("sk-SK", { month: "long", year: "numeric" }) },
                { icon: Clock, label: "Trvanie", value: project.days === 1 ? "1 deň" : `${project.days} pracovných dní` },
                { icon: Euro, label: "Cena s DPH", value: `cca ${formatEuro(Math.round(project.price / 10) * 10)}` },
              ].map((d) => (
                <div key={d.label} className="rounded-xl bg-bg p-3">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-mute">
                    <d.icon size={14} /> {d.label}
                  </dt>
                  <dd className="mt-1 text-sm font-bold">{d.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-[16px] leading-relaxed text-soft">{project.text}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {project.scope.map((s) => (
                <li key={s} className="flex min-w-0 items-start gap-2 text-sm font-medium [overflow-wrap:anywhere]">
                  <Check size={17} className="mt-0.5 text-ok" strokeWidth={2.6} /> {s}
                </li>
              ))}
            </ul>
            {project.review && (
              <blockquote className="mt-6 rounded-2xl border-l-4 border-accent bg-accent-soft/60 p-5">
                <p className="text-[15.5px] italic leading-relaxed">„{project.review.text}“</p>
                <footer className="mt-2 text-sm font-bold">— {project.review.name}</footer>
              </blockquote>
            )}
            {service?.job && (
              <Link to={`/kalkulacka?praca=${service.job}`} className="btn-accent mt-6" onClick={onClose}>
                Spočítať cenu podobnej zákazky <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
