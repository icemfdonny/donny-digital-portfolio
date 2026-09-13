import { DribbbleMarkIcon, GithubMarkIcon, LinkedinMarkIcon, XMarkIcon } from "./icons";
import Logo from "./Logo";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/", Icon: GithubMarkIcon },
  { label: "LinkedIn", href: "https://linkedin.com/", Icon: LinkedinMarkIcon },
  { label: "Dribbble", href: "https://dribbble.com/", Icon: DribbbleMarkIcon },
  { label: "X", href: "https://x.com/", Icon: XMarkIcon },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-charcoal">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-10 text-center md:flex-row md:justify-between md:px-10 md:text-left">
        <Logo className="h-7 w-auto" />

        <ul className="flex items-center gap-6">
          {SOCIALS.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-white/50 transition-colors hover:text-orange"
              >
                <Icon className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-1 text-sm text-white/40 md:items-end">
          <a
            href="mailto:dalog.darien@gmail.com"
            className="transition-colors hover:text-white"
          >
            dalog.darien@gmail.com
          </a>
          <p>&copy; {new Date().getFullYear()} Donny Digital. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
