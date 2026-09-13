type Token = { text: string; className?: string };
type Line = Token[];

const KEYWORD = "text-orange/80";
const STRING = "text-peach/80";
const COMMENT = "text-white/25";
const PUNCT = "text-white/30";
const PROP = "text-white/45";

const LINES: Line[] = [
  [{ text: "import", className: KEYWORD }, { text: " { useEffect, useRef, useState, useCallback, type ReactNode } ", className: PROP }, { text: "from", className: KEYWORD }, { text: ' "react";', className: STRING }],
  [{ text: " " }],
  [{ text: "interface", className: KEYWORD }, { text: " HeroProps {", className: PROP }],
  [{ text: "  title:", className: PROP }, { text: " string;", className: KEYWORD }],
  [{ text: "  subtitle:", className: PROP }, { text: " string;", className: KEYWORD }],
  [{ text: "  badge:", className: PROP }, { text: " { label: string; tone: ", className: PUNCT }, { text: '"orange" | "peach" | "slate"', className: STRING }, { text: " };", className: PUNCT }],
  [{ text: "  onPrimaryClick:", className: PROP }, { text: " () => void;", className: KEYWORD }],
  [{ text: "  onSecondaryClick?:", className: PROP }, { text: " () => void;", className: KEYWORD }],
  [{ text: "  children?:", className: PROP }, { text: " ReactNode;", className: KEYWORD }],
  [{ text: "}", className: PUNCT }],
  [{ text: " " }],
  [{ text: "export", className: KEYWORD }, { text: " function", className: KEYWORD }, { text: " Hero({ title, subtitle, badge, onPrimaryClick, onSecondaryClick, children }: HeroProps) {", className: PROP }],
  [{ text: "  const", className: KEYWORD }, { text: " sectionRef = useRef<HTMLElement | null>(null);", className: PROP }],
  [{ text: "  const", className: KEYWORD }, { text: " [isVisible, setIsVisible] = useState(", className: PROP }, { text: "false", className: KEYWORD }, { text: ");", className: PUNCT }],
  [{ text: " " }],
  [{ text: "  useEffect(() => {", className: PROP }],
  [{ text: "    const", className: KEYWORD }, { text: " observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.25 });", className: PROP }],
  [{ text: "    if", className: KEYWORD }, { text: " (sectionRef.current) observer.observe(sectionRef.current);", className: PROP }],
  [{ text: "    return", className: KEYWORD }, { text: " () => observer.disconnect();", className: PROP }],
  [{ text: "  }, []);", className: PUNCT }],
  [{ text: " " }],
  [{ text: "  return (", className: PUNCT }],
  [{ text: "    <section", className: PUNCT }, { text: ' ref={sectionRef} className={`hero ${isVisible ? "hero--visible" : "hero--hidden"}`} aria-labelledby="hero-heading">', className: STRING }],
  [{ text: "      <span", className: PUNCT }, { text: ' className={`badge badge--${badge.tone}`}>{badge.label}</span>', className: STRING }],
  [{ text: '      <h1 id="hero-heading">{title}</h1>', className: PROP }],
  [{ text: '      <p className="hero__subtitle">{subtitle}</p>', className: PROP }],
  [{ text: '      <div className="hero__actions">', className: PROP }],
  [{ text: '        <button type="button" className="btn btn--primary" onClick={onPrimaryClick}>View my work</button>', className: PROP }],
  [{ text: "        {onSecondaryClick && (", className: PUNCT }],
  [{ text: '          <button type="button" className="btn btn--ghost" onClick={onSecondaryClick}>Let&rsquo;s talk</button>', className: PROP }],
  [{ text: "        )}", className: PUNCT }],
  [{ text: "      </div>", className: PUNCT }],
  [{ text: "      {children}", className: PROP }],
  [{ text: "    </section>", className: PUNCT }],
  [{ text: "  );", className: PUNCT }],
  [{ text: "}", className: PUNCT }],
  [{ text: " " }],
  [{ text: ".hero { position: relative; overflow: hidden; background: var(--color-charcoal); padding-block: clamp(4rem, 8vw, 8rem); }", className: PROP }],
  [{ text: ".hero__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-top: 2.25rem; }", className: PROP }],
  [{ text: ".btn--primary { background: var(--color-orange); color: var(--color-charcoal); border-radius: 9999px; padding: 0.875rem 1.75rem; }", className: PROP }],
  [{ text: ".btn--primary:hover { transform: translateY(-2px); transition: transform .2s ease, box-shadow .2s ease; }", className: PROP }],
  [{ text: "@media", className: KEYWORD }, { text: " (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; } }", className: PROP }],
  [{ text: " " }],
  [{ text: "  $", className: COMMENT }, { text: " npx create-vite@latest donny-digital --template react-ts && cd donny-digital && npm install", className: PROP }],
  [{ text: "  $", className: COMMENT }, { text: " npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer eslint-plugin-react-hooks", className: PROP }],
  [{ text: "  $", className: COMMENT }, { text: ' git add -A && git commit -m "feat: add scrolling code backdrop to hero section" && git push origin main', className: STRING }],
  [{ text: "  $", className: COMMENT }, { text: " npm run build && npm run preview -- --host 0.0.0.0 --port 4173", className: PROP }],
  [{ text: "  ✓ 27 modules transformed · built in 311ms · bundle size 249.7kb (gzip 76.1kb)", className: COMMENT }],
  [{ text: " " }],
  [{ text: "type", className: KEYWORD }, { text: " ButtonVariant = ", className: PROP }, { text: '"primary" | "secondary" | "ghost" | "outline" | "link" | "destructive" | "subtle";', className: STRING }],
  [{ text: "export", className: KEYWORD }, { text: " const", className: KEYWORD }, { text: ' breakpoints = { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" } as const;', className: PROP }],
  [{ text: "export default", className: KEYWORD }, { text: " defineConfig({ plugins: [react(), tailwindcss()], server: { port: 5173, open: true } });", className: PROP }],
  [{ text: "const", className: KEYWORD }, { text: ' palette = { charcoal: "#171717", orange: "#FF6B35", cream: "#FFF7ED", slate: "#64748B", peach: "#FDBA74" };', className: STRING }],
  [{ text: " " }],
  [{ text: "function", className: KEYWORD }, { text: " useReveal<T extends HTMLElement>(threshold = 0.25): [React.RefObject<T>, boolean] {", className: PROP }],
  [{ text: "  const", className: KEYWORD }, { text: " ref = useRef<T>(null);", className: PROP }],
  [{ text: "  const", className: KEYWORD }, { text: " [visible, setVisible] = useState(", className: PROP }, { text: "false", className: KEYWORD }, { text: ");", className: PUNCT }],
  [{ text: "  useEffect(() => {", className: PROP }],
  [{ text: "    const", className: KEYWORD }, { text: " node = ref.current;", className: PROP }],
  [{ text: "    if", className: KEYWORD }, { text: " (!node) ", className: PROP }, { text: "return", className: KEYWORD }, { text: ";", className: PUNCT }],
  [{ text: "    const", className: KEYWORD }, { text: " observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold });", className: PROP }],
  [{ text: "    observer.observe(node);", className: PROP }],
  [{ text: "    return", className: KEYWORD }, { text: " () => observer.disconnect();", className: PROP }],
  [{ text: "  }, [threshold]);", className: PUNCT }],
  [{ text: "  return", className: KEYWORD }, { text: " [ref, visible];", className: PROP }],
  [{ text: "}", className: PUNCT }],
  [{ text: " " }],
  [{ text: "export", className: KEYWORD }, { text: " function", className: KEYWORD }, { text: " ProjectCard({ title, category, year, description, coverImage, href }: ProjectCardProps) {", className: PROP }],
  [{ text: "  return (", className: PUNCT }],
  [{ text: "    <a", className: PUNCT }, { text: ' href={href} className="group block overflow-hidden rounded-sm border border-charcoal/10 transition-colors duration-300 hover:border-orange">', className: STRING }],
  [{ text: "      <div", className: PUNCT }, { text: ' className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-peach to-orange transition-transform duration-500 group-hover:scale-105">', className: STRING }],
  [{ text: "        <img", className: PUNCT }, { text: ' src={coverImage} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover" />', className: STRING }],
  [{ text: "      </div>", className: PUNCT }],
  [{ text: '      <div className="mt-5 flex items-start justify-between gap-4">', className: PROP }],
  [{ text: "        <h3", className: PUNCT }, { text: ' className="font-display text-2xl font-semibold tracking-tight group-hover:text-orange">{title}</h3>', className: STRING }],
  [{ text: "        <span", className: PUNCT }, { text: ' className="whitespace-nowrap pt-1 text-sm text-charcoal/60">{category} · {year}</span>', className: STRING }],
  [{ text: "      </div>", className: PUNCT }],
  [{ text: '      <p className="mt-2 max-w-md text-charcoal/70">{description}</p>', className: PROP }],
  [{ text: "    </a>", className: PUNCT }],
  [{ text: "  );", className: PUNCT }],
  [{ text: "}", className: PUNCT }],
  [{ text: " " }],
  [{ text: "{", className: PUNCT }],
  [{ text: '  "name":', className: PROP }, { text: ' "donny-digital-portfolio",', className: STRING }],
  [{ text: '  "scripts":', className: PROP }, { text: ' { "dev": "vite", "build": "tsc -b && vite build", "preview": "vite preview", "lint": "oxlint" },', className: STRING }],
  [{ text: '  "dependencies":', className: PROP }, { text: ' { "react": "^19.2.8", "react-dom": "^19.2.8" },', className: STRING }],
  [{ text: '  "devDependencies":', className: PROP }, { text: ' { "@tailwindcss/vite": "^4.3.3", "typescript": "~6.0.2", "vite": "^8.3.0", "oxlint": "^1.81.0" }', className: STRING }],
  [{ text: "}", className: PUNCT }],
  [{ text: " " }],
  [{ text: "  // Palette tokens mirror the Tailwind theme so design and code never drift apart from one another", className: COMMENT }],
  [{ text: "export", className: KEYWORD }, { text: " const", className: KEYWORD }, { text: ' skills: Skill[] = ["product design", "frontend development", "creative direction", "design systems"];', className: STRING }],
  [{ text: "export", className: KEYWORD }, { text: " const", className: KEYWORD }, { text: ' tools = ["Figma", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Webflow", "Vite", "Git"];', className: STRING }],
  [{ text: "export", className: KEYWORD }, { text: " const", className: KEYWORD }, { text: ' clients = ["Acme Studio", "Northwind Labs", "Fieldwork Co.", "Loop & Co.", "Vantage Group"];', className: STRING }],
];

function CodeLines() {
  return (
    <>
      {LINES.map((line, i) => (
        <div key={i} className="whitespace-pre">
          {line.map((token, j) => (
            <span key={j} className={token.className}>
              {token.text}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

/**
 * Decorative, non-interactive backdrop for the hero. Purely ambient — the
 * content it "renders" is illustrative, not meant to be read line by line.
 */
export default function CodeBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.16] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
    >
      <div className="animate-code-scroll font-mono text-[13px] leading-6 tracking-tight md:text-sm">
        <CodeLines />
        <CodeLines />
      </div>
    </div>
  );
}
