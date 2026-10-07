import { useState, type FormEvent, type ReactNode } from "react";
import { EMAIL, SOCIALS } from "../data";
import { useCopyEmail, usePageMeta } from "../hooks";
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "../components/icons";
import PageHeader from "../components/PageHeader";
import { Reveal } from "../components/ui";

const TOPICS = ["New website", "Redesign", "Design system", "Brand & identity", "Something else"];

/** What to tell the visitor when the server rejects the input (error codes from api/contact.ts). */
const REJECTIONS: Record<string, string> = {
  invalid_name: "Please enter your name (up to 100 characters).",
  invalid_email: "That email address doesn\u2019t look right. Please check it and try again.",
  invalid_message: "Please write a message (up to 5,000 characters).",
  rate_limited: "Several messages were sent from your connection recently. Please try again in a few minutes.",
};

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
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sentTo, setSentTo] = useState({ name: "", email: "" });
  const [fallbackHref, setFallbackHref] = useState("");
  const [rejection, setRejection] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const name = String(f.get("name") ?? "").trim();
    const from = String(f.get("email") ?? "").trim();
    const message = String(f.get("message") ?? "").trim();

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // "company" is a hidden spam trap: people leave it empty, bots fill it in.
        body: JSON.stringify({ name, email: from, topic, message, company: String(f.get("company") ?? "") }),
      });
      if (!res.ok) {
        const code = await res.json().then((j: { error?: unknown }) => String(j.error ?? ""), () => "");
        const reason = REJECTIONS[code];
        if (reason) {
          // The input was refused: say why and keep what they typed, no email-app fallback needed.
          setRejection(reason);
          setStatus("error");
          return;
        }
        throw new Error(`Contact form request failed (${res.status})`);
      }
      form.reset();
      setTopic(TOPICS[0]);
      setSentTo({ name, email: from });
      setStatus("sent");
    } catch {
      // Sending failed (offline, server down, ...): keep what they typed and offer their own email app instead.
      const subject = `${topic} — ${name}`;
      const body = `${message}\n\n— ${name}\n${from}`;
      setFallbackHref(`mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      setRejection("");
      setStatus("error");
    }
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

          <Reveal delay={100} className="h-full">
            {status === "sent" ? (
              <div role="status" className={`${CARD} flex h-full min-h-[26rem] flex-col items-center justify-center text-center`}>
                <div className="relative flex flex-col items-center">
                  <span className="grid size-14 place-items-center rounded-full bg-black text-white">
                    <CheckIcon className="size-6" />
                  </span>
                  <h2 className="mt-7 font-display text-2xl leading-snug md:text-3xl">Message sent</h2>
                  <p className="mt-4 max-w-sm leading-relaxed text-black/60">
                    Thanks{sentTo.name ? `, ${sentTo.name.split(" ")[0]}` : ""}. I&rsquo;ll reply to {sentTo.email} as soon as I can.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-8 inline-flex items-center rounded-full border border-black/15 px-6 py-3 text-sm font-medium text-black transition-colors hover:border-black/40 hover:bg-black/5"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className={CARD}>
                <div className="relative">
                  {/* Hidden spam trap, see onSubmit. */}
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-[9999px] size-px opacity-0"
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">Your name</span>
                      <input name="name" required maxLength={100} autoComplete="name" placeholder="Jane Doe" className={field} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">Your email</span>
                      <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="jane@company.com" className={field} />
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
                      maxLength={5000}
                      rows={6}
                      placeholder="What are you building, who is it for, and when would you like to launch?"
                      className={`${field} resize-y`}
                    />
                  </label>

                  {status === "error" && (
                    <div role="alert" className="mt-6 rounded-xl border border-black/20 bg-black/[0.04] px-4 py-3 text-sm leading-relaxed text-black">
                      {rejection || (
                        <>
                          Your message couldn&rsquo;t be sent just now. Try again, or{" "}
                          <a href={fallbackHref} className="font-medium underline underline-offset-2">
                            open it in your email app
                          </a>{" "}
                          instead.
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="max-w-xs text-xs leading-relaxed text-black/50">Your message goes straight to my inbox.</p>
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="inline-flex items-center gap-3 rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {status === "sending" ? "Sending…" : "Send message"}
                      {status !== "sending" && <ArrowUpRightIcon className="size-4" />}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
