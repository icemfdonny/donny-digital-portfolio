import { usePageMeta } from "../hooks";
import PageHeader from "../components/PageHeader";
import { ArrowLink } from "../components/ui";

export default function NotFound() {
  usePageMeta("Page not found — Donny Digital");
  return (
    <>
      <PageHeader eyebrow="Error 404" title={<>This page drifted off the grid.</>}>
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </PageHeader>
      <section className="pb-40">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-6">
          <ArrowLink to="/">Back to home</ArrowLink>
          <ArrowLink to="/work">Browse work</ArrowLink>
        </div>
      </section>
    </>
  );
}
