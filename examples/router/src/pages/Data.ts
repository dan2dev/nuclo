/**
 * /data — route loaders.
 *
 * `load` runs before this page is built, every time you navigate here, and
 * what it returns arrives as the page's third argument. The counter below is
 * the proof: it goes up on every visit, while the module behind it is
 * imported exactly once.
 */
import type { DataLoader, Layer, RouteContext } from "nuclo-router";
import { css, cx } from "../theme.ts";
import { btn, card, code, feature, pill, s } from "../ui.ts";

export interface Report {
  runs: number;
  forPath: string;
  slowly: boolean;
  at: number;
}

/** Module scope, so it survives navigation — the module is cached. */
let runs = 0;

export const load: DataLoader<Report> = async (ctx) => {
  runs++;
  // ?slow=1 makes the loader take its time, so route.pending is observable.
  const slowly = ctx.search.get("slow") === "1";
  if (slowly) await new Promise((resolve) => setTimeout(resolve, 1200));
  // ?fail=1 makes it reject, so route.error is observable.
  if (ctx.search.get("fail") === "1") throw new Error("the loader rejected (?fail=1)");
  return { runs, forPath: ctx.path, slowly, at: runs };
};

export default function DataPage(ctx: RouteContext, layer: Layer, report: Report) {
  // Placed by the page itself: into the layout's region({ id: "main" }).
  return view("main", div(
    s.page,

    feature(
      "A loader runs before the page",
      "the page is not built until load() settles, so it never renders without its data " +
        "and there is no loading state inside it. the module is cached; the data is not.",

      div(
        s.row,
        pill("good", `load() runs: ${report.runs}`),
        pill("neutral", `for ${report.forPath}`),
        pill("info", `this page is layer ${layer.depth}`),
      ),

      code(
        `// pages/Data.ts — the loader travels with the page\n` +
          `export const load: DataLoader<Report> = async (ctx) => {\n` +
          `  return fetchReport(ctx.params, ctx.search);\n` +
          `};\n\n` +
          `export default function DataPage(ctx, layer, report: Report) { … }\n\n` +
          `// routes.ts — unchanged\n` +
          `"/data": () => import("./pages/Data.ts"),`,
      ),
    ),

    feature(
      "Try it",
      "each of these is a navigation, so each one runs the loader again.",

      div(
        s.row,
        // Revalidating is a navigation to where you already are, with no new
        // history entry.
        a({ href: ctx.path }, btn.primary, "revalidate (load again)"),
        a({ href: `${ctx.path}?slow=1` }, btn.base, "?slow=1 — watch route.pending"),
        a({ href: `${ctx.path}?fail=1` }, btn.base, "?fail=1 — watch route.error"),
        a({ href: ctx.path }, btn.base, "back to plain"),
      ),

      p(
        s.note,
        "the ?slow=1 link keeps this page on screen for 1.2s while the next one loads — " +
          "the spinner in the shell is route.pending. ?fail=1 leaves you here with " +
          "route.error set and the page you were on untouched, and the next successful " +
          "navigation clears it.",
      ),

      div(
        cx(s.cardBox, css({ gap: 6 })),
        span(s.caption, "this render's data"),
        pre(s.code, JSON.stringify(report, null, 2)),
      ),
    ),

    feature(
      "What it does and does not do",
      "the rules, briefly.",

      div(
        s.cols2,
        card(
          "never cached",
          span(
            "the chunk is imported once; load() runs on every navigation. two URLs through " +
              "one route can never see each other's data, and a failed loader is simply " +
              "retried.",
          ),
        ),
        card(
          "runs on the server too",
          span(
            "which is the point: a server-rendered page ships with its data in the first " +
              "HTML. see ../router-ssr, where the server also hands the data to the client " +
              "so hydration does not refetch it.",
          ),
        ),
        card(
          "not preloaded",
          span(
            "the idle preloader warms modules only. it has no context to pass, and would " +
              "be fetching data for routes you may never open.",
          ),
        ),
        card(
          "revalidate by navigating",
          span("route.go(route.url, { replace: true }) runs the loader again without a new history entry."),
        ),
      ),
    ),
  ));
}
