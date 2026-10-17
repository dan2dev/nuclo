// examples.ts: the examples pages' text. The groups' titles and the page labels are here;
// each example's English title and description stay beside its code (pages/examples/*.ts,
// components/api-demos.ts, content/examples.ts), so `items` is empty for English. A
// translation fills `items` by example id and the registry lays it over the English entry.

export const groups = {
  basics: { title: "Basics", sub: "The patterns every Nuclo app is made of." },
  components: { title: "Components", sub: "Plain functions with static and dynamic params, children, lists matched by identity and nested data. Every preview counts its mounts." },
  api: { title: "API", sub: "One small demo per building block, the same ones the docs embed." },
  styling: { title: "Styling", sub: "Create a class, compose a class, and use a tiny theme." },
  forms: { title: "Forms", sub: "Validation as plain functions over plain state, touched fields, steps and dynamic rows." },
  svg: { title: "SVG", sub: "Charts, animations, tools and games from the SVG tag builders, driven by plain data, pointer events and update()." },
  routing: { title: "Routing", sub: "Route tables, matching, the active route, layers and loaders. nuclo-router is a separate package: npm install nuclo nuclo-router." },
  apps: { title: "Apps", sub: "Bigger programs, full screen, with their real source behind tabs: a desktop with windows, a data grid, a chat, games, editors and libraries that own their own state." },
};

export type GroupKey = keyof typeof groups;

/** Per example id: its title and description. English keeps them in the source files. */
export const items: Record<string, { title: string; desc: string }> = {};

export const LABELS = {
  examples: "Examples",
  title: "Practical examples. Live demos.",
  sub: "Pick an example to open it full screen, with the live preview and its source side by side.",
  needsPackage: (pkg: string) => `Needs the ${pkg} package`,
  // The example modal
  openInStackBlitz: "Open in StackBlitz",
  openInStackBlitzTitle: (title: string) => `Open ${title} in StackBlitz`,
  previous: "Previous",
  next: "Next",
  examplesNavigation: "Examples navigation",
  closeExample: "Close example",
  closeEsc: "Close (Esc)",
  less: "Less",
  more: "More",
  openInStandalone: "Open in standalone",
  openInNewTab: (title: string) => `Open ${title} in a new tab`,
  openStandaloneInNewTab: (title: string) => `Open ${title} in standalone in a new tab`,
  notFound: "Not found",
  noExampleCalled: (id: string) => `There is no example called "${id}".`,
  allExamples: "All examples",
  separatePackage: "Separate package:",
  mustBeInstalled: " is not part of nuclo and must be installed:",
  // Standalone apps
  standalone: (title: string) => `${title} standalone`,
  appNotFound: "App not found",
  browseExamples: "Browse examples",
};
