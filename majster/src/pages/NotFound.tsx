import { Link } from "react-router-dom";
import { ArrowRight, Wrench } from "../components/icons";
import { usePageMeta } from "../lib/hooks";

export default function NotFound() {
  usePageMeta("Stránka nenájdená");
  return (
    <section className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent text-accent-ink">
          <Wrench size={30} />
        </span>
        <h1 className="display mt-6 text-4xl">Túto stránku sme nenašli</h1>
        <p className="mx-auto mt-3 max-w-md text-soft">Odkaz je možno starý alebo v ňom chýba znak. Skúste to od úvodu.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn-dark">
            Na úvod <ArrowRight size={18} />
          </Link>
          <Link to="/kontakt" className="btn-outline">
            Kontakt
          </Link>
        </div>
      </div>
    </section>
  );
}
