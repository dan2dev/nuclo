import { EXAMPLES } from "../../content/examples.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import { STYLING_FEATURES } from "./styling-demos.ts";
import { SVG_EXAMPLES } from "./svg-demos.ts";
import { buildPreview } from "./demos.ts";

export interface Example {
  id: string; // the URL segment: /examples/:id
  group: string;
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
  docs?: string; // the docs section this example belongs to
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
    title: "SVG",
    sub: "Charts and animations from the SVG tag builders, driven by plain data and update().",
    examples: SVG_EXAMPLES.map((ex) => ({ ...ex, group: "SVG" })),
  },
];

export const ALL_EXAMPLES: Example[] = EXAMPLE_GROUPS.flatMap((g) => g.examples);

export const findExample = (id: string): Example | undefined => ALL_EXAMPLES.find((ex) => ex.id === id);
