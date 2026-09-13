import {
  ArrowUpRightIcon,
  DribbbleMarkIcon,
  GithubMarkIcon,
  LinkedinMarkIcon,
  MailIcon,
  XMarkIcon,
} from "./icons";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/", Icon: GithubMarkIcon },
  { label: "LinkedIn", href: "https://linkedin.com/", Icon: LinkedinMarkIcon },
  { label: "Dribbble", href: "https://dribbble.com/", Icon: DribbbleMarkIcon },
  { label: "X (Twitter)", href: "https://x.com/", Icon: XMarkIcon },
];

export default function Contact() {
  return (
    <section
      id="contact"
      className="grain relative overflow-hidden border-t border-white/10 bg-charcoal py-24 md:py-32"
    >
      <div
        className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[420px] w-[420px] rounded-full bg-orange/20 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-6 text-center md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange">
          05 / Contact
        </p>
        <h2 className="text-balance mx-auto mt-6 max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-white">
          Have an idea? Let&rsquo;s make it real.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-lg text-white/60">
          Currently booking new freelance projects starting in Q4. Tell me
          what you&rsquo;re building.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:dalog.darien@gmail.com"
            className="inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-sm font-semibold text-charcoal transition-transform hover:-translate-y-0.5"
          >
            <MailIcon className="h-4 w-4" />
            dalog.darien@gmail.com
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white transition-colors hover:border-white/50"
          >
            Start a project
            <ArrowUpRightIcon className="h-4 w-4" />
          </a>
        </div>

        <ul className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {SOCIALS.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-orange"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
