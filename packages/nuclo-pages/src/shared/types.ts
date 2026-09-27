import type { Head } from "../../types/index";

export type View = (props: any) => NodeModFn<any>;

export type Action = (...args: any[]) => unknown;

/** What Page(), Layout() and ErrorPage() define, seen from the runtime. */
export interface Definition {
  prerender?: boolean;
  load?: (event: never) => unknown;
  head?: (props: never) => Head | undefined;
  actions?: Record<string, Action>;
  render: View;
}

/** A route file: `default` is its definition; API routes export HTTP methods instead. */
export interface RouteModule {
  default?: Definition;
  [key: string]: unknown;
}

export type Loader = () => Promise<RouteModule>;

/**
 * A generated route table entry. Module numbers index the generated module
 * list; -1 stands for the built-in default layout or error view.
 */
export interface RouteDef {
  /** URL pattern, e.g. "/blog/[slug]". */
  id: string;
  /** Pattern segments: "blog", "[slug]" or "[...rest]". */
  path: string[];
  /** Layout chain, root first: [module, params the layout's folder consumes]. */
  layouts: [module: number, params: string[]][];
  /** Page or API route module. */
  page: number;
  /** Error boundary per level (layouts…, page): [error module, layouts kept]. */
  errors: [module: number, keep: number][];
  /** Server-only API route: the browser falls back to a full navigation. */
  api?: 1;
}

/** Unmatched URLs render the root error view inside the root layout. */
export interface RootDef {
  layout: number;
  error: number;
}

/** Server → client hydration payload (`<script id="nuclo-data">`). */
export interface Payload {
  /** Route index, or -1 for an unmatched URL. */
  r: number;
  /** Route params. */
  p: Record<string, string>;
  /** Load data of each rendered level. */
  d: unknown[];
  /** Error rendered at boundary `b` ([module, layouts kept]). */
  e?: { s: number; m: string; b: [number, number] };
}
