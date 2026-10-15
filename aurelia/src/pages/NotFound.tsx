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
            Táto stránka si dala <em className="font-normal text-gold-soft">voľno.</em>
          </>
        }
        text="Stránku, ktorú hľadáte, sme nenašli. Možno sa presťahovala, možno je práve na manikúre."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn-light">
            Na úvod <ArrowRight size={17} />
          </Link>
          <Link to="/rezervacia" className="btn-ghost-light">
            Rezervovať termín
          </Link>
        </div>
      </PageHero>
      <div className="h-32" />
    </>
  );
}
