export const EMAIL = "donnydigital.darien@gmail.com";

export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
  { label: "Dribbble", href: "https://dribbble.com/" },
  { label: "X (Twitter)", href: "https://x.com/" },
] as const;

export type ProjectGroup = "Websites" | "Brand" | "Experiments";

export type Shot = { src: string; alt: string; caption: string };

export type Project = {
  slug: string;
  index: string;
  title: string;
  category: string;
  group: ProjectGroup;
  year: string;
  /** One line, used on cards and in the page header. */
  summary: string;
  /** The full write-up, shown in the project overview. */
  description: string;
  services: string[];
  deliverables: string[];
  stack: string[];
  /** All four are self-initiated concept sites, designed and built end to end. */
  concept: boolean;
  /** Live address, shown as a "Visit live site" button once the site is deployed. */
  url?: string;
  /** Hero screenshot (1600x1000), used on cards, previews and the project page. */
  cover: string;
  coverAlt: string;
  /** Inner pages and sections, shown in the project gallery. */
  shots: Shot[];
  mobile: Shot;
};

export const PROJECTS: Project[] = [
  {
    slug: "orbit",
    index: "01",
    title: "Orbit",
    category: "SaaS product website",
    group: "Websites",
    year: "2025",
    summary: "A product site for a workflow-automation platform, with an interactive demo.",
    description:
      "A marketing site for a workflow-automation platform that connects 350+ apps. One scroll explains the product: a hero built around a live-looking flow canvas, a feature grid, an interactive demo where you pick a trigger and an action and watch it run, an integrations map, pricing with a monthly and yearly toggle, and an FAQ.",
    services: ["Product design", "Frontend development"],
    deliverables: ["Information architecture", "Interface design", "Interactive flow demo", "Pricing and FAQ sections", "Responsive front-end build"],
    stack: ["React", "TypeScript", "Vite", "Tailwind CSS"],
    concept: true,
    cover: "/work/orbit/hero.webp",
    coverAlt: "Orbit homepage: the headline 'Automate the work between your apps' above a workflow editor",
    shots: [
      { src: "/work/orbit/features.webp", alt: "Orbit feature grid", caption: "Feature grid: a canvas, not a config file" },
      { src: "/work/orbit/demo.webp", alt: "Orbit interactive demo", caption: "Interactive demo: pick a trigger, pick an action, watch it run" },
      { src: "/work/orbit/pricing.webp", alt: "Orbit pricing section", caption: "Pricing with a monthly and yearly toggle" },
    ],
    mobile: { src: "/work/orbit/mobile.webp", alt: "Orbit on a phone", caption: "Responsive down to phone size" },
  },
  {
    slug: "field-notes",
    index: "02",
    title: "Field Notes",
    category: "Digital publication",
    group: "Websites",
    year: "2024",
    summary: "A design magazine built as a typographic showcase.",
    description:
      "An editorial reading experience for an independent design magazine. Issue 14 is a typographic showcase: a variable serif with live optical-size, weight and softness controls, a long-form cover essay with a reading-progress header and text-size control, a departments index, a back-issue archive, a newsletter signup, and a paper and ink theme switch.",
    services: ["Creative direction", "Frontend development"],
    deliverables: ["Editorial layout system", "Variable-type playground", "Paper and ink themes", "Reading view with progress", "Responsive front-end build"],
    stack: ["React", "TypeScript", "Vite", "Tailwind CSS"],
    concept: true,
    cover: "/work/field-notes/hero.webp",
    coverAlt: "Field Notes homepage: a large serif masthead above the Issue 14 cover essay",
    shots: [
      { src: "/work/field-notes/article.webp", alt: "Field Notes cover essay", caption: "Cover essay with a reading-progress header" },
      { src: "/work/field-notes/type.webp", alt: "Field Notes variable-type playground", caption: "Variable-type playground: optical size, weight, softness" },
      { src: "/work/field-notes/archive.webp", alt: "Field Notes back-issue archive", caption: "Back-issue archive, fourteen issues" },
    ],
    mobile: { src: "/work/field-notes/mobile.webp", alt: "Field Notes on a phone", caption: "Responsive down to phone size" },
  },
  {
    slug: "northstar",
    index: "03",
    title: "Northstar",
    category: "Brand and portfolio site",
    group: "Brand",
    year: "2024",
    summary: "Identity and portfolio site for an architecture studio, drawn from its own materials.",
    description:
      "Identity and portfolio site for a boutique architecture studio in Copenhagen. The palette is sampled from the studio's own materials (board-formed concrete, oak, travertine, brass, patinated steel) so the interface feels like the buildings: calm and precisely made. It includes a filterable project index, a material library, studio and approach pages, and a documented identity.",
    services: ["Creative direction", "Design systems"],
    deliverables: ["Visual identity", "Material-based palette", "Filterable project index", "Identity and design-system page", "Responsive front-end build"],
    stack: ["React", "TypeScript", "Vite", "Tailwind CSS"],
    concept: true,
    cover: "/work/northstar/hero.webp",
    coverAlt: "Northstar homepage: 'Calm buildings, precisely made' beside an elevation drawing built from material swatches",
    shots: [
      { src: "/work/northstar/work.webp", alt: "Northstar project index", caption: "Project index: eight buildings, five materials" },
      { src: "/work/northstar/materials.webp", alt: "Northstar material library", caption: "Material library: the palette is the interface" },
      { src: "/work/northstar/identity.webp", alt: "Northstar identity page", caption: "Identity: logo construction and palette" },
    ],
    mobile: { src: "/work/northstar/mobile.webp", alt: "Northstar on a phone", caption: "Responsive down to phone size" },
  },
  {
    slug: "flux",
    index: "04",
    title: "Flux",
    category: "Creative-coding experiment",
    group: "Experiments",
    year: "2023",
    summary: "A generative-art playground running live WebGL shader studies.",
    description:
      "A generative-art playground built on a hand-written WebGL renderer. Five fragment-shader studies (drift, mercury, tidelines, cellwork and aurora) run live in the browser, each with tunable speed, scale, pointer strength and palette, alongside notes on how the studies were toned down into quiet backgrounds for client websites.",
    services: ["Creative direction", "Frontend development"],
    deliverables: ["Custom WebGL renderer", "Five live shader studies", "Interactive playground controls", "Background presets for client work", "Responsive front-end build"],
    stack: ["React", "TypeScript", "WebGL (GLSL)", "Tailwind CSS"],
    concept: true,
    cover: "/work/flux/hero.webp",
    coverAlt: "Flux homepage: a live fluid shader behind the headline 'Flux.'",
    shots: [
      { src: "/work/flux/playground.webp", alt: "Flux playground", caption: "The playground: a live shader with tunable controls" },
      { src: "/work/flux/studies.webp", alt: "Flux studies gallery", caption: "Five studies, each running live" },
      { src: "/work/flux/backgrounds.webp", alt: "Flux backgrounds page", caption: "From experiment to client background" },
    ],
    mobile: { src: "/work/flux/mobile.webp", alt: "Flux on a phone", caption: "Responsive down to phone size" },
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

export const PRINCIPLES = [
  { title: "Craft over templates", body: "Every layout, transition and line of code is made for the project in front of me — never dropped in from a kit." },
  { title: "Performance is a feature", body: "Fast pages feel better and rank better. I build lean, optimise images and keep the JavaScript honest." },
  { title: "Accessible by default", body: "Semantic markup, visible focus states and strong contrast are part of the baseline, not an afterthought." },
];
