import { useState, type FormEvent, type ReactNode } from "react";
import { EMAIL, SOCIALS } from "../data";
import { useCopyEmail, usePageMeta } from "../hooks";
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "../components/icons";
import PageHeader from "../components/PageHeader";
import { Reveal } from "../components/ui";

const TOPICS = ["New website", "Redesign", "Design system", "Brand & identity", "Something else"];

/** Same light card as the "Have an idea?" call to action: black on white, with the film-grain tile (no filters or blend modes). */
const CARD =
  "noise relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-[#cfcfcf] p-7 text-black md:rounded-[2.5rem] md:p-10";

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-black/10 py-5 last:border-b-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">{label}</p>
      <div className="mt-2 text-black">{children}</div>
    </div>
  );
}

export default function ContactPage() {
  usePageMeta("Contact — Donny Digital", "Have an idea? Get in touch with Donny Digital to start a project.");
  const { copied, copy } = useCopyEmail();
  const [topic, setTopic] = useState(TOPICS[0]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "");
    const from = String(f.get("email") ?? "");
    const message = String(f.get("message") ?? "");
    const subject = `${topic} — ${name}`;
    const body = `${message}\n\n— ${name}\n${from}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const field =
    "w-full rounded-xl border border-black/15 bg-white/70 px-4 py-3.5 text-sm text-black placeholder:text-black/40 transition-colors focus:border-black/60 focus:bg-white focus:outline-none";

  return (
    <>
      <PageHeader eyebrow="Contact" title={<>Let&rsquo;s make it real.</>}>
        Currently booking new freelance projects starting in Q4. Tell me what you&rsquo;re building.
      </PageHeader>

      <section className="pb-28 md:pb-36">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className={`${CARD} h-full`}>
              <div className="relative">
                <button
                  type="button"
                  onClick={copy}
                  className="flex w-full items-center justify-between gap-3 rounded-full bg-black px-6 py-4 text-sm font-medium text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5"
                >
                  <span aria-live="polite">{copied ? "Copied to clipboard" : EMAIL}</span>
                  {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                </button>

                <div className="mt-6">
                  <InfoRow label="Location">Senec, Slovakia</InfoRow>
                  <InfoRow label="Availability">Booking new projects from Q4</InfoRow>
                  <InfoRow label="Elsewhere">
                    <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
                      {SOCIALS.map((s) => (
                        <li key={s.label}>
                          <a
                            href={s.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-black/70 transition-colors hover:text-black"
                          >
                            {s.label}
                            <ArrowUpRightIcon className="size-3.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </InfoRow>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <form onSubmit={onSubmit} className={CARD}>
              <div className="relative">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">Your name</span>
                    <input name="name" required autoComplete="name" placeholder="Jane Doe" className={field} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">Your email</span>
                    <input name="email" type="email" required autoComplete="email" placeholder="jane@company.com" className={field} />
                  </label>
                </div>

                <fieldset className="mt-6">
                  <legend className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">What do you need?</legend>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={topic === t}
                        onClick={() => setTopic(t)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          topic === t
                            ? "border-black bg-black text-white"
                            : "border-black/15 bg-black/[0.03] text-black/70 hover:border-black/40 hover:text-black"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="mt-6 block">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">Tell me about the project</span>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    placeholder="What are you building, who is it for, and when would you like to launch?"
                    className={`${field} resize-y`}
                  />
                </label>

                <div className="mt-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <p className="max-w-xs text-xs leading-relaxed text-black/50">Sending opens your email app with this message ready to go.</p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-3 rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5"
                  >
                    Compose email
                    <ArrowUpRightIcon className="size-4" />
                  </button>
                </div>
              </div>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
