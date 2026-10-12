import { Link } from "react-router-dom";
import { ArrowRight } from "../components/icons";
import { PageHero } from "../components/ui";
import { usePageMeta } from "../lib/hooks";

export default function NotFound() {
  usePageMeta("Stránka nenájdená");
  return (
    <>
      <PageHero
        eyebrow="Chyba 404"
        title={
          <>
            Tento stôl je <em className="text-honey-soft">prázdny.</em>
          </>
        }
        text="Stránku, ktorú hľadáte, sme nenašli. Možno sa presťahovala, možno ju zjedli."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn-light">
            Na úvod <ArrowRight size={17} />
          </Link>
          <Link to="/menu" className="btn-ghost-light">
            Pozrieť menu
          </Link>
        </div>
      </PageHero>
      <div className="h-32" />
    </>
  );
}
