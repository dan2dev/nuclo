import { EXAMPLES } from "../../content/examples.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import { STYLING_FEATURES } from "./styling-demos.ts";
import { SVG_EXAMPLES } from "./svg-demos.ts";
import { SVG_INTERACTIVE_EXAMPLES } from "./svg-interactive-demos.ts";
import { DATA_CHART_EXAMPLES } from "./svg-chart-demos.ts";
import { LIVE_CHART_EXAMPLES } from "./svg-live-chart-demos.ts";
import { ROUTER_EXAMPLES } from "./router-demos.ts";
import { FORM_EXAMPLES } from "./form-demos.ts";
import { COMPONENT_EXAMPLES } from "./component-demos.ts";
import { APP_EXAMPLES } from "./app-demos.ts";
import { buildPreview } from "./demos.ts";
import type { CodeFile } from "../../components/CodeBlock.ts";

export interface Example {
  id: string; // the URL segment: /examples/:id
  group: string;
  title: string;
  desc: string;
  code: string;
  files?: CodeFile[]; // a multi-file example: the modal shows one tab per file
  preview: () => NodeModLike<"div">;
  docs?: string; // the docs section this example belongs to
  install?: string; // a package beyond nuclo the example needs, such as "nuclo-router"
  layout?: "app"; // "app": the preview fills the modal and the files sit behind tabs (ExampleDetail.ts)
}

export interface ExampleGroup {
  title: string;
  sub: string;
  examples: Example[];
}

// The docs section each basic example demonstrates.
const BASIC_DOCS: Record<string, string> = { counter: "api-update", todo: "api-list", search: "computed", styling: "api-cx" };

export const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    title: "Basics",
    sub: "The patterns every Nuclo app is made of.",
    examples: EXAMPLES.map((ex) => ({ ...ex, group: "Basics", docs: BASIC_DOCS[ex.id], preview: () => buildPreview(ex.id) })),
  },
  {
    title: "Components",
    sub: "Plain functions with static and dynamic params, children, lists matched by identity and nested data. Every preview counts its mounts.",
    examples: COMPONENT_EXAMPLES.map((ex) => ({ ...ex, group: "Components" })),
  },
  {
    title: "API",
    sub: "One small demo per building block, the same ones the docs embed.",
    examples: API_DEMOS.map((demo) => ({ ...demo, group: "API", docs: demo.id })),
  },
  {
    title: "Styling",
    sub: "Create a class, compose a class, and use a tiny theme.",
    examples: STYLING_FEATURES.map((f) => ({ ...f, group: "Styling" })),
  },
  {
    title: "Forms",
    sub: "Validation as plain functions over plain state, touched fields, steps and dynamic rows.",
    examples: FORM_EXAMPLES.map((ex) => ({ ...ex, group: "Forms" })),
  },
  {
    title: "SVG",
    sub: "Charts, animations, tools and games from the SVG tag builders, driven by plain data, pointer events and update().",
    examples: [...SVG_EXAMPLES, ...LIVE_CHART_EXAMPLES, ...DATA_CHART_EXAMPLES, ...SVG_INTERACTIVE_EXAMPLES].map((ex) => ({ ...ex, group: "SVG" })),
  },
  {
    title: "Routing",
    sub: "Route tables, matching, the active route, layers and loaders. nuclo-router is a separate package: npm install nuclo nuclo-router.",
    examples: ROUTER_EXAMPLES.map((ex) => ({ ...ex, group: "Routing" })),
  },
  {
    title: "Apps",
    sub: "Bigger programs, full screen, with their real source behind tabs: a desktop with windows, a data grid, a chat, games, editors and libraries that own their own state.",
    examples: APP_EXAMPLES.map((ex) => ({ ...ex, group: "Apps" })),
  },
];

export const ALL_EXAMPLES: Example[] = EXAMPLE_GROUPS.flatMap((g) => g.examples);

export const findExample = (id: string): Example | undefined => ALL_EXAMPLES.find((ex) => ex.id === id);
