export type HomeCodeTone = "accent" | "comment" | "muted" | "number" | "primary";

export type HomeCodeLine = {
  text: string;
  tone?: HomeCodeTone;
};

export type HomeFeature = {
  description: string;
  icon: string;
  title: string;
};

export const HOMEPAGE_EXAMPLE_IDS = ["counter", "todo", "search"] as const;

export const EXAMPLE_ICONS: Record<string, string> = {
  counter: "🔢",
  todo: "✅",
  subtasks: "🗂️",
  search: "🔍",
  async: "⚡",
  forms: "📝",
  nested: "🧩",
  animations: "✨",
  routing: "🗺️",
  "styled-card": "🎨",
};

export const HERO_CODE_LINES: HomeCodeLine[] = [
  { text: "import 'nuclo';", tone: "primary" },
  { text: "", tone: "muted" },
  { text: "let count = 0;" },
  { text: "", tone: "muted" },
  { text: "const counter = div(", tone: "accent" },
  { text: "  h1(() => `Count: ${count}`)," },
  { text: "  button('Increment', on('click', () => {" },
  { text: "    count++;", tone: "number" },
  { text: "    update();", tone: "accent" },
  { text: "  }))" },
  { text: ");" },
  { text: "", tone: "muted" },
  { text: "render(counter, document.body);", tone: "primary" },
];

export const QUICK_START_USAGE_LINES: HomeCodeLine[] = [
  { text: "import 'nuclo';", tone: "primary" },
  { text: " " },
  { text: "const app = div(", tone: "accent" },
  { text: "  h1('Hello, Nuclo!')," },
  { text: "  p('Building UIs.')" },
  { text: ");" },
  { text: " " },
  { text: "render(app, document.body);", tone: "primary" },
];

export const QUICK_START_TYPES_LINES: HomeCodeLine[] = [
  { text: "// tsconfig.json", tone: "comment" },
  { text: "{" },
  { text: '  "compilerOptions": {' },
  { text: '    "types": ["nuclo/types"]', tone: "primary" },
  { text: "  }" },
  { text: "}" },
];

export const HOME_FEATURES: HomeFeature[] = [
  {
    icon: "⚡",
    title: "TypeScript-First",
    description:
      "Full type definitions for 140+ HTML and SVG tags. Catch errors at compile time, not runtime.",
  },
  {
    icon: "🎯",
    title: "Fine-Grained Updates",
    description:
      "Call update() and Nuclo only touches DOM nodes whose resolved values changed. Elements are reused, branches stay mounted.",
  },
];

export const HOME_COPY = {
  heroBadge: "Lightweight · Explicit · Imperative",
  heroDescription:
    "A lightweight imperative DOM framework. Mutate plain state, call update() when you're ready, and let Nuclo sync the DOM without proxies, signals, or virtual DOM.",
  installCommand: "npm install nuclo",
  examplesDescription: "Practical examples with interactive live demos.",
  quickStartDescription: "Up and running in 30 seconds.",
  readyDescription:
    "That's it. Three steps to build imperative, explicit UIs with zero abstractions.",
  statDescription: "No third-party packages. Pure DOM, pure performance.",
  statLabel: "Zero Dependencies",
  tagCoverageDescription:
    "Every standard element as a global builder function. No imports needed.",
  tagCoverageTitle: "HTML & SVG Tags",
};
