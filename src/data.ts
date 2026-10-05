export const EMAIL = "dalog.darien@gmail.com";

export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
  { label: "Dribbble", href: "https://dribbble.com/" },
  { label: "X (Twitter)", href: "https://x.com/" },
] as const;

export type ProjectGroup = "Websites" | "Brand" | "Experiments";

export type Project = {
  slug: string;
  index: string;
  title: string;
  category: string;
  group: ProjectGroup;
  year: string;
  description: string;
  services: string[];
  deliverables: string[];
};

export const PROJECTS: Project[] = [
  {
    slug: "orbit",
    index: "01",
    title: "Orbit",
    category: "SaaS website redesign",
    group: "Websites",
    year: "2025",
    description:
      "A full marketing-site rebuild for a workflow-automation platform, cutting bounce rate by 32% with a clearer story and faster load times.",
    services: ["Product design", "Frontend development"],
    deliverables: ["Information architecture", "Interface design", "Front-end build", "Performance tuning"],
  },
  {
    slug: "field-notes",
    index: "02",
    title: "Field Notes",
    category: "Digital publication",
    group: "Websites",
    year: "2024",
    description:
      "An editorial reading experience for an independent design magazine, built around variable type and long-form layout rhythm.",
    services: ["Creative direction", "Frontend development"],
    deliverables: ["Editorial layout system", "Typography & reading experience", "Front-end build", "Accessibility review"],
  },
  {
    slug: "northstar",
    index: "03",
    title: "Northstar",
    category: "Brand & portfolio site",
    group: "Brand",
    year: "2024",
    description:
      "Visual identity and portfolio site for a boutique architecture studio, translating their material palette into an interface language.",
    services: ["Creative direction", "Design systems"],
    deliverables: ["Visual identity", "Portfolio site design", "Design system", "Front-end build"],
  },
  {
    slug: "flux",
    index: "04",
    title: "Flux",
    category: "Creative coding experiment",
    group: "Experiments",
    year: "2023",
    description:
      "A generative-art playground exploring shader-driven motion, later adapted into interactive backgrounds for client work.",
    services: ["Creative direction", "Frontend development"],
    deliverables: ["Concept & motion studies", "Canvas / shader experiments", "Interactive prototypes"],
  },
];

export const PROJECT_GROUPS: ("All" | ProjectGroup)[] = ["All", "Websites", "Brand", "Experiments"];

export type Service = {
  slug: string;
  number: string;
  title: string;
  short: string;
  long: string;
  includes: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "product-design",
    number: "01",
    title: "Product design",
    short: "User flows, wireframes, and interface design grounded in real user research, not just aesthetics.",
    long: "Great interfaces start with understanding who they're for. I map the journey, test the structure with low-fidelity wireframes, and only then refine the visual layer — so every screen has a reason to exist.",
    includes: ["User flows & sitemaps", "Wireframes & prototypes", "Interface design in Figma", "Usability review"],
  },
  {
    slug: "frontend-development",
    number: "02",
    title: "Frontend development",
    short: "Accessible, performant React and TypeScript builds that translate design intent pixel-for-pixel.",
    long: "I build the designs I make, so nothing is lost between a mockup and the browser. Clean component architecture, responsive layouts and thoughtful motion — shipped fast and easy to maintain.",
    includes: ["React & TypeScript builds", "Responsive, accessible interfaces", "Animation & micro-interactions", "Performance & SEO fundamentals"],
  },
  {
    slug: "creative-direction",
    number: "03",
    title: "Creative direction",
    short: "Visual concepts, art direction, and brand systems that give a product a distinct point of view.",
    long: "A site should feel like somebody made it on purpose. I develop the concept, the tone and the visual language — then carry it consistently through every page, asset and interaction.",
    includes: ["Brand & visual concepts", "Art direction", "Moodboards & style exploration", "Asset & launch guidance"],
  },
  {
    slug: "design-systems",
    number: "04",
    title: "Design systems",
    short: "Reusable component libraries and documentation that keep teams shipping consistent work fast.",
    long: "Consistency scales when it's built in. I turn one-off screens into a system of tokens and components, documented so designers and developers can keep building without drifting apart.",
    includes: ["Component libraries", "Design tokens", "Documentation", "Figma & code parity"],
  },
];

export type Step = { number: string; title: string; description: string; details: string[] };

export const STEPS: Step[] = [
  {
    number: "01",
    title: "Discover",
    description: "Understand the goals, audience, and constraints before any pixels move.",
    details: ["Kickoff conversation", "Audience & goals brief", "Reference & competitor review"],
  },
  {
    number: "02",
    title: "Define",
    description: "Translate research into a clear brief, sitemap, and success criteria.",
    details: ["Sitemap & content outline", "Scope & success criteria", "Project plan"],
  },
  {
    number: "03",
    title: "Design",
    description: "Explore concepts and refine the details that make an interface feel considered.",
    details: ["Concept directions", "High-fidelity interface designs", "Interactive prototype"],
  },
  {
    number: "04",
    title: "Deliver",
    description: "Build, test, and ship a performant product that's ready for the real world.",
    details: ["Production build", "Cross-device testing", "Launch & handover"],
  },
];

export const SKILLS = ["UI Design", "Design Systems", "Motion & Interaction", "Frontend Engineering", "Art Direction", "Accessibility"];
export const TOOLS = ["Figma", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Webflow"];
export const CLIENTS = ["Acme Studio", "Northwind Labs", "Fieldwork Co.", "Loop & Co.", "Vantage"];

export const PRINCIPLES = [
  { title: "Craft over templates", body: "Every layout, transition and line of code is made for the project in front of me — never dropped in from a kit." },
  { title: "Performance is a feature", body: "Fast pages feel better and rank better. I build lean, optimise images and keep the JavaScript honest." },
  { title: "Accessible by default", body: "Semantic markup, visible focus states and strong contrast are part of the baseline, not an afterthought." },
];
