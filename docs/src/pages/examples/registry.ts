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
import * as en from "../../i18n/en/examples.ts";
import { i18n } from "../../i18n/index.ts";
import { examplesText } from "./text.ts";

export { examplesText };

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
  key: en.GroupKey;
  title: string;
  sub: string;
  examples: Example[];
}

// The docs section each basic example demonstrates.
const BASIC_DOCS: Record<string, string> = { counter: "api-update", todo: "api-list", search: "computed", styling: "api-cx" };

// The English examples, by group, with their titles and descriptions as written in the source files.
const SOURCE: [en.GroupKey, Omit<Example, "group">[]][] = [
  ["basics", EXAMPLES.map((ex) => ({ ...ex, docs: BASIC_DOCS[ex.id], preview: () => buildPreview(ex.id) }))],
  ["components", COMPONENT_EXAMPLES],
  ["api", API_DEMOS.map((demo) => ({ ...demo, docs: demo.id }))],
  ["styling", STYLING_FEATURES],
  ["forms", FORM_EXAMPLES],
  ["svg", [...SVG_EXAMPLES, ...LIVE_CHART_EXAMPLES, ...DATA_CHART_EXAMPLES, ...SVG_INTERACTIVE_EXAMPLES]],
  ["routing", ROUTER_EXAMPLES],
  ["apps", APP_EXAMPLES],
];

const localized = new Map<string, ExampleGroup[]>();

/** The groups in the current locale: the English entries with the locale's group names, titles and descriptions laid over. Built once per locale. */
export function exampleGroups(): ExampleGroup[] {
  const cached = localized.get(i18n.locale);
  if (cached) return cached;
  const text = examplesText();
  const groups = SOURCE.map(([key, examples]) => {
    const { title, sub } = text.groups[key];
    return { key, title, sub, examples: examples.map((ex) => ({ ...ex, ...text.items[ex.id], group: title })) };
  });
  localized.set(i18n.locale, groups);
  return groups;
}

export const allExamples = (): Example[] => exampleGroups().flatMap((g) => g.examples);

export const findExample = (id: string): Example | undefined => allExamples().find((ex) => ex.id === id);

// The English list, for the servers' SEO and the text exports.
export const ALL_EXAMPLES: Example[] = SOURCE.flatMap(([key, examples]) => examples.map((ex) => ({ ...ex, group: en.groups[key].title })));
